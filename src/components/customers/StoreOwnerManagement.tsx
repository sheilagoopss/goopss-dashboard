"use client";

import React, { useState, useEffect } from "react";
import { Layout, Typography, Row, Col, Button, Modal } from "antd";
import StoreOwnerList from "./components/StoreOwnerList";
import AddCustomerForm from "./components/AddCustomerForm";
import Analytics from "./components/Analytics";
import SearchFilter from "./components/SearchFilter";
import { StoreOwner } from "./types";
import { Store } from "lucide-react";

const { Content } = Layout;
const { Title } = Typography;

export default function StoreOwnerManagement() {
  const [storeOwners, setStoreOwners] = useState<StoreOwner[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<StoreOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [addNewCustomerModal, setAddNewCustomerModal] = useState(false);

  useEffect(() => {
    // TODO: Fetch store owners from Firestore
    // For now, we'll use mock data
    const mockData: StoreOwner[] = [
      {
        id: "1",
        store_name: "Store A",
        store_owner_name: "John Doe",
        email: "john@storea.com",
        phone: "123-456-7890",
        date_joined: "2023-01-01",
        package_type: "Social",
        products_count: 100,
        notes: "VIP customer",
        weeks: 52,
        lists: 5,
        sales_when_joined: 10000,
        current_sales: 15000,
      },
      // Add more mock data as needed
    ];
    setStoreOwners(mockData);
    setFilteredOwners(mockData);
    setLoading(false);
  }, []);

  const handleSearch = (searchTerm: string, filters: any) => {
    // Implement search and filter logic here
    const filtered = storeOwners.filter(
      (owner) =>
        owner.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.store_owner_name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredOwners(filtered);
  };

  const handleAddCustomer = (newCustomer: StoreOwner) => {
    // TODO: Add new customer to Firestore
    setStoreOwners([...storeOwners, newCustomer]);
    setFilteredOwners([...filteredOwners, newCustomer]);
  };

  return (
    <Layout>
      <Content style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "1ch",
            }}
          >
            <Store size={"2ch"} />
            <h2 style={{ fontWeight: "bolder" }}>Etsy Store Owners</h2>
          </div>
          <Button onClick={() => setAddNewCustomerModal(true)}>
            Add New Customer
          </Button>
        </div>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Analytics storeOwners={storeOwners} />
          </Col>
          {/* <Col span={24}>
            <SearchFilter onSearch={handleSearch} />
          </Col> */}
          <Col span={24}>
            <StoreOwnerList storeOwners={filteredOwners} loading={loading} />
          </Col>
        </Row>
        <Modal
          title="Add Customer"
          style={{ top: "3ch" }}
          open={addNewCustomerModal}
          onCancel={() => setAddNewCustomerModal(false)}
          footer={null}
        >
          <AddCustomerForm onAddCustomer={handleAddCustomer} />
        </Modal>
      </Content>
    </Layout>
  );
}
