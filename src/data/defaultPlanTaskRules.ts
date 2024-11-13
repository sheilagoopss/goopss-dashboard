import { PlanTaskRules } from '../types/PlanTasks';

export const defaultPlanTaskRules: PlanTaskRules = {
  tasks: [
    // General Section
    {
      id: '1-1',
      task: 'Connect your Etsy store to Vela',
      section: 'General',
      daysAfterJoin: 1,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '1-2',
      task: 'Connect to Erank',
      section: 'General',
      daysAfterJoin: 1,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },

    // Social Section
    {
      id: '2-1',
      task: 'Connect to your Facebook account',
      section: 'Social',
      daysAfterJoin: 1,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '2-2',
      task: 'Connect to your Instagram account',
      section: 'Social',
      daysAfterJoin: 1,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '2-3',
      task: 'Connect to your Pinterest account',
      section: 'Social',
      daysAfterJoin: 1,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '2-4',
      task: 'Create a social insights report',
      section: 'Social',
      daysAfterJoin: 1,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '2-5',
      task: 'Creating new Pinterest boards',
      section: 'Social',
      daysAfterJoin: 1,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '1731330908550',
      task: 'Create Facebook Posts',
      section: 'Social',
      daysAfterJoin: 7,
      frequency: 'Monthly',
      isActive: true,
      requiresGoal: true,
      defaultGoal: 10,
      defaultCurrent: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '1731384174953',
      task: 'Create Facebook group posts',
      section: 'Social',
      daysAfterJoin: 7,
      frequency: 'Monthly',
      isActive: true,
      requiresGoal: true,
      defaultGoal: 10,
      defaultCurrent: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '1731330952320',
      task: 'Create Instagram Posts',
      section: 'Social',
      daysAfterJoin: 7,
      frequency: 'Monthly',
      isActive: true,
      requiresGoal: true,
      defaultGoal: 10,
      defaultCurrent: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '1731330999362',
      task: 'Create Pinterest Posts',
      section: 'Social',
      daysAfterJoin: 7,
      frequency: 'Monthly',
      isActive: true,
      requiresGoal: true,
      defaultGoal: 10,
      defaultCurrent: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },

    // Store Page Section
    {
      id: '3-1',
      task: 'Analyze store banner',
      section: 'Store Page',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-2',
      task: 'Analyze About Shop Section',
      section: 'Store Page',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-3',
      task: 'Analyze About Owner Section + Owner picture',
      section: 'Store Page',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-4',
      task: 'Analyze Store Announcement',
      section: 'Store Page',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-5',
      task: 'Analyze FAQs',
      section: 'Store Page',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-6',
      task: 'Analyze Store policies',
      section: 'Store Page',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-7',
      task: 'Analyze free shipping',
      section: 'Store Page',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-8',
      task: 'Analyze store sale',
      section: 'Store Page',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-9',
      task: 'Analyze featured listings',
      section: 'Store Page',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-10',
      task: 'Create/update Store Announcement',
      section: 'Store Page',
      daysAfterJoin: 5,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-11',
      task: 'Create/update FAQs',
      section: 'Store Page',
      daysAfterJoin: 5,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-12',
      task: 'Recommend store policy changes',
      section: 'Store Page',
      daysAfterJoin: 5,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-13',
      task: 'Recommend free shipping',
      section: 'Store Page',
      daysAfterJoin: 5,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '3-14',
      task: 'Recommend a store sale',
      section: 'Store Page',
      daysAfterJoin: 5,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },

    // Listings Section
    {
      id: '4-1',
      task: "Analyze which listings doesn't have 'sections'",
      section: 'Listings',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '4-2',
      task: 'Analyzing which listings should have more images',
      section: 'Listings',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '4-3',
      task: 'New keyword research - low competition',
      section: 'Listings',
      daysAfterJoin: 5,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '4-4',
      task: 'New keyword research - high searches',
      section: 'Listings',
      daysAfterJoin: 5,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '4-5',
      task: 'Identify bestsellers',
      section: 'Listings',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '4-6',
      task: 'Identify if listings have missing, one-word, or misspelled tags',
      section: 'Listings',
      daysAfterJoin: 2,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '4-7',
      task: 'Update the listings with no sections',
      section: 'Listings',
      daysAfterJoin: 5,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '4-8',
      task: 'Update the listings with missing, one-word, or misspelled tags',
      section: 'Listings',
      daysAfterJoin: 5,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '4-9',
      task: 'Listing Optimization',
      section: 'Listings',
      daysAfterJoin: 1,
      frequency: 'Monthly',
      isActive: true,
      requiresGoal: true,
      defaultGoal: 30,
      defaultCurrent: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '4-10',
      task: 'Duplication of listings',
      section: 'Listings',
      daysAfterJoin: 1,
      frequency: 'As Needed',
      isActive: true,
      requiresGoal: true,
      defaultGoal: 15,
      defaultCurrent: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '4-11',
      task: 'New Listings',
      section: 'Listings',
      daysAfterJoin: 1,
      frequency: 'As Needed',
      isActive: true,
      requiresGoal: true,
      defaultGoal: 10,
      defaultCurrent: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },

    // Design Section
    {
      id: '5-1',
      task: 'Store Banner',
      section: 'Design',
      daysAfterJoin: 5,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '5-2',
      task: 'Create new product images',
      section: 'Design',
      daysAfterJoin: 1,
      frequency: 'Monthly',
      isActive: true,
      requiresGoal: true,
      defaultGoal: 10,
      defaultCurrent: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },

    // Ads Section
    {
      id: '6-1',
      task: 'Analyze ads data',
      section: 'Ads',
      daysAfterJoin: 5,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },

    // Email Marketing Section
    {
      id: '7-1',
      task: 'Create an Aweber account',
      section: 'Email Marketing',
      daysAfterJoin: 1,
      frequency: 'One Time',
      isActive: true,
      requiresGoal: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    },
    {
      id: '7-2',
      task: 'Newsletters',
      section: 'Email Marketing',
      daysAfterJoin: null,
      monthlyDueDate: 1,
      frequency: 'Monthly',
      isActive: true,
      requiresGoal: true,
      defaultGoal: 4,
      defaultCurrent: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@goopss.com'
    }
  ],
  sections: ['General', 'Social', 'Store Page', 'Listings', 'Design', 'Ads', 'Email Marketing'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  updatedBy: 'admin@goopss.com'
}; 
