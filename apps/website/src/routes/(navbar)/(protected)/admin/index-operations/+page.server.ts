import { getIndexOperations } from '@revelationsai/server/services/data-source/index-op';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const limit = 50;
  const indexOperations = await getIndexOperations({
    limit
  });
  return {
    indexOperations,
    limit
  };
};
