export type PlanTaskType =
  | "Design"
  | "Optimization"
  | "Plan"
  | "Duplication"
  | "FacebookGroupPost"
  | "FacebookPagePost"
  | "InstagramPost"
  | "NewKeywordResearchLowCompetition"
  | "NewKeywordResearchHighSearches"
  | "StoreBanner"
  | "PinterestBanner"
  | "NewListing"
  | "Newsletter"
  | "Other";
export type PlanTaskFrequency = "One Time" | "Monthly" | "As Needed";
export interface SubTask {
  id: string;
  text: string;
  isCompleted?: boolean;
  completedDate: string | null;
  completedBy?: string | null;
  createdAt: string;
  createdBy: string;
}

export interface PlanTaskRule {
  id: string;
  task: string;
  section: string;
  order: number;
  frequency: PlanTaskFrequency;
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
  id: string;
  tasks: PlanTaskRule[];
  sections: string[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  type: PlanTaskType;
}
