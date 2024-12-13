"use client";

import { Spin } from "antd";
import {
  useEtsyListings,
  useFetchOptimizedEtsyListings,
} from "@/hooks/useEtsy";
import { useEffect, useState, useCallback } from "react";
import { IEtsyFetchedListing, IOptimizedEtsyListing } from "@/types/Etsy";
import EtsyListingOptimizationList from "@/components/etsyListing/Optimization/EtsyListingOptimizationList";

interface EtsyListingsProps {
  customerId: string;
}

const EtsyListings: React.FC<EtsyListingsProps> = ({ customerId }) => {
  const { fetchEtsyListings, isFetchingEtsyListings } = useEtsyListings();
  const { fetchOptimizedListing, isFetchingOptimizedListings } =
    useFetchOptimizedEtsyListings();

  const [etsyListings, setEtsyListings] = useState<
    (IOptimizedEtsyListing | IEtsyFetchedListing)[]
  >([]);

  const refetch = useCallback(async () => {
    const listings = await fetchEtsyListings({ customerId });
    const optimizedListings = await fetchOptimizedListing();
    const checkOptimized: (IOptimizedEtsyListing | IEtsyFetchedListing)[] =
      listings.map((listing) => ({
        ...listing,
        id: optimizedListings.find(
          (optimizedListing) =>
            optimizedListing.listing_id === listing.listing_id,
        )?.id,
        isOptimized: optimizedListings.some(
          (optimizedListing) =>
            optimizedListing.listing_id === listing.listing_id,
        ),
        optimizedTitle:
          optimizedListings.find(
            (optimizedListing) =>
              optimizedListing.listing_id === listing.listing_id,
          )?.optimizedTitle || "",
        optimizedDescription:
          optimizedListings.find(
            (optimizedListing) =>
              optimizedListing.listing_id === listing.listing_id,
          )?.optimizedDescription || "",
        optimizedTags:
          optimizedListings.find(
            (optimizedListing) =>
              optimizedListing.listing_id === listing.listing_id,
          )?.optimizedTags || [],
        optimizationStatus:
          optimizedListings.find(
            (optimizedListing) =>
              optimizedListing.listing_id === listing.listing_id,
          )?.optimizationStatus || false,
        originalTitle: optimizedListings.find(
          (optimizedListing) =>
            optimizedListing.listing_id === listing.listing_id,
        )?.title,
        originalDescription: optimizedListings.find(
          (optimizedListing) =>
            optimizedListing.listing_id === listing.listing_id,
        )?.description,
        originalTags: optimizedListings.find(
          (optimizedListing) =>
            optimizedListing.listing_id === listing.listing_id,
        )?.tags,
      }));
    setEtsyListings(checkOptimized);
  }, [fetchEtsyListings, customerId, fetchOptimizedListing]);

  useEffect(() => {
    console.log("customerId", customerId);
    if (customerId) {
      console.log("refetching");
      refetch();
    }
  }, [customerId, refetch]);

  return (
    <>
      {isFetchingEtsyListings || isFetchingOptimizedListings ? (
        <div
          style={{
            width: "100%",
            minHeight: "30vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin />
        </div>
      ) : (
        <EtsyListingOptimizationList
          listings={etsyListings}
          selectedCustomerId={customerId}
          refetch={refetch}
        />
      )}
    </>
  );
};

export default EtsyListings;
