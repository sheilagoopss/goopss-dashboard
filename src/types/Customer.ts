export interface ICustomer {
  id: string;
  customer_id: string;
  store_name: string;
  store_owner_name: string;
  email: string;
  customer_type: "Free" | "Paid";
  logo?: string;
  date_joined?: string;
  package_type?: string;
  products_count?: number;
  notes?: string;
  weeks?: number;
  lists?: number;
  sales_when_joined?: number;
  current_sales?: number;
  phone?: string;
  
  // New fields for store information
  website?: string;
  industry?: string;
  about?: string;
  target_audience?: string;
  facebook_link?: string;
  instagram_link?: string;
  pinterest_link?: string;
  content_tone?: string;
}

export interface IAdmin {
  name?: string;
  email: string;
  isAdmin: boolean;
}
