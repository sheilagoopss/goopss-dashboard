import { endpoints } from "constants/endpoints";
import HttpHelper from "helpers/HttpHelper";
import { useCallback, useState } from "react";
import { IEtsyListing, IEtsyShippingProfile } from "types/Etsy";

export interface ITaxonomy {
  id: number;
  level: number;
  name: string;
  parent_id: number | null;
  children: ITaxonomy[];
  full_path_taxonomy_ids: number[];
}

const useEtsy = () => {
  const [isConnecting, setIsConnecting] = useState(false);

  const getEtsyConnectionUrl = async () => {
    try {
      setIsConnecting(true);
      const response = await HttpHelper.get(endpoints.etsy.getConnectionUrl);
      return response?.data;
    } catch (error) {
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  return { getEtsyConnectionUrl, isConnecting };
};

export const useTaxonomy = () => {
  const [isFetchingTaxonomies, setIsFetchingTaxonomies] = useState(false);

  const fetchTaxonomies = useCallback(async (): Promise<ITaxonomy[]> => {
    setIsFetchingTaxonomies(true);
    try {
      const taxonomies = await HttpHelper.get(endpoints.etsy.getTaxonomies);
      return taxonomies?.data?.data?.results || [];
    } catch (error) {
      console.error("Error fetching taxonomies:", error);
      return [];
    } finally {
      setIsFetchingTaxonomies(false);
    }
  }, []);

  return { fetchTaxonomies, isFetchingTaxonomies };
};

export const useCreateListing = () => {
  const [isCreatingListing, setIsCreatingListing] = useState(false);

  const createListing = useCallback(
    async (listing: IEtsyListing): Promise<IEtsyListing | null> => {
      setIsCreatingListing(true);
      try {
        const response = await HttpHelper.post(endpoints.etsy.createListing, {
          data: listing,
        });
        return response?.data?.data;
      } catch (error) {
        console.error("Error creating listing:", error);
        return null;
      } finally {
        setIsCreatingListing(false);
      }
    },
    [],
  );

  return { createListing, isCreatingListing };
};

export const useShopShippingProfile = () => {
  const [isFetchingShopShippingProfile, setIsFetchingShopShippingProfile] =
    useState(false);

  const fetchShopShippingProfile = useCallback(
    async ({ customerId }: { customerId: string }): Promise<IEtsyShippingProfile[]> => {
      setIsFetchingShopShippingProfile(true);
      try {
        const response = await HttpHelper.get(
          endpoints.etsy.getShopShippingProfile(customerId),
        );
        return response?.data?.data?.results || [];
      } catch (error) {
        console.error("Error fetching shop shipping profile:", error);
        return [];
      } finally {
        setIsFetchingShopShippingProfile(false);
      }
    },
    [],
  );

  return { fetchShopShippingProfile, isFetchingShopShippingProfile };
};

export default useEtsy;
