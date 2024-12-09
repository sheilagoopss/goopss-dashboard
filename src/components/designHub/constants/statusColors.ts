import { ListingImage } from "@/types/Listing";

export const STATUS_COLORS: Record<ListingImage["status"], string> = {
  approved: "green",
  pending: "blue",
  revision: "orange",
  superseded: "red",
};
