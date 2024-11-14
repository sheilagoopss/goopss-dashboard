const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export const endpoints = {
  storeAnalytics: {
    scrape: `${API_URL}/api/v1/storeAnalytics/scrape`,
    getStoreAnalytics: (storeName: string) =>
      `${API_URL}/api/v1/storeAnalytics/${storeName}`,
    generateFeedback: `${API_URL}/api/v1/storeAnalytics/generateFeedback`,
    setAIPrompt: `${API_URL}/api/v1/storeAnalytics/setAIPrompt`,
  },
  facebook: {
    getUserData: `${API_URL}/api/v1/facebook/userData`,
    login: `${API_URL}/api/v1/auth/facebook`,
  },
  pinterest: {
    login: `${API_URL}/api/v1/auth/pinterest`,
  },
  listingImage: {
    download: (imageId: string) =>
      `${API_URL}/api/v1/listingImage/${imageId}/download`,
    downloadMultiple: `${API_URL}/api/v1/listingImage/downloadMultiple`,
  },
  tagify: {
    generateTags: `${API_URL}/api/v1/tagify/generate-tags`,
    generateTagsBase64: `${API_URL}/api/v1/tagify/generate-tags-base64`,
  },
  social: {
    schedulePost: `${API_URL}/api/v1/facebook/schedulePost`,
  },
};
