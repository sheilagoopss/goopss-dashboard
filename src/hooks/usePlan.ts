import { useState, useCallback } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plan, PlanSection, PlanTask } from '../types/Plan';
import { useAuth } from '../contexts/AuthContext';

export const usePlan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const getDefaultSections = (): PlanSection[] => [
    {
      title: 'General',
      tasks: [
        { key: '1-1', task: 'Connect your Etsy store to Vela', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-11-15', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-2', task: 'Connect to Erank', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-11-16', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
      ]
    },
    {
      title: 'Social',
      tasks: [
        { key: '1-1', task: 'Connect to your Facebook account', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-11-15', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-2', task: 'Connect to your Instagram account', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-11-16', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-3', task: 'Connect to your Pinterest account', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-11-17', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-4', task: 'Create a social insights report', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-11-18', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-5', task: 'Schedule Facebook page posts', progress: 'To Do', isActive: true, notes: '', frequency: 'Monthly', dueDate: '2024-11-19', isEditing: false, current: 0, goal: 10, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-6', task: 'Schedule Facebook group posts', progress: 'To Do', isActive: true, notes: '', frequency: 'Monthly', dueDate: '2024-11-20', isEditing: false, current: 0, goal: 10, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-7', task: 'Schedule Instagram Posts', progress: 'To Do', isActive: true, notes: '', frequency: 'Monthly', dueDate: '2024-11-21', isEditing: false, current: 0, goal: 10, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-8', task: 'Publish Pinterest pins', progress: 'To Do', isActive: true, notes: '', frequency: 'Monthly', dueDate: '2024-11-22', isEditing: false, current: 0, goal: 15, updatedAt: new Date(), updatedBy: user?.email || '' },
      ]
    },
    {
      title: 'Email Marketing',
      tasks: [
        { key: '3-1', task: 'Create an Aweber account', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-11-25', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '3-2', task: 'Newsletters', progress: 'To Do', isActive: true, notes: '', frequency: 'Monthly', dueDate: '2024-11-26', isEditing: false, current: 0, goal: 2, updatedAt: new Date(), updatedBy: user?.email || '' },
      ]
    },
    {
      title: 'Store Page',
      tasks: [
        { key: '4-1', task: 'Analyze store banner', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-11-27', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-2', task: 'Analyze About Shop Section', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-11-28', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-3', task: 'Analyze About Owner Section + Owner picture', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-11-29', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-4', task: 'Analyze Store Announcement', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-11-30', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-5', task: 'Analyze FAQs', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-01', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-6', task: 'Analyze Store policies', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-02', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-7', task: 'Analyze free shipping', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-03', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-8', task: 'Analyze store sale', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-04', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-9', task: 'Analyze featured listings', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-05', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-10', task: 'Create/update Store Announcement', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-06', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-11', task: 'Create/update FAQs', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-07', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-12', task: 'Recommend store policy changes', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-08', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-13', task: 'Recommend free shipping', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-09', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '4-14', task: 'Recommend a store sale', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-10', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
      ]
    },
    {
      title: 'Listings',
      tasks: [
        { key: '5-1', task: "Analyze which listings doesn't have 'sections'", progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-11', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '5-2', task: 'Analyzing which listings should have more images', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-12', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '5-3', task: 'New keyword research - low competition', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-13', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '5-4', task: 'New keyword research - high searches', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-14', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '5-5', task: 'Identify bestsellers', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-15', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '5-6', task: 'Identify if listings have missing', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-16', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '5-7', task: 'Update the listings with no sections', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-17', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '5-8', task: 'Listing Optimization', progress: 'To Do', isActive: true, notes: '', frequency: 'Monthly', dueDate: '2024-12-18', isEditing: false, current: 0, goal: 30, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '5-9', task: 'Duplication of listings', progress: 'To Do', isActive: true, notes: '', frequency: 'Monthly', dueDate: '2024-12-19', isEditing: false, current: 0, goal: 15, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '5-10', task: 'New Listings', progress: 'To Do', isActive: true, notes: '', frequency: 'Monthly', dueDate: '2024-12-20', isEditing: false, current: 0, goal: 10, updatedAt: new Date(), updatedBy: user?.email || '' },
      ]
    },
    {
      title: 'Design',
      tasks: [
        { key: '6-1', task: 'Store Banner', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-21', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '6-2', task: 'Create new product images', progress: 'To Do', isActive: true, notes: '', frequency: 'Monthly', dueDate: '2024-12-22', isEditing: false, current: 0, goal: 10, updatedAt: new Date(), updatedBy: user?.email || '' },
      ]
    },
    {
      title: 'Ads',
      tasks: [
        { key: '7-1', task: 'Analyze ads data', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: '2024-12-23', isEditing: false, updatedAt: new Date(), updatedBy: user?.email || '' },
      ]
    }
  ];

  const fetchPlan = useCallback(async (customerId: string): Promise<Plan> => {
    setIsLoading(true);
    try {
      const planRef = doc(db, 'plans', customerId);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        const defaultPlan: Plan = {
          sections: getDefaultSections(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await setDoc(planRef, defaultPlan);
        return defaultPlan;
      }

      return planDoc.data() as Plan;
    } catch (error) {
      console.error('Error fetching plan:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePlan = useCallback(async (customerId: string, sections: PlanSection[]) => {
    setIsLoading(true);
    try {
      const planRef = doc(db, 'plans', customerId);
      await updateDoc(planRef, {
        sections,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (
    customerId: string, 
    sectionTitle: string, 
    taskKey: string, 
    updates: Partial<PlanTask>
  ) => {
    setIsLoading(true);
    try {
      const planRef = doc(db, 'plans', customerId);
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        throw new Error('Plan not found');
      }

      const plan = planDoc.data() as Plan;
      const updatedSections = plan.sections.map(section => {
        if (section.title === sectionTitle) {
          return {
            ...section,
            tasks: section.tasks.map(task => {
              if (task.key === taskKey) {
                return {
                  ...task,
                  ...updates,
                  updatedAt: new Date(),
                  updatedBy: user?.email || ''
                };
              }
              return task;
            })
          };
        }
        return section;
      });

      await updateDoc(planRef, {
        sections: updatedSections,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isLoading,
    fetchPlan,
    updatePlan,
    updateTask
  };
};
