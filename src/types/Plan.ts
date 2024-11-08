import { ICustomer } from './Customer';

export interface PlanTask {
  key: string;
  task: string;
  progress: 'To Do' | 'Doing' | 'Done';
  isActive: boolean;
  notes: string;
  frequency: 'Monthly' | 'One Time';
  dueDate: string;
  isEditing: boolean;
  current?: number;
  goal?: number;
  customerId: string;
  completedDate?: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface PlanSection {
  title: string;
  tasks: PlanTask[];
}

export interface Plan {
  customer_id: string;
  sections: PlanSection[];
  createdAt: Date;
  updatedAt: Date;
}
