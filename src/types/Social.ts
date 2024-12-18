export interface ISocialPost {
  id: string;
  content: string;
  scheduledDate: Date;
  dateCreated: Date;
  platform: "facebook" | "instagram" | "pinterest" | "facebookGroup";
  listingId: string;
  customerId: string;
  imageUrl?: string;
  images?: string[];
  pinterest?: {
    boardId?: string;
    content?: {
      title?: string;
      description?: string;
      link?: string;
      media_source?: {
        source_type?: string;
        url?: string;
      };
    };
  };
}

export interface EtsyListing {
  id: string;
  listingID: string;
  listingTitle: string;
  scheduled_post_date?: string;
  primaryImage?: string;
  totalSales?: number;
  dailyViews?: number;
  etsyLink?: string;
}