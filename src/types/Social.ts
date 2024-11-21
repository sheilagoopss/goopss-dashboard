export interface ISocialPost {
  id: string;
  content: string;
  scheduledDate: Date;
  dateCreated: Date;
  platform: "facebook" | "instagram";
  listingId: string;
  customerId: string;
  imageUrl?: string;
}