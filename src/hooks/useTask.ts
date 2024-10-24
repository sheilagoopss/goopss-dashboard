import { useState, useCallback } from "react";
import FirebaseHelper from "../helpers/FirebaseHelper";
import { ITasklist, ITask } from "../types/Task";
import { ICustomer } from "../types/Customer";
import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";

interface UseTaskFetchReturn {
  fetchTask: (taskId: string) => Promise<ITask | null>;
  isLoading: boolean;
}

interface UseTaskCreateReturn {
  createTask: (task: Omit<ITask, "id">) => Promise<void>;
  isLoading: boolean;
}

interface UseTaskUpdateReturn {
  updateTask: (taskId: string, task: Partial<ITask>) => Promise<boolean>;
  isLoading: boolean;
}

interface UseTaskDeleteReturn {
  deleteTask: (taskId: string) => Promise<void>;
  isLoading: boolean;
}

interface UseTaskFetchAllReturn {
  fetchAllTasks: () => Promise<ITasklist[]>;
  isLoading: boolean;
}

export function useTaskFetch(): UseTaskFetchReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchTask = useCallback(
    async (taskId: string): Promise<ITask | null> => {
      setIsLoading(true);
      try {
        const task = await FirebaseHelper.findOne<ITask>("tasklists", taskId);
        return task;
      } catch (error) {
        console.error("Error fetching task:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchTask, isLoading };
}

export function useTaskCreate(): UseTaskCreateReturn {
  const [isLoading, setIsLoading] = useState(false);

  const createTask = useCallback(
    async (task: Omit<ITask, "id">): Promise<void> => {
      setIsLoading(true);
      try {
        await FirebaseHelper.create("tasklists", task);
      } catch (error) {
        console.error("Error creating task:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { createTask, isLoading };
}

export function useTaskUpdate(): UseTaskUpdateReturn {
  const [isLoading, setIsLoading] = useState(false);

  const updateTask = useCallback(
    async (taskId: string, task: Partial<ITask>): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updated = await FirebaseHelper.update("tasklists", taskId, task);
        return updated;
      } catch (error) {
        console.error("Error updating task:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { updateTask, isLoading };
}

export function useTaskDelete(): UseTaskDeleteReturn {
  const [isLoading, setIsLoading] = useState(false);

  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await FirebaseHelper.delete("tasklists", taskId);
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deleteTask, isLoading };
}

export function useTaskFetchAll(): UseTaskFetchAllReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllTasks = useCallback(async (): Promise<ITasklist[]> => {
    setIsLoading(true);
    try {
      const tasks = await FirebaseHelper.find<ITask>("tasklists");
      const customers = await FirebaseHelper.find<ICustomer>("customers");

      const populatedTasks: ITasklist[] = tasks.map((task) => ({
        ...task,
        customer:
          customers.find((customer) => customer.id === task.customerId) || null,
        customerName:
          customers.find((customer) => customer.id === task.customerId)
            ?.store_owner_name || "",
        dateCompleted: (task.dateCompleted as Timestamp)?.seconds
          ? dayjs(
              new Date(
                (task.dateCompleted as Timestamp)?.seconds * 1000 +
                  (task.dateCompleted as Timestamp)?.nanoseconds / 1000000,
              ),
            ).toISOString()
          : (task.dateCompleted as string),
      }));
      return populatedTasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchAllTasks, isLoading };
}
