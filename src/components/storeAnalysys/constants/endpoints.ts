const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export const endpoints = {
  scrape: `${API_URL}/api/v1/storeAnalytics/scrape`,
  getStoreAnalytics: (storeName: string) =>
    `${API_URL}/api/v1/storeAnalytics/${storeName}`,
};
