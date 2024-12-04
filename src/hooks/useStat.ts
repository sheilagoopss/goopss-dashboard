import { useState, useCallback } from "react";
import FirebaseHelper from "@/helpers/FirebaseHelper";
import { IStat } from "@/types/Stat";

interface UseStatFetchReturn {
  fetchStat: (statId: string) => Promise<IStat | null>;
  isLoading: boolean;
}

interface UseStatFetchAllReturn {
  fetchAllStats: () => Promise<IStat[]>;
  isLoading: boolean;
}

export function useStatFetch(): UseStatFetchReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchStat = useCallback(
    async (statId: string): Promise<IStat | null> => {
      setIsLoading(true);
      try {
        const stat = await FirebaseHelper.findOne<IStat>("stats", statId);
        return stat;
      } catch (error) {
        console.error("Error fetching stat:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchStat, isLoading };
}

export function useStatFetchAll(): UseStatFetchAllReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllStats = useCallback(async (): Promise<IStat[]> => {
    setIsLoading(true);
    try {
      const stats = await FirebaseHelper.find<IStat>("stats");
      return stats;
    } catch (error) {
      console.error("Error fetching stats:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchAllStats, isLoading };
}
