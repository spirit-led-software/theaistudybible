import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { rpcClient, queryClient } = await parent();

  await queryClient.prefetchQuery({
    queryKey: ['bibles'],
    queryFn: async () =>
      await rpcClient.bibles
        .$get()
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch bibles: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .catch((error) => {
          console.error(error);
          return null;
        })
  });
};
