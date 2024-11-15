import { Card, Layout, Typography } from "antd";
import { Content } from "antd/es/layout/layout";
import DragDropUpload from "components/common/DragDropUpload";
import { ICustomer } from "types/Customer";

interface UploadBannerProps {
  selectedCustomer: ICustomer;
}

const UploadBanner: React.FC<UploadBannerProps> = ({ selectedCustomer }) => {
  return (
    <Layout>
      <Content>
        <Card>
          <Typography.Title level={3}>Upload Banner</Typography.Title>
          <DragDropUpload handleUpload={() => {}} />
        </Card>
      </Content>
    </Layout>
  );
};

export default UploadBanner;
