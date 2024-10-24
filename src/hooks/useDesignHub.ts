import { useState, useCallback } from "react";
import { IImage } from "../types/DesignHub";
import FirebaseHelper from "../helpers/FirebaseHelper";
import { filterUndefined } from "../utils/filterUndefined";
import { useAuth } from "../contexts/AuthContext";
import { IAdmin } from "../types/Customer";
import { serverTimestamp } from "firebase/firestore";
import { ITask } from "../types/Task";

interface UseDesignHubFetchReturn {
  fetchDesignHub: (imageId: string) => Promise<IImage | null>;
  isLoading: boolean;
}

interface UseDesignHubCreateReturn {
  createDesignHub: (
    image: Omit<IImage, "id">,
    customerId: string,
  ) => Promise<IImage | null>;
  isLoading: boolean;
}

interface UseDesignHubUpdateReturn {
  updateDesignHub: (imageId: string, image: Partial<IImage>) => Promise<boolean>;
  isLoading: boolean;
}

interface UseDesignHubDeleteReturn {
  deleteDesignHub: (imageId: string) => Promise<void>;
  isLoading: boolean;
}

interface UseDesignHubFetchAllReturn {
  fetchAllDesignHubs: () => Promise<IImage[]>;
  isLoading: boolean;
}

export function useDesignHubFetch(): UseDesignHubFetchReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchDesignHub = useCallback(
    async (imageId: string): Promise<IImage | null> => {
      setIsLoading(true);
      try {
        const image = await FirebaseHelper.findOne<IImage>("images", imageId);
        return image;
      } catch (error) {
        console.error("Error fetching image:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchDesignHub, isLoading };
}

export function useDesignHubCreate(): UseDesignHubCreateReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const createDesignHub = useCallback(
    async (
      image: Omit<IImage, "id">,
      customerId: string,
    ): Promise<IImage | null> => {
      setIsLoading(true);
      try {
        const filteredData = filterUndefined(
          image as unknown as Record<string, string>,
        );
        const data = await FirebaseHelper.create("images", filteredData);
        if (data) {
          await FirebaseHelper.create("tasklists", {
            customerId,
            taskName: `${(user as IAdmin)?.name} added images`,
            teamMemberName: (user as IAdmin)?.name || user?.email,
            dateCompleted: serverTimestamp(),
            isDone: true,
          } as Omit<ITask, "id">);
        }
        return data;
      } catch (error) {
        console.error("Error creating image:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { createDesignHub, isLoading };
}

export function useDesignHubUpdate(): UseDesignHubUpdateReturn {
  const [isLoading, setIsLoading] = useState(false);

  const updateDesignHub = useCallback(
    async (imageId: string, image: Partial<IImage>): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updated = await FirebaseHelper.update("images", imageId, image);
        return updated;
      } catch (error) {
        console.error("Error updating image:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { updateDesignHub, isLoading };
}

export function useDesignHubDelete(): UseDesignHubDeleteReturn {
  const [isLoading, setIsLoading] = useState(false);

  const deleteDesignHub = useCallback(
    async (imageId: string): Promise<void> => {
      setIsLoading(true);
      try {
        await FirebaseHelper.delete("images", imageId);
      } catch (error) {
        console.error("Error deleting image:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { deleteDesignHub, isLoading };
}

export function useDesignHubFetchAll(): UseDesignHubFetchAllReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllDesignHubs = useCallback(async (): Promise<IImage[]> => {
    setIsLoading(true);
    try {
      const images = await FirebaseHelper.find<IImage>("images");
      return images;
    } catch (error) {
      console.error("Error fetching images:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchAllDesignHubs, isLoading };
}
