import { Form, Input, Select, Button, Row, Col, InputNumber } from "antd";
import { Customer } from "../../../types/Customer";
import dayjs from "dayjs";

const { Option } = Select;

interface AddCustomerFormProps {
  onAddCustomer: (customer: Customer) => void;
  isCreating: boolean;
}

export default function AddCustomerForm({
  onAddCustomer,
  isCreating,
}: AddCustomerFormProps) {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    const newCustomer: Customer = {
      ...values,
      date_joined: dayjs().format("YYYY-MM-DD"),
    };
    onAddCustomer(newCustomer);
    form.resetFields();
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
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
      <Row gutter={[16, 6]}>
        <Col span={12}>
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
              <Option value="Accelerator - Standard">
                Accelerator - Standard
              </Option>
              <Option value="Free">Free</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="products_count"
            label="Products Count"
            rules={[{ type: "number" }]}
          >
            <InputNumber type="number" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="notes" label="Notes">
        <Input.TextArea />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isCreating}>
          Add Customer
        </Button>
      </Form.Item>
    </Form>
  );
}
