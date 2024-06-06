import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { zValidator } from '@hono/zod-validator';
import { indexRemoteFile } from '@theaistudybible/server/lib/scraper/file';
import { indexWebCrawl } from '@theaistudybible/server/lib/scraper/web-crawl';
import { indexWebPage } from '@theaistudybible/server/lib/scraper/webpage';
import { Hono } from 'hono';
import { Resource } from 'sst';
import { z } from 'zod';
import type { Bindings, Variables } from '../../types';

const s3Client = new S3Client({});

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .post(
    '/file/remote-download',
    zValidator(
      'json',
      z.object({
        name: z.string(),
        url: z.string(),
        metadata: z.string().optional(),
        dataSourceId: z.string()
      })
    ),
    async (c) => {
      const { name, url, metadata = '{}', dataSourceId } = c.req.valid('json');

      await indexRemoteFile({
        name,
        url,
        dataSourceId,
        metadata: JSON.parse(metadata)
      });

      return c.json({
        message: 'File indexed successfully'
      });
    }
  )
  .post(
    '/file/presigned-url',
    zValidator(
      'json',
      z.object({
        name: z.string(),
        url: z.string(),
        fileName: z.string(),
        fileType: z.string(),
        metadata: z.string().optional(),
        dataSourceId: z.string()
      })
    ),
    async (c) => {
      const { name, url, fileName, fileType, metadata = '{}', dataSourceId } = c.req.valid('json');

      const s3Url = await getSignedUrl(
        s3Client,
        new PutObjectCommand({
          ACL: 'public-read',
          ContentType: fileType,
          Bucket: Resource.IndexFileBucket.name,
          Key: fileName,
          Metadata: {
            ...JSON.parse(metadata),
            dataSourceId,
            name,
            url
          }
        })
      );

      return c.json({
        url: s3Url
      });
    }
  )
  .post(
    '/web/page',
    zValidator(
      'json',
      z.object({
        dataSourceId: z.string(),
        name: z.string(),
        url: z.string(),
        metadata: z.string().optional()
      })
    ),
    async (c) => {
      const { dataSourceId, name, url, metadata = '{}' } = c.req.valid('json');

      const indexOp = await indexWebPage({
        dataSourceId,
        name,
        url,
        metadata: JSON.parse(metadata)
      });

      return c.json({
        message: 'Success',
        indexOp
      });
    }
  )
  .post(
    '/web/crawl',
    zValidator(
      'json',
      z.object({
        dataSourceId: z.string(),
        url: z.string(),
        pathRegex: z.string().optional(),
        name: z.string(),
        metadata: z.string().optional()
      })
    ),
    async (c) => {
      const {
        dataSourceId,
        url,
        pathRegex: pathRegexString,
        name,
        metadata = '{}'
      } = c.req.valid('json');

      if (
        pathRegexString &&
        (pathRegexString.startsWith('/') ||
          pathRegexString.startsWith('\\/') ||
          pathRegexString.endsWith('/') ||
          pathRegexString.endsWith('\\/'))
      ) {
        return c.json(
          {
            message: 'Path regex cannot start or end with a forward slash'
          },
          400
        );
      }

      const indexOp = await indexWebCrawl({
        dataSourceId,
        url,
        pathRegex: pathRegexString,
        name,
        metadata: JSON.parse(metadata)
      });

      return c.json({
        message: 'Website index operation started',
        indexOp
      });
    }
  );

export default app;
