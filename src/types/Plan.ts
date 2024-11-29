import { ICustomer } from './Customer';
import type { SubTask } from './PlanTasks';

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
  section: string;
  progress: 'To Do' | 'Doing' | 'Done';
  isActive: boolean;
  notes: string;
  frequency: 'One Time' | 'Monthly' | 'As Needed';
  dueDate: string | null;
  completedDate: string | null;
  current?: number;
  goal?: number;
  order?: number;
  daysAfterJoin?: number | null;
  subtasks?: SubTask[];
  monthlyHistory?: MonthlyHistory[];
  files?: TaskFile[];
  createdBy?: string;
  createdAt?: string;
  updatedAt: string;
  updatedBy: string;
  assignedTeamMembers?: string[];
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
