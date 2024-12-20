"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Table, Button, message, Tabs } from "antd";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { PlusCircle } from "lucide-react";
import { format } from "date-fns";
import NewListingForm from "@/components/listings/NewListingForm";
import Image from "next/image";

interface AdminNewListingProps {
  customerId: string;
  storeName: string;
}

interface Listing {
  id: string;
  listingID: string;
  listingTitle: string;
  section: string;
  etsyLink: string;
  createdAt: string;
  isNewListing: boolean;
  primaryImage: string;
}

const AdminNewListing: React.FC<AdminNewListingProps> = ({
  customerId,
  storeName,
}) => {
  const [activeTab, setActiveTab] = useState<string>("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const listingsRef = collection(db, "listings");
      const q = query(
        listingsRef,
        where("customer_id", "==", customerId),
        where("optimizationStatus", "==", true),
        where("isNewListing", "==", true),
      );

      const querySnapshot = await getDocs(q);
      const fetchedListings = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      })) as Listing[];

      setListings(fetchedListings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      message.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const columns = [
    {
      title: "Image",
      dataIndex: "primaryImage",
      key: "primaryImage",
      width: 100,
      render: (image: string) => (
        <div style={{ width: "60px", height: "60px" }}>
          <Image
            src={image}
            alt="Listing"
            style={{
              objectFit: "cover",
              borderRadius: "4px",
            }}
            width={60}
            height={60}
          />
        </div>
      ),
    },
    {
      title: "Listing ID",
      dataIndex: "listingID",
      key: "listingID",
      width: 120,
    },
    {
      title: "Listing Title",
      dataIndex: "listingTitle",
      key: "listingTitle",
      render: (text: string, record: Listing) => (
        <a href={record.etsyLink} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: "Section",
      dataIndex: "section",
      key: "section",
      width: 150,
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: Date) => format(new Date(date), "MMM dd, yyyy"),
    },
  ];

  const handleCreateSuccess = () => {
    setActiveTab("listings");
    fetchListings();
  };
  useEffect(() => {
    if (activeTab === "listings") {
      fetchListings();
    }
  }, [customerId, activeTab, fetchListings]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">New Listings</h1>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="mt-0"
          items={[
            {
              key: "listings",
              label: "Listings",
              children: (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      type="primary"
                      icon={<PlusCircle className="w-4 h-4 mr-2" />}
                      onClick={() => setActiveTab("create")}
                    >
                      Create New Listing
                    </Button>
                  </div>
                  <Table
                    columns={columns}
                    dataSource={listings}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} items`,
                    }}
                  />
                </div>
              ),
            },
            {
              key: "create",
              label: "Create New Listing",
              children: (
                <NewListingForm
                  customerId={customerId}
                  storeName={storeName}
                  onSuccess={handleCreateSuccess}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default AdminNewListing;
