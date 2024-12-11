"use client";

import { Spin } from "antd";
import {
  useEtsyListings,
  useFetchOptimizedEtsyListings,
} from "@/hooks/useEtsy";
import { useEffect, useState, useCallback } from "react";
import { IEtsyFetchedListing } from "@/types/Etsy";
import EtsyListingOptimizationList from "@/components/EtsyListing/Optimization/EtsyListingOptimizationList";

interface EtsyListingsProps {
  customerId: string;
}

const EtsyListings: React.FC<EtsyListingsProps> = ({ customerId }) => {
  const { fetchEtsyListings, isFetchingEtsyListings } = useEtsyListings();
  const { fetchOptimizedListing, isFetchingOptimizedListings } =
    useFetchOptimizedEtsyListings();

  const [etsyListings, setEtsyListings] = useState<
    (IEtsyFetchedListing & {
      optimizedTitle: string;
      optimizedDescription: string;
      optimizedTags: string[];
      optimizationStatus: boolean;
    })[]
  >([]);

  const refetch = useCallback(() => {
    fetchEtsyListings({ customerId }).then((listings) => {
      fetchOptimizedListing().then((optimizedListings) => {
        const checkOptimized: (IEtsyFetchedListing & {
          optimizedTitle: string;
          optimizedDescription: string;
          optimizedTags: string[];
          optimizationStatus: boolean;
        })[] = listings.map((listing) => ({
          ...listing,
          id: optimizedListings.find(
            (optimizedListing) =>
              optimizedListing.listing_id === listing.listing_id,
          )?.id || "",
          isOptimized: optimizedListings.some(
            (optimizedListing) =>
              optimizedListing.listing_id === listing.listing_id,
          ),
          optimizedTitle: optimizedListings.find(
            (optimizedListing) =>
              optimizedListing.listing_id === listing.listing_id,
          )?.optimizedTitle || "",
          optimizedDescription: optimizedListings.find(
            (optimizedListing) =>
              optimizedListing.listing_id === listing.listing_id,
          )?.optimizedDescription || "",
          optimizedTags: optimizedListings.find(
            (optimizedListing) =>
              optimizedListing.listing_id === listing.listing_id,
          )?.optimizedTags || [],
          optimizationStatus: optimizedListings.find(
            (optimizedListing) =>
              optimizedListing.listing_id === listing.listing_id,
          )?.optimizationStatus || false,
        }));

        setEtsyListings(checkOptimized);
      });
    });
  }, [fetchEtsyListings, customerId, fetchOptimizedListing]);

  useEffect(() => {
    if (customerId) {
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
        <>
          <EtsyListingOptimizationList
            listings={etsyListings}
            selectedCustomerId={customerId}
          />
        </>
      )}
    </>
  );
};

export default EtsyListings;
