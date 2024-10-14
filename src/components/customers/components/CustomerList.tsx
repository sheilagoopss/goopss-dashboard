import React, { useState } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Col,
  Row,
  message,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { ChartColumn, Paintbrush, Search, Share2 } from "lucide-react";
import { Customer } from "../../../types/Customer";
import {
  useCustomerUpdate,
  useCustomerDelete,
} from "../../../hooks/useCustomer";
import { useNavigate } from "react-router-dom";

interface CustomerListProps {
  customers: Customer[];
  loading: boolean;
  refresh: () => void;
}

export default function CustomerList({
  customers,
  loading,
  refresh,
}: CustomerListProps) {
  const [editingKey, setEditingKey] = useState("");
  const [form] = Form.useForm();
  const { isLoading: isUpdating, updateCustomer } = useCustomerUpdate();
  const { isLoading: isDeleting, deleteCustomer } = useCustomerDelete();
  const navigate = useNavigate();

  const columns = [
    {
      title: "Store Name",
      dataIndex: "store_name",
      key: "store_name",
      sorter: (a: Customer, b: Customer) =>
        a.store_name.localeCompare(b.store_name),
    },
    {
      title: "Owner Name",
      dataIndex: "store_owner_name",
      key: "store_owner_name",
      sorter: (a: Customer, b: Customer) =>
        a.store_owner_name.localeCompare(b.store_owner_name),
    },
    {
      title: "Package Type",
      dataIndex: "package_type",
      key: "package_type",
      render: (packageType: string) => (
        <Tag color={packageType === "Free" ? "green" : "blue"}>
          {packageType || "-"}
        </Tag>
      ),
      sorter: (a: Customer, b: Customer) =>
        (a.package_type || "").localeCompare(b.package_type || ""),
    },
    {
      title: "Current Sales",
      dataIndex: "current_sales",
      key: "current_sales",
      sorter: (a: Customer, b: Customer) =>
        (a.current_sales || 0) - (b.current_sales || 0),
    },
    // {
    //   title: "Date Joined",
    //   dataIndex: "date_joined",
    //   key: "date_joined",
    //   sorter: (a: Customer, b: Customer) =>
    //     new Date(a.date_joined).getTime() - new Date(b.date_joined).getTime(),
    // },
    {
      title: "",
      key: "actions",
      render: (_: any, record: Customer) => (
        <Row gutter={[16, 2]}>
          <Col>
            <Button
              onClick={() => handleEdit(record)}
              icon={<EditOutlined />}
            />
          </Col>
          <Col>
            <Button
              onClick={() => handleDelete(record.customer_id)}
              icon={<DeleteOutlined />}
              danger
              loading={isDeleting}
            />
          </Col>
        </Row>
      ),
    },
  ];

  const handleEdit = (record: Customer) => {
    form.setFieldsValue(record);
    setEditingKey(record.customer_id);
  };

  const handleSave = async () => {
    try {
      const row = await form.validateFields();
      const update = await updateCustomer(editingKey, row);
      if (update) {
        message.success({ content: "Customer Updated!" });
        refresh();
      } else {
        message.error({ content: "Customer Not Updated!" });
      }
      setEditingKey("");
    } catch (errInfo) {
      message.error({ content: `Validate Failed: ${errInfo}` });
      console.log("Validate Failed:", errInfo);
    }
  };

  const handleDelete = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      message.success({ content: "Customer Deleted!" });
      refresh();
    } catch (error) {
      message.error({ content: `Error deleting customer: ${error}` });
      console.error("Error deleting customer:", error);
    }
  };

  const expandedRowRender = (record: Customer) => (
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
        <Row gutter={[16, 20]}>
          <Col span={12}>
            <Button
              size="large"
              icon={<Search />}
              onClick={() => navigate(`/seo?${record.id}`)}
            >
              SEO
            </Button>
          </Col>
          <Col span={12}>
            <Button
              size="large"
              icon={<Paintbrush />}
              onClick={() => navigate(`/design-hub?${record.id}`)}
            >
              Design Hub
            </Button>
          </Col>
          <Col span={12}>
            <Button
              size="large"
              icon={<ChartColumn />}
              onClick={() => navigate(`/ads-recommendation?${record.id}`)}
            >
              Store Analytics
            </Button>
          </Col>
          <Col span={12}>
            <Button
              size="large"
              icon={<Share2 />}
              onClick={() => navigate(`/social?${record.id}`)}
            >
              Social
            </Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );

  return (
    <>
      <Table
        dataSource={customers}
        columns={columns}
        rowKey="id"
        loading={loading}
        expandable={{ expandedRowRender }}
        pagination={{
          showSizeChanger: true,
        }}
      />
      <Modal
        title="Edit Store Owner"
        open={!!editingKey}
        style={{ top: "3ch" }}
        onCancel={() => setEditingKey("")}
        footer={[
          <Button key="back" onClick={() => setEditingKey("")}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSave}
            loading={isUpdating}
          >
            Update
          </Button>,
        ]}
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
