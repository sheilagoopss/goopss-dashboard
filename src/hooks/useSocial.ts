import { endpoints } from "@/constants/endpoints";
import HttpHelper from "@/helpers/HttpHelper";
import { useCallback } from "react";
import { useState } from "react";
import { IAPIResponse } from "@/types/API";
import { ISocialPost } from "@/types/Social";

interface UseFacebookScheduleReturn {
  schedulePosts: (params: {
    customerId: string;
    postId: string;
  }) => Promise<IAPIResponse<any> | null>;
  isScheduling: boolean;
}

interface UseSocialUpdateReturn {
  updatePost: (params: {
    post: ISocialPost;
  }) => Promise<IAPIResponse<any> | null>;
  isUpdating: boolean;
}

interface UseSocialDeleteReturn {
  deletePost: (params: {
    post: ISocialPost;
  }) => Promise<IAPIResponse<any> | null>;
  isDeleting: boolean;
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
        const scheduleData = await HttpHelper.post(
          endpoints.social.schedulePost,
          {
            data: params,
          },
        );

        return scheduleData?.data;
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

export function useSocialUpdate(): UseSocialUpdateReturn {
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePost = useCallback(
    async (params: {
      post: ISocialPost;
    }): Promise<IAPIResponse<any> | null> => {
      setIsUpdating(true);
      try {
        const updateData = await HttpHelper.patch(
          endpoints.social.updatePost(params.post.id),
          {
            data: params,
          },
        );

        return updateData?.data;
      } catch (error) {
        console.error(error);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  return { updatePost, isUpdating };
}

export function useSocialDelete(): UseSocialDeleteReturn {
  const [isDeleting, setIsDeleting] = useState(false);

  const deletePost = useCallback(
    async (params: {
      post: ISocialPost;
    }): Promise<IAPIResponse<any> | null> => {
      setIsDeleting(true);
      try {
        const deleteData = await HttpHelper.delete(
          endpoints.social.deletePost(params.post.id),
        );

        return deleteData?.data;
      } catch (error) {
        console.error(error);
        return null;
      } finally {
        setIsDeleting(false);
      }
    },
    [],
  );

  return { deletePost, isDeleting };
}
