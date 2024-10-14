import React, { useState } from "react";
import { Table, Tag, Button, Modal, Form, Input, Col, Row } from "antd";
import { StoreOwner } from "../types";
import { EditOutlined } from "@ant-design/icons";
import { ChartColumn, Paintbrush, Search, Share2 } from "lucide-react";

interface StoreOwnerListProps {
  storeOwners: StoreOwner[];
  loading: boolean;
}

export default function StoreOwnerList({
  storeOwners,
  loading,
}: StoreOwnerListProps) {
  const [editingKey, setEditingKey] = useState("");
  const [form] = Form.useForm();

  const columns = [
    {
      title: "Store Name",
      dataIndex: "store_name",
      key: "store_name",
      sorter: (a: StoreOwner, b: StoreOwner) =>
        a.store_name.localeCompare(b.store_name),
    },
    {
      title: "Owner Name",
      dataIndex: "store_owner_name",
      key: "store_owner_name",
      sorter: (a: StoreOwner, b: StoreOwner) =>
        a.store_owner_name.localeCompare(b.store_owner_name),
    },
    {
      title: "Package Type",
      dataIndex: "package_type",
      key: "package_type",
      render: (packageType: string) => (
        <Tag color={packageType === "Free" ? "green" : "blue"}>
          {packageType}
        </Tag>
      ),
      sorter: (a: StoreOwner, b: StoreOwner) =>
        a.package_type.localeCompare(b.package_type),
    },
    {
      title: "Current Sales",
      dataIndex: "current_sales",
      key: "current_sales",
      sorter: (a: StoreOwner, b: StoreOwner) =>
        (a.current_sales || 0) - (b.current_sales || 0),
    },
    // {
    //   title: "Date Joined",
    //   dataIndex: "date_joined",
    //   key: "date_joined",
    //   sorter: (a: StoreOwner, b: StoreOwner) =>
    //     new Date(a.date_joined).getTime() - new Date(b.date_joined).getTime(),
    // },
    {
      title: "",
      key: "actions",
      render: (_: any, record: StoreOwner) => (
        <Button onClick={() => handleEdit(record)} icon={<EditOutlined />} />
      ),
    },
  ];

  const handleEdit = (record: StoreOwner) => {
    form.setFieldsValue(record);
    setEditingKey(record.id);
  };

  const handleSave = async () => {
    try {
      const row = await form.validateFields();
      // TODO: Update the store owner in Firestore
      setEditingKey("");
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const expandedRowRender = (record: StoreOwner) => (
    <Row>
      <Col span={12}>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          <li>
            <span style={{ fontWeight: "bold" }}>Phone: </span>
            {record.phone}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>Email: </span>
            {record.email}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>Products: </span>
            {record.products_count}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>Notes: </span>
            {record.notes}
          </li>
          {record.package_type !== "Free" && (
            <>
              <li>
                <span style={{ fontWeight: "bold" }}>Sales When Joined: </span>$
                {record.sales_when_joined}
              </li>
              <li>
                <span style={{ fontWeight: "bold" }}>Date Joined: </span>
                {record.date_joined}
              </li>
              <li>
                <span style={{ fontWeight: "bold" }}>Weeks: </span>
                {record.weeks}
              </li>
              <li>
                <span style={{ fontWeight: "bold" }}>Lists: </span>
                {record.lists}
              </li>
            </>
          )}
        </ul>
      </Col>
      <Col span={12}>
        <Row gutter={[16, 6]}>
          <Col span={12}>
            <Button icon={<Search />}>SEO</Button>
          </Col>
          <Col span={12}>
            <Button icon={<Paintbrush />}>Design Hub</Button>
          </Col>
          <Col span={12}>
            <Button icon={<ChartColumn />}>Store Analytics</Button>
          </Col>
          <Col span={12}>
            <Button icon={<Share2/>}>Social</Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );

  return (
    <>
      <Table
        dataSource={storeOwners}
        columns={columns}
        rowKey="id"
        loading={loading}
        expandable={{ expandedRowRender }}
      />
      <Modal
        title="Edit Store Owner"
        open={!!editingKey}
        style={{ top: "3ch" }}
        onOk={handleSave}
        onCancel={() => setEditingKey("")}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="store_name" label="Store Name">
            <Input />
          </Form.Item>
          <Form.Item name="store_owner_name" label="Owner Name">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="package_type" label="Package Type">
            <Input />
          </Form.Item>
          <Form.Item name="products_count" label="Products Count">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
