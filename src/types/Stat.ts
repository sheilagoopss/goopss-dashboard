interface IMetrics {
  "Conversion rate": string;
  Orders: string;
  Revenue: string;
  Visits: string;
}

interface SearchTermsData {
  searchTerm: string;
  visits: string;
}

interface EtsyAppData {
  image: string;
  title: string;
  visits: number;
}

interface EtsySearchData {
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

interface BaseDataStructure<T> {
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

interface OtherDataStructure<T> extends BaseDataStructure<T> {
  name: Exclude<
    string,
    "Search Terms" | "Etsy search" | "Etsy app & other Etsy pages"
  >;
}

type CapturedDataStructure =
  | SearchTermsStructure
  | EtsyAppStructure
  | EtsySearchStructure
  | OtherDataStructure<unknown>;

interface IListingData {
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

interface ITrafficAnalysis {
  listingsData?: IListingData[];
  data?: {
    capturedData?: CapturedDataStructure[];
  };
}

interface ITrafficSource {
  [source: string]: number | undefined;
}

interface IPeriodData {
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
