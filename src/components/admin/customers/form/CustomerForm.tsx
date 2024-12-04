"use client";
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from "antd";
import { packageTypes } from "@/types/Customer";

interface CustomerFormProps {
  isUpdate?: boolean;
  loading: boolean;
}

const { Option } = Select;

export const CustomerForm: React.FC<CustomerFormProps> = ({
  loading,
  isUpdate,
}) => {
  return (
    <>
      <Row gutter={[16, 6]}>
        <Col span={12}>
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
        name="logo"
        label="Logo URL"
        rules={[
          { required: true, message: 'Logo URL is required' },
          { type: 'url', message: 'Please enter a valid URL' }
        ]}
      >
        <Input 
          disabled={loading}
        />
      </Form.Item>
      <Row gutter={[16, 6]}>
        <Col span={12}>
          <Form.Item
            name="package_type"
            label="Package Type"
            rules={[{ required: true }]}
          >
            <Select>
              {Object.values(packageTypes).map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="customer_type"
            label="Customer Type"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="Paid">Paid</Option>
              <Option value="Free">Free</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 6]}>
        <Col span={8}>
          <Form.Item
            name="date_joined"
            label="Date Joined"
            rules={[{ required: true }]}
          >
            <DatePicker allowClear />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="lists" label="Listings" rules={[{ type: "number" }]}>
            <InputNumber type="number" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="sales_when_joined"
            label="Sales When Joined"
            rules={[{ type: "number" }]}
          >
            <InputNumber type="number" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        name="products_count"
        label="Products Count"
        rules={[{ type: "number" }]}
      >
        <InputNumber type="number" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="notes" label="Notes">
        <Input.TextArea />
      </Form.Item>
      <Form.Item name="isSuperCustomer">
        <Col span={12}>
          <Checkbox>Super Customer</Checkbox>
        </Col>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {isUpdate ? "Update Customer" : " Add Customer"}
        </Button>
      </Form.Item>
    </>
  );
};
