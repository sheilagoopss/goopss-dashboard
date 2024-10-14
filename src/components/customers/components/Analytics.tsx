import React from "react";
import { Card, Statistic, Row, Col, Button, Input } from "antd";
import { StoreOwner } from "../types";
import { SearchOutlined } from "@ant-design/icons";

interface AnalyticsProps {
  storeOwners: StoreOwner[];
}

export default function Analytics({ storeOwners }: AnalyticsProps) {
  const totalOwners = storeOwners.length;
  const payingCustomers = storeOwners.filter(
    (owner) => owner.package_type !== "Free",
  ).length;
  const freeCustomers = totalOwners - payingCustomers;

  return (
    <Card>
      <Row gutter={[16, 0]}>
        <Col span={4}>
          <Statistic title="Total Store Owners" value={totalOwners} />
        </Col>
        <Col span={4}>
          <Statistic title="Paying Customers" value={payingCustomers} />
        </Col>
        <Col span={4}>
          <Statistic title="Free Customers" value={freeCustomers} />
        </Col>
        <Col>
          <Button>Edit All</Button>
        </Col>
        <Col>
          <Button>Export store owners list</Button>
        </Col>
        <Col>
          <Input
            placeholder="Search store owners"
            prefix={<SearchOutlined className="h-5 w-5 text-gray-400" />}
          />
        </Col>
      </Row>
    </Card>
  );
}
