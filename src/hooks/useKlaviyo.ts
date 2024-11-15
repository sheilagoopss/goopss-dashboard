import { endpoints } from "constants/endpoints";
import HttpHelper from "helpers/HttpHelper";
import { useCallback, useState } from "react";
import { IServiceReturn } from "types/apiResponse";

export const useSubscribeCustomer = () => {
  const [isSubscribingCustomer, setIsSubscribingCustomer] = useState(false);

  const subscribeCustomer = useCallback(
    async (email: string, name: string): Promise<IServiceReturn | null> => {
      setIsSubscribingCustomer(true);
      try {
        const response = await HttpHelper.post(
          endpoints.klaviyo.subscribeCustomer,
          {
            data: {
              email,
              name,
            },
          },
        );
        return response?.data;
      } catch (error) {
        console.error("Error subscribing customer:", error);
        return null;
      } finally {
        setIsSubscribingCustomer(false);
      }
    },
    [],
  );

  return { subscribeCustomer, isSubscribingCustomer };
};
