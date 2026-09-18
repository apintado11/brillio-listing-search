import type { FormEvent } from 'react';
import { CityLookup } from './CityLookup';
import { formatMoneyInput } from '../format';
import type { SearchFormValues } from '../types';
import type { FieldErrors } from '../validation/searchForm';

type SearchPanelProps = {
  values: SearchFormValues;
  errors: FieldErrors;
  cities: string[];
  updating: boolean;
  onChange: (
    field: keyof SearchFormValues,
    value: string,
    immediate?: boolean,
  ) => void;
  onSubmit: () => void;
  onReset: () => void;
};

function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className="field__error" role="alert">
      {message}
    </p>
  );
}

export function SearchPanel({
  values,
  errors,
  cities,
  updating,
  onChange,
  onSubmit,
  onReset,
}: SearchPanelProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  const errorList = Object.values(errors).filter(Boolean);

  return (
    <form
      id="search"
      className="filters"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={updating}
      aria-describedby="search-help"
      role="search"
    >
      <p id="search-help" className="visually-hidden">
        Results update as you type. Budget ranks results; city, price range,
        and beds hide homes that do not match.
      </p>

      <div className="filters__main">
        <label htmlFor="keyword" className="visually-hidden">
          Search listings
        </label>
        <input
          id="keyword"
          name="keyword"
          type="search"
          enterKeyHint="search"
          placeholder="Search listings — pets, metro, yard"
          maxLength={80}
          value={values.keyword}
          onChange={(event) => onChange('keyword', event.target.value)}
          aria-invalid={Boolean(errors.keyword)}
          aria-describedby={errors.keyword ? 'keyword-error' : undefined}
        />
        <div className="field field--budget">
          <label htmlFor="targetBudget">Budget</label>
          <input
            id="targetBudget"
            name="targetBudget"
            inputMode="numeric"
            autoComplete="off"
            placeholder="$450,000"
            value={values.targetBudget}
            onChange={(event) =>
              onChange('targetBudget', formatMoneyInput(event.target.value))
            }
            aria-invalid={Boolean(errors.targetBudget)}
            aria-describedby="budget-hint targetBudget-error"
            required
          />
        </div>
        <button className="btn btn--primary" type="submit">
          Search
        </button>
        <FieldError id="keyword-error" message={errors.keyword} />
        <FieldError id="targetBudget-error" message={errors.targetBudget} />
      </div>

      <div className="filters__row">
        <CityLookup
          value={values.city}
          cities={cities}
          error={errors.city}
          onChange={(city, immediate) => onChange('city', city, immediate)}
        />

        <div className="field-group field-group--price">
          <span className="field-group__label" id="price-label">
            Price range
          </span>
          <div className="field-group__pair" role="group" aria-labelledby="price-label">
            <input
              id="minPrice"
              name="minPrice"
              inputMode="numeric"
              autoComplete="off"
              placeholder="$ Min"
              value={values.minPrice}
              onChange={(event) =>
                onChange('minPrice', formatMoneyInput(event.target.value))
              }
              aria-label="Minimum price"
              aria-invalid={Boolean(errors.minPrice)}
              aria-describedby={errors.minPrice ? 'minPrice-error' : undefined}
            />
            <span className="field-group__dash" aria-hidden="true">
              –
            </span>
            <input
              id="maxPrice"
              name="maxPrice"
              inputMode="numeric"
              autoComplete="off"
              placeholder="$ Max"
              value={values.maxPrice}
              onChange={(event) =>
                onChange('maxPrice', formatMoneyInput(event.target.value))
              }
              aria-label="Maximum price"
              aria-invalid={Boolean(errors.maxPrice)}
              aria-describedby={errors.maxPrice ? 'maxPrice-error' : undefined}
            />
          </div>
          <FieldError id="minPrice-error" message={errors.minPrice} />
          <FieldError id="maxPrice-error" message={errors.maxPrice} />
        </div>

        <div className="field field--beds">
          <label htmlFor="minBedrooms">Beds</label>
          <select
            id="minBedrooms"
            name="minBedrooms"
            value={values.minBedrooms}
            onChange={(event) =>
              onChange('minBedrooms', event.target.value, true)
            }
            aria-invalid={Boolean(errors.minBedrooms)}
          >
            <option value="">Any</option>
            <option value="1">1+ bed</option>
            <option value="2">2+ beds</option>
            <option value="3">3+ beds</option>
            <option value="4">4+ beds</option>
          </select>
        </div>

        <div className="filters__actions">
          <button className="btn btn--ghost" type="button" onClick={onReset}>
            Clear
          </button>
        </div>
      </div>

      <p id="budget-hint" className="filters__hint">
        Updates as you type. Budget ranks the list; price range hides homes
        outside min–max.
      </p>

      {errorList.length > 1 ? (
        <ul className="filters__errors" aria-live="polite">
          {errorList.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
