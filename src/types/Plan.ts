import { ICustomer } from './Customer';

export interface MonthlyProgress {
  month: string;
  current: number;
  goal: number;
}

export interface PlanTask {
  id: string;
  task: string;
  progress: 'To Do' | 'Doing' | 'Done';
  isActive: boolean;
  notes: string;
  frequency: 'Monthly' | 'One Time' | 'As Needed';
  dueDate: string | null;
  completedDate: string | null;
  updatedAt: string;
  updatedBy: string;
  current: number;
  goal: number;
  monthlyProgress?: MonthlyProgress[];
}

export interface PlanSection {
  title: string;
  tasks: PlanTask[];
}

export interface Plan {
  sections: PlanSection[];
}
