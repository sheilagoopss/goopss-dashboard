import { useCallback, useState } from "react";
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import FirebaseHelper from "helpers/FirebaseHelper";
import { ListingImage } from "types/Listing";
import { db, storage } from "../firebase/config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useTaskCreate } from "./useTask";
import { useAuth } from "contexts/AuthContext";
import { IAdmin } from "types/Customer";
import { endpoints } from "constants/endpoints";
import HttpHelper from "helpers/HttpHelper";
import { IServiceReturn } from "types/apiResponse";

interface UseListingImageStatusUpdate {
  approveImage: (imageId: string) => Promise<boolean>;
  reviseImage: (imageId: string, revisionNote: string) => Promise<boolean>;
  batchApproveImages: (imageIds: string[]) => Promise<boolean>;
  supersedeImage: (imageId: string) => Promise<boolean>;
  isLoading: boolean;
}

interface UseUploadRevision {
  uploadRevision: (
    customerId: string,
    listing: ListingImage,
    base64Image: string,
  ) => Promise<boolean>;
  isLoading: boolean;
}

interface UseDownloadImage {
  downloadImage: (imageId: string) => Promise<IServiceReturn | null>;
  isDownloading: boolean;
}

export const useListingImageStatusUpdate = (): UseListingImageStatusUpdate => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const approveImage = useCallback(async (imageId: string) => {
    setIsLoading(true);
    try {
      await FirebaseHelper.update("images", imageId, {
        status: "approved",
        statusChangeDate: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("Error approving image:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reviseImage = useCallback(
    async (imageId: string, revisionNote: string) => {
      setIsLoading(true);
      try {
        await FirebaseHelper.update("images", imageId, {
          status: "revision",
          statusChangeDate: serverTimestamp(),
          revisionNote,
        });

        return true;
      } catch (error) {
        console.error("Error submitting revision request:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const supersedeImage = useCallback(async (imageId: string) => {
    setIsLoading(true);
    try {
      await FirebaseHelper.update("images", imageId, {
        status: "superseded",
      });
      return true;
    } catch (error) {
      console.error("Error superseding image:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const batchApproveImages = useCallback(async (imageIds: string[]) => {
    setIsLoading(true);
    try {
      const updates = imageIds.map((imageId) => ({
        id: imageId,
        data: {
          status: "approved",
          statusChangeDate: serverTimestamp(),
        },
      }));

      await Promise.all(
        updates.map(({ id, data }) =>
          FirebaseHelper.update("images", id, data),
        ),
      );

      return true;
    } catch (error) {
      console.error("Error in batch approving images:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    approveImage,
    reviseImage,
    batchApproveImages,
    supersedeImage,
    isLoading,
  };
};

export const useUploadRevision = (): UseUploadRevision => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { createTask } = useTaskCreate();
  const { user } = useAuth();

  const uploadRevision = useCallback(
    async (customerId: string, listing: ListingImage, base64Image: string) => {
      setIsLoading(true);
      try {
        if (!listing.listing_id || !base64Image) {
          return false;
        }

        const batch = writeBatch(db);
        const newImages: ListingImage[] = [];
        const matches = base64Image.match(/^data:(image\/\w+);base64,/);
        const fileExtension = matches ? matches[1].split("/")[1] : "png";
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length)
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: `image/${fileExtension}` });
        const uniqueFileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}.${fileExtension}`;
        const storageRef = ref(storage, `designs/${uniqueFileName}`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        const newImageDoc: ListingImage = {
          id: doc(collection(db, "images")).id,
          url: downloadURL,
          status: "pending",
          listing_id: listing.listing_id,
          customer_id: customerId,
        };
        newImages.push(newImageDoc);
        const fullImageDoc = {
          ...newImageDoc,
          title: `${listing.revisionNote?.substring(
            0,
            10,
          )}${new Date().toISOString()}`,
          date: new Date().toISOString(),
        };
        batch.set(doc(db, "images", newImageDoc.id), fullImageDoc);
        const listingRef = doc(db, "listings", listing.listing_id);
        batch.update(listingRef, { hasImage: true });
        await createTask({
          customerId: customerId,
          taskName: `Added 1 image`,
          teamMemberName: (user as IAdmin)?.name || user?.email || "",
          dateCompleted: serverTimestamp(),
          listingId: listing.id,
          isDone: true,
          category: "Design",
        });
        await batch.commit();
        return true;
      } catch (error) {
        console.error("Error uploading revision image:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { uploadRevision, isLoading };
};

export const useDownloadImage = (): UseDownloadImage => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const downloadImage = useCallback(
    async (imageId: string): Promise<IServiceReturn | null> => {
      setIsDownloading(true);
      try {
        const response = await HttpHelper.get(
          endpoints.listingImage.download(imageId),
        );
        return response?.data;
      } catch (error) {
        console.error("Error downloading image:", error);
        return null;
      } finally {
        setIsDownloading(false);
      }
    },
    [],
  );

  return { downloadImage, isDownloading };
};
