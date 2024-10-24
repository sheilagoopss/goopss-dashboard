export interface ICustomer {
  id: string;
  customer_id: string;
  store_name: string;
  store_owner_name: string;
  email?: string;
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

export interface IAdmin {
  name?: string;
  email: string;
  isAdmin: boolean;
}
