import { endpoints } from "constants/endpoints";
import HttpHelper from "helpers/HttpHelper";
import { useCallback, useState } from "react";

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

export default useEtsy;
