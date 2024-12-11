import { ICustomer } from "./Customer";
import type { PlanTaskFrequency, PlanType, SubTask } from "./PlanTasks";

export type PlanTaskProgress = "To Do" | "Doing" | "Done";
interface MonthlyProgress {
  month: string; // Format: 'YYYY-MM'
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
  month: string; // Format: 'YYYY-MM'
  current: number;
  goal: number;
  completedAt?: string | null;
}

export interface PlanTask {
  id: string;
  task: string;
  section: string;
  progress: PlanTaskProgress;
  isActive: boolean;
  notes: string;
  frequency: PlanTaskFrequency;
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

export interface ISubtask {
  completedBy: string | null;
  completedDate: string | null;
  createdAt: string;
  text: string;
  isCompleted: boolean;
  id: string;
  createdBy: string;
}

export interface IPlanTask {
  section: string;
  task: string;
  defaultCurrent: number | null;
  updatedBy: string;
  monthlyDueDate: string | null;
  order: number;
  defaultGoal: number | null;
  daysAfterJoin: number | null;
  files: TaskFile[];
  dueDate: string | null;
  updatedAt: string;
  subtasks: ISubtask[];
  progress: PlanTaskProgress;
  completedDate: string | null;
  assignedTeamMembers: string[];
  goal: number;
  frequency: PlanTaskFrequency;
  current: number;
  type: PlanType;
  requiresGoal: boolean;
  isActive: boolean;
  id: string;
  notes: string;
}

export interface PlanWithCustomer {
  id: string;
  updatedAt: string;
  sections: {
    tasks: IPlanTask[];
  }[];
  updatedBy: string;
  createdAt: string;
}
