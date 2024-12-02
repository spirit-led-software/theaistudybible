import type { CreateQueryResult } from '@tanstack/solid-query';
import type { JSX } from 'solid-js';
import { Match, Show, Suspense, Switch } from 'solid-js';
import { SentryErrorBoundary } from './sentry/error-boundary';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { H1, H3 } from './ui/typography';

export interface QueryBoundaryProps<T = unknown> {
  query: CreateQueryResult<T, Error>;

  /**
   * Triggered when the data is initially loading.
   */
  loadingFallback?: JSX.Element;

  /**
   * Triggered when fetching is complete, but the returned data was falsey.
   */
  notFoundFallback?: JSX.Element;

  /**
   * Triggered when the query results in an error.
   */
  errorFallback?: (err: Error, retry: () => void) => JSX.Element;

  /**
   * Triggered when fetching is complete, and the returned data is not falsey.
   */
  children: (data: Exclude<T, null | false | undefined>) => JSX.Element;
}

/**
 * Convenience wrapper that handles suspense and errors for queries. Makes the results of query.data available to
 * children (as a render prop) in a type-safe way.
 */
export function QueryBoundary<T>(props: QueryBoundaryProps<T>) {
  return (
    <Suspense
      fallback={
        props.loadingFallback ?? (
          <div class='flex h-full w-full flex-1 items-center justify-center p-10'>
            <Spinner />
          </div>
        )
      }
    >
      <SentryErrorBoundary
        fallback={(err, reset) =>
          props.errorFallback ? (
            props.errorFallback(err, async () => {
              await props.query.refetch();
              reset();
            })
          ) : (
            <div class='flex h-full w-full items-center justify-center'>
              <div class='flex w-full max-w-xl flex-col gap-3'>
                <H1>Oops, something went wrong. Please contact support.</H1>
                <H3>{err.message}</H3>
                <Show when={err.stack}>
                  {(stack) => (
                    <pre class='max-h-80 overflow-y-auto whitespace-pre-wrap text-wrap rounded-xl bg-foreground/10 p-5 text-xs'>
                      {stack()}
                    </pre>
                  )}
                </Show>
                <Show when={'cause' in err && err.cause instanceof Error && err.cause}>
                  {(cause) => <H3>{cause().message}</H3>}
                </Show>
                <Button
                  onClick={async () => {
                    await props.query.refetch();
                    reset();
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          )
        }
      >
        <Switch fallback={props.notFoundFallback}>
          <Match when={!props.query.isFetching && !props.query.data}>
            {props.notFoundFallback ?? (
              <div class='flex h-full w-full flex-1 items-center justify-center'>
                Data not found
              </div>
            )}
          </Match>
          <Match when={Boolean(props.query.data) && props.query.data}>
            {(data) => props.children(data() as Exclude<T, null | false | undefined>)}
          </Match>
        </Switch>
      </SentryErrorBoundary>
    </Suspense>
  );
}
