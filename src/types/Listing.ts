export interface Listing {
  id: string;
  title: string;
  listingID: string;
  listingTitle: string;
  listingDescription: string;
  primaryImage: string;
  listingTags: string;
  optimizationStatus: boolean;
  optimizedAt: Date | null;
  bestseller: boolean;
  totalSales: number;
  dailyViews: number;
  optimizedTitle?: string;
  optimizedDescription?: string;
  optimizedTags?: string;
  createdAt?: string;
  uploadedImages?: ListingImage[];
  hasImage?: boolean;
}

export interface ListingImage {
  id: string;
  url: string;
  listing_id: string;
  customer_id: string;
  status: 'pending' | 'approved' | 'revision';
  statusChangeDate?: Date;
  revisionNote?: string;
}
