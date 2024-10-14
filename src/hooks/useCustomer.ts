import { useState, useCallback } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Customer } from "../types/Customer";

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
  ) => Promise<void>;
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
        const customerDoc = await getDoc(doc(db, "customers", customerId));
        if (customerDoc.exists()) {
          return { id: customerDoc.id, ...customerDoc.data() } as Customer;
        } else {
          return null;
        }
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
        const customersCollection = collection(db, "customers");
        await setDoc(doc(customersCollection, customer.customer_id), customer);
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
    async (customerId: string, customer: Partial<Customer>): Promise<void> => {
      setIsLoading(true);
      try {
        const customerDoc = doc(db, "customers", customerId);
        await setDoc(customerDoc, customer, { merge: true });
      } catch (error) {
        console.error("Error updating customer:", error);
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
        const customerDoc = doc(db, "customers", customerId);
        await deleteDoc(customerDoc);
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
      const customersCollection = collection(db, "customers");
      const querySnapshot = await getDocs(customersCollection);
      const customers: Customer[] = [];
      querySnapshot.forEach((doc) => {
        customers.push({ id: doc.id, ...doc.data() } as Customer);
      });
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
