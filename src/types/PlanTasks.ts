interface SubTask {
  id: string;
  text: string;
  isCompleted?: boolean;
}

export interface PlanTaskRule {
  id: string;
  task: string;
  section: string;
  frequency: 'One Time' | 'Monthly' | 'As Needed';
  daysAfterJoin?: number | null;
  monthlyDueDate?: number | null;
  isActive: boolean;
  requiresGoal?: boolean;
  defaultGoal?: number | null;
  defaultCurrent?: number | null;
  subtasks?: SubTask[];
  updatedAt: string;
  updatedBy: string;
}

export interface PlanTaskRules {
  tasks: PlanTaskRule[];
  sections: string[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
} 