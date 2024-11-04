/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback } from "react";
import { Listing, ListingImage } from "../types/Listing";
import FirebaseHelper from "../helpers/FirebaseHelper";
import { ITask } from "../types/Task";
import { useAuth } from "../contexts/AuthContext";
import { IAdmin } from "../types/Customer";
import {
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";

interface UseListingFetchReturn {
  fetchListing: (listingId: string) => Promise<Listing | null>;
  isLoading: boolean;
}

interface UseListingCreateReturn {
  createListing: (listing: Listing) => Promise<void>;
  isLoading: boolean;
}

interface UseListingUpdateReturn {
  updateListing: (
    listingId: string,
    listing: Partial<Listing>,
    customerId: string,
  ) => Promise<boolean>;
  isLoading: boolean;
}

interface UseListingDeleteReturn {
  deleteListing: (listingId: string) => Promise<void>;
  isLoading: boolean;
}

interface UseListingFetchAllReturn {
  fetchAllListings: () => Promise<Listing[]>;
  isLoading: boolean;
}

interface UseListingDeleteAllReturn {
  deleteAllListings: (customerId: string) => Promise<boolean>;
  isLoading: boolean;
}

interface UseCustomerFetchListingsReturn {
  fetchCustomerListings: (customerId: string) => Promise<Listing[]>;
  isLoading: boolean;
}

interface UseListingFetchImagesReturn {
  fetchListingImages: (listingId: string) => Promise<ListingImage[]>;
  isLoading: boolean;
}

export function useListingFetch(): UseListingFetchReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchListing = useCallback(
    async (listingId: string): Promise<Listing | null> => {
      setIsLoading(true);
      try {
        const listing = await FirebaseHelper.findOne<Listing>(
          "listings",
          listingId,
        );
        return listing;
      } catch (error) {
        console.error("Error fetching listing:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchListing, isLoading };
}

export function useListingCreate(): UseListingCreateReturn {
  const [isLoading, setIsLoading] = useState(false);

  const createListing = useCallback(async (listing: Listing): Promise<void> => {
    setIsLoading(true);
    try {
      await FirebaseHelper.create("listings", listing);
    } catch (error) {
      console.error("Error creating listing:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createListing, isLoading };
}

export function useListingUpdate(): UseListingUpdateReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const updateListing = useCallback(
    async (
      listingId: string,
      listing: Partial<Listing>,
      customerId: string,
    ): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updated = await FirebaseHelper.update(
          "listings",
          listingId,
          listing,
        );
        if (listing.optimizationStatus) {
          await FirebaseHelper.create("tasklists", {
            customerId,
            taskName: "Listing Optimization",
            teamMemberName: (user as IAdmin)?.name || user?.email,
            dateCompleted: serverTimestamp(),
            isDone: true,
          } as Omit<ITask, "id">);
        }
        return updated;
      } catch (error) {
        console.error("Error updating listing:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { updateListing, isLoading };
}

export function useListingDelete(): UseListingDeleteReturn {
  const [isLoading, setIsLoading] = useState(false);

  const deleteListing = useCallback(
    async (listingId: string): Promise<void> => {
      setIsLoading(true);
      try {
        await FirebaseHelper.delete("listings", listingId);
      } catch (error) {
        console.error("Error deleting listing:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { deleteListing, isLoading };
}

export function useListingFetchAll(): UseListingFetchAllReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllListings = useCallback(async (): Promise<Listing[]> => {
    setIsLoading(true);
    try {
      const listings = await FirebaseHelper.find<Listing>("listings");
      return listings;
    } catch (error) {
      console.error("Error fetching listings:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchAllListings, isLoading };
}

export function useListingDeleteAll(): UseListingDeleteAllReturn {
  const [isLoading, setIsLoading] = useState(false);

  const deleteAllListings = useCallback(
    async (customerId: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const listingsRef = collection(db, "listings");
        const q = query(listingsRef, where("customer_id", "==", customerId));
        const querySnapshot = await getDocs(q);

        const batch = writeBatch(db);
        querySnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        console.log(
          `Successfully deleted all listings for customer ${customerId}`,
        );
        return true;
      } catch (error) {
        console.error("Error deleting listings:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { deleteAllListings, isLoading };
}

export function useCustomerFetchListings(): UseCustomerFetchListingsReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomerListings = useCallback(
    async (customerId: string): Promise<Listing[]> => {
      setIsLoading(true);
      try {
        const listingsCollection = collection(db, "listings");
        const q = query(
          listingsCollection,
          where("customer_id", "==", customerId),
          orderBy("listingTitle"),
        );
        const listingsSnapshot = await getDocs(q);
        const listingsData = await Promise.all(
          listingsSnapshot.docs.map(async (doc) => {
            const listingData = doc.data() as Listing;
            const imagesQuery = query(
              collection(db, "images"),
              where("listing_id", "==", doc.id),
            );
            const imagesSnapshot = await getDocs(imagesQuery);
            const uploadedImages = imagesSnapshot.docs.map((imgDoc) => ({
              ...imgDoc.data() as ListingImage,
              id: imgDoc.id,
              status: imgDoc.data().status as "pending" | "approved" | "revision",
            }));
            return {
              ...listingData,
              id: doc.id,
              uploadedImages,
              createdAt: listingData.createdAt || new Date().toISOString(),
            };
          }),
        );
        return listingsData;
      } catch (error) {
        console.error("Error fetching customer listings:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchCustomerListings, isLoading };
}

export function useListingFetchImages(): UseListingFetchImagesReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchListingImages = useCallback(
    async (listingId: string): Promise<ListingImage[]> => {
      setIsLoading(true);
      try {
        const imagesQuery = query(
          collection(db, "images"),
          where("listing_id", "==", listingId),
        );
        const imagesSnapshot = await getDocs(imagesQuery);
        const imagesData = imagesSnapshot.docs.map((imgDoc) => ({
          ...imgDoc.data() as ListingImage,
          id: imgDoc.id,
        }));
        return imagesData;
      } catch (error) {
        console.error("Error fetching listing images:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { fetchListingImages, isLoading };
}

