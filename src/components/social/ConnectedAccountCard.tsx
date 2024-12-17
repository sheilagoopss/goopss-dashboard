import { Card, Row, Col, Typography, Button, Popconfirm, Avatar } from "antd";
import { FacebookFilled, InstagramFilled, PinterestFilled } from "@ant-design/icons";

const ConnectedAccountCard: React.FC<{
  profilePictureUrl: string;
  pageName: string;
  userEmail: string;
  handleDisconnect: () => void;
  isUpdatingCustomer: boolean;
  platform: "facebook" | "instagram" | "pinterest";
}> = ({
  profilePictureUrl,
  pageName,
  userEmail,
  handleDisconnect,
  isUpdatingCustomer,
  platform,
}) => {
  return (
    <Card style={{ width: "fit-content" }}>
      <Row gutter={16} style={{ alignItems: "center" }}>
        <Col>
          {platform === "facebook" ? (
            <FacebookFilled style={{ fontSize: "2rem", color: "#1877F2" }} />
          ) : platform === "instagram" ? (
            <InstagramFilled style={{ fontSize: "2rem", color: "#E1306C" }} />
          ) : (
            <PinterestFilled style={{ fontSize: "2rem", color: "#E60023" }} />
          )}
        </Col>
        <Col>
          <Avatar src={profilePictureUrl} size={64} />
        </Col>
        <Col>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Typography.Text>{pageName}</Typography.Text>
            <Typography.Text type="secondary">{userEmail}</Typography.Text>
          </div>
        </Col>
        <Col>
          <Popconfirm
            title="Are you sure you want to disconnect?"
            onConfirm={handleDisconnect}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger loading={isUpdatingCustomer}>
              Disconnect
            </Button>
          </Popconfirm>
        </Col>
      </Row>
    </Card>
  );
};

export default ConnectedAccountCard;
