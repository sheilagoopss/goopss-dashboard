import { DeleteOutlined } from "@ant-design/icons";
import { CloseCircleFilled } from "@ant-design/icons";
import { Button, Card, Col, Image, Layout, Row, Spin, Typography } from "antd";
import { Content } from "antd/es/layout/layout";
import DragDropUpload from "components/common/DragDropUpload";
import { useCustomerBannerUpload } from "hooks/useCustomer";
import { useState } from "react";
import { ICustomer } from "types/Customer";

interface UploadBannerProps {
  isFetchingCustomer: boolean;
  selectedCustomer: ICustomer;
  refetch: () => void;
}

const UploadBanner: React.FC<UploadBannerProps> = ({
  isFetchingCustomer,
  selectedCustomer,
  refetch,
}) => {
  const { uploadCustomerBanner, isUploading } = useCustomerBannerUpload();
  const [banner, setBanner] = useState<string | null>(null);

  const handleUploadBanner = async (banner: string) => {
    await uploadCustomerBanner(selectedCustomer.id, banner);
    setBanner(null);
    refetch();
  };

  const handleRemoveBanner = async () => {
    await uploadCustomerBanner(selectedCustomer.id, null);
    refetch();
  };

  return (
    <Layout>
      <Content>
        {isFetchingCustomer ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Spin />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {selectedCustomer.banner && (
              <Col span={24}>
                <Button
                  type="primary"
                  icon={<DeleteOutlined />}
                  onClick={handleRemoveBanner}
                  loading={isUploading}
                  danger
                >
                  Remove
                </Button>
              </Col>
            )}
            <Col span={24}>
              {selectedCustomer.banner && (
                <Image src={selectedCustomer.banner} width={"100%"} />
              )}
            </Col>
            <Col span={24}>
              {!banner && (
                <Card>
                  <Typography.Title level={5}>
                    Upload New Banner
                  </Typography.Title>
                  <DragDropUpload
                    handleUpload={(banner) => setBanner(banner[0] as string)}
                  />
                </Card>
              )}
            </Col>
            {banner && (
              <Col span={24}>
                <Button
                  type="primary"
                  onClick={() => handleUploadBanner(banner)}
                  loading={isUploading}
                >
                  Upload
                </Button>
              </Col>
            )}
            <Col span={24}>
              {banner && (
                <Card>
                  <Typography.Title level={5}>Preview</Typography.Title>
                  <Button
                    type="text"
                    onClick={() => setBanner(null)}
                    icon={<CloseCircleFilled />}
                    danger
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      color: "red",
                    }}
                  />
                  <Image
                    src={banner || ""}
                    style={{ width: "100%", minHeight: "200px" }}
                    preview={!isUploading}
                  />
                </Card>
              )}
            </Col>
          </Row>
        )}
      </Content>
    </Layout>
  );
};

export default UploadBanner;
