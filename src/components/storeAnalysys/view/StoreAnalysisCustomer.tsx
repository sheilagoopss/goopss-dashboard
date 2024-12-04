/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Button, Col, Divider, Row, Spin } from "antd";
import { IStoreDetail } from "../../../types/StoreDetail";
import { useCustomerStoreAnalyticsFetch } from "../../../hooks/useStoreAnalytics";
import { ReloadOutlined } from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import { SCRAPE_DATA, ScrapeDataKeys } from "../components/ScrapeDataModal";
import Paragraph from "antd/es/typography/Paragraph";

const StoreAnalysisCustomer: React.FC = () => {
  const { customerData } = useAuth();
  const { fetchCustomerStoreAnalytics, isLoading: isFetchingStoreAnalytics } =
    useCustomerStoreAnalyticsFetch();
  const [storeAnalytics, setStoreAnalytics] = useState<
    IStoreDetail | undefined
  >(undefined);

  const refresh = () => {
    if (!customerData?.customer_id) {
      return;
    }
    fetchCustomerStoreAnalytics(customerData.customer_id).then((res) => {
      setStoreAnalytics(res?.at(0));
    });
  };

  useEffect(() => {
    refresh();
  }, [customerData?.customer_id]);

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

      {customerData && (
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
              src={customerData.logo || "/placeholder-logo.png"}
              alt={`${customerData.store_name} logo`}
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
        {customerData && (
          <>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                Store analysis for {customerData?.store_name}
              </Col>
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
    </div>
  );
};

export default StoreAnalysisCustomer;
