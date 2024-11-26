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

export interface IEtsyFetchedListing {
  listing_id: number;
  user_id: number;
  shop_id: number;
  title: string;
  description: string;
  state: string;
  creation_timestamp: number;
  created_timestamp: number;
  ending_timestamp: number;
  original_creation_timestamp: number;
  last_modified_timestamp: number;
  updated_timestamp: number;
  state_timestamp: number;
  quantity: number;
  shop_section_id: number | null;
  featured_rank: number;
  url: string;
  num_favorers: number;
  non_taxable: boolean;
  is_taxable: boolean;
  is_customizable: boolean;
  is_personalizable: boolean;
  personalization_is_required: boolean;
  personalization_char_count_max: number | null;
  personalization_instructions: string | null;
  listing_type: string;
  tags: string[];
  materials: string[];
  shipping_profile_id: number;
  return_policy_id: number;
  processing_min: number;
  processing_max: number;
  who_made: string;
  when_made: string;
  is_supply: boolean;
  item_weight: number | null;
  item_weight_unit: string | null;
  item_length: number | null;
  item_width: number | null;
  item_height: number | null;
  item_dimensions_unit: string | null;
  is_private: boolean;
  style: string[];
  file_data: string;
  has_variations: boolean;
  should_auto_renew: boolean;
  language: string;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  taxonomy_id: number;
  production_partners: any[]; // If you know the structure of this array, replace `any` with the correct type.
  skus: any[];
  views: number;
  shipping_profile: any | null; // Replace `any` with the correct type if known.
  shop: any | null;
  images: any | null;
  videos: any | null;
  user: any | null;
  translations: any | null;
  inventory: any | null;
}

export interface IEtsyListingEdit
  extends Omit<IEtsyFetchedListing, "tags" | "materials"> {
  tags: string;
  materials: string;
}

export interface IEtsyListingUpdate {
  customerId: string;
  listingId: string;
  shipping_profile_id?: string;
  quantity?: number;
  title?: string;
  tags?: string[];
  materials?: string[];
  description?: string;
  who_made?: string;
  when_made?: string;
  taxonomy_id?: string;
  image_ids?: string[];
}
