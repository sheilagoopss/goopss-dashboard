import { endpoints } from "constants/endpoints";
import HttpHelper from "helpers/HttpHelper";
import { useCallback } from "react";

import { useState } from "react";
import { IAPIResponse } from "types/API";

interface UseFacebookScheduleReturn {
  schedulePosts: (params: {
    customerId: string;
    postId: string;
  }) => Promise<IAPIResponse<any> | null>;
  isScheduling: boolean;
}

export function useFacebookSchedule(): UseFacebookScheduleReturn {
  const [isScheduling, setIsScheduling] = useState(false);

  const schedulePosts = useCallback(
    async (params: {
      customerId: string;
      postId: string;
    }): Promise<IAPIResponse<any> | null> => {
      setIsScheduling(true);
      try {
        const scrapeData = await HttpHelper.post(
          endpoints.social.schedulePost,
          {
            data: params,
          },
        );

        return scrapeData?.data;
      } catch (error) {
        console.error(error);
        return null;
      } finally {
        setIsScheduling(false);
      }
    },
    [],
  );

  return { schedulePosts, isScheduling };
}
