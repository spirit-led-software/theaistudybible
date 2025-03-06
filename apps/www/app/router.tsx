import { QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { Button } from './components/ui/button';
import { CodeBlock, H1, P } from './components/ui/typography';
import { routeTree } from './routeTree.gen';

export function createRouter() {
  const queryClient = new QueryClient();

  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      scrollRestoration: true,
      context: { queryClient },
      defaultPreload: 'intent',
      defaultErrorComponent: ({ error, reset }) => {
        console.error(error);
        return (
          <div className='flex min-h-full w-full flex-col items-center justify-center'>
            <div className='mx-auto flex max-w-3xl flex-col items-center justify-center px-2'>
              <H1>An error occurred</H1>
              <P>{error.message}</P>
              {error.stack && <CodeBlock className='mt-2'>{error.stack}</CodeBlock>}
              <Button className='mt-4' onClick={reset}>
                Reset
              </Button>
            </div>
          </div>
        );
      },
    }),
    queryClient,
  );
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
