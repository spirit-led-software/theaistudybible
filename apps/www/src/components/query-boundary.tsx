import type { CreateQueryResult } from '@tanstack/solid-query';
import type { JSX } from 'solid-js';
import { Match, Show, Suspense, Switch } from 'solid-js';
import { SentryErrorBoundary } from './error-boundary';
import { Button } from './ui/button';
import { H1, H6 } from './ui/typography';

export interface QueryBoundaryProps<T = unknown> {
  query: CreateQueryResult<T, Error>;

  /**
   * Triggered when the data is initially loading.
   */
  loadingFallback?: JSX.Element | (() => JSX.Element);

  /**
   * Triggered when fetching is complete, but the returned data was falsey.
   */
  notFoundFallback?: JSX.Element | ((retry: () => void) => JSX.Element);

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
        <Show when={props.loadingFallback} keyed>
          {(fallback) => (
            <Show
              when={typeof fallback === 'function' && fallback}
              fallback={fallback as JSX.Element}
              keyed
            >
              {(fallback) => fallback()}
            </Show>
          )}
        </Show>
      }
    >
      <SentryErrorBoundary
        fallback={(err: Error, reset) =>
          props.errorFallback ? (
            props.errorFallback(err, async () => {
              await props.query.refetch();
              reset();
            })
          ) : (
            <div class='flex h-full w-full flex-1 flex-col place-items-center justify-center space-x-2'>
              <H1>Error</H1>
              <H6 class='max-w-sm'>{err.message}</H6>
              <Button
                onClick={async () => {
                  await props.query.refetch();
                  reset();
                }}
              >
                Retry
              </Button>
            </div>
          )
        }
      >
        <Switch
          fallback={
            <Show when={props.notFoundFallback} keyed>
              {(fallback) => (
                <Show
                  when={typeof fallback === 'function' && fallback}
                  fallback={fallback as JSX.Element}
                  keyed
                >
                  {(fallback) =>
                    fallback(async () => {
                      await props.query.refetch();
                    })
                  }
                </Show>
              )}
            </Show>
          }
        >
          <Match when={!props.query.isFetching && !props.query.data}>
            <Show
              when={props.notFoundFallback}
              fallback={
                <div class='flex h-full w-full flex-1 flex-col place-items-center justify-center space-x-2'>
                  <H1>Data not found</H1>
                  <Button onClick={() => props.query.refetch()}>Retry</Button>
                </div>
              }
              keyed
            >
              {(fallback) => (
                <Show
                  when={typeof fallback === 'function' && fallback}
                  fallback={fallback as JSX.Element}
                  keyed
                >
                  {(fallback) =>
                    fallback(async () => {
                      await props.query.refetch();
                    })
                  }
                </Show>
              )}
            </Show>
          </Match>
          <Match when={props.query.data} keyed>
            {props.children(props.query.data as Exclude<T, null | false | undefined>)}
          </Match>
        </Switch>
      </SentryErrorBoundary>
    </Suspense>
  );
}
