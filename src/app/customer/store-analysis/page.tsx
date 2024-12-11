"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Col, Divider, Form, Input, message, Row, Spin } from "antd";
import { IStoreDetail } from "@/types/StoreDetail";
import { useCustomerStoreAnalyticsFetch } from "@/hooks/useStoreAnalytics";
import { ReloadOutlined } from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import Paragraph from "antd/es/typography/Paragraph";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { ScrapeDataKeys } from "@/components/storeAnalysis/ScrapeDataModal";
import { SCRAPE_DATA } from "@/components/storeAnalysis/ScrapeDataModal";
import { useCustomerUpdate } from "@/hooks/useCustomer";

const StoreAnalysisCustomer: React.FC = () => {
  const { customerData } = useAuth();
  const { fetchCustomerStoreAnalytics, isLoading: isFetchingStoreAnalytics } =
    useCustomerStoreAnalyticsFetch();
  const [storeAnalytics, setStoreAnalytics] = useState<
    IStoreDetail | undefined
  >(undefined);
  const [form] = Form.useForm();
  const { updateCustomer, isLoading: isUpdatingCustomer } = useCustomerUpdate();

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
              <Col span={24}>Store analysis for {customerData?.store_name}</Col>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "2ch",
                }}
              >
                <Button
                  icon={<ReloadOutlined />}
                  onClick={refresh}
                  loading={isFetchingStoreAnalytics}
                />
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
                                    {SCRAPE_DATA[key as ScrapeDataKeys].label}
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
            <Button type="primary" htmlType="submit" loading={isUpdatingCustomer}>
              Save
            </Button>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default StoreAnalysisCustomer;
