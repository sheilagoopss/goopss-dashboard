import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import CustomersDropdown from "../CustomersDropdown";
import { ICustomer } from "../../types/Customer";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import PreviousAnalysis from "./components/PreviousAnalysis";
import { Button, Col, Row } from "antd";
import useScrape from "../../hooks/useScrape";
import ScrapeDataModal from "./components/ScrapeDataModal";
import { IStoreDetail } from "../../types/StoreDetail";

const StoreAnalysis: React.FC = () => {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<
    IStoreDetail | undefined | null
  >();
  const { scrape, isLoading } = useScrape();

  useEffect(() => {
    const fetchCustomers = async () => {
      if (isAdmin) {
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
        } catch (err) {
          console.error("Error fetching customers:", err);
          setError("Failed to fetch customers");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [isAdmin]);

  const handleScraping = async () => {
    setIsScraping(true);
    if (!selectedCustomer) {
      return null;
    }
    const scrapedData = await scrape(selectedCustomer.store_name);
    console.log(scrapedData);
    setScrapedData(scrapedData);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Store Analysis</h1>
        {isAdmin && (
          <CustomersDropdown
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {selectedCustomer && (
        <div
          style={{
            backgroundColor: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img
              src={selectedCustomer.logo || "/placeholder-logo.png"}
              alt={`${selectedCustomer.store_name} logo`}
              style={{ width: "64px", height: "64px", borderRadius: "50%" }}
            />
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  margin: "0 0 4px 0",
                }}
              >
                {selectedCustomer.store_name}
              </h2>
              <p style={{ color: "#666", margin: "0 0 4px 0" }}>
                {selectedCustomer.store_owner_name}
              </p>
              <p style={{ fontSize: "14px", color: "#888", margin: "0" }}>
                Customer ID: {selectedCustomer.customer_id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add your store analysis content here */}
      <div>
        {!selectedCustomer && (
          <p>Please select a customer first to view store analysis.</p>
        )}
        {selectedCustomer && (
          <>
            {" "}
            <Row gutter={[16, 16]}>
              <Col span={24}>
                Store analysis for {selectedCustomer.store_name}
              </Col>
              <Col>
                <Button type="primary" onClick={handleScraping}>
                  Scrape New Data
                </Button>
              </Col>
              <Col span={24}>
                <PreviousAnalysis
                  loading={false}
                  storeDetail={[]}
                  refresh={() => {}}
                />
              </Col>
            </Row>
            <ScrapeDataModal
              title={selectedCustomer.store_name}
              open={isScraping}
              storeName={selectedCustomer.store_name}
              isLoading={isLoading}
              scrapedData={scrapedData}
              onCancel={() => {
                setIsScraping(false);
                setScrapedData(undefined);
              }}
              footer={false}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default StoreAnalysis;
