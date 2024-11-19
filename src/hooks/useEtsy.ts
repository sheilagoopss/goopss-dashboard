import { endpoints } from "constants/endpoints";
import HttpHelper from "helpers/HttpHelper";
import { useState } from "react";

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

export default useEtsy;
