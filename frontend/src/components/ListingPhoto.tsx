import { useId } from 'react';
import type { Listing } from '../types';
import { listingKey } from '../types';

type Palette = {
  sky: string;
  ground: string;
  body: string;
  roof: string;
  trim: string;
  glass: string;
};

const PALETTES: Palette[] = [
  {
    sky: '#9eb4c8',
    ground: '#6d6a62',
    body: '#f4efe6',
    roof: '#1b2430',
    trim: '#d14836',
    glass: '#d7e6f2',
  },
  {
    sky: '#cfd8c4',
    ground: '#7a7568',
    body: '#2c3642',
    roof: '#11171f',
    trim: '#d14836',
    glass: '#e8eef4',
  },
  {
    sky: '#e4d3c0',
    ground: '#6f7d5c',
    body: '#8d4a3c',
    roof: '#1b2430',
    trim: '#f4efe6',
    glass: '#f0e6d8',
  },
  {
    sky: '#b9c7d6',
    ground: '#5c5854',
    body: '#efe7d8',
    roof: '#d14836',
    trim: '#1b2430',
    glass: '#dce7f0',
  },
  {
    sky: '#d7cfc4',
    ground: '#4f5d4a',
    body: '#3d4f44',
    roof: '#1b2430',
    trim: '#f4efe6',
    glass: '#e5eee6',
  },
  {
    sky: '#c5b7a8',
    ground: '#6b6358',
    body: '#1b2430',
    roof: '#11171f',
    trim: '#d14836',
    glass: '#f0e6d8',
  },
];

function seedFrom(listing: Pick<Listing, 'source' | 'id'>): number {
  const key = listingKey(listing);
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function paletteFor(seed: number): Palette {
  const first = PALETTES[0];
  if (!first) {
    throw new Error('Listing photo palettes are missing');
  }
  return PALETTES[seed % PALETTES.length] ?? first;
}

function isMultiUnit(address: string): boolean {
  return /apt|unit|#/i.test(address);
}

type ListingPhotoProps = {
  listing: Listing;
  className?: string;
};

export function ListingPhoto({ listing, className }: ListingPhotoProps) {
  const grainId = useId().replace(/:/g, '');
  const seed = seedFrom(listing);
  const palette = paletteFor(seed);
  const condo = isMultiUnit(listing.address);
  const windowCount = Math.min(Math.max(listing.bedrooms, 1), 4);

  return (
    <svg
      className={className}
      viewBox="0 0 160 108"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={grainId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed={seed % 20}
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.08" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="160" height="108" fill={palette.sky} />
      <rect y="74" width="160" height="34" fill={palette.ground} />
      {condo ? (
        <CondoShape palette={palette} windows={windowCount + 2} />
      ) : (
        <HouseShape palette={palette} windows={windowCount} />
      )}
      <rect width="160" height="108" filter={`url(#${grainId})`} />
    </svg>
  );
}

function HouseShape({
  palette,
  windows,
}: {
  palette: Palette;
  windows: number;
}) {
  const stride = 18;
  const start = 44 + (84 - windows * stride) / 2;
  return (
    <g>
      <polygon points="28,46 80,18 132,46" fill={palette.roof} />
      <rect x="38" y="46" width="84" height="40" fill={palette.body} />
      <rect x="72" y="62" width="16" height="24" fill={palette.trim} />
      {Array.from({ length: windows }, (_, index) => (
        <rect
          key={index}
          x={start + index * stride}
          y="52"
          width="11"
          height="11"
          fill={palette.glass}
        />
      ))}
    </g>
  );
}

function CondoShape({
  palette,
  windows,
}: {
  palette: Palette;
  windows: number;
}) {
  const cols = Math.min(windows, 5);
  return (
    <g>
      <rect x="22" y="16" width="116" height="8" fill={palette.roof} />
      <rect x="26" y="24" width="108" height="58" fill={palette.body} />
      <rect x="70" y="62" width="20" height="20" fill={palette.trim} />
      {Array.from({ length: cols }, (_, index) => (
        <g key={index}>
          <rect
            x={36 + index * 18}
            y="32"
            width="11"
            height="11"
            fill={palette.glass}
          />
          <rect
            x={36 + index * 18}
            y="47"
            width="11"
            height="11"
            fill={palette.glass}
          />
        </g>
      ))}
    </g>
  );
}
