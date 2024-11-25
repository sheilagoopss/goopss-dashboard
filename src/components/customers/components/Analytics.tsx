import React from "react";
import { Card, Statistic, Row, Col, Button, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { ICustomer } from "../../../types/Customer";

interface AnalyticsProps {
  customers: ICustomer[];
  handleSearch: (value?: string) => void;
  handleCSVExport: () => void;
}

export default function Analytics({
  customers,
  handleSearch,
  handleCSVExport,
}: AnalyticsProps) {
  const totalOwners = customers.length;
  
  const activePayingCustomers = customers.filter(
    (owner) => owner.isActive && owner.customer_type === "Paid"
  ).length;
  
  const activeFreeCustomers = customers.filter(
    (owner) => owner.isActive && owner.customer_type === "Free"
  ).length;

  const inactiveCustomers = customers.filter(customer => !customer.isActive).length;

  return (
    <Card>
      <Row gutter={[16, 0]}>
        <Col span={4}>
          <Statistic title="Total Store Owners" value={totalOwners} />
        </Col>
        <Col span={4}>
          <Statistic title="Paying Customers" value={activePayingCustomers} />
        </Col>
        <Col span={4}>
          <Statistic title="Free Customers" value={activeFreeCustomers} />
        </Col>
        <Col span={4}>
          <Statistic title="Inactive Customers" value={inactiveCustomers} />
        </Col>
        <Col>
          <Button onClick={handleCSVExport}>Export store owners list</Button>
        </Col>
        <Col>
          <Input
            placeholder="Search store owners"
            prefix={<SearchOutlined className="h-5 w-5 text-gray-400" />}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
        </Col>
      </Row>
    </Card>
  );
}
