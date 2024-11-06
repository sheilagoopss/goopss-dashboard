import { endpoints } from "constants/endpoints";
import HttpHelper from "helpers/HttpHelper";
import { useCallback, useState } from "react";
import { IServiceReturn } from "types/apiResponse";

export const useGenerateTags = () => {
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  const generateTags = useCallback(
    async (
      images: File[],
      description: string,
    ): Promise<IServiceReturn | null> => {
      setIsGeneratingTags(true);
      try {
        const formData = new FormData();
        images.forEach((image) => {
          formData.append("files", image);
        });
        formData.append("description", description);
        
        const response = await HttpHelper.post(endpoints.tagify.generateTags, {
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response?.data;
      } catch (error) {
        console.error("Error downloading image:", error);
        return null;
      } finally {
        setIsGeneratingTags(false);
      }
    },
    [],
  );

  return {
    generateTags,
    isGeneratingTags,
  };
};
