import { useState, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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

      await checkMonthlyProgress(customerId);

      const updatedPlanDoc = await getDoc(planRef);
      
      if (!updatedPlanDoc.exists()) {
        const rulesRef = doc(db, 'planTaskRules', 'default');
        const rulesDoc = await getDoc(rulesRef);
        const rules = rulesDoc.exists() ? rulesDoc.data() as PlanTaskRules : null;

        if (!rules) {
          throw new Error('Task rules not found');
        }

        const customerRef = doc(db, 'customers', customerId);
        const customerDoc = await getDoc(customerRef);
        const customerData = customerDoc.exists() ? customerDoc.data() as ICustomer : {
          date_joined: new Date().toISOString()
        } as ICustomer;

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
              updatedBy: user?.email || '',
              monthlyProgress: []
            }))
        }));

        const defaultPlan: Plan = {
          sections,
        };

        await setDoc(planRef, defaultPlan);
        return defaultPlan;
      }

      return updatedPlanDoc.data() as Plan;
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

  const checkMonthlyProgress = async (customerId: string) => {
    try {
      const planRef = doc(db, 'plans', customerId);
      const planDoc = await getDoc(planRef);

      if (planDoc.exists()) {
        const plan = planDoc.data() as Plan;
        const today = dayjs();
        const currentMonth = today.format('YYYY-MM');
        let needsUpdate = false;

        console.log('Monthly Progress Check:', {
          currentMonth,
          tasks: plan.sections.flatMap(section => 
            section.tasks
              .filter(task => task.frequency === 'Monthly')
              .map(task => ({
                task: task.task,
                current: task.current,
                lastUpdate: dayjs(task.updatedAt).format('YYYY-MM'),
                monthlyProgress: task.monthlyProgress
              }))
          )
        });

        const updatedSections = plan.sections.map(section => ({
          ...section,
          tasks: section.tasks.map(task => {
            if (task.frequency === 'Monthly') {
              const taskMonth = dayjs(task.updatedAt).format('YYYY-MM');
              
              if (taskMonth !== currentMonth) {
                console.log('Resetting task:', {
                  task: task.task,
                  from: taskMonth,
                  to: currentMonth,
                  oldValue: task.current
                });

                needsUpdate = true;
                return {
                  ...task,
                  current: 0,
                  updatedAt: today.format('YYYY-MM-DD'),
                  monthlyProgress: [
                    ...(task.monthlyProgress || []),
                    {
                      month: taskMonth,
                      current: task.current,
                      goal: task.goal
                    }
                  ]
                };
              }
            }
            return task;
          })
        }));

        if (needsUpdate) {
          console.log('Updating tasks with reset values');
          await updateDoc(planRef, { 
            sections: updatedSections,
            updatedAt: today.format('YYYY-MM-DD')
          });
        }
      }
    } catch (error) {
      console.error('Error in monthly progress check:', error);
    }
  };

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
    const today = dayjs();
    let nextDueDate = today.date(rule.monthlyDueDate);
    
    if (nextDueDate.isBefore(today)) {
      nextDueDate = nextDueDate.add(1, 'month');
    }
    
    return nextDueDate.format('YYYY-MM-DD');
  } else if (rule.frequency === 'As Needed' || rule.daysAfterJoin === 0) {
    return null;
  } else {
    return dayjs(customer.date_joined)
      .add(rule.daysAfterJoin || 0, 'day')
      .format('YYYY-MM-DD');
  }
};
