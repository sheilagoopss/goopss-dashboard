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
        return boards?.data || [];
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
