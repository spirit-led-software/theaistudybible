import { checkIfIndexOpIsCompletedAndUpdate } from '@api/lib/data-source/index-operation/web-crawl';
import { generatePageContentEmbeddings } from '@api/lib/data-source/index-operation/webpage';
import type { Bindings, Variables } from '@api/types';
import { indexOperations } from '@core/database/schema';
import type { IndexOperation } from '@core/model/data-source/index-op';
import { Receiver } from '@upstash/qstash';
import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>().post('/webpage', async (c) => {
  const receiver = new Receiver({
    currentSigningKey: c.env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: c.env.QSTASH_NEXT_SIGNING_KEY
  });

  const signature = c.req.header('Upstash-Signature');
  if (!signature) {
    return c.json({ message: 'Missing signature header' }, 400);
  }

  const body = await c.req.text();
  const isValid = await receiver.verify({
    body,
    signature,
    url: c.req.url
  });
  if (!isValid) {
    return c.json({ message: 'Invalid signature' }, 400);
  }

  const data = JSON.parse(body);
  const { name, url, indexOpId } = data;
  if (!name || !url || !indexOpId) {
    return c.json({ message: 'Invalid data' }, 400);
  }

  let indexOp: IndexOperation | undefined;
  try {
    if (!indexOpId) {
      throw new Error('Missing index op id');
    }

    indexOp = await c.var.db.query.indexOperations.findFirst({
      where: (indexOperations, { eq }) => eq(indexOperations.id, indexOpId)
    });
    if (!indexOp) {
      throw new Error('Index op not found');
    }

    const dataSource = await c.var.db.query.dataSources.findFirst({
      where: (dataSources, { eq }) => eq(dataSources.id, indexOp!.dataSourceId)
    });
    if (!dataSource) {
      throw new Error('Data source not found');
    }

    await generatePageContentEmbeddings({
      env: c.env,
      vars: c.var,
      name,
      url,
      dataSourceId: indexOp.dataSourceId,
      metadata: dataSource.metadata
    });

    console.log(`Successfully indexed url '${url}'. Updating index op.`);
    [indexOp] = await c.var.db
      .update(indexOperations)
      .set({
        metadata: sql`jsonb_set(
            jsonb_set(
              ${indexOperations.metadata},
              '{failedUrls}',
              COALESCE(
                ${indexOperations.metadata}->'failedUrls',
                '[]'::jsonb
              ) - '${sql.raw(url)}',
              true
            ),
            '{succeededUrls}',
            COALESCE(
              ${indexOperations.metadata}->'succeededUrls',
              '[]'::jsonb
            ) || jsonb_build_array('${sql.raw(url)}'),
            true
          )`
      })
      .where(eq(indexOperations.id, indexOp.id))
      .returning();

    indexOp = await checkIfIndexOpIsCompletedAndUpdate({
      env: c.env,
      vars: c.var,
      indexOp: indexOp!
    });
  } catch (err) {
    console.error(`Error indexing url '${url}':`, err);
    if (indexOp) {
      [indexOp] = await c.var.db
        .update(indexOperations)
        .set({
          metadata: sql`jsonb_set(${indexOperations.metadata}, 
                '{failedUrls}',
                COALESCE(
                  ${indexOperations.metadata}->'failedUrls', 
                  '[]'::jsonb
                ) || jsonb_build_array('${sql.raw(url)}'),
                true
              )`,
          errorMessages: sql`${indexOperations.errorMessages} || jsonb_build_array('${sql.raw(
            err instanceof Error ? `${err.message}: ${err.stack}` : `Error: ${JSON.stringify(err)}`
          )}')`
        })
        .where(eq(indexOperations.id, indexOp.id))
        .returning();

      indexOp = await checkIfIndexOpIsCompletedAndUpdate({ env: c.env, vars: c.var, indexOp });
    }
    throw err;
  }

  return c.json({ message: 'Message received' }, 200);
});

export default app;
