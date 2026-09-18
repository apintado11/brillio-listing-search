import { useEffect, useRef, useState } from 'react';
import { fetchCities } from './api/listings';
import { ListingCard } from './components/ListingCard';
import { ListingDetail } from './components/ListingDetail';
import { Pagination } from './components/Pagination';
import { SearchPanel } from './components/SearchPanel';
import { EmptyState, ErrorBanner, LoadingList } from './components/Status';
import { SiteHeader } from './components/SiteHeader';
import { formatUsd } from './format';
import { useListingsSearch } from './hooks/useListingsSearch';
import {
  ENGINE_STORAGE_KEY,
  listingKey,
  type BackendEngine,
  type Listing,
  type SearchFormValues,
  type SearchParams,
  type SortOption,
} from './types';
import {
  emptyForm,
  validateSearchForm,
  type FieldErrors,
} from './validation/searchForm';

function toParams(values: SearchFormValues, page: number): SearchParams | null {
  const parsed = validateSearchForm(values);
  if (!parsed.ok) {
    return null;
  }
  return { ...parsed.params, page };
}

function sameParams(left: SearchParams | null, right: SearchParams): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

const initialParams = toParams(emptyForm, 1);
const FILTER_DELAY_MS = 280;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'match', label: 'Best match' },
  { value: 'priceAsc', label: 'Price: low to high' },
  { value: 'priceDesc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest listed' },
  { value: 'bedsDesc', label: 'Most bedrooms' },
];

function readStoredEngine(): BackendEngine {
  try {
    const stored = window.sessionStorage.getItem(ENGINE_STORAGE_KEY);
    return stored === 'python' ? 'python' : 'node';
  } catch {
    return 'node';
  }
}

export function App() {
  const [values, setValues] = useState<SearchFormValues>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [applied, setApplied] = useState<SearchParams | null>(initialParams);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cities, setCities] = useState<string[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [engine, setEngine] = useState<BackendEngine>(readStoredEngine);
  const debounceRef = useRef<number>(0);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const search = useListingsSearch(applied, refreshKey, engine);

  useEffect(() => {
    const controller = new AbortController();
    fetchCities(engine, controller.signal)
      .then(setCities)
      .catch(() => {
        if (!controller.signal.aborted) {
          setCities([]);
        }
      });
    return () => controller.abort();
  }, [engine]);

  useEffect(() => {
    if (search.status !== 'success') {
      return;
    }
    const results = search.data.results;
    setSelected((current) => {
      if (!current) {
        return current;
      }
      return (
        results.find((row) => listingKey(row) === listingKey(current)) ?? current
      );
    });
  }, [search]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelected(null);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(debounceRef.current);
  }, []);

  function applyValues(next: SearchFormValues, page = 1) {
    const parsed = validateSearchForm(next);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    const nextApplied = { ...parsed.params, page };
    setApplied((current) =>
      sameParams(current, nextApplied) ? current : nextApplied,
    );
  }

  function updateField(
    field: keyof SearchFormValues,
    value: string,
    immediate = false,
  ) {
    const next = { ...valuesRef.current, [field]: value };
    valuesRef.current = next;
    setValues(next);
    setErrors((current) => ({ ...current, [field]: undefined }));
    window.clearTimeout(debounceRef.current);
    if (immediate) {
      applyValues(next, 1);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      applyValues(next, 1);
    }, FILTER_DELAY_MS);
  }

  function submit() {
    window.clearTimeout(debounceRef.current);
    applyValues(valuesRef.current, 1);
  }

  function reset() {
    window.clearTimeout(debounceRef.current);
    valuesRef.current = emptyForm;
    setValues(emptyForm);
    setSelected(null);
    applyValues(emptyForm, 1);
  }

  function changePage(page: number) {
    if (!applied) {
      return;
    }
    setApplied({ ...applied, page });
    document.getElementById('results')?.focus();
  }

  function changePageSize(pageSize: string) {
    window.clearTimeout(debounceRef.current);
    const nextValues = { ...valuesRef.current, pageSize };
    valuesRef.current = nextValues;
    setValues(nextValues);
    applyValues(nextValues, 1);
  }

  function changeSort(sort: string) {
    window.clearTimeout(debounceRef.current);
    const nextValues = { ...valuesRef.current, sort };
    valuesRef.current = nextValues;
    setValues(nextValues);
    applyValues(nextValues, 1);
  }

  function changeEngine(next: BackendEngine) {
    setEngine(next);
    try {
      window.sessionStorage.setItem(ENGINE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setRefreshKey((key) => key + 1);
  }

  function selectListing(listing: Listing) {
    setSelected((current) =>
      current && listingKey(current) === listingKey(listing) ? null : listing,
    );
  }

  const listData =
    search.status === 'success' ||
    search.status === 'empty' ||
    search.status === 'refreshing'
      ? search.data
      : null;
  const updating = search.status === 'refreshing';
  const resultCount = listData ? listData.total : null;

  return (
    <div className="page">
      <SiteHeader engine={engine} onEngineChange={changeEngine} />
      <main>
        <section className="hero">
          <div className="hero__copy">
            <p className="eyebrow eyebrow--light">Northern Virginia listings</p>
            <h1>Let&apos;s get looking.</h1>
          </div>
        </section>

        <SearchPanel
          values={values}
          errors={errors}
          cities={cities}
          updating={updating}
          onChange={updateField}
          onSubmit={submit}
          onReset={reset}
        />

        <section
          id="results"
          className={selected ? 'results results--split' : 'results'}
          tabIndex={-1}
          aria-live="polite"
          aria-busy={updating || search.status === 'loading'}
        >
          <div className="results__toolbar">
            <div>
              <h2>Homes for you</h2>
              {resultCount !== null && applied ? (
                <p>
                  {resultCount} {resultCount === 1 ? 'match' : 'matches'} near{' '}
                  {formatUsd(applied.targetBudget)}
                  {updating ? (
                    <span className="results__updating">Updating</span>
                  ) : null}
                </p>
              ) : (
                <p>Set a budget and search.</p>
              )}
            </div>
            <div className="results__tools">
              <label className="toolbar-control">
                Sort
                <select
                  value={values.sort}
                  onChange={(event) => changeSort(event.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="toolbar-control">
                Show
                <select
                  value={values.pageSize}
                  onChange={(event) => changePageSize(event.target.value)}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </label>
            </div>
          </div>

          <div className={selected ? 'results__split' : undefined}>
            <div className="results__list">
              {search.status === 'loading' ? <LoadingList /> : null}
              {search.status === 'error' ? (
                <ErrorBanner
                  message={search.message}
                  details={search.details}
                  onRetry={() => setRefreshKey((key) => key + 1)}
                />
              ) : null}
              {listData && listData.total === 0 ? <EmptyState /> : null}
              {listData && listData.total > 0 ? (
                <>
                  <div className="listing-grid">
                    {listData.results.map((listing) => (
                      <ListingCard
                        key={listingKey(listing)}
                        listing={listing}
                        selected={
                          Boolean(
                            selected && listingKey(selected) === listingKey(listing),
                          )
                        }
                        onSelect={selectListing}
                      />
                    ))}
                  </div>
                  <Pagination
                    page={listData.page}
                    totalPages={listData.totalPages}
                    onPageChange={changePage}
                  />
                </>
              ) : null}
            </div>
            {selected ? (
              <ListingDetail
                listing={selected}
                onClose={() => setSelected(null)}
              />
            ) : null}
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <p>
          Northline listing search is a take-home demo. Rankings use a 70/30
          blend of budget fit and recency. Not a lender, not an offer to
          finance.
        </p>
      </footer>
    </div>
  );
}
