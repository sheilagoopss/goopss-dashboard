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
  
  // Store information and social form
  website?: string;
  industry?: string;
  about?: string;
  target_audience?: string;
  facebook_link?: string;
  instagram_link?: string;
  pinterest_link?: string;
  content_tone?: string;
  first_name?: string;
  last_name?: string;
  display_shop_name?: string;
  etsy_store_url?: string;
  facebook_groups?: string;
  past_facebook_posts?: string;
  past_instagram_posts?: string;
  instagram_hashtags?: string;
  products_to_post?: string;
  competitor_social?: string;
  content_guideline?: string;

  // Social Report
  pinterest_shared_boards_goopss?: string;
  facebook_groups_goopss?: string;
  instagram_hashtags_goopss?: string;
}

export interface IAdmin {
  id: string;
  name?: string;
  email: string;
  isAdmin: boolean;
}
