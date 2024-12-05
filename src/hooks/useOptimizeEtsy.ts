import { endpoints } from "@/constants/endpoints";
import FirebaseHelper from "@/helpers/FirebaseHelper";
import HttpHelper from "@/helpers/HttpHelper";
import { useCallback } from "react";
import { useState } from "react";
import { IAPIResponse } from "@/types/API";
import { IOptimizeEtsyListing } from "@/types/OptimizeEtsyListing";

interface UseOptimizeEtsyPromptFetchReturn {
  fetchPrompt: () => Promise<IOptimizeEtsyListing | null>;
  isFetchingPrompt: boolean;
}

interface UseOptimizeEtsyPromptUpdateReturn {
  updatePrompt: (
    params: IOptimizeEtsyListing,
  ) => Promise<IAPIResponse<IOptimizeEtsyListing> | null>;
  isUpdatingPrompt: boolean;
}

interface UseOptimizeEtsyListingReturn {
  generateFeedback: (params: {
    title: string;
    description: string;
    tags: string;
  }) => Promise<IAPIResponse<{
    titleFeedback: string;
    descriptionFeedback: string;
    tagsFeedback: string;
  }> | null>;
  isGenerating: boolean;
}

interface UseOptimizeListingReturn {
  optimizeText: (params: {
    title: string;
    description: string;
    version: number;
    storeUrl?: string;
  }) => Promise<{ title: string; description: string } | null>;
  isOptimizing: boolean;
}

export function useOptimizeEtsyPromptFetch(): UseOptimizeEtsyPromptFetchReturn {
  const [isFetchingPrompt, setIsFetchingPrompt] = useState(false);

  const fetchPrompt = useCallback(async () => {
    setIsFetchingPrompt(true);
    try {
      const promptData = await FirebaseHelper.find<IOptimizeEtsyListing>(
        "listingOptimizationPrompts",
      );
      return promptData?.at(0) || null;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setIsFetchingPrompt(false);
    }
  }, []);

  return { fetchPrompt, isFetchingPrompt };
}

export function useOptimizeEtsyPromptUpdate(): UseOptimizeEtsyPromptUpdateReturn {
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);

  const updatePrompt = useCallback(
    async (
      params: IOptimizeEtsyListing,
    ): Promise<IAPIResponse<IOptimizeEtsyListing> | null> => {
      setIsUpdatingPrompt(true);
      try {
        const updatePromptData = await HttpHelper.patch(
          endpoints.optimizeEtsy.setAIPrompt,
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

export function useOptimizeEtsyListing(): UseOptimizeEtsyListingReturn {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateFeedback = useCallback(
    async (params: {
      title: string;
      description: string;
      tags: string;
    }): Promise<IAPIResponse<{
      titleFeedback: string;
      descriptionFeedback: string;
      tagsFeedback: string;
    }> | null> => {
      setIsGenerating(true);
      try {
        const feedbackData = await HttpHelper.post(
          endpoints.optimizeEtsy.feedback,
          {
            data: params,
          },
        );

        return feedbackData?.data;
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

export function useOptimizeListing(): UseOptimizeListingReturn {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizeText = useCallback(
    async (params: {
      title: string;
      description: string;
      version: number;
      storeUrl?: string;
    }): Promise<{ title: string; description: string } | null> => {
      setIsOptimizing(true);
      try {
        const response = await HttpHelper.post(
          endpoints.listing.optimizeListing,
          {
            data: params,
          },
        );
        return response?.data;
      } catch (error) {
        console.error(error);
        return null;
      } finally {
        setIsOptimizing(false);
      }
    },
    [],
  );

  return { optimizeText, isOptimizing };
}
