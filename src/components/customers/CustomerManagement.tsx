/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { Layout, Row, Col, Button, Modal, message, Segmented } from "antd";
import CustomerList from "./components/CustomerList";
import AddCustomerForm from "./components/AddCustomerForm";
import Analytics from "./components/Analytics";
import { Store } from "lucide-react";
import {
  useCustomerCreate,
  useCustomerFetchAll,
} from "../../hooks/useCustomer";
import { Customer } from "../../types/Customer";
import { caseInsensitiveSearch } from "../../utils/caseInsensitveMatch";
import Papa from "papaparse";
import { ReloadOutlined } from "@ant-design/icons";

const { Content } = Layout;

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [addNewCustomerModal, setAddNewCustomerModal] = useState(false);
  const { isLoading, fetchAllCustomers } = useCustomerFetchAll();
  const { isLoading: isCreating, createCustomer } = useCustomerCreate();
  const [segmentValue, setSegmentValue] = useState("all");

  const refresh = async () => {
    fetchAllCustomers().then((customers) => {
      setCustomers(customers);
      setFilteredCustomers(
        customers.filter((customer) => customer.package_type !== "Free"),
      );
      setSegmentValue("all");
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSearch = (searchTerm?: string) => {
    const filterColumns: (keyof Customer)[] = [
      "package_type",
      "email",
      "phone",
      "date_joined",
      "store_name",
      "store_owner_name",
    ];
    const filtered = customers?.filter((val) =>
      filterColumns.some((v) =>
        caseInsensitiveSearch(val[v] || "", searchTerm),
      ),
    );
    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = async (newCustomer: Customer) => {
    createCustomer(newCustomer).then((value) => {
      message.success({ content: "Customer Created" });
      setCustomers([...customers, newCustomer]);
      setFilteredCustomers([...filteredCustomers, newCustomer]);
    });
  };

  const handleCSVExport = () => {
    const csvData = customers.map((customer) => ({
      "Store Name": customer.store_name,
      "Owner Name": customer.store_owner_name,
      Email: customer.email,
      Phone: customer.phone || "-",
      "Date Joined": customer.date_joined || "-",
      "Package Type": customer.package_type || "-",
      "Products Count": customer.products_count || "-",
      Notes: customer.notes || "-",
      "Sales When Joined": customer.sales_when_joined || "-",
      "Current Sales": customer.current_sales || "-",
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "store_owners.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Layout style={{ backgroundColor: "white" }}>
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
          <div style={{ display: "flex", gap: "2ch" }}>
            <Button onClick={() => setAddNewCustomerModal(true)}>
              Add New Customer
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refresh()}
              loading={isLoading}
            />
          </div>
        </div>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Analytics
              customers={customers}
              handleSearch={handleSearch}
              handleCSVExport={handleCSVExport}
            />
          </Col>
          {/* <Col span={24}>
            <SearchFilter onSearch={handleSearch} />
          </Col> */}
          <Col span={24}>
            <Segmented
              options={[
                { label: "Paying Customers", value: "all" }, //TODO: temp
                { label: "Free Customers", value: "Free" },
              ]}
              onChange={(value) => {
                if (value === "Free") {
                  setSegmentValue("Free");
                  const filteredCustomers = customers.filter(
                    (customer) => customer.package_type === value,
                  );
                  setFilteredCustomers(filteredCustomers);
                } else {
                  setSegmentValue("all");
                  const filteredCustomers = customers.filter(
                    (customer) => customer.package_type !== "Free",
                  );
                  setFilteredCustomers(filteredCustomers);
                }
              }}
              style={{ padding: "0.5ch" }}
              span={24}
              value={segmentValue}
            />
          </Col>
          <Col span={24}>
            <CustomerList
              customers={filteredCustomers}
              loading={isLoading}
              refresh={refresh}
            />
          </Col>
        </Row>
        <Modal
          title="Add Customer"
          style={{ top: "3ch" }}
          open={addNewCustomerModal}
          onCancel={() => setAddNewCustomerModal(false)}
          footer={null}
        >
          <AddCustomerForm
            onAddCustomer={handleAddCustomer}
            isCreating={isCreating}
          />
        </Modal>
      </Content>
    </Layout>
  );
}
