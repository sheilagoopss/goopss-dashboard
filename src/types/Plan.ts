import { ICustomer } from './Customer';

interface MonthlyProgress {
  month: string;  // Format: 'YYYY-MM'
  current: number;
  goal: number;
  completedAt?: string;
}

export interface PlanTask {
  id: string;
  task: string;
  progress: 'To Do' | 'Doing' | 'Done';
  isActive: boolean;
  notes: string;
  frequency: 'Monthly' | 'One Time' | 'As Needed';
  dueDate: string | null;
  isEditing: boolean;
  current?: number;  // Current month's progress
  goal?: number;     // Current month's goal
  monthlyHistory?: MonthlyProgress[];  // Track monthly history
  completedDate?: string;
  updatedAt: string;
  updatedBy: string;
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
