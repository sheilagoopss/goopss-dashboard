export interface Image {
  id: string;
  url: string;
  status: "pending" | "approved" | "revision" | "superseded";
  title: string;
  date: string;
  revisionNote?: string;
  customer_id: string;
  originalImageId?: string;
  currentRevisionId?: string;
  listing_id?: string;
}
