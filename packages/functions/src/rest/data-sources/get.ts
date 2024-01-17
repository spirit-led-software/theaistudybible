import { buildOrderBy } from '@core/database/helpers';
import { dataSources as dataSourcesTable } from '@core/schema';
import { InternalServerErrorResponse, OkResponse } from '@lib/api-responses';
import { getDataSources } from '@services/data-source';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? '25');
  const page = parseInt(searchParams.page ?? '1');
  const orderBy = searchParams.orderBy ?? 'createdAt';
  const order = searchParams.order ?? 'desc';

  try {
    const dataSources = await getDataSources({
      offset: (page - 1) * limit,
      limit,
      orderBy: buildOrderBy(dataSourcesTable, orderBy, order)
    });

    return OkResponse({
      entities: dataSources,
      page,
      perPage: limit
    });
  } catch (error) {
    console.error('Error searching data sources:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
