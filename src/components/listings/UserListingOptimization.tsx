"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { List, Segmented, Spin, Tabs } from "antd";
import EtsyListings from "@/components/etsyListing/EtsyListings";
import DuplicationCard from "@/components/listings/components/DuplicationCard";
import { Listing, ListingImage } from "@/types/Listing";
import OptimizationCard from "@/components/listings/components/OptimizationCard";
import CreateEtsyProduct from "@/components/etsyListing/CreateEtsyProduct";

interface UserListingOptimizationProps {
  showEtsyListings?: boolean;
  showDuplicatedListings?: boolean;
  showOptimizedListings?: boolean;
  showCreateListing?: boolean;
}

const UserListingOptimization: React.FC<UserListingOptimizationProps> = ({
  showEtsyListings = false,
  showDuplicatedListings = false,
  showOptimizedListings = false,
  showCreateListing = false,
}) => {
  const { customerData } = useAuth();
  const [activeTab, setActiveTab] = useState("optimized");
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [duplicatedListings, setDuplicatedListings] = useState<Listing[]>([]);

  const tabs = [
    ...(showOptimizedListings
      ? [
          {
            id: "optimized",
            label: "Listings we've optimized",
            subtitle:
              "We've enhanced these listings to improve their performance and visibility.",
            children: (
              <List
                dataSource={filteredListings}
                renderItem={(listing) => (
                  <OptimizationCard key={listing.id} listing={listing} />
                )}
                pagination={{
                  pageSize: 10,
                }}
              />
            ),
          },
        ]
      : []),
    ...(showDuplicatedListings
      ? [
          {
            id: "duplicated",
            label: "Listings we've duplicated",
            subtitle:
              "These listings have been replicated to expand your reach across multiple platforms.",
            children: (
              <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
                {duplicatedListings.length > 0 ? (
                  <>
                    <List
                      dataSource={duplicatedListings}
                      renderItem={(listing) => (
                        <DuplicationCard key={listing.id} listing={listing} />
                      )}
                      pagination={{
                        pageSize: 10,
                      }}
                    />
                  </>
                ) : (
                  <div
                    style={{
                      maxWidth: "1600px",
                      margin: "0 auto",
                      textAlign: "center",
                      padding: "4rem",
                      backgroundColor: "white",
                      borderRadius: "8px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.25rem",
                        color: "#6B7280",
                        marginBottom: "1rem",
                      }}
                    >
                      No duplicated listings available yet.
                    </div>
                    <p
                      style={{
                        color: "#9CA3AF",
                        maxWidth: "600px",
                        margin: "0 auto",
                      }}
                    >
                      We&apos;ll show your duplicated listings here once
                      they&apos;re available. Check back soon!
                    </p>
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
    ...(showEtsyListings
      ? [
          {
            id: "etsy",
            label: "Etsy Listings",
            subtitle: "These are your listings on Etsy.",
            children: <EtsyListings customerId={customerData?.id || ""} />,
          },
        ]
      : []),
    ...(showCreateListing
      ? [
          {
            id: "create",
            label: "Create a new listing",
            subtitle: "Create a new listing to get started.",
            children: <CreateEtsyProduct />,
          },
        ]
      : []),
  ];

  // Get first name from store_owner_name
  const firstName = customerData?.store_owner_name?.split(" ")[0] || "";

  const fetchImagesForListing = async (
    listingId: string,
  ): Promise<ListingImage[]> => {
    try {
      const imagesRef = collection(db, "images");
      const q = query(
        imagesRef,
        where("listing_id", "==", listingId),
        where("status", "!=", "superseded"),
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        statusChangeDate: doc.data().statusChangeDate
          ? doc.data().statusChangeDate.toDate()
          : null,
      })) as ListingImage[];
    } catch (error) {
      console.error("Error fetching images:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchListings = async () => {
      if (!customerData) return;

      setIsLoading(true);
      try {
        const listingsRef = collection(db, "listings");

        if (activeTab === "optimized") {
          // Existing optimized listings query
          const q = query(
            listingsRef,
            where("customer_id", "==", customerData.id),
            where("optimizationStatus", "==", true),
          );
          const querySnapshot = await getDocs(q);
          const fetchedListings = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
              const data = doc.data();
              let images: ListingImage[] = [];

              // Check hasImage flag first
              if (data.hasImage === true) {
                // Explicitly check for true
                // Then fetch images using the listing's ID
                images = await fetchImagesForListing(doc.id);
              }

              return {
                id: doc.id,
                ...data,
                optimizedAt: data.optimizedAt
                  ? data.optimizedAt.toDate()
                  : null,
                uploadedImages: images,
              } as Listing;
            }),
          );

          const filteredListings = fetchedListings.filter(
            (listing) =>
              listing.optimizedTitle ||
              listing.optimizedDescription ||
              listing.optimizedTags,
          );

          // Sort listings by optimizedAt date before setting state
          const sortedListings = [...filteredListings].sort((a, b) => {
            const dateA = a.optimizedAt ? a.optimizedAt.getTime() : 0;
            const dateB = b.optimizedAt ? b.optimizedAt.getTime() : 0;
            return dateB - dateA; // Sort in descending order (newest first)
          });

          setAllListings(sortedListings);
          setFilteredListings(sortedListings);
        } else if (activeTab === "duplicated") {
          // Query for duplicated listings
          const q = query(
            listingsRef,
            where("customer_id", "==", customerData.id),
            where("duplicatedFrom", "!=", null),
          );
          const querySnapshot = await getDocs(q);
          const fetchedDuplicates = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
              const data = doc.data();

              return {
                id: doc.id,
                listingID: data.listingID,
                primaryImage: data.primaryImage,
                listingTitle: data.listingTitle,
                listingDescription: data.listingDescription,
                listingTags: data.listingTags,
                optimizedTitle: data.optimizedTitle || "",
                optimizedDescription: data.optimizedDescription || "",
                optimizedTags: data.optimizedTags || "",
                optimizedAt: data.optimizedAt
                  ? data.optimizedAt.toDate()
                  : null,
                optimizationStatus: data.optimizationStatus || false,
                createdAt: data.createdAt ? data.createdAt.toDate() : null,
                uploadedImages: data.uploadedImages || [],
                duplicatedFrom: data.duplicatedFrom || "", // Original listing ID
              } as Listing;
            }),
          );

          setDuplicatedListings(fetchedDuplicates);
        }
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, [customerData, activeTab]);

  useEffect(() => {
    const filtered = allListings.filter(
      (listing) =>
        listing.listingID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.optimizedTitle
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );
    setFilteredListings(filtered);
  }, [searchTerm, allListings]);

  // Then in the return statement, add this before the table
  return (
    <div>
      {/* Header Section */}
      <div
        style={{ width: "100%", padding: "16px", backgroundColor: "#f9fafb" }}
      >
        <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              textAlign: "center",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Hi {firstName} 👋! Here&apos;s everything we&apos;ve done with your
            listings
          </h1>
          <Segmented
            options={tabs.map((tab) => ({ label: tab.label, value: tab.id }))}
            onChange={(value) => setActiveTab(value as string)}
            block
          />
          <div
            style={{
              marginTop: "1rem",
              backgroundColor: "white",
              borderRadius: "0.5rem",
              padding: "1rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                {tabs.find((tab) => tab.id === activeTab)?.label}
              </h2>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#4B5563",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                {tabs.find((tab) => tab.id === activeTab)?.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div
          style={{
            width: "100%",
            minHeight: "30vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin />
        </div>
      ) : (
        <div style={{ padding: "2rem 4rem" }}>
          {/* Search Bar */}
          {activeTab !== "create" && (
            <div style={{ maxWidth: "600px", margin: "0 auto 2rem" }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 40px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "1rem",
                  }}
                />
                <Search
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                />
              </div>
            </div>
          )}

          <Tabs
            items={tabs.map((tab) => ({
              label: tab.label,
              key: tab.id,
              children: tab.children,
            }))}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            tabBarStyle={{ display: "none" }}
          />
        </div>
      )}
      {/* Content Section */}
    </div>
  );
};

export default UserListingOptimization;
