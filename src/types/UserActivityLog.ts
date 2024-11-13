import { Timestamp } from "firebase/firestore";

export interface IUserActivity {
  customer_id: string;
  activity: "login";
  timestamp: Timestamp;
}
