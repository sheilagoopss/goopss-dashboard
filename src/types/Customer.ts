export interface Customer {
  id: string;
  customer_id: string;
  store_name: string;
  store_owner_name: string;
  isAdmin: boolean;
  email: string;
  phone?: string;
  date_joined?: string;
  package_type?: string;
  customer_type?: "Free" | "Paid";
  products_count?: number;
  notes?: string;
  weeks?: number;
  lists?: number;
  sales_when_joined?: number;
  current_sales?: number;
  logo?: string;
}

export interface Admin {
  name?: string;
  email: string;
  isAdmin: boolean;
}
