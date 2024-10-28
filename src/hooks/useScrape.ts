import { useCallback, useState } from "react";
import { IStoreDetail } from "../types/StoreDetail";
import { processStoreDetails } from "../utils/scrapeStoreAnalysis";

interface UseScrapeReturn {
  scrape: (storeName: string) => Promise<IStoreDetail | null>;
  isLoading: boolean;
}

function useScrape(): UseScrapeReturn {
  const [isLoading, setIsLoading] = useState(false);

  // function openAndProcess(url: string) {
  //   const newWindow = window.open(url, "_blank");

  //   if (newWindow) {
  //     newWindow.onload = function () {
  //       // Get the HTML of the entire document
  //       const htmlContent = newWindow.document.documentElement.outerHTML;
  //       console.log(htmlContent);
  //       // Send the HTML content back to the parent window
  //       window.opener.postMessage(
  //         { html: htmlContent },
  //         window.location.origin,
  //       );

  //       // Close the new window after getting the HTML
  //       newWindow.close();
  //     };
  //   } else {
  //     console.error(
  //       "Failed to open new window. Please check your pop-up settings.",
  //     );
  //   }

  //   window.addEventListener("message", async (event) => {
  //     if (event.origin !== window.location.origin) return;

  //     const htmlData = event.data;
  //     console.log("Received HTML:", htmlData);
  //   });
  // }

  const scrape = useCallback(
    async (storeName: string): Promise<IStoreDetail | null> => {
      setIsLoading(true);
      try {
        const url = `https://etsy.com/shop/${storeName}`;
        // openAndProcess(url);
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
