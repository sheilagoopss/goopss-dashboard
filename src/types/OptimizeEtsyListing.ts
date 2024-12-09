export interface IOptimizeEtsyListing {
  title: string;
  description: string;
  tags: string;
}

export type OptimizationType =
  | "Title"
  | "Description"
  | "Tags"
  | "Images"
  | "Attributes"
  | "Alt text";
