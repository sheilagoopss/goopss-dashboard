import { useState, useCallback } from 'react';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PlanTaskRule, PlanTaskRules } from '../types/PlanTasks';
import { packageTypes } from '../types/Customer';
import { message } from 'antd';
import dayjs from 'dayjs';

const getPackageId = (displayName: string): string => {
  const packageId = Object.entries(packageTypes).find(
    ([key, value]) => value === displayName
  )?.[0];
  
  return packageId || '';
};

export const usePlanTaskRules = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const fetchTaskRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const rulesRef = doc(db, 'planTaskRules', 'default');
      const rulesDoc = await getDoc(rulesRef);
      const rules = rulesDoc.exists() ? (rulesDoc.data() as PlanTaskRules).tasks : [];

      return rules;
    } catch (error) {
      console.error('Error fetching task rules:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSections = useCallback(async () => {
    setIsLoading(true);
    try {
      const rulesRef = doc(db, 'planTaskRules', 'default');
      const rulesDoc = await getDoc(rulesRef);
      const sections = rulesDoc.exists() ? (rulesDoc.data() as PlanTaskRules).sections : [];

      return sections;
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPackageRules = useCallback(async (packageType: string) => {
    setIsLoading(true);
    try {
      const packageId = getPackageId(packageType);
      const rulesRef = doc(db, 'planTaskRules', packageId);
      const rulesDoc = await getDoc(rulesRef);
      return rulesDoc.exists() ? rulesDoc.data() : null;
    } catch (error) {
      console.error('Error fetching package rules:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEdit = useCallback(async (editedRule: PlanTaskRule) => {
    setIsLoading(true);
    try {
      console.log('Selected Package:', selectedPackage);
      console.log('Document ID:', selectedPackage ? getPackageId(selectedPackage) : 'default');

      const docId = selectedPackage ? getPackageId(selectedPackage) : 'default';
      const rulesRef = doc(db, 'planTaskRules', docId);
      const rulesDoc = await getDoc(rulesRef);
      
      if (rulesDoc.exists()) {
        const currentRules = rulesDoc.data() as PlanTaskRules;
        const updatedTasks = currentRules.tasks.map(task => 
          task.id === editedRule.id ? editedRule : task
        );

        console.log('Updating document:', docId);

        await setDoc(rulesRef, {
          ...currentRules,
          tasks: updatedTasks,
          updatedAt: new Date().toISOString()
        });

        message.success(`Rule updated in ${selectedPackage || 'default'} rules`);
        return updatedTasks;
      }
    } catch (error) {
      console.error('Error updating rule:', error);
      message.error('Failed to update rule');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPackage]);

  const handleDelete = useCallback(async (ruleToDelete: PlanTaskRule) => {
    setIsLoading(true);
    try {
      if (!window.confirm(`Are you sure you want to delete this task from ${selectedPackage || 'default'} rules?`)) {
        return;
      }

      const docId = selectedPackage ? getPackageId(selectedPackage) : 'default';
      console.log('Deleting from document:', docId);

      const rulesRef = doc(db, 'planTaskRules', docId);
      const rulesDoc = await getDoc(rulesRef);
      
      if (rulesDoc.exists()) {
        const currentRules = rulesDoc.data() as PlanTaskRules;
        const updatedTasks = currentRules.tasks.filter(task => 
          task.id !== ruleToDelete.id
        );

        await setDoc(rulesRef, {
          ...currentRules,
          tasks: updatedTasks,
          updatedAt: new Date().toISOString()
        });

        message.success(`Task deleted from ${selectedPackage || 'default'} rules`);
        return updatedTasks;
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      message.error('Failed to delete rule');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPackage]);

  const handlePackageSelect = useCallback(async (packageType: string) => {
    setSelectedPackage(packageType);
    try {
      if (packageType === 'default') {
        const rulesRef = doc(db, 'planTaskRules', 'default');
        const rulesDoc = await getDoc(rulesRef);
        if (rulesDoc.exists()) {
          const data = rulesDoc.data() as PlanTaskRules;
          return data.tasks;
        }
        message.error('Default rules not found');
        return null;
      }

      const packageRules = await fetchPackageRules(packageType);
      if (!packageRules) {
        message.error('No rules found for this package');
        return null;
      }
      return (packageRules as PlanTaskRules).tasks;
    } catch (error) {
      console.error('Error loading package rules:', error);
      message.error('Failed to load package rules');
      return null;
    }
  }, [fetchPackageRules]);

  const handleSubmit = useCallback(async (values: any, editingRule: PlanTaskRule | null, user: any) => {
    setIsLoading(true);
    try {
      const docId = selectedPackage === 'default' ? 'default' : 
                   selectedPackage ? getPackageId(selectedPackage) : 'default';
                 
      console.log('Saving to document:', docId);

      const rulesRef = doc(db, 'planTaskRules', docId);
      const rulesDoc = await getDoc(rulesRef);
      
      if (rulesDoc.exists()) {
        const currentRules = rulesDoc.data() as PlanTaskRules;
        let updatedTasks = [...currentRules.tasks];

        const newTask: PlanTaskRule = {
          id: editingRule?.id || `${Date.now()}`,
          task: values.task,
          section: values.section,
          daysAfterJoin: values.daysAfterJoin === 0 ? null : values.daysAfterJoin,
          monthlyDueDate: values.frequency === 'Monthly' ? dayjs(values.monthlyDueDate).date() : null,
          frequency: values.frequency,
          isActive: true,
          requiresGoal: values.requiresGoal || false,
          defaultGoal: values.requiresGoal ? values.defaultGoal : null,
          defaultCurrent: values.requiresGoal ? (values.defaultCurrent || 0) : null,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || ''
        };

        if (editingRule) {
          updatedTasks = updatedTasks.map(task => 
            task.id === editingRule.id ? newTask : task
          );
        } else {
          updatedTasks.push(newTask);
        }

        await setDoc(rulesRef, {
          ...currentRules,
          tasks: updatedTasks,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || ''
        });

        message.success(`Task rule ${editingRule ? 'updated' : 'added'} successfully in ${selectedPackage || 'default'} rules`);
        return updatedTasks;
      }
    } catch (error) {
      console.error('Error saving task rule:', error);
      message.error('Failed to save task rule');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPackage]);

  return {
    isLoading,
    selectedPackage,
    fetchTaskRules,
    fetchSections,
    fetchPackageRules,
    handleEdit,
    handleDelete,
    handlePackageSelect,
    handleSubmit
  };
}; 