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
  contact_email?: string;
  etsyLink?: string;
}

export interface ListingImage {
  id: string;
  url: string;
  status: 'pending' | 'approved' | 'revision' | 'superseded';
  listing_id: string;
  customer_id: string;
  statusChangeDate?: Date;
  revisionNote?: string;
}
