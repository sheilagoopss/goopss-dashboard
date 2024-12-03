export interface IMetrics {
  "Conversion rate": string;
  Orders: string;
  Revenue: string;
  Visits: string;
}

export interface SearchTermsData {
  searchTerm: string;
  visits: string;
}

export interface EtsyAppData {
  image: string;
  title: string;
  visits: number;
}

export interface EtsySearchData {
  advertising: string;
  clicks: string;
  doc: Record<string, unknown>;
  favorites: string;
  html: Record<string, unknown>;
  image: string;
  key: number;
  link: string;
  listingId: string;
  orders: string;
  revenue: string;
  spend: string;
  title: string;
  type: "Etsy Ad";
  usValue: string;
  views: string;
}

export interface BaseDataStructure<T> {
  html: Record<string, unknown>;
  name: string;
  data: T;
}

export interface SearchTermsStructure
  extends BaseDataStructure<SearchTermsData[]> {
  name: "Search Terms";
}

export interface EtsyAppStructure extends BaseDataStructure<EtsyAppData> {
  name: "Etsy app & other Etsy pages";
}

export interface EtsySearchStructure
  extends BaseDataStructure<EtsySearchData[]> {
  name: "Etsy search";
}

export interface OtherDataStructure<T> extends BaseDataStructure<T> {
  name: Exclude<
    string,
    "Search Terms" | "Etsy search" | "Etsy app & other Etsy pages"
  >;
}

export type CapturedDataStructure =
  | SearchTermsStructure
  | EtsyAppStructure
  | EtsySearchStructure
  | OtherDataStructure<unknown>;

export interface IListingData {
  link?: string;
  key?: number;
  favorites?: string;
  views?: string;
  title?: string;
  image?: string;
  listingId?: string;
  type?: string;
  advertising?: number;
  orders?: string;
  revenue?: string;
  usValue?: number;
}

export interface ITrafficAnalysis {
  listingsData?: IListingData[];
  data?: {
    capturedData?: CapturedDataStructure[];
  };
}

export interface ITrafficSource {
  [source: string]: number | undefined;
}

export interface IPeriodData {
  daterange: string;
  metrics?: IMetrics;
  trafficAnalysis?: ITrafficAnalysis;
  trafficSource?: ITrafficSource;
}

export interface IStat {
  id: string;
  shop: string;
  last30Days: IPeriodData;
  thisYear: IPeriodData;
  timestamp: string;
}

export interface EtsySearchInfo {
  name: "Etsy search";
  info: EtsySearchData[];
}

