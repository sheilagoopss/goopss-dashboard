import { FieldValue } from "firebase/firestore";
import { Customer } from "./Customer";

export interface Task {
  id: string;
  taskName: string;
  customerId: string;
  teamMemberName: string;
  dateCompleted?: string | FieldValue;
  isDone?: boolean;
}

export interface ITasklist extends Task {
  customer: Customer | null;
  customerName: string;
  dateCompleted?: string;
}
