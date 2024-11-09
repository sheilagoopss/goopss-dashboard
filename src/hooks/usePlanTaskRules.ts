import { useState, useCallback } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PlanTaskRule, PlanTaskRules } from '../types/PlanTasks';

export const usePlanTaskRules = () => {
  const [isLoading, setIsLoading] = useState(false);

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

  return {
    isLoading,
    fetchTaskRules,
    fetchSections
  };
}; 