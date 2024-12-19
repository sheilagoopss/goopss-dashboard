import FirebaseHelper from "@/helpers/FirebaseHelper";
import { useCallback, useState } from "react";

interface UseImageUploadReturn {
  uploadImages: (images: string[], folder?: string) => Promise<string[]>;
  isUploading: boolean;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const uploadImages = useCallback(
    async (images: string[], folder = "images"): Promise<string[]> => {
      setIsUploading(true);
      const urls = await Promise.all(
        images.map((file) => FirebaseHelper.uploadImage(file, folder)),
      );
      setIsUploading(false);
      return urls;
    },
    [],
  );
  return { uploadImages, isUploading };
}
