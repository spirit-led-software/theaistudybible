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
  const LoadingFallback = () =>
    props.loadingFallback ?? (
      <div class='flex h-full w-full flex-1 items-center justify-center p-10'>
        <Spinner />
      </div>
    );

  const ErrorFallback = (fallbackProps: { error: Error; reset: () => void }) =>
    props.errorFallback ? (
      props.errorFallback(fallbackProps.error, fallbackProps.reset)
    ) : (
      <div class='flex h-full w-full items-center justify-center'>
        <div class='flex w-full max-w-xl flex-col gap-3'>
          <H1>Oops, something went wrong. Please contact support.</H1>
          <H3>{fallbackProps.error.message}</H3>
          <Show when={fallbackProps.error.stack} keyed>
            {(stack) => (
              <pre class='max-h-80 overflow-y-auto whitespace-pre-wrap text-wrap rounded-xl bg-foreground/10 p-5 text-xs'>
                {stack}
              </pre>
            )}
          </Show>
          <Show
            when={
              'cause' in fallbackProps.error &&
              fallbackProps.error.cause instanceof Error &&
              fallbackProps.error.cause
            }
            keyed
          >
            {(cause) => <H3>{cause.message}</H3>}
          </Show>
          <Button
            onClick={async () => {
              await props.query.refetch();
              fallbackProps.reset();
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    );

  const NotFoundFallback = () =>
    props.notFoundFallback ?? (
      <div class='flex h-full w-full flex-1 items-center justify-center'>Data not found</div>
    );

  return (
    <Suspense fallback={<LoadingFallback />}>
      <SentryErrorBoundary
        fallback={(error, reset) => <ErrorFallback error={error} reset={reset} />}
      >
        <Switch fallback={<NotFoundFallback />}>
          <Match when={!props.query.isFetching && !props.query.data}>
            <NotFoundFallback />
          </Match>
          <Match when={props.query.data} keyed>
            {(data) => props.children(data as Exclude<T, null | false | undefined>)}
          </Match>
        </Switch>
      </SentryErrorBoundary>
    </Suspense>
  );
}
