import { ICustomer } from './Customer';

interface MonthlyProgress {
  month: string;  // Format: 'YYYY-MM'
  current: number;
  goal: number;
  completedAt?: string | null;
}

export interface PlanTask {
  id: string;
  task: string;
  progress: 'To Do' | 'Doing' | 'Done';
  isActive: boolean;
  notes: string;
  frequency: 'Monthly' | 'One Time' | 'As Needed';
  dueDate: string | null;
  current: number;
  goal: number;
  monthlyHistory?: MonthlyProgress[];
  completedDate: string | null;
  updatedAt: string;
  updatedBy: string;
  isEditing?: boolean;
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
