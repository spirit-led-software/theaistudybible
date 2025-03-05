import type { UseQueryResult } from '@tanstack/react-query';
import type React from 'react';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { CodeBlock, H1, H3 } from './ui/typography';

export interface QueryBoundaryProps<T = unknown> {
  query: UseQueryResult<T, Error>;

  /**
   * Triggered when the data is initially loading.
   */
  loadingFallback?: React.ReactNode;

  /**
   * Triggered when fetching is complete, but the returned data was falsey.
   */
  notFoundFallback?: React.ReactNode;

  /**
   * Triggered when the query results in an error.
   */
  errorFallback?: (error: Error, retry: () => void) => React.ReactNode;

  /**
   * Triggered when fetching is complete, and the returned data is not falsey.
   */
  children: (data: Exclude<T, null | false | undefined>) => React.ReactNode;
}

/**
 * Convenience wrapper that handles suspense and errors for queries. Makes the results of query.data available to
 * children (as a render prop) in a type-safe way.
 */
export function QueryBoundary<T>(props: QueryBoundaryProps<T>) {
  if (props.query.isFetching && !props.query.data) {
    return (
      props.loadingFallback ?? (
        <div className='flex h-full w-full flex-1 items-center justify-center p-10'>
          <Spinner />
        </div>
      )
    );
  }

  if (props.query.isError) {
    return (
      props.errorFallback?.(props.query.error, props.query.refetch) || (
        <div className='flex h-full w-full items-center justify-center'>
          <div className='flex w-full max-w-xl flex-col gap-3'>
            <H1>Oops, something went wrong. Please contact support.</H1>
            <H3>{props.query.error.message}</H3>
            {props.query.error.stack && <CodeBlock>{props.query.error.stack}</CodeBlock>}
            <Button
              onClick={async () => {
                await props.query.refetch();
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      )
    );
  }

  if (!props.query.data) {
    return (
      props.notFoundFallback ?? (
        <div className='flex h-full w-full items-center justify-center'>Data not found</div>
      )
    );
  }

  return props.children(props.query.data as Exclude<T, null | false | undefined>);
}
