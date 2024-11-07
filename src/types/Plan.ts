export interface PlanTask {
  key: string;
  section: string;
  task: string;
  progress: 'In Progress' | 'Done' | string;
  isActive: boolean;
  completedAt?: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface PlanSection {
  title: string;
  tasks: PlanTask[];
}

export interface Plan {
  customer_id: string;
  sections: PlanSection[];
  createdAt: Date;
  updatedAt: Date;
}
