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

type ListingDetailProps = {
  listing: Listing;
  onClose: () => void;
};

function placeLine(listing: Listing): string {
  const cityState = [listing.city, listing.state].filter(Boolean).join(', ');
  return [cityState, listing.zip].filter(Boolean).join(' ');
}

function mapHref(listing: Listing): string | null {
  if (listing.latitude === undefined || listing.longitude === undefined) {
    return null;
  }
  const { latitude, longitude } = listing;
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

export function ListingDetail({ listing, onClose }: ListingDetailProps) {
  const mapUrl = mapHref(listing);

  return (
    <aside className="listing-detail" aria-label="Listing details">
      <div className="listing-detail__bar">
        <p className="eyebrow">Selected listing</p>
        <button className="btn btn--ghost" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="listing-detail__media">
        <ListingPhoto listing={listing} className="listing-detail__photo" />
        <p className="listing-detail__match">
          <span>{formatScore(listing.score)}</span> match
        </p>
      </div>

      <div className="listing-detail__body">
        <h2 className="listing-detail__address">{listing.address}</h2>
        <p className="listing-detail__place">{placeLine(listing)}</p>
        <p className="listing-detail__price">{formatUsd(listing.price)}</p>

        <dl className="listing-detail__facts">
          <div>
            <dt>Beds</dt>
            <dd>{formatBeds(listing.bedrooms)}</dd>
          </div>
          {listing.bathrooms !== undefined ? (
            <div>
              <dt>Baths</dt>
              <dd>{formatBaths(listing.bathrooms)}</dd>
            </div>
          ) : null}
          {listing.sqft !== undefined ? (
            <div>
              <dt>Size</dt>
              <dd>{formatSqft(listing.sqft)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`status status--${listing.status}`}>
                {listing.status}
              </span>
            </dd>
          </div>
          <div>
            <dt>Listed</dt>
            <dd>{formatDate(listing.listedDate)}</dd>
          </div>
          <div>
            <dt>MLS</dt>
            <dd>
              {listing.source} · {listing.id}
            </dd>
          </div>
        </dl>

        <p className="listing-detail__copy">{listing.description}</p>

        {mapUrl ? (
          <a
            className="listing-detail__map"
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open map
          </a>
        ) : null}
      </div>
    </aside>
  );
}
