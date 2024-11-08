import { ICustomer } from './Customer';

export interface PlanTask {
  key: string;
  task: string;
  progress: 'To Do' | 'Doing' | 'Done';
  isActive: boolean;
  notes: string;
  frequency: 'Monthly' | 'One Time' | 'As Needed';
  dueDate: string;
  isEditing: boolean;
  current?: number;
  goal?: number;
  completedDate?: string;
  updatedAt: string;
  updatedBy: string;
  trigger?: string;
}

export interface PlanSection {
  title: string;
  tasks: PlanTask[];
}

export interface Plan {
  sections: PlanSection[];
  createdAt: string;
  updatedAt: string;
}
