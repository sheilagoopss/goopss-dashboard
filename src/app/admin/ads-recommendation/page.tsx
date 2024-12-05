"use client";

import React, { useState, useEffect } from "react";
import CustomersDropdown from "@/components/common/CustomersDropdown";
import { ICustomer } from "@/types/Customer";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { message, Spin } from "antd";
import Image from "next/image";

interface Listing {
  listingId: string;
  title: string;
  image: string;
}
const AdsRecommendation = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );

  const fetchCustomers = async () => {
    try {
      const customersCollection = collection(db, "customers");
      const customersSnapshot = await getDocs(customersCollection);
      const customersList = customersSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as ICustomer),
      );
      setCustomers(customersList);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching customers:", err);
      message.error("Failed to fetch customers");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchListings = async (storeName: string) => {
    setLoading(true);

    try {
      console.log("Fetching listings for store:", storeName);
      const trafficAnalysisCollection = collection(db, "trafficAnalysis");
      const q = query(
        trafficAnalysisCollection,
        where("shop", "==", storeName),
      );
      const querySnapshot = await getDocs(q);

      console.log("Query snapshot size:", querySnapshot.size);

      const recommendedListings: Listing[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Document data:", data);
        if (data.listingsData && Array.isArray(data.listingsData)) {
          data.listingsData.forEach((listing: any) => {
            if (parseInt(listing.views) > 0) {
              // Extract the full-size image URL
              const fullSizeImageUrl = listing.image.replace(
                "_75x75.",
                "_1588xN.",
              );
              recommendedListings.push({
                listingId: listing.listingId,
                title: listing.title,
                image: fullSizeImageUrl,
              });
            }
          });
        }
      });

      console.log("Recommended listings:", recommendedListings);
      setListings(recommendedListings);
    } catch (err) {
      console.error("Error fetching listings:", err);
      message.error(
        "Failed to fetch listings: " +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setLoading(false);
    }
  };

  const getEtsyListingUrl = (storeName: string, listingId: string) => {
    return `https://${storeName}.etsy.com/listing/${listingId}`;
  };

  const handleCardClick = (listingId: string) => {
    const storeName = selectedCustomer?.store_name;
    if (storeName) {
      const url = getEtsyListingUrl(storeName, listingId);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      fetchListings(selectedCustomer.store_name);
    }
  }, [selectedCustomer]);

  return loading ? (
    <div className="flex justify-center items-center h-screen">
      <Spin />
    </div>
  ) : (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Ads Recommendation</h1>
        <CustomersDropdown
          customers={customers}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          isAdmin={true}
        />
      </div>

      {listings.length === 0 ? (
        <p>No recommended listings found.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {listings.map((listing) => (
            <div
              key={listing.listingId}
              style={{
                width: "250px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={() => handleCardClick(listing.listingId)}
            >
              <div
                style={{
                  width: "100%",
                  height: "250px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  src={listing.image}
                  alt={listing.title}
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                  width={250}
                  height={250}
                />
              </div>
              <div
                style={{
                  padding: "10px",
                  height: "80px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    marginBottom: "5px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    lineHeight: "1.2em",
                    maxHeight: "2.4em",
                  }}
                >
                  {listing.title}
                </h3>
                <p style={{ margin: 0 }}>ID: {listing.listingId}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdsRecommendation;
