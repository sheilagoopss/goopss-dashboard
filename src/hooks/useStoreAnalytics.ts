import { useState, useCallback } from "react";
import { IStoreDetail } from "../types/StoreDetail";
import { IAPIResponse } from "../types/API";
import HttpHelper from "../helpers/HttpHelper";
import { endpoints } from "../components/storeAnalysys/constants/endpoints";

interface UseStoreAnalyticsReturn {
  scrape: (storeName: string) => Promise<IAPIResponse<IStoreDetail> | null>;
  fetchStoreAnalytics: (
    storeName: string,
  ) => Promise<IAPIResponse<IStoreDetail[]>>;
  isLoading: boolean;
  isScraping: boolean;
}

export function useStoreAnalytics(): UseStoreAnalyticsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  const scrape = useCallback(
    async (storeName: string): Promise<IAPIResponse<IStoreDetail> | null> => {
      setIsScraping(true);
      try {
        const url = `https://etsy.com/shop/${storeName}`;
        const scrapeData = await HttpHelper.post(endpoints.scrape, {
          data: {
            url,
          },
        });

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

  const fetchStoreAnalytics = useCallback(
    async (storeName: string): Promise<IAPIResponse<IStoreDetail[]>> => {
      setIsLoading(true);
      try {
        const scrapeData = await HttpHelper.get(
          endpoints.getStoreAnalytics(storeName),
        );

        return scrapeData?.data;
      } catch (error: any) {
        console.error(error);
        return {
          message: error.message,
          data: [],
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchStoreAnalytics, scrape, isLoading, isScraping };
}
