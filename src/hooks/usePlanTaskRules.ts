import { useState, useCallback } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PlanTaskRule, PlanTaskSection } from '../types/PlanTasks';

export const usePlanTaskRules = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchTaskRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const rulesRef = collection(db, 'plan_task_rules');
      const rulesSnapshot = await getDocs(rulesRef);
      const rules = rulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlanTaskRule[];

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
      const sectionsRef = collection(db, 'plan_task_sections');
      const sectionsSnapshot = await getDocs(sectionsRef);
      const sections = sectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlanTaskSection[];

      return sections;
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    fetchTaskRules,
    fetchSections
  };
}; 