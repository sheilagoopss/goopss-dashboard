import { FieldValue } from 'firebase/firestore';

interface DuplicateInfo {
  listingId: string;
  createdAt: Date;
}

export interface Listing {
  // Base fields
  id: string;
  title?: string;
  customer_id: string;
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
  etsyLink: string;
  store_name: string;

  // Optimization fields
  optimizationStatus: boolean;
  optimizedAt?: Date | null;
  optimizedTitle?: string;
  optimizedDescription?: string;
  optimizedTags?: string;

  // Duplication fields
  duplicationStatus?: boolean;
  duplicatedAt?: Date | null;
  duplicatedFrom?: string;
  duplicates?: DuplicateInfo[];

}

export interface ListingImage {
  id: string;
  url: string;
  status: 'pending' | 'approved' | 'revision' | 'superseded';
  listing_id: string;
  customer_id: string;
  statusChangeDate?: Date;
  revisionNote?: string;
  date?: Date;
}
