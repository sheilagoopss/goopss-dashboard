import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import CustomersDropdown from "./CustomersDropdown";
import { ICustomer } from "../types/Customer";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

interface Listing {
  listingId: string;
  title: string;
  image: string;
}

interface AdsRecommendationProps {
  customerId: string;
  isAdmin: boolean;
}

const styles = {
  listingCard: {
    width: "200px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
    "&:hover": {
      transform: "scale(1.05)",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    },
  },
};

const AdsRecommendation: React.FC<AdsRecommendationProps> = ({
  customerId,
  isAdmin,
}) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );

  useEffect(() => {
    if (isAdmin) {
      fetchCustomers();
    } else if ((user as ICustomer)?.store_name) {
      console.log("User store name:", (user as ICustomer).store_name);
      fetchListings((user as ICustomer).store_name);
    } else {
      console.error("User or store name is undefined");
      setError(
        "User information is missing. Please try logging out and back in.",
      );
    }
  }, [isAdmin, user]);

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
      setError("Failed to fetch customers");
      setLoading(false);
    }
  };

  const fetchListings = async (storeName: string) => {
    setLoading(true);
    setError(null);

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
      setError(
        "Failed to fetch listings: " +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const customerId = event.target.value;
    const customer = customers.find((c) => c.id === customerId) || null;
    setSelectedCustomer(customer);
    if (customer) {
      fetchListings(customer.store_name);
    } else {
      setListings([]);
    }
  };

  const getEtsyListingUrl = (storeName: string, listingId: string) => {
    return `https://${storeName}.etsy.com/listing/${listingId}`;
  };

  const handleCardClick = (listingId: string) => {
    const storeName = isAdmin
      ? selectedCustomer?.store_name
      : (user as ICustomer)?.store_name;
    if (storeName) {
      const url = getEtsyListingUrl(storeName, listingId);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (loading && !isAdmin) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
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
        {isAdmin && (
          <CustomersDropdown
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {!isAdmin && user && <p>Store: {(user as ICustomer).store_name}</p>}

      {listings.length === 0 ? (
        <p>
          {isAdmin && !selectedCustomer
            ? "Please select a customer to view listings."
            : "No recommended listings found."}
        </p>
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
                <img
                  src={listing.image}
                  alt={listing.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
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
