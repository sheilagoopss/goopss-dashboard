"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Layout, Row, Col, Button, Modal, message, Segmented } from "antd";
import CustomerList from "@/components/customers/CustomerList";
import AddCustomer from "@/components/customers/AddCustomer";
import Analytics from "@/components/customers/Analytics";
import { useCustomerCreate, useCustomerFetchAll } from "@/hooks/useCustomer";
import { ICustomer } from "@/types/Customer";
import { caseInsensitiveSearch } from "@/utils/caseInsensitveMatch";
import Papa from "papaparse";
import { ReloadOutlined } from "@ant-design/icons";
import { Store } from "lucide-react";

const { Content } = Layout;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<ICustomer[]>([]);
  const [addNewCustomerModal, setAddNewCustomerModal] = useState(false);
  const { isLoading, fetchAllCustomers } = useCustomerFetchAll();
  const { isLoading: isCreating, createCustomer } = useCustomerCreate();
  const [segmentValue, setSegmentValue] = useState("Paid");

  const refresh = useCallback(() => {
    fetchAllCustomers().then((customers) => {
      setCustomers(customers);
      const filteredCustomers = customers.filter(
        (customer) => customer.customer_type === "Paid",
      );
      setFilteredCustomers(filteredCustomers);
      setSegmentValue("Paid");
    });
  }, [fetchAllCustomers]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSearch = (searchTerm?: string) => {
    const filterColumns: (keyof ICustomer)[] = [
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

  const handleAddCustomer = async (
    newCustomer: ICustomer,
  ): Promise<boolean> => {
    const response = await createCustomer(newCustomer);
    if (response) {
      message.success({ content: "Customer Created" });
      setCustomers([...customers, newCustomer]);
      setFilteredCustomers([...filteredCustomers, newCustomer]);
      return true;
    } else {
      message.error({ content: "Customer not created" });
      return false;
    }
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
    <Content className="p-4">
      <div className="flex flex-row justify-between items-center mb-2">
        <div className="flex flex-row items-center gap-2">
          <Store size={"2ch"} />
          <h2 className="font-bold">Etsy Store Owners</h2>
        </div>
        <div className="flex flex-row gap-2">
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
              { label: "Paying Customers", value: "Paid" }, //TODO: temp
              { label: "Free Customers", value: "Free" },
            ]}
            onChange={(value) => {
              if (value === "Free") {
                setSegmentValue("Free");
                const filteredCustomers = customers.filter(
                  (customer) => customer.customer_type === value,
                );
                setFilteredCustomers(filteredCustomers);
              } else {
                setSegmentValue("Paid");
                const filteredCustomers = customers.filter(
                  (customer) => customer.customer_type !== "Free",
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
        <AddCustomer
          onAddCustomer={handleAddCustomer}
          isCreating={isCreating}
        />
      </Modal>
    </Content>
  );
}