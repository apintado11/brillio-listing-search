import type { Listing } from '../types';
import {
  formatBaths,
  formatBeds,
  formatDate,
  formatScore,
  formatSqft,
  formatUsd,
} from '../format';
import { ListingPhoto } from './ListingPhoto';

type ListingCardProps = {
  listing: Listing;
  selected: boolean;
  onSelect: (listing: Listing) => void;
};

export function ListingCard({ listing, selected, onSelect }: ListingCardProps) {
  const label = `${listing.address}, ${formatUsd(listing.price)}`;

  return (
    <article>
      <button
        type="button"
        className={
          selected ? 'listing-card listing-card--selected' : 'listing-card'
        }
        aria-pressed={selected}
        aria-current={selected ? 'true' : undefined}
        aria-label={label}
        onClick={() => onSelect(listing)}
      >
        <div className="listing-card__media">
          <ListingPhoto listing={listing} className="listing-card__photo" />
          <div
            className="listing-card__score"
            title="Relevance vs your budget and recency"
          >
            <span className="listing-card__score-value">
              {formatScore(listing.score)}
            </span>
            <span className="listing-card__score-label">Match</span>
          </div>
        </div>
        <div className="listing-card__body">
          <div className="listing-card__top">
            <span className="listing-card__title">{listing.address}</span>
            <span className="listing-card__price">{formatUsd(listing.price)}</span>
          </div>
          <p className="listing-card__scan">
            <span>{listing.city}</span>
            <span>{formatBeds(listing.bedrooms)}</span>
            {listing.bathrooms !== undefined ? (
              <span>{formatBaths(listing.bathrooms)}</span>
            ) : null}
            {listing.sqft !== undefined ? (
              <span>{formatSqft(listing.sqft)}</span>
            ) : null}
            <span className={`status status--${listing.status}`}>
              {listing.status}
            </span>
            <span>{formatDate(listing.listedDate)}</span>
          </p>
          <p className="listing-card__copy">{listing.description}</p>
        </div>
      </button>
    </article>
  );
}
