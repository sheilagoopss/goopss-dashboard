export interface ISocialPost {
  id: string;
  content: string;
  scheduledDate: Date;
  dateCreated: Date;
  platform: "facebook" | "instagram" | "pinterest";
  listingId: string;
  customerId: string;
  imageUrl?: string;
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
