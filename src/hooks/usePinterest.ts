import { useState } from "react";
import { useCallback } from "react";
import { endpoints } from "constants/endpoints";
import HttpHelper from "helpers/HttpHelper";

export const usePinterestBoard = () => {
  const [isFetchingBoards, setIsFetchingBoards] = useState(false);

  const fetchBoards = useCallback(
    async ({ customerId }: { customerId: string }): Promise<any[]> => {
      setIsFetchingBoards(true);
      try {
        const boards = await HttpHelper.get(
          endpoints.pinterest.boards(customerId),
        );
        return boards?.data?.data || [];
      } catch (error) {
        console.error("Error fetching boards:", error);
        return [];
      } finally {
        setIsFetchingBoards(false);
      }
    },
    [],
  );

  return { fetchBoards, isFetchingBoards };
};

export const useCreatePinterestPin = () => {
  const [isCreatingPin, setIsCreatingPin] = useState(false);

  const createPin = useCallback(
    async ({
      customerId,
      boardId,
      content,
    }: {
      customerId: string;
      boardId: string;
      content?: {
        title?: string;
        description?: string;
        link?: string;
        media_source?: {
          source_type?: string;
          url?: string;
        };
      };
    }) => {
      setIsCreatingPin(true);
      try {
        const pin = await HttpHelper.post(endpoints.pinterest.pin, {
          data: {
            content: { ...content, board_id: boardId },
            customerId,
          },
        });
        return pin?.data?.data || {};
      } catch (error) {
        console.error("Error creating pin:", error);
        return {};
      } finally {
        setIsCreatingPin(false);
      }
    },
    [],
  );

  return { createPin, isCreatingPin };
};
