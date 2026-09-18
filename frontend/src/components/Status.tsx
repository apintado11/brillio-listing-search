type ErrorBannerProps = {
  message: string;
  details: string[];
  onRetry: () => void;
};

export function ErrorBanner({ message, details, onRetry }: ErrorBannerProps) {
  return (
    <div className="banner banner--error" role="alert">
      <p className="banner__title">{message}</p>
      {details.length > 0 ? (
        <ul>
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      <button className="btn btn--primary" type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="banner banner--empty" role="status">
      <p className="banner__title">No listings matched those filters.</p>
      <p>Try a different city, a wider price range, or clear the keyword.</p>
    </div>
  );
}

export function LoadingList() {
  return (
    <div className="listing-grid" aria-busy="true" aria-live="polite">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="listing-card listing-card--skeleton" />
      ))}
    </div>
  );
}
