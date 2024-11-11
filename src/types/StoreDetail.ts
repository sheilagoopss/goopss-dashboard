export interface IStoreDetail {
  id?: string;
  storeName: string;
  sales?: number;
  announcement?: string;
  about?: string;
  faq?: string;
  bannerImage?: string;
  feeShipping?: "yes" | "no";
  socialAccounts?: string[];
  activeSale?: "yes" | "no";
  starSeller?: "yes" | "no";
  ownerPhoto?: string;
  featureItems?: "yes" | "no";
  customerId: string;
  createdAt: string;
  updatedAt: string;
  feedback?: Partial<
    Record<keyof IStoreDetail, string | undefined>
  >;
}

export interface IAIPrompt {
  id: string;
  about: string;
  announcement: string;
  faq: string;
}
