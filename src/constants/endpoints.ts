const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
    boards: (customerId: string) =>
      `${API_URL}/api/v1/pinterest/boards/${customerId}`,
    pin: `${API_URL}/api/v1/pinterest/board/pin`,
  },
  listingImage: {
    download: (imageId: string) =>
      `${API_URL}/api/v1/listingImage/${imageId}/download`,
    downloadMultiple: `${API_URL}/api/v1/listingImage/downloadMultiple`,
  },
  tagify: {
    generateTags: `${API_URL}/api/v1/tagify/generate-tags`,
    generateTagsBase64: `${API_URL}/api/v1/tagify/generate-tags-base64`,
    generateDescription: `${API_URL}/api/v1/tagify/generate-description`,
  },
  social: {
    schedulePost: `${API_URL}/api/v1/facebook/schedulePost`,
    updatePost: (postId: string) =>
      `${API_URL}/api/v1/facebook/updatePost/${postId}`,
    deletePost: (postId: string) =>
      `${API_URL}/api/v1/facebook/deletePost/${postId}`,
  },
  klaviyo: {
    subscribeCustomer: `${API_URL}/api/v1/klaviyo/subscribe-customer`,
  },
  etsy: {
    getConnectionUrl: `${API_URL}/api/v1/etsy/auth`,
    getTaxonomies: `${API_URL}/api/v1/etsy/taxonomies`,
    createListing: `${API_URL}/api/v1/etsy/create-listing`,
    getShopShippingProfile: (customerId: string) =>
      `${API_URL}/api/v1/etsy/shop-shipping-profile/${customerId}`,
    getListings: (customerId: string) =>
      `${API_URL}/api/v1/etsy/listings/${customerId}`,
    updateListing: (listingId: string) =>
      `${API_URL}/api/v1/etsy/update-listing/${listingId}`,
    getListingImages: (params: { customerId: string; listingId: string }) =>
      `${API_URL}/api/v1/etsy/listing-images/${params.customerId}/${params.listingId}`,
  },
  optimizeEtsy: {
    feedback: `${API_URL}/api/v1/optimizeEtsy/feedback`,
    setAIPrompt: `${API_URL}/api/v1/optimizeEtsy/set-ai-prompt`,
  },
  mailSender: {
    sendMail: `${API_URL}/api/v1/mail/send-email`,
  },
  listing: {
    optimizeListing: `${API_URL}/api/optimize-listing`,
  },
};
