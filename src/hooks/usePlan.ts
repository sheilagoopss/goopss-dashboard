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
              completedDate: null,
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
