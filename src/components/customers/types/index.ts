export interface StoreOwner {
  id: string;
  store_name: string;
  store_owner_name: string;
  email: string;
  phone: string;
  date_joined: string;
  package_type: string;
  products_count: number;
  notes: string;
  weeks?: number;
  lists?: number;
  sales_when_joined?: number;
  current_sales?: number;
}
