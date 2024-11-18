import { ICustomer } from './Customer';

interface MonthlyProgress {
  month: string;  // Format: 'YYYY-MM'
  current: number;
  goal: number;
  completedAt?: string | null;
}

export interface TaskFile {
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface MonthlyHistory {
  month: string;  // Format: 'YYYY-MM'
  current: number;
  goal: number;
  completedAt?: string | null;
}

export interface PlanTask {
  id: string;
  task: string;
  progress: 'To Do' | 'Doing' | 'Done';
  frequency: 'Monthly' | 'One Time' | 'As Needed';
  dueDate: string | null;
  completedDate: string | null;
  isActive: boolean;
  notes: string;
  current: number;
  goal: number;
  updatedAt: string;
  updatedBy: string;
  files?: TaskFile[];
  createdBy?: string;
  createdAt?: string;
  monthlyHistory?: MonthlyHistory[];
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
