import FirebaseHelper from "helpers/FirebaseHelper";
import { useState, useCallback } from "react";
import { IAdmin } from "types/Customer";

interface UseAdminFetchReturn {
  fetchAdmin: (adminId: string) => Promise<IAdmin | null>;
  isLoading: boolean;
}

interface UseAdminUpdateReturn {
  updateAdmin: (adminId: string, admin: Partial<IAdmin>) => Promise<boolean>;
  isLoading: boolean;
}

interface UseAdminDeleteReturn {
  deleteAdmin: (adminId: string) => Promise<void>;
  isLoading: boolean;
}

interface UseAdminFetchAllReturn {
  fetchAllAdmins: () => Promise<IAdmin[]>;
  isLoading: boolean;
}

export function useAdminFetch(): UseAdminFetchReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdmin = useCallback(
    async (adminId: string): Promise<IAdmin | null> => {
      setIsLoading(true);
      try {
        const admin = await FirebaseHelper.findOne<IAdmin>("admin", adminId);
        return admin;
      } catch (error) {
        console.error("Error fetching admin:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchAdmin, isLoading };
}

export function useAdminUpdate(): UseAdminUpdateReturn {
  const [isLoading, setIsLoading] = useState(false);

  const updateAdmin = useCallback(
    async (adminId: string, admin: Partial<IAdmin>): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updated = await FirebaseHelper.update("admin", adminId, admin);
        return updated;
      } catch (error) {
        console.error("Error updating admin:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { updateAdmin, isLoading };
}

export function useAdminDelete(): UseAdminDeleteReturn {
  const [isLoading, setIsLoading] = useState(false);

  const deleteAdmin = useCallback(async (adminId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await FirebaseHelper.delete("admin", adminId);
    } catch (error) {
      console.error("Error deleting admin:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deleteAdmin, isLoading };
}

export function useAdminFetchAll(): UseAdminFetchAllReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllAdmins = useCallback(async (): Promise<IAdmin[]> => {
    setIsLoading(true);
    try {
      const admins = await FirebaseHelper.find<IAdmin>("admin");
      return admins;
    } catch (error) {
      console.error("Error fetching admins:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchAllAdmins, isLoading };
}
