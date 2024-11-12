/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import CustomersDropdown from "../CustomersDropdown";
import { ICustomer } from "../../types/Customer";
import PreviousAnalysis from "./components/PreviousAnalysis";
import { Button, Col, message, Popconfirm, Row, Spin } from "antd";
import ScrapeDataModal from "./components/ScrapeDataModal";
import { IStoreDetail } from "../../types/StoreDetail";
import {
  useCustomerStoreAnalyticsFetch,
  useGenerateFeedback,
  useStoreAnalysisCreate,
  useStoreAnalysisDelete,
  useStoreAnalytics,
} from "../../hooks/useStoreAnalytics";
import { useCustomerFetchAll } from "hooks/useCustomer";
import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const StoreAnalysis: React.FC = () => {
  const { isAdmin } = useAuth();
  const { fetchAllCustomers, isLoading } = useCustomerFetchAll();
  const { isScraping, scrape } = useStoreAnalytics();
  const { createStoreAnalysis, isLoading: isCreatingStoreAnalysis } =
    useStoreAnalysisCreate();
  const { fetchCustomerStoreAnalytics, isLoading: isFetchingStoreAnalytics } =
    useCustomerStoreAnalyticsFetch();
  const { deleteStoreAnalysis, isDeleting } = useStoreAnalysisDelete();
  const { generateFeedback, isGenerating } = useGenerateFeedback();
  const [scrapingInProgress, setScrapingInProgress] = useState(false);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [scrapedData, setScrapedData] = useState<
    IStoreDetail | undefined | null
  >();
  const [storeAnalytics, setStoreAnalytics] = useState<
    IStoreDetail | undefined
  >(undefined);

  useEffect(() => {
    if (isAdmin) {
      fetchAllCustomers().then((res) => {
        setCustomers(res);
      });
    }
  }, [isAdmin]);

  const refresh = () => {
    if (!selectedCustomer) {
      return;
    }
    fetchCustomerStoreAnalytics(selectedCustomer?.customer_id).then((res) => {
      setStoreAnalytics(res?.at(0));
    });
  };

  useEffect(() => {
    refresh();
  }, [selectedCustomer]);

  const handleScraping = async () => {
    if (!selectedCustomer) {
      return null;
    }
    setScrapingInProgress(true);
    const scrapedData = await scrape(selectedCustomer.store_name);
    if (scrapedData?.data) {
      setScrapedData(scrapedData?.data);
    }
  };

  const handleCloseScraping = () => {
    setScrapedData(undefined);
    setScrapingInProgress(false);
  };

  const handleSave = async () => {
    if (!scrapedData || !selectedCustomer) {
      return;
    }

    const dataToSave: IStoreDetail = {
      ...scrapedData,
      customerId: selectedCustomer?.customer_id,
      createdAt: dayjs().toISOString(),
    };

    const resp = await createStoreAnalysis(dataToSave);

    if (resp) {
      message.success("Data saved successfully");
      refresh();
      setScrapingInProgress(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) {
      return;
    }
    const resp = await deleteStoreAnalysis(id);
    if (resp) {
      message.success("Store detail deleted successfully");
      refresh();
    }
  };

  const handleGenerateFeedback = async () => {
    if (!storeAnalytics) {
      return;
    }

    const feedback = await generateFeedback({
      aboutSection: storeAnalytics?.about || "",
      FAQ: storeAnalytics?.faq || "",
      storeAnnouncement: storeAnalytics?.announcement || "",
    });

    if (feedback?.data) {
      message.success("Feedback generated successfully");
      setStoreAnalytics({
        ...storeAnalytics,
        feedback: {
          about: feedback.data?.aboutSectionFeedback,
          announcement: feedback.data?.storeAnnouncementFeedback,
          faq: feedback.data?.faqFeedback,
        },
      });
    }
  };

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

      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Spin />
        </div>
      )}

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
            <Row gutter={[16, 16]}>
              <Col span={24}>
                Store analysis for {selectedCustomer.store_name}
              </Col>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  // justifyContent: "flex-end",
                  gap: "2ch",
                }}
              >
                {!storeAnalytics && (
                  <Button type="primary" onClick={handleScraping}>
                    Scrape New Data
                  </Button>
                )}
                <Button
                  icon={<ReloadOutlined />}
                  onClick={refresh}
                  loading={isFetchingStoreAnalytics}
                />
                {storeAnalytics && (
                  <>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={handleGenerateFeedback}
                      loading={isGenerating}
                    >
                      Generate Feedback
                    </Button>
                    <Button type="primary" onClick={handleSave}>
                      Save
                    </Button>
                    <Popconfirm
                      title="Are you sure you want to delete this store detail?"
                      onConfirm={() => handleDelete(storeAnalytics?.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        loading={isDeleting}
                      />
                    </Popconfirm>
                  </>
                )}
              </div>
              {storeAnalytics && (
                <Col span={24}>
                  <PreviousAnalysis
                    loading={isFetchingStoreAnalytics}
                    storeDetail={storeAnalytics}
                    refresh={refresh}
                  />
                </Col>
              )}
            </Row>
            <ScrapeDataModal
              title={selectedCustomer.store_name}
              open={scrapingInProgress}
              storeName={selectedCustomer.store_name}
              isLoading={isScraping}
              scrapedData={scrapedData}
              onCancel={handleCloseScraping}
              footer={[
                <Button key="cancel" onClick={handleCloseScraping}>
                  Cancel
                </Button>,
                <Button
                  key="save"
                  type="primary"
                  onClick={handleSave}
                  loading={isCreatingStoreAnalysis}
                >
                  Save
                </Button>,
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default StoreAnalysis;
