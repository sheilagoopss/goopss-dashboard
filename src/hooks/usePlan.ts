import { useState, useCallback } from "react";
import { Plan } from "../types/Plan";
import FirebaseHelper from "../helpers/FirebaseHelper";

interface UsePlanFetchReturn {
  fetchPlan: (planId: string) => Promise<Plan | null>;
  isLoading: boolean;
}

interface UsePlanCreateReturn {
  createPlan: (plan: Plan) => Promise<void>;
  isLoading: boolean;
}

interface UsePlanUpdateReturn {
  updatePlan: (planId: string, plan: Partial<Plan>) => Promise<boolean>;
  isLoading: boolean;
}

interface UsePlanDeleteReturn {
  deletePlan: (planId: string) => Promise<void>;
  isLoading: boolean;
}

interface UsePlanFetchAllReturn {
  fetchAllPlans: () => Promise<Plan[]>;
  isLoading: boolean;
}

export function usePlanFetch(): UsePlanFetchReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlan = useCallback(
    async (planId: string): Promise<Plan | null> => {
      setIsLoading(true);
      try {
        const plan = await FirebaseHelper.findOne<Plan>("monthlyPlan", planId);
        return plan;
      } catch (error) {
        console.error("Error fetching plan:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchPlan, isLoading };
}

export function usePlanCreate(): UsePlanCreateReturn {
  const [isLoading, setIsLoading] = useState(false);

  const createPlan = useCallback(async (plan: Plan): Promise<void> => {
    setIsLoading(true);
    try {
      await FirebaseHelper.create("monthlyPlan", plan);
    } catch (error) {
      console.error("Error creating plan:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createPlan, isLoading };
}

export function usePlanUpdate(): UsePlanUpdateReturn {
  const [isLoading, setIsLoading] = useState(false);

  const updatePlan = useCallback(
    async (planId: string, plan: Partial<Plan>): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updated = await FirebaseHelper.update(
          "monthlyPlan",
          planId,
          plan,
        );
        return updated;
      } catch (error) {
        console.error("Error updating plan:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { updatePlan, isLoading };
}

export function usePlanDelete(): UsePlanDeleteReturn {
  const [isLoading, setIsLoading] = useState(false);

  const deletePlan = useCallback(async (planId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await FirebaseHelper.delete("monthlyPlan", planId);
    } catch (error) {
      console.error("Error deleting plan:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deletePlan, isLoading };
}

export function usePlanFetchAll(): UsePlanFetchAllReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllPlans = useCallback(async (): Promise<Plan[]> => {
    setIsLoading(true);
    try {
      const plans = await FirebaseHelper.find<Plan>("monthlyPlan");
      return plans;
    } catch (error) {
      console.error("Error fetching plans:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchAllPlans, isLoading };
}
