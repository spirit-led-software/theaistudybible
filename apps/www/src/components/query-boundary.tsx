import type { CreateQueryResult } from '@tanstack/solid-query';
import type { JSX } from 'solid-js';
import { Match, Suspense, Switch } from 'solid-js';
import { SentryErrorBoundary } from './sentry/error-boundary';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { CodeBlock, H1, H3 } from './ui/typography';

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
  errorFallback?: (error: Error, retry: () => void) => JSX.Element;

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
    <SentryErrorBoundary
      fallback={(error, reset) =>
        props.errorFallback ? (
          props.errorFallback(error, reset)
        ) : (
          <div class='flex h-full w-full items-center justify-center'>
            <div class='flex w-full max-w-xl flex-col gap-3'>
              <H1>Oops, something went wrong. Please contact support.</H1>
              <H3>{error.message}</H3>
              {error.stack && <CodeBlock>{error.stack}</CodeBlock>}
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
      <Suspense
        fallback={
          props.loadingFallback ?? (
            <div class='flex h-full w-full flex-1 items-center justify-center p-10'>
              <Spinner />
            </div>
          )
        }
      >
        <Switch
          fallback={
            props.notFoundFallback ?? (
              <div class='flex h-full w-full flex-1 items-center justify-center'>
                Data not found
              </div>
            )
          }
        >
          <Match when={!props.query.isFetching && !props.query.data}>
            {props.notFoundFallback ?? (
              <div class='flex h-full w-full flex-1 items-center justify-center'>
                Data not found
              </div>
            )}
          </Match>
          <Match when={props.query.data} keyed>
            {(data) => props.children(data as Exclude<T, null | false | undefined>)}
          </Match>
        </Switch>
      </Suspense>
    </SentryErrorBoundary>
  );
}
