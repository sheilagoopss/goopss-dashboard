import type { PlanTaskFrequency, PlanTaskType, SubTask } from "./PlanTasks";

export type PlanTaskProgress = "To Do" | "Doing" | "Done";
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
  progress: 'To Do' | 'Doing' | 'Done';
  frequency: 'One Time' | 'Monthly' | 'As Needed';
  current: number;
  goal: number;
  dueDate: string | null;
  completedDate: string | null;
  isActive: boolean;
  notes: string;
  assignedTeamMembers: string[];
  subtasks: ISubtask[];
  files: TaskFile[];
  createdAt: string;
  createdBy: string;
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
  updatedBy: string;
}

export interface ISubtask {
  id: string;
  text: string;
  isCompleted: boolean;
  completedDate: string | null;
  completedBy: string | null;
  createdAt: string;
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
  type: PlanTaskType;
  requiresGoal: boolean;
  isActive: boolean;
  id: string;
  notes: string;
  monthlyHistory: MonthlyHistory[];
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
