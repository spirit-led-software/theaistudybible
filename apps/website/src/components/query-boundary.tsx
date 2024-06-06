import type { CreateQueryResult } from '@tanstack/solid-query';
import type { JSX } from 'solid-js';
import { ErrorBoundary, Match, Suspense, Switch } from 'solid-js';
import { Spinner } from './ui/spinner';

export interface QueryBoundaryProps<T = unknown> {
  query: CreateQueryResult<T, Error>;

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
        <div class="flex h-full w-full items-center justify-center">
          <Spinner size="sm" />
        </div>
      }
    >
      <ErrorBoundary
        fallback={(err: Error, reset) => (
          <div>
            <div class="error">{err.message}</div>
            <button
              onClick={async () => {
                await props.query.refetch();
                reset();
              }}
            >
              retry
            </button>
          </div>
        )}
      >
        <Switch>
          <Match when={!props.query.isFetching && !props.query.data}>
            <div class="flex h-full w-full items-center justify-center">Data not found</div>
          </Match>
          <Match when={props.query.data}>
            {props.children(props.query.data as Exclude<T, null | false | undefined>)}
          </Match>
        </Switch>
      </ErrorBoundary>
    </Suspense>
  );
}
