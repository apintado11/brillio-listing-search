import { useEffect, useState } from 'react';
import { searchListings, ApiError } from '../api/listings';
import type { SearchParams, SearchResponse } from '../types';

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'refreshing'; data: SearchResponse }
  | { status: 'success'; data: SearchResponse }
  | { status: 'empty'; data: SearchResponse }
  | { status: 'error'; message: string; details: string[] };

function toResultState(data: SearchResponse): SearchState {
  return data.total === 0
    ? { status: 'empty', data }
    : { status: 'success', data };
}

export function useListingsSearch(
  params: SearchParams | null,
  refreshKey = 0,
): SearchState {
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const paramsKey = params ? JSON.stringify(params) : '';

  useEffect(() => {
    if (!paramsKey) {
      setState({ status: 'idle' });
      return;
    }

    const parsed = JSON.parse(paramsKey) as SearchParams;
    const controller = new AbortController();
    setState((current) => {
      if (
        current.status === 'success' ||
        current.status === 'empty' ||
        current.status === 'refreshing'
      ) {
        return { status: 'refreshing', data: current.data };
      }
      return { status: 'loading' };
    });

    searchListings(parsed, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }
        setState(toResultState(data));
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (err instanceof ApiError) {
          setState({
            status: 'error',
            message: err.message,
            details: err.details,
          });
          return;
        }
        setState({
          status: 'error',
          message: 'Could not reach the listing service.',
          details: [],
        });
      });

    return () => controller.abort();
  }, [paramsKey, refreshKey]);

  return state;
}
