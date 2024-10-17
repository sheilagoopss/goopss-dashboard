import { useState, useCallback } from "react";
import { Customer } from "../types/Customer";
import FirebaseHelper from "../helpers/FirebaseHelper";

interface UseCustomerFetchReturn {
  fetchCustomer: (customerId: string) => Promise<Customer | null>;
  isLoading: boolean;
}

interface UseCustomerCreateReturn {
  createCustomer: (customer: Customer) => Promise<void>;
  isLoading: boolean;
}

interface UseCustomerUpdateReturn {
  updateCustomer: (
    customerId: string,
    customer: Partial<Customer>,
  ) => Promise<boolean>;
  isLoading: boolean;
}

interface UseCustomerDeleteReturn {
  deleteCustomer: (customerId: string) => Promise<void>;
  isLoading: boolean;
}

interface UseCustomerFetchAllReturn {
  fetchAllCustomers: () => Promise<Customer[]>;
  isLoading: boolean;
}

export function useCustomerFetch(): UseCustomerFetchReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomer = useCallback(
    async (customerId: string): Promise<Customer | null> => {
      setIsLoading(true);
      try {
        const customer = await FirebaseHelper.findOne<Customer>(
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
    async (customer: Customer): Promise<void> => {
      setIsLoading(true);
      try {
        await FirebaseHelper.create("customers", customer);
      } catch (error) {
        console.error("Error creating customer:", error);
      } finally {
        setIsLoading(false);
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
      customer: Partial<Customer>,
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

  const fetchAllCustomers = useCallback(async (): Promise<Customer[]> => {
    setIsLoading(true);
    try {
      const customers = await FirebaseHelper.find<Customer>("customers");
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
