import { useState, useCallback } from "react";
import { ICustomer } from "../types/Customer";
import FirebaseHelper from "../helpers/FirebaseHelper";
import { filterUndefined } from "../utils/filterUndefined";
import { ListingImage } from "types/Listing";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { IUserActivity } from "types/UserActivityLog";

interface UseCustomerFetchReturn {
  fetchCustomer: (customerId: string) => Promise<ICustomer | null>;
  isLoading: boolean;
}

interface UseCustomerCreateReturn {
  createCustomer: (customer: ICustomer) => Promise<boolean>;
  isLoading: boolean;
}

interface UseCustomerUpdateReturn {
  updateCustomer: (
    customerId: string,
    customer: Partial<ICustomer>,
  ) => Promise<boolean>;
  isLoading: boolean;
}

interface UseCustomerDeleteReturn {
  deleteCustomer: (customerId: string) => Promise<void>;
  isLoading: boolean;
}

interface UseCustomerFetchAllReturn {
  fetchAllCustomers: () => Promise<ICustomer[]>;
  isLoading: boolean;
}

interface UseCustomerListingImagesFetchReturn {
  fetchCustomerListingImages: (customerId: string) => Promise<ListingImage[]>;
  isLoading: boolean;
}

interface UseCustomerUserActivityFetchReturn {
  fetchCustomerUserActivity: (customerId: string) => Promise<IUserActivity[]>;
  isLoading: boolean;
}

interface UseCustomerUserActivityFetchAllReturn {
  fetchCustomerUserActivityAll: () => Promise<IUserActivity[]>;
  isLoading: boolean;
} 

export function useCustomerFetch(): UseCustomerFetchReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomer = useCallback(
    async (customerId: string): Promise<ICustomer | null> => {
      setIsLoading(true);
      try {
        const customer = await FirebaseHelper.findOne<ICustomer>(
          "customers",
          customerId,
        );
        return customer;
      } catch (error) {
        console.error("Error fetching customer:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchCustomer, isLoading };
}

export function useCustomerCreate(): UseCustomerCreateReturn {
  const [isLoading, setIsLoading] = useState(false);

  const createCustomer = useCallback(
    async (customer: ICustomer): Promise<boolean> => {
      setIsLoading(true);
      try {
        const filteredData = filterUndefined(
          customer as unknown as Record<string, string>,
        );
        await FirebaseHelper.create("customers", filteredData);
      } catch (error) {
        console.error("Error creating customer:", error);
        return false;
      } finally {
        setIsLoading(false);
        return true;
      }
    },
    [],
  );

  return { createCustomer, isLoading };
}

export function useCustomerUpdate(): UseCustomerUpdateReturn {
  const [isLoading, setIsLoading] = useState(false);

  const updateCustomer = useCallback(
    async (
      customerId: string,
      customer: Partial<ICustomer>,
    ): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updated = await FirebaseHelper.update(
          "customers",
          customerId,
          customer,
        );
        return updated;
      } catch (error) {
        console.error("Error updating customer:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { updateCustomer, isLoading };
}

export function useCustomerDelete(): UseCustomerDeleteReturn {
  const [isLoading, setIsLoading] = useState(false);

  const deleteCustomer = useCallback(
    async (customerId: string): Promise<void> => {
      setIsLoading(true);
      try {
        await FirebaseHelper.delete("customers", customerId);
      } catch (error) {
        console.error("Error deleting customer:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { deleteCustomer, isLoading };
}

export function useCustomerFetchAll(): UseCustomerFetchAllReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllCustomers = useCallback(async (): Promise<ICustomer[]> => {
    setIsLoading(true);
    try {
      const customers = await FirebaseHelper.find<ICustomer>("customers");
      return customers;
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchAllCustomers, isLoading };
}

export function useCustomerListingImagesFetch(): UseCustomerListingImagesFetchReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomerListingImages = useCallback(
    async (customerId: string): Promise<ListingImage[]> => {
      setIsLoading(true);
      try {
        const imagesQuery = query(
          collection(db, "images"),
          where("customer_id", "==", customerId),
        );
        const imagesSnapshot = await getDocs(imagesQuery);
        const imagesData = imagesSnapshot.docs.map((imgDoc) => ({
          ...(imgDoc.data() as ListingImage),
          id: imgDoc.id,
        }));
        return imagesData;
      } catch (error) {
        console.error("Error fetching listing images:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchCustomerListingImages, isLoading };
}

export function useCustomerUserActivityFetchAll(): UseCustomerUserActivityFetchAllReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomerUserActivityAll = useCallback(
    async (): Promise<IUserActivity[]> => {
    setIsLoading(true);
    try {
      const userActivities =
        await FirebaseHelper.find<IUserActivity>("userActivity");
      return userActivities;
    } catch (error) {
      console.error("Error fetching user activity:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchCustomerUserActivityAll, isLoading };
}
export function useCustomerUserActivityFetch(): UseCustomerUserActivityFetchReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomerUserActivity = useCallback(
    async (customerId: string): Promise<IUserActivity[]> => {
      setIsLoading(true);
      try {
        const userActivities =
          await FirebaseHelper.findWithFilter<IUserActivity>(
            "userActivity",
            "customer_id",
            customerId,
          );
        return userActivities;
      } catch (error) {
        console.error("Error fetching user activity:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchCustomerUserActivity, isLoading };
}
