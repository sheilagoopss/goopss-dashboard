interface ITrafficSource {
  Pinterest: number;
  "Direct & other traffic": number;
  "Etsy Ads": number;
  "Etsy search": number;
  Tumblr: number;
  Twitter: number;
  "Etsy app & other Etsy pages": number;
  Instagram: number;
  "Social Media": number;
  Facebook: number;
  "Etsy marketing & SEO": number;
}

interface IMetrics {
  "Conversion rate": string;
  Visits: string;
  Revenue: string;
  Orders: string;
}

interface IDateRangeData {
  daterange: string;
  trafficSource: ITrafficSource;
  metrics: IMetrics;
}

export interface IStat {
  id: string;
  thisYear: IDateRangeData;
  shop: string;
  last30Days: IDateRangeData;
  timestamp: string;
}
