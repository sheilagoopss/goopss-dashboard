import { useState, useCallback } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plan, PlanSection, PlanTask } from '../types/Plan';
import { PlanTaskRules } from '../types/PlanTasks';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import { ICustomer } from '../types/Customer';
import { PlanTaskRule } from '../types/PlanTasks';

export const usePlan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const getDefaultSections = (dateJoined: string): PlanSection[] => {
    const joinDate = dayjs(dateJoined);
    const oneDayAfter = joinDate.add(1, 'day').format('YYYY-MM-DD');
    const twoDaysAfter = joinDate.add(2, 'day').format('YYYY-MM-DD');
    const fiveDaysAfter = joinDate.add(5, 'day').format('YYYY-MM-DD');

    return [
      {
        title: 'General',
        tasks: [
          { id: '1-1', task: 'Connect your Etsy store to Vela', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: oneDayAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '1-2', task: 'Connect to Erank', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: oneDayAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
        ]
      },
      {
        title: 'Social',
        tasks: [
          { id: '2-1', task: 'Connect to your Facebook account', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: oneDayAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '2-2', task: 'Connect to your Instagram account', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: oneDayAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '2-3', task: 'Connect to your Pinterest account', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: oneDayAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '2-4', task: 'Create a social insights report', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: oneDayAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '2-5', task: 'Creating new Pinterest boards', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: oneDayAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
        ]
      },
      {
        title: 'Store Page',
        tasks: [
          { id: '3-1', task: 'Analyze store banner', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-2', task: 'Analyze About Shop Section', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-3', task: 'Analyze About Owner Section + Owner picture', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-4', task: 'Analyze Store Announcement', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-5', task: 'Analyze FAQs', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-6', task: 'Analyze Store policies', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-7', task: 'Analyze free shipping', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-8', task: 'Analyze store sale', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-9', task: 'Analyze featured listings', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-10', task: 'Create/update Store Announcement', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: fiveDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-11', task: 'Create/update FAQs', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: fiveDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-12', task: 'Recommend store policy changes', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: fiveDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-13', task: 'Recommend free shipping', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: fiveDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '3-14', task: 'Recommend a store sale', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: fiveDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
        ]
      },
      {
        title: 'Listings',
        tasks: [
          { id: '4-1', task: "Analyze which listings doesn't have 'sections'", progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '4-2', task: 'Analyzing which listings should have more images', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '4-3', task: 'New keyword research - low competition', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: fiveDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '4-4', task: 'New keyword research - high searches', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: fiveDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '4-5', task: 'Identify bestsellers', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '4-6', task: 'Identify if listings have missing, one-word, or misspelled tags', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: twoDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '4-7', task: 'Update the listings with no sections', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: fiveDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '4-8', task: 'Update the listings with missing, one-word, or misspelled tags', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: fiveDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '4-9', task: 'Listing Optimization', progress: 'To Do', isActive: true, notes: '', frequency: 'Monthly', dueDate: oneDayAfter, isEditing: false, current: 0, goal: 30, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '4-10', task: 'Duplication of listings', progress: 'To Do', isActive: true, notes: '', frequency: 'As Needed', dueDate: oneDayAfter, isEditing: false, current: 0, goal: 15, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '4-11', task: 'New Listings', progress: 'To Do', isActive: true, notes: '', frequency: 'As Needed', dueDate: oneDayAfter, isEditing: false, current: 0, goal: 10, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
        ]
      },
      {
        title: 'Design',
        tasks: [
          { id: '5-1', task: 'Store Banner', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: fiveDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
          { id: '5-2', task: 'Create new product images', progress: 'To Do', isActive: true, notes: '', frequency: 'Monthly', dueDate: oneDayAfter, isEditing: false, current: 0, goal: 10, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
        ]
      },
      {
        title: 'Ads',
        tasks: [
          { id: '6-1', task: 'Analyze ads data', progress: 'To Do', isActive: true, notes: '', frequency: 'One Time', dueDate: fiveDaysAfter, isEditing: false, updatedAt: new Date().toISOString(), updatedBy: user?.email || '' },
        ]
      }
    ];
  };

  const fetchPlan = useCallback(async (customerId: string): Promise<Plan> => {
    setIsLoading(true);
    try {
      const planRef = doc(db, 'plans', customerId);
      const planDoc = await getDoc(planRef);

      console.log('Plan exists:', planDoc.exists());
      console.log('Plan data:', planDoc.data());

      const customerRef = doc(db, 'customers', customerId);
      const customerDoc = await getDoc(customerRef);
      const customerData = customerDoc.exists() ? customerDoc.data() as ICustomer : {
        date_joined: new Date().toISOString()
      } as ICustomer;

      if (!planDoc.exists()) {
        const rulesRef = doc(db, 'planTaskRules', 'default');
        const rulesDoc = await getDoc(rulesRef);
        const rules = rulesDoc.exists() ? rulesDoc.data() as PlanTaskRules : null;

        if (!rules) {
          throw new Error('Task rules not found');
        }

        const sections: PlanSection[] = rules.sections.map((sectionTitle: string) => ({
          title: sectionTitle,
          tasks: rules.tasks
            .filter((rule) => rule.section === sectionTitle)
            .map((rule) => ({
              id: rule.id,
              task: rule.task,
              progress: 'To Do' as const,
              isActive: rule.isActive,
              notes: '',
              frequency: rule.frequency,
              dueDate: calculateDueDate(customerData, rule),
              isEditing: false,
              current: rule.defaultCurrent || 0,
              goal: rule.defaultGoal || 0,
              updatedAt: new Date().toISOString(),
              updatedBy: user?.email || ''
            }))
        }));

        const defaultPlan: Plan = {
          sections,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
        updatedAt: new Date().toISOString()
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
    taskId: string,
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
              if (task.id === taskId) {
                return {
                  ...task,
                  ...updates,
                  updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const checkMonthlyProgress = useCallback(async (customerId: string) => {
    const currentMonth = dayjs().format('YYYY-MM');
    
    const planRef = doc(db, 'plans', customerId);
    const planDoc = await getDoc(planRef);
    
    if (!planDoc.exists()) {
      return;
    }

    const plan = planDoc.data() as Plan;
    let needsUpdate = false;

    const updatedSections = plan.sections.map(section => ({
      ...section,
      tasks: section.tasks.map(task => {
        if (task.frequency === 'Monthly') {
          const lastUpdateMonth = dayjs(task.updatedAt).format('YYYY-MM');
          
          if (lastUpdateMonth !== currentMonth) {
            needsUpdate = true;
            const monthlyHistory = task.monthlyHistory || [];
            monthlyHistory.push({
              month: lastUpdateMonth,
              current: task.current || 0,
              goal: task.goal || 0,
              completedAt: task.completedDate
            });

            return {
              ...task,
              current: 0,
              progress: 'To Do',
              monthlyHistory,
              updatedAt: task.updatedAt,
              updatedBy: task.updatedBy
            };
          }
        }
        return task;
      })
    }));

    if (needsUpdate) {
      await updateDoc(planRef, {
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      });
    }
  }, []);

  return {
    isLoading,
    fetchPlan,
    updatePlan,
    updateTask,
    checkMonthlyProgress
  };
};

const calculateDueDate = (customer: ICustomer, rule: PlanTaskRule) => {
  if (rule.frequency === 'Monthly' && rule.monthlyDueDate) {
    // For monthly tasks, use monthlyDueDate
    const today = dayjs();
    let nextDueDate = today.date(rule.monthlyDueDate);
    
    // If this month's due date has passed, move to next month
    if (nextDueDate.isBefore(today)) {
      nextDueDate = nextDueDate.add(1, 'month');
    }
    
    return nextDueDate.format('YYYY-MM-DD');
  } else if (rule.frequency === 'As Needed' || rule.daysAfterJoin === 0) {
    // As Needed tasks or tasks with daysAfterJoin = 0: No due date
    return null;
  } else {
    // One Time tasks: Based on join date
    return dayjs(customer.date_joined)
      .add(rule.daysAfterJoin || 0, 'day')
      .format('YYYY-MM-DD');
  }
};
