/* eslint-disable react-hooks/exhaustive-deps */
import { Alert, Col, Row, Spin, Tabs, Typography } from "antd";
import CustomersDropdown from "components/CustomersDropdown";
import { useCustomerFetchAll } from "hooks/useCustomer";
import { useEffect, useState } from "react";
import { ICustomer } from "types/Customer";
import UploadListingImage from "./Tabs/UploadListingImage";
import UploadBanner from "./Tabs/UploadBanner";

const DesignHubAdmin = () => {
  const { fetchAllCustomers, isLoading } = useCustomerFetchAll();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );

  useEffect(() => {
    fetchAllCustomers().then((customers) => setCustomers(customers));
  }, [fetchAllCustomers]);

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
              children: <UploadBanner selectedCustomer={selectedCustomer} />,
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
  );
};

export default DesignHubAdmin;