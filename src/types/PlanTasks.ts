export interface PlanTaskRule {
  id: string;
  task: string;
  section: string;
  daysAfterJoin: number | null;
  monthlyDueDate?: number | null;
  frequency: 'Monthly' | 'One Time' | 'As Needed';
  isActive: boolean;
  requiresGoal: boolean;
  defaultGoal?: number | null;
  defaultCurrent?: number | null;
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