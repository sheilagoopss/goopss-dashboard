import { Content } from "antd/es/layout/layout";
import { Form, Input, InputNumber, Row, Col, Button } from "antd";

interface IListingEditProps {
  listing: {
    listing_id: number;
    tags: string;
    materials: string;
    description: string;
    quantity: number;
  };
  isUpdating: boolean;
  handleUpdate: (listing: {
    description: string;
    quantity: number;
    tags: string;
    materials: string;
  }) => void;
}

const ListingEdit: React.FC<IListingEditProps> = ({
  listing,
  handleUpdate,
  isUpdating,
}) => {
  return (
    <Content>
      <Form
        layout="vertical"
        initialValues={{
          description: listing.description,
          tags: listing.tags,
          materials: listing.materials,
          quantity: listing.quantity,
        }}
        key={listing.listing_id}
        onFinish={handleUpdate}
      >
        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Please enter a description" }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item
          label="Tags"
          name="tags"
          extra="Please separate tags with commas."
          rules={[{ required: true, message: "Please enter tags" }]}
        >
          <Input placeholder="Enter tags separated by commas" />
        </Form.Item>
        <Form.Item
          label="Materials"
          name="materials"
          extra="Please separate materials with commas."
          rules={[{ required: true, message: "Please enter materials" }]}
        >
          <Input placeholder="Enter materials separated by commas" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Quantity"
              name="quantity"
              rules={[{ required: true, message: "Please enter a quantity" }]}
            >
              <InputNumber min={1} />
            </Form.Item>
          </Col>
        </Row>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" htmlType="submit" loading={isUpdating}>
            Update
          </Button>
        </div>
      </Form>
    </Content>
  );
};

export default ListingEdit;
