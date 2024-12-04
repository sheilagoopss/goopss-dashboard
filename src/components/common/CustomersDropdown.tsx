"use client";
import React, { useState } from "react";
import { Select, Space, Switch, Tooltip, Tag, Button } from "antd";
import { ICustomer } from "@/types/Customer";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

interface CustomersDropdownProps {
  customers: ICustomer[];
  selectedCustomer: ICustomer | null;
  setSelectedCustomer: (customer: ICustomer | null) => void;
  isAdmin: boolean;
}

const CustomersDropdown: React.FC<CustomersDropdownProps> = ({
  customers,
  selectedCustomer,
  setSelectedCustomer,
  isAdmin,
}) => {
  const [showInactive, setShowInactive] = useState(false);

  if (!isAdmin) return null;

  const filteredCustomers = customers.filter(
    (c) => c.customer_type === "Paid" && (showInactive ? true : c.isActive),
  );

  const handleToggleAdmin = () => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("viewAsCustomer", "true");
    newUrl.searchParams.set("selectedCustomerId", selectedCustomer?.id || "");
    window.open(newUrl.toString(), "_blank");
  };

  return (
    <Space direction="vertical" size="small">
      <Select
        style={{ width: "300px" }}
        placeholder="Select a customer"
        value={selectedCustomer?.id}
        onChange={(value) => {
          const customer = filteredCustomers.find((c) => c.id === value);
          setSelectedCustomer(customer || null);
        }}
        size="large"
        listHeight={400}
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) =>
          (option?.label?.toString() || "")
            .toLowerCase()
            .includes(input.toLowerCase())
        }
      >
        {filteredCustomers.map((customer) => (
          <Select.Option
            key={customer.id}
            value={customer.id}
            label={`${customer.store_name} - ${customer.store_owner_name}${!customer.isActive ? " (Inactive)" : ""}`}
          >
            <Space>
              {customer.logo && (
                <Image
                  src={customer.logo}
                  alt={customer.store_name}
                  width={20}
                  height={20}
                  style={{ borderRadius: "50%" }}
                />
              )}
              {customer.store_name} - {customer.store_owner_name}
              {!customer.isActive && <Tag color="red">Inactive</Tag>}
            </Space>
          </Select.Option>
        ))}
      </Select>
      {isAdmin && (
        <div style={{ display: "flex", flexDirection: "row", gap: "2ch" }}>
          <Tooltip title="Show inactive customers">
            <Switch
              checked={showInactive}
              onChange={setShowInactive}
              checkedChildren="Showing Inactive"
              unCheckedChildren="Show Inactive"
            />
          </Tooltip>
          <Tooltip title="Open customer view in new window">
            <Button
              size="small"
              type="link"
              onClick={handleToggleAdmin}
              icon={<ExternalLink size={"1.5ch"} />}
              disabled={!selectedCustomer}
            >
              Customer View
            </Button>
          </Tooltip>
        </div>
      )}
    </Space>
  );
};

export default CustomersDropdown;
