import { FieldValue } from "firebase/firestore";
import { ICustomer } from "./Customer";

export interface ITask {
  id: string;
  taskName: string;
  customerId: string;
  teamMemberName: string;
  dateCompleted?: string | FieldValue;
  listingId?: string;
  isDone?: boolean;
  category:
    | "Design"
    | "Optimization"
    | "Plan"
    | "Duplication"
    | "FacebookGroupPost"
    | "FacebookPagePost"
    | "InstagramPost"
    | "NewKeywordResearchLowCompetition"
    | "NewKeywordResearchHighSearches"
    | "StoreBanner"
    | "PinterestBanner"
    | "Newsletter";
  count?: number;
}

export interface ITasklist extends ITask {
  customer: ICustomer | null;
  customerName: string;
  dateCompleted?: string;
}
