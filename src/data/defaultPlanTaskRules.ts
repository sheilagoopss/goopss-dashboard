import type { PlanTaskRules } from '../types/PlanTasks';

export const defaultPlanTaskRules: PlanTaskRules = {
  sections: [
    'Getting Started',
    'SEO',
    'Social Media',
    'Marketing',
    // ... other sections
  ],
  tasks: [
    {
      id: '1',
      task: 'Create Pinterest Account',
      section: 'Getting Started',
      order: 1,
      frequency: 'One Time',
      daysAfterJoin: 1,
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      id: '2',
      task: 'Set Up Pinterest Business Account',
      section: 'Getting Started',
      order: 2,
      frequency: 'One Time',
      daysAfterJoin: 2,
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    // ... Add order field to all other tasks
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
}; 
