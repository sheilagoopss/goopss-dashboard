import { useCallback, useState } from "react";
import { IStoreDetail } from "../types/StoreDetail";
import { processStoreDetails } from "../utils/scrapeStoreAnalysis";

interface UseScrapeReturn {
  scrape: (storeName: string) => Promise<IStoreDetail | null>;
  isLoading: boolean;
}

function useScrape(): UseScrapeReturn {
  const [isLoading, setIsLoading] = useState(false);

  const scrape = useCallback(
    async (storeName: string): Promise<IStoreDetail | null> => {
      setIsLoading(true);
      try {
        const url = `https://etsy.com/shop/${storeName}`;
        const data = await processStoreDetails(url);
        return data;
      } catch (error) {
        console.error("Error fetching image:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { scrape, isLoading };
}

export default useScrape;
