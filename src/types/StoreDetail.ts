export interface IStoreDetail {
  id?: string;
  storeName: string;
  sales?: number;
  announcement?: string;
  about?: string;
  faq?: string;
  bannerImage?: string;
  feeShipping?: boolean;
  socialAccounts?: string[];
  activeSale?: boolean;
  starSeller?: boolean;
  ownerPhoto?: string;
  featureItems?: boolean;
  customerId: string;
  createdAt: string;
  feedback?: Partial<
    Record<keyof IStoreDetail, string | undefined>
  >;
}
