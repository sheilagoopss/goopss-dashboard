import React from "react";
import { v4 } from "uuid";
import { Form, Input, Select, Button, DatePicker, Row, Col } from "antd";
import { StoreOwner } from "../types";

const { Option } = Select;

interface AddCustomerFormProps {
  onAddCustomer: (customer: StoreOwner) => void;
}

export default function AddCustomerForm({
  onAddCustomer,
}: AddCustomerFormProps) {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    const newCustomer: StoreOwner = {
      id: v4(),
      ...values,
      date_joined: values.date_joined.format("YYYY-MM-DD"),
    };
    onAddCustomer(newCustomer);
    form.resetFields();
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Row gutter={[16, 6]}>
        <Col span={12}>
          {" "}
          <Form.Item
            name="store_name"
            label="Store Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="store_owner_name"
            label="Owner Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="email"
        label="Email"
        rules={[{ required: true, type: "email" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="phone" label="Phone">
        <Input />
      </Form.Item>
      <Form.Item
        name="date_joined"
        label="Date Joined"
        rules={[{ required: true }]}
      >
        <DatePicker />
      </Form.Item>
      <Form.Item
        name="package_type"
        label="Package Type"
        rules={[{ required: true }]}
      >
        <Select>
          <Option value="Social">Social</Option>
          <Option value="Maintenance">Maintenance</Option>
          <Option value="Extended Maintenance">Extended Maintenance</Option>
          <Option value="Accelerator - Basic">Accelerator - Basic</Option>
          <Option value="Accelerator - Standard">Accelerator - Standard</Option>
          <Option value="Free">Free</Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="products_count"
        label="Products Count"
        rules={[{ type: "number" }]}
      >
        <Input type="number" />
      </Form.Item>
      <Form.Item name="notes" label="Notes">
        <Input.TextArea />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Add Customer
        </Button>
      </Form.Item>
    </Form>
  );
}
