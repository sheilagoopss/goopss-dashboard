export interface PlanTaskRule {
  id: string;
  task: string;
  section: string;
  daysAfterJoin: number;  // Number of days after join date
  frequency: 'Monthly' | 'One Time' | 'As Needed';
  isActive: boolean;
  requiresGoal: boolean;
  defaultGoal?: number;
  defaultCurrent?: number;
  order: number;  // To maintain task order within sections
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PlanTaskSection {
  id: string;
  title: string;
  order: number;  // To maintain section order
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
} 