export type Listing = {
  id: string;
  source: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
  price: number;
  bedrooms: number;
  bathrooms?: number;
  sqft?: number;
  latitude?: number;
  longitude?: number;
  status: string;
  listedDate: string;
  description: string;
  score: number;
};

export function listingKey(listing: Pick<Listing, 'source' | 'id'>): string {
  return `${listing.source}-${listing.id}`;
}

export type SearchResponse = {
  results: Listing[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SearchParams = {
  targetBudget: number;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  city?: string;
  keyword?: string;
  page: number;
  pageSize: number;
};

export type SearchFormValues = {
  targetBudget: string;
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  city: string;
  keyword: string;
  pageSize: string;
};
