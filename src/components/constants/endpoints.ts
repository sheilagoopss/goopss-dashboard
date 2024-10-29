const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export const endpoints = {
  storeAnalytics: {
    scrape: `${API_URL}/api/v1/storeAnalytics/scrape`,
    getStoreAnalytics: (storeName: string) =>
      `${API_URL}/api/v1/storeAnalytics/${storeName}`,
  },
  facebook: {
    login: `${API_URL}/api/v1/auth/facebook`,
  },
  pinterest: {
    login: `${API_URL}/api/v1/auth/pinterest`,
  },
};
