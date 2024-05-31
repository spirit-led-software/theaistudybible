import type { PageLoad } from './$types';
import { getBibles } from './data';

export const load: PageLoad = async ({ parent }) => {
  const { rpcClient, queryClient } = await parent();

  await queryClient.prefetchQuery({
    queryKey: ['bibles'],
    queryFn: async () => await getBibles(rpcClient)
  });
};
