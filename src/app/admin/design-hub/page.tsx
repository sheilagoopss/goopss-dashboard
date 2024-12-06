"use client";

import { Alert, Col, Row, Spin, Tabs, Typography } from "antd";
import CustomersDropdown from "@/components/common/CustomersDropdown";
import { useCustomerFetch, useCustomerFetchAll } from "@/hooks/useCustomer";
import { useEffect, useState } from "react";
import { ICustomer } from "@/types/Customer";
import UploadListingImage from "@/components/designHub/views/Admin/Tabs/UploadListingImage";
import UploadBanner from "@/components/designHub/views/Admin/Tabs/UploadBanner";
import { Content } from "antd/es/layout/layout";

const DesignHubAdminPage = () => {
  const { fetchAllCustomers, isLoading } = useCustomerFetchAll();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );

  const { fetchCustomer, isLoading: isFetchingCustomer } = useCustomerFetch();

  useEffect(() => {
    fetchAllCustomers().then((customers) => setCustomers(customers));
  }, [fetchAllCustomers]);

  const refetchCustomer = async () => {
    if (!selectedCustomer) return;
    const customer = await fetchCustomer(selectedCustomer.id);
    if (customer) setSelectedCustomer(customer);
  };

  return isLoading ? (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "60vh",
      }}
    >
      <Spin />
    </div>
  ) : (
    <Content className="p-4">
      <Row gutter={[16, 16]}>
        <Col
          span={24}
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1ch",
          }}
        >
          <Typography.Title level={4}>Design Hub</Typography.Title>
          <CustomersDropdown
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            isAdmin={true}
          />
        </Col>

        {selectedCustomer ? (
          <Tabs
            defaultActiveKey="1"
            style={{ width: "100%" }}
            items={[
              {
                label: "Upload Listing Image",
                key: "1",
                children: (
                  <UploadListingImage selectedCustomer={selectedCustomer} />
                ),
              },
              {
                label: "Upload Banner",
                key: "2",
                children: (
                  <UploadBanner
                    selectedCustomer={selectedCustomer}
                    refetch={refetchCustomer}
                    isFetchingCustomer={isFetchingCustomer}
                  />
                ),
              },
            ]}
          />
        ) : (
          <Alert
            message="Please select a customer to view designs"
            type="error"
            showIcon
            style={{ padding: "4ch", width: "100%" }}
            banner
          />
        )}
      </Row>
    </Content>
  );
};

export default DesignHubAdminPage;