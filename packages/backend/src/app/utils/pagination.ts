export const paginateEntityList = (
  entities: any[],
  page: number,
  limit: number,
) => {
  if (!page) {
    page = 0;
  }
  if (!limit) {
    limit = 25;
  }
  return {
    page,
    pageCount: Math.ceil(entities.length / limit),
    perPage: limit,
    entities: entities.slice(page * limit, (page + 1) * limit),
  };
};
