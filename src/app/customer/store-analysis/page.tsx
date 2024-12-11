"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Spin,
} from "antd";
import { IStoreDetail } from "@/types/StoreDetail";
import {
  useCustomerStoreAnalyticsFetch,
  useGenerateFeedback,
  useStoreAnalysisCreate,
  useStoreAnalysisDelete,
  useStoreAnalysisUpdate,
  useStoreAnalytics,
} from "@/hooks/useStoreAnalytics";
import { DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import Paragraph from "antd/es/typography/Paragraph";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import ScrapeDataModal, {
  ScrapeDataKeys,
} from "@/components/storeAnalysis/ScrapeDataModal";
import { SCRAPE_DATA } from "@/components/storeAnalysis/ScrapeDataModal";
import { useCustomerUpdate } from "@/hooks/useCustomer";
import dayjs from "dayjs";
import { FEEDBACKS } from "@/components/storeAnalysis/constants/feedback";

const StoreAnalysisCustomer: React.FC = () => {
  const [form] = Form.useForm();
  const { customerData } = useAuth();
  const { fetchCustomerStoreAnalytics, isLoading: isFetchingStoreAnalytics } =
    useCustomerStoreAnalyticsFetch();
  const [storeAnalytics, setStoreAnalytics] = useState<
    IStoreDetail | undefined
  >(undefined);
  const { updateCustomer, isLoading: isUpdatingCustomer } = useCustomerUpdate();
  const { isScraping, scrape } = useStoreAnalytics();
  const { createStoreAnalysis, isLoading: isCreatingStoreAnalysis } =
    useStoreAnalysisCreate();
  const { updateStoreAnalysis, isUpdatingStoreAnalysis } =
    useStoreAnalysisUpdate();
  const { deleteStoreAnalysis, isDeleting } = useStoreAnalysisDelete();
  const { generateFeedback, isGenerating } = useGenerateFeedback();
  const [scrapingInProgress, setScrapingInProgress] = useState(false);
  const [scrapedData, setScrapedData] = useState<
    IStoreDetail | undefined | null
  >();

  const refresh = useCallback(() => {
    if (!customerData?.customer_id) {
      return;
    }
    fetchCustomerStoreAnalytics(customerData.customer_id).then((res) => {
      setStoreAnalytics(res?.at(0));
    });
  }, [customerData?.customer_id, fetchCustomerStoreAnalytics]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onFinish = async () => {
    form.validateFields().then(async (values) => {
      const updated = await updateCustomer(customerData?.id || "", {
        store_name: values.store_name,
      });
      if (updated) {
        message.success("Store name updated successfully");
        window.location.reload();
      } else {
        message.error("Failed to update store name");
      }
    });
  };
  const handleScraping = async () => {
    if (!customerData) {
      return null;
    }
    setScrapingInProgress(true);
    const scrapedData = await scrape(customerData.store_name);
    if (scrapedData?.data) {
      setScrapedData(scrapedData?.data);
    }
  };

  const handleCloseScraping = () => {
    setScrapedData(undefined);
    setScrapingInProgress(false);
  };

  const handleSave = async () => {
    if (!scrapedData || !customerData) {
      return;
    }

    const dataToSave: IStoreDetail = {
      ...scrapedData,
      customerId: customerData?.customer_id,
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
    if (!storeAnalytics?.id || !customerData) {
      return;
    }

    const dataToSave: IStoreDetail = {
      ...storeAnalytics,
      customerId: customerData?.customer_id,
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
      </div>

      {isFetchingStoreAnalytics && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Spin />
        </div>
      )}

      {customerData?.store_name && (
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
              src={customerData.logo || "/placeholder-logo.png"}
              alt={`${customerData.store_name} logo`}
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
                {customerData.store_name}
              </h2>
              <p style={{ color: "#666", margin: "0 0 4px 0" }}>
                {customerData.store_owner_name}
              </p>
              <p style={{ fontSize: "14px", color: "#888", margin: "0" }}>
                Customer ID: {customerData.customer_id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add your store analysis content here */}
      <div>
        {customerData?.store_name && (
          <>
            <Row gutter={[16, 16]}>
              <Card
                title={`Store analysis for ${customerData?.store_name}`}
                style={{ width: "100%" }}
              >
                <Row gutter={[16, 16]}>
                  <div className="flex justify-end gap-2">
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
                      {storeAnalytics.feedback ? (
                        <Row gutter={[16, 16]}>
                          <Col span={6}>
                            <Title level={5}>Store Section</Title>
                          </Col>
                          <Col span={18}>
                            <Title level={5}>Feedback</Title>
                          </Col>
                          {storeAnalytics && (
                            <Col span={24}>
                              {Object.keys(SCRAPE_DATA).map(
                                (key: string, i: number) => (
                                  <Row gutter={[16, 6]} key={i}>
                                    <Col span={6}>
                                      <Paragraph style={{ fontWeight: "bold" }}>
                                        {
                                          SCRAPE_DATA[key as ScrapeDataKeys]
                                            .label
                                        }
                                      </Paragraph>
                                    </Col>
                                    <Col span={18}>
                                      <Paragraph>
                                        {storeAnalytics?.feedback?.[
                                          key as keyof IStoreDetail
                                        ] || "-"}
                                      </Paragraph>
                                    </Col>
                                    <Divider />
                                  </Row>
                                ),
                              )}
                            </Col>
                          )}
                        </Row>
                      ) : (
                        <Title level={5} style={{ textAlign: "center" }}>
                          No Store Feedback
                        </Title>
                      )}
                    </Col>
                  )}
                </Row>
                <ScrapeDataModal
                  title={customerData.store_name}
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
              </Card>
            </Row>
          </>
        )}
      </div>

      {!customerData?.store_name && (
        <Card>
          <Form layout="vertical" onFinish={onFinish} form={form}>
            <Form.Item
              label="Store Name"
              name="store_name"
              rules={[
                {
                  required: true,
                  message:
                    "Store name must contain letters and numbers only, and cannot include spaces.",
                  pattern: /^[a-zA-Z0-9]+$/,
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isUpdatingCustomer}
            >
              Save
            </Button>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default StoreAnalysisCustomer;
