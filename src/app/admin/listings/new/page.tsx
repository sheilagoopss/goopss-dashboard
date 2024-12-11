"use client";

import { useState, useEffect } from "react";
import { ICustomer } from "@/types/Customer";
import { useCustomerFetchAll } from "@/hooks/useCustomer";
import { Content } from "antd/es/layout/layout";
import CustomersDropdown from "@/components/common/CustomersDropdown";
import AdminNewListing from "@/components/listings/AdminNewListing";

export default function NewListingPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const { fetchAllCustomers } = useCustomerFetchAll();

  useEffect(() => {
    fetchAllCustomers().then((customers) => {
      setCustomers(customers);
    });
  }, [fetchAllCustomers]);

  return (
    <Content className="p-4">
      <div style={{
        marginBottom: "24px",
        display: "flex",
        justifyContent: "flex-end",
      }}>
        <div style={{ width: "300px" }}>
          <CustomersDropdown
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            isAdmin={true}
          />
        </div>
      </div>
      {selectedCustomer ? (
        <AdminNewListing
          customerId={selectedCustomer.id}
          storeName={selectedCustomer.store_name}
        />
      ) : (
        <div style={{ textAlign: "center", padding: "20px" }}>
          Please select a customer to create a new listing
        </div>
      )}
    </Content>
  );
} 