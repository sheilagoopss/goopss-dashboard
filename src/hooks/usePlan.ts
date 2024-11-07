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
      title: 'Initial setup',
      tasks: [
        { key: '1-1', section: 'General', task: 'Connect your Etsy store to Vela', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-2', section: 'General', task: 'Connect to Erank', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-3', section: 'Social', task: 'Connect to your facebook account', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-4', section: 'Social', task: 'Connect to your instagram account', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-5', section: 'Social', task: 'Connect to your pinterest account', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '1-6', section: 'Email Marketing', task: 'Create an Aweber account (only if they have a custom domain) / extract emails', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
      ]
    },
    {
      title: 'Research & Analyze',
      tasks: [
        { key: '2-1', section: 'Social', task: 'Create a social insights report', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-2', section: 'Store Page', task: 'Analyze Store banner', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-3', section: 'Store Page', task: 'Analyze About Shop Section', progress: 'Done', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-4', section: 'Store Page', task: 'Analyze About Owner Section + Owner picture', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-5', section: 'Store Page', task: 'Analyze Store Announcement, Store policies, free shipping strategy, FAQ sections', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-6', section: 'Store Page', task: 'Analyze sale, free shipping', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-7', section: 'Store Page', task: 'Check if store has featured listings on the shop page', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-8', section: 'Listings', task: "Analyze which listings doesn't have 'sections'", progress: 'Done', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-9', section: 'Listings', task: 'Analyzing which listings should have more images', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-10', section: 'Listings', task: 'New keyword research - low competition', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-11', section: 'Listings', task: 'New keyword research - High searches, High competition (for big stores)', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-12', section: 'Listings', task: 'Identify bestsellers', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-13', section: 'Listings', task: 'Identify if listings have missing, one-word, or misspelled tags', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '2-14', section: 'Ads', task: 'Analyze ads data', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
      ]
    },
    {
      title: 'Time to work!',
      tasks: [
        { key: '3-1', section: 'Store Page', task: 'Creating/optimizing About, FAQ, Announcement, etc', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '3-2', section: 'Store Page', task: 'Implement new sale and free shipping strategy', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '3-3', section: 'Design', task: 'Store Banner', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '3-4', section: 'Design', task: 'Create new product images', progress: '', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '3-5', section: 'Social', task: 'Creating new Pinterest boards', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '3-6', section: 'Listings', task: 'Update the listings with no sections', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '3-7', section: 'Listings', task: 'Listing Optimization (title, description, attributes, alt texts)', progress: '', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '3-8', section: 'Listings', task: 'Duplication of listings', progress: '', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '3-9', section: 'Listings', task: 'Update the listings with missing, one-word or misspelled tags', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '3-10', section: 'Listings', task: 'New Listings', progress: 'In Progress', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
        { key: '3-11', section: 'Email Marketing', task: 'Newsletters (for customers with custom domains)', progress: '', isActive: true, updatedAt: new Date(), updatedBy: user?.email || '' },
      ]
    }
  ];

  const fetchPlan = useCallback(async (customerId: string): Promise<Plan> => {
    setIsLoading(true);
    try {
      const planRef = doc(db, 'plans', customerId);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        // Create default plan if none exists
        const defaultPlan: Plan = {
          customer_id: customerId,
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
