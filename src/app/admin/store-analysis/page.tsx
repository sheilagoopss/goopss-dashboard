"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ICustomer } from "@/types/Customer";
import PreviousAnalysis from "@/components/storeAnalysis/PreviousAnalysis";
import { Button, Col, message, Modal, Popconfirm, Row, Spin } from "antd";
import ScrapeDataModal from "@/components/storeAnalysis/ScrapeDataModal";
import { IStoreDetail } from "@/types/StoreDetail";
import {
  useCustomerStoreAnalyticsFetch,
  useGenerateFeedback,
  useStoreAnalysisCreate,
  useStoreAnalysisDelete,
  useStoreAnalysisUpdate,
  useStoreAnalytics,
} from "@/hooks/useStoreAnalytics";
import { useCustomerFetchAll } from "@/hooks/useCustomer";
import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { FEEDBACKS } from "@/components/storeAnalysis/constants/feedback";
import CustomersDropdown from "@/components/common/CustomersDropdown";
import Image from "next/image";
import Setting from "@/components/storeAnalysis/Setting";

const StoreAnalysisAdmin: React.FC = () => {
  const { isAdmin } = useAuth();
  const { fetchAllCustomers, isLoading } = useCustomerFetchAll();
  const { isScraping, scrape } = useStoreAnalytics();
  const { createStoreAnalysis, isLoading: isCreatingStoreAnalysis } =
    useStoreAnalysisCreate();
  const { updateStoreAnalysis, isUpdatingStoreAnalysis } =
    useStoreAnalysisUpdate();
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
  const [openSetting, setOpenSetting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAllCustomers().then((res) => {
        setCustomers(res);
      });
    }
  }, [isAdmin, fetchAllCustomers]);

  const refresh = useCallback(() => {
    if (!selectedCustomer) {
      return;
    }
    fetchCustomerStoreAnalytics(selectedCustomer?.customer_id).then((res) => {
      setStoreAnalytics(res?.at(0));
    });
  }, [selectedCustomer, fetchCustomerStoreAnalytics]);

  useEffect(() => {
    refresh();
  }, [selectedCustomer, refresh]);

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

  const handleUpdate = async () => {
    if (!storeAnalytics?.id || !selectedCustomer) {
      return;
    }

    const dataToSave: IStoreDetail = {
      ...storeAnalytics,
      customerId: selectedCustomer?.customer_id,
      updatedAt: dayjs().toISOString(),
    };

    const resp = await updateStoreAnalysis(storeAnalytics.id, dataToSave);

    if (resp) {
      message.success("Feedback saved successfully");
      refresh();
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
      faq: storeAnalytics?.faq || "",
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
          feeShipping:
            storeAnalytics?.feeShipping === "yes"
              ? FEEDBACKS.YES.freeShipping
              : FEEDBACKS.NO.freeShipping,
          activeSale:
            storeAnalytics?.activeSale === "yes"
              ? FEEDBACKS.YES.activeSale
              : FEEDBACKS.NO.activeSale,
          starSeller:
            storeAnalytics?.starSeller === "yes"
              ? FEEDBACKS.YES.starSeller
              : FEEDBACKS.NO.starSeller,
          featureItems:
            storeAnalytics?.featureItems === "yes"
              ? FEEDBACKS.YES.featuredItems
              : FEEDBACKS.NO.featuredItems,
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
          <div style={{ display: "flex", alignItems: "center", gap: "2ch" }}>
            <Button
              icon={<SettingOutlined />}
              size="large"
              onClick={() => setOpenSetting(true)}
            >
              Settings
            </Button>
            <CustomersDropdown
              customers={customers}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              isAdmin={isAdmin}
            />
          </div>
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
            <Image
              src={selectedCustomer.logo || "/placeholder-logo.png"}
              alt={`${selectedCustomer.store_name} logo`}
              style={{ borderRadius: "50%" }}
              width={64}
              height={64}
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
                    <Button
                      type="primary"
                      onClick={handleUpdate}
                      loading={isUpdatingStoreAnalysis}
                    >
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
                    setStoreDetail={setStoreAnalytics}
                  />
                </Col>
              )}
            </Row>
            <ScrapeDataModal
              title={selectedCustomer.store_name}
              open={scrapingInProgress}
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
      <Modal
        open={openSetting}
        onCancel={() => setOpenSetting(false)}
        title="Settings"
        width={"60%"}
        footer={null}
      >
        <Setting />
      </Modal>
    </div>
  );
};

export default StoreAnalysisAdmin;
