import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

type CityLookupProps = {
  value: string;
  cities: string[];
  error?: string;
  onChange: (value: string, immediate?: boolean) => void;
};

export function CityLookup({ value, cities, error, onChange }: CityLookupProps) {
  const listId = useId();
  const optionId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const query = value.trim().toLowerCase();
  const matches = cities.filter((city) =>
    query ? city.toLowerCase().includes(query) : true,
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (highlight >= matches.length) {
      setHighlight(0);
    }
  }, [highlight, matches.length]);

  function selectCity(city: string) {
    onChange(city, true);
    setOpen(false);
    inputRef.current?.focus();
  }

  function toggleOpen() {
    setOpen((current) => !current);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlight((index) =>
        matches.length === 0 ? 0 : Math.min(index + 1, matches.length - 1),
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'Enter' && open) {
      const selected = matches[highlight];
      if (selected) {
        event.preventDefault();
        selectCity(selected);
      }
    }
  }

  const activeOptionId =
    open && matches[highlight] ? `${optionId}-${highlight}` : undefined;

  return (
    <div className="city-lookup field field--city" ref={rootRef}>
      <label htmlFor="city">City</label>
      <div className="city-lookup__control">
        <input
          ref={inputRef}
          id="city"
          name="city"
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          placeholder="Type or pick a city"
          maxLength={80}
          value={value}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'city-error' : undefined}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="city-lookup__toggle"
          type="button"
          tabIndex={-1}
          aria-label="Show cities"
          aria-expanded={open}
          aria-controls={listId}
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleOpen}
        >
          <span aria-hidden="true">{open ? '▴' : '▾'}</span>
        </button>
      </div>
      {open && matches.length > 0 ? (
        <ul id={listId} className="city-lookup__menu" role="listbox">
          {matches.map((city, index) => (
            <li key={city} role="none">
              <button
                id={`${optionId}-${index}`}
                type="button"
                role="option"
                aria-selected={index === highlight}
                className={
                  index === highlight
                    ? 'city-lookup__option city-lookup__option--active'
                    : 'city-lookup__option'
                }
                onMouseEnter={() => setHighlight(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCity(city)}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p id="city-error" className="field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
