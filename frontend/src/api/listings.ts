import type { BackendEngine, SearchParams, SearchResponse } from '../types';
import { apiPrefix } from '../types';

export class ApiError extends Error {
  status: number;
  details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function buildQuery(params: SearchParams): string {
  const query = new URLSearchParams();
  query.set('targetBudget', String(params.targetBudget));
  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));
  query.set('sort', params.sort);
  if (params.minPrice !== undefined) {
    query.set('minPrice', String(params.minPrice));
  }
  if (params.maxPrice !== undefined) {
    query.set('maxPrice', String(params.maxPrice));
  }
  if (params.minBedrooms !== undefined) {
    query.set('minBedrooms', String(params.minBedrooms));
  }
  if (params.city) {
    query.set('city', params.city);
  }
  if (params.keyword) {
    query.set('keyword', params.keyword);
  }
  return query.toString();
}

export async function fetchCities(
  engine: BackendEngine,
  signal?: AbortSignal,
): Promise<string[]> {
  const response = await fetch(`${apiPrefix(engine)}/api/cities`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new ApiError('Could not load cities', response.status);
  }
  const body = (await response.json()) as { cities?: string[] };
  return Array.isArray(body.cities) ? body.cities : [];
}

export async function searchListings(
  params: SearchParams,
  engine: BackendEngine,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const response = await fetch(
    `${apiPrefix(engine)}/api/listings?${buildQuery(params)}`,
    {
      signal,
      headers: { Accept: 'application/json' },
    },
  );

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const payload = body as { error?: string; details?: string[] } | null;
    throw new ApiError(
      payload?.error ?? 'Search failed',
      response.status,
      payload?.details ?? [],
    );
  }

  return body as SearchResponse;
}
