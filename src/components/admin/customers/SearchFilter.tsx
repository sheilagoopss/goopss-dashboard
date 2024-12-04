import React from "react";
import { Input, Select, DatePicker, Form, Button } from "antd";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface SearchFilterProps {
  onSearch: (searchTerm: string, filters: any) => void;
}

export default function SearchFilter({ onSearch }: SearchFilterProps) {
  const [form] = Form.useForm();

  const handleSearch = () => {
    const values = form.getFieldsValue();
    onSearch(values.searchTerm || "", values);
  };

  return (
    <Form form={form} layout="inline" onFinish={handleSearch}>
      <Form.Item name="searchTerm">
        <Input placeholder="Search store owners" />
      </Form.Item>
      <Form.Item name="packageType">
        <Select placeholder="Package Type" style={{ width: 200 }}>
          <Option value="Social">Social</Option>
          <Option value="Maintenance">Maintenance</Option>
          <Option value="Extended Maintenance">Extended Maintenance</Option>
          <Option value="Accelerator - Basic">Accelerator - Basic</Option>
          <Option value="Accelerator - Standard">Accelerator - Standard</Option>
          <Option value="Free">Free</Option>
        </Select>
      </Form.Item>
      <Form.Item name="dateRange">
        <RangePicker />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Search
        </Button>
      </Form.Item>
    </Form>
  );
}
