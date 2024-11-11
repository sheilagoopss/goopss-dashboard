import { useState, useCallback } from "react";
import { IAIPrompt, IStoreDetail } from "../types/StoreDetail";
import { IAPIResponse } from "../types/API";
import HttpHelper from "../helpers/HttpHelper";
import { endpoints } from "../constants/endpoints";
import { db } from "../firebase/config";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { filterUndefined } from "utils/filterUndefined";
import FirebaseHelper from "helpers/FirebaseHelper";
import dayjs from "dayjs";

interface UseStoreAnalyticsReturn {
  scrape: (storeName: string) => Promise<IAPIResponse<IStoreDetail> | null>;
  isScraping: boolean;
}

interface UseCustomerStoreAnalyticsFetchReturn {
  fetchCustomerStoreAnalytics: (customerId: string) => Promise<IStoreDetail[]>;
  isLoading: boolean;
}

interface UseStoreAnalysisCreateReturn {
  createStoreAnalysis: (storeAnalysis: IStoreDetail) => Promise<boolean>;
  isLoading: boolean;
}

interface UseStoreAnalysisDeleteReturn {
  deleteStoreAnalysis: (storeAnalysisId: string) => Promise<boolean>;
  isDeleting: boolean;
}

interface UseGenerateFeedbackReturn {
  generateFeedback: (params: {
    aboutSection: string;
    faq: string;
    storeAnnouncement: string;
  }) => Promise<IAPIResponse<{
    aboutSectionFeedback: string;
    storeAnnouncementFeedback: string;
    faqFeedback: string;
  }> | null>;
  isGenerating: boolean;
}

interface UsePromptUpdateReturn {
  updatePrompt: (params: {
    about: string;
    announcement: string;
    faq: string;
  }) => Promise<IAPIResponse<IAIPrompt> | null>;
  isUpdatingPrompt: boolean;
}

interface UsePromptFetchReturn {
  fetchPrompt: () => Promise<IAIPrompt[] | null>;
  isFetchingPrompt: boolean;
}

interface UseStoreAnalysisUpdateReturn {
  updateStoreAnalysis: (
    storeAnalysisId: string,
    storeAnalysis: IStoreDetail,
  ) => Promise<boolean>;
  isUpdatingStoreAnalysis: boolean;
}

export function useStoreAnalytics(): UseStoreAnalyticsReturn {
  const [isScraping, setIsScraping] = useState(false);

  const scrape = useCallback(
    async (storeName: string): Promise<IAPIResponse<IStoreDetail> | null> => {
      setIsScraping(true);
      try {
        const url = `https://etsy.com/shop/${storeName}`;
        const scrapeData = await HttpHelper.post(
          endpoints.storeAnalytics.scrape,
          {
            data: {
              url,
            },
          },
        );

        return scrapeData?.data;
      } catch (error) {
        console.error(error);
        return null;
      } finally {
        setIsScraping(false);
      }
    },
    [],
  );

  return { scrape, isScraping };
}

export function useCustomerStoreAnalyticsFetch(): UseCustomerStoreAnalyticsFetchReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomerStoreAnalytics = useCallback(
    async (customerId: string): Promise<IStoreDetail[]> => {
      setIsLoading(true);
      try {
        const dbQuery = query(
          collection(db, "storeAnalysis"),
          where("customerId", "==", customerId),
        );
        const analysis = await getDocs(dbQuery);
        const analysisData = analysis.docs.map((storeAnalysisDoc) => ({
          ...(storeAnalysisDoc.data() as IStoreDetail),
          id: storeAnalysisDoc.id,
          createdAt: (storeAnalysisDoc.data().createdAt as Timestamp)?.seconds
            ? dayjs(
                new Date(
                  (storeAnalysisDoc.data().createdAt as Timestamp)?.seconds *
                    1000 +
                    (storeAnalysisDoc.data().createdAt as Timestamp)
                      ?.nanoseconds /
                      1000000,
                ),
              ).toISOString()
            : (storeAnalysisDoc.data().createdAt as string),
        }));
        return analysisData as IStoreDetail[];
      } catch (error) {
        console.error("Error fetching store analysis:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchCustomerStoreAnalytics, isLoading };
}

export function useStoreAnalysisCreate(): UseStoreAnalysisCreateReturn {
  const [isLoading, setIsLoading] = useState(false);

  const createStoreAnalysis = useCallback(
    async (storeAnalysis: IStoreDetail): Promise<boolean> => {
      setIsLoading(true);
      try {
        const filteredData = filterUndefined(
          storeAnalysis as unknown as Record<string, string>,
        );
        await FirebaseHelper.create("storeAnalysis", filteredData);
      } catch (error) {
        console.error("Error creating storeAnalysis:", error);
        return false;
      } finally {
        setIsLoading(false);
        return true;
      }
    },
    [],
  );

  return { createStoreAnalysis, isLoading };
}

export function useStoreAnalysisUpdate(): UseStoreAnalysisUpdateReturn {
  const [isUpdatingStoreAnalysis, setIsUpdatingStoreAnalysis] = useState(false);

  const updateStoreAnalysis = useCallback(
    async (
      storeAnalysisId: string,
      storeAnalysis: IStoreDetail,
    ): Promise<boolean> => {
      setIsUpdatingStoreAnalysis(true);
      try {
        const filteredData = filterUndefined(
          storeAnalysis as unknown as Record<string, string>,
        );
        await FirebaseHelper.update(
          "storeAnalysis",
          storeAnalysisId,
          filteredData,
        );
      } catch (error) {
        console.error("Error updating storeAnalysis:", error);
        return false;
      } finally {
        setIsUpdatingStoreAnalysis(false);
        return true;
      }
    },
    [],
  );

  return { updateStoreAnalysis, isUpdatingStoreAnalysis };
}

export function useStoreAnalysisDelete(): UseStoreAnalysisDeleteReturn {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteStoreAnalysis = useCallback(
    async (storeAnalysisId: string): Promise<boolean> => {
      setIsDeleting(true);
      try {
        await FirebaseHelper.delete("storeAnalysis", storeAnalysisId);
        return true;
      } catch (error) {
        console.error("Error deleting storeAnalysis:", error);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [],
  );

  return { deleteStoreAnalysis, isDeleting };
}

export function useGenerateFeedback(): UseGenerateFeedbackReturn {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateFeedback = useCallback(
    async (params: {
      aboutSection: string;
      faq: string;
      storeAnnouncement: string;
    }): Promise<IAPIResponse<{
      aboutSectionFeedback: string;
      storeAnnouncementFeedback: string;
      faqFeedback: string;
    }> | null> => {
      setIsGenerating(true);
      try {
        const scrapeData = await HttpHelper.post(
          endpoints.storeAnalytics.generateFeedback,
          {
            data: params,
          },
        );

        return scrapeData?.data;
      } catch (error) {
        console.error(error);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  return { generateFeedback, isGenerating };
}

export function usePromptFetch(): UsePromptFetchReturn {
  const [isFetchingPrompt, setIsFetchingPrompt] = useState(false);

  const fetchPrompt = useCallback(async () => {
    setIsFetchingPrompt(true);
    try {
      const promptData =
        await FirebaseHelper.find<IAIPrompt>("feedbackPrompts");
      return promptData;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setIsFetchingPrompt(false);
    }
  }, []);

  return { fetchPrompt, isFetchingPrompt };
}

export function usePromptUpdate(): UsePromptUpdateReturn {
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);

  const updatePrompt = useCallback(
    async (params: {
      about: string;
      announcement: string;
      faq: string;
    }): Promise<IAPIResponse<IAIPrompt> | null> => {
      setIsUpdatingPrompt(true);
      try {
        const updatePromptData = await HttpHelper.patch(
          endpoints.storeAnalytics.setAIPrompt,
          {
            data: params,
          },
        );

        return updatePromptData?.data;
      } catch (error) {
        console.error(error);
        return null;
      } finally {
        setIsUpdatingPrompt(false);
      }
    },
    [],
  );

  return { updatePrompt, isUpdatingPrompt };
}
