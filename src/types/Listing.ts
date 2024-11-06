export interface Listing {
  // Base fields
  id: string;
  title: string;
  listingID: string;
  listingTitle: string;
  listingDescription: string;
  primaryImage: string;
  listingTags: string;
  bestseller: boolean;
  totalSales: number;
  dailyViews: number;
  createdAt?: string;
  uploadedImages?: ListingImage[];
  hasImage?: boolean;
  section?: string;
  

  // Optimization fields
  optimizationStatus: boolean;
  optimizedAt: Date | null;
  optimizedTitle?: string;
  optimizedDescription?: string;
  optimizedTags?: string;

  // Duplication fields
  duplicationStatus?: boolean;
  duplicatedAt?: Date | null;
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
