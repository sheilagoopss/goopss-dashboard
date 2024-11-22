export interface IEtsyListing {
  customerId: string;
  quantity: number;
  title: string;
  description: string;
  price: number;
  who_made: string;
  when_made: string;
  taxonomy_id: string;
}

interface ICost {
  amount: number;
  divisor: number;
  currency_code: string;
}

interface IShippingProfileDestination {
  shipping_profile_destination_id: number;
  shipping_profile_id: number;
  origin_country_iso: string;
  destination_country_iso: string;
  destination_region: string;
  primary_cost: ICost;
  secondary_cost: ICost;
  shipping_carrier_id: number;
  mail_class: string | null;
  min_delivery_days: number | null;
  max_delivery_days: number | null;
}

export interface IEtsyShippingProfile {
  shipping_profile_id: number;
  title: string;
  user_id: number;
  min_processing_days: number;
  max_processing_days: number;
  processing_days_display_label: string;
  origin_country_iso: string;
  origin_postal_code: string;
  profile_type: string;
  is_deleted: boolean;
  domestic_handling_fee: number;
  international_handling_fee: number;
  shipping_profile_destinations: IShippingProfileDestination[];
  shipping_profile_upgrades: unknown[]; // Use specific type if upgrades have a defined structure
}
