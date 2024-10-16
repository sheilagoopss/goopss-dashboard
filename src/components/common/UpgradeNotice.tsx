import React from "react";
import { Card, Typography, Layout } from "antd";

const { Title, Paragraph } = Typography;
const { Content } = Layout;

export default function UpgradeNotice() {
  return (
    <Layout style={{ backgroundColor: "white" }}>
      <Content
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "4ch",
        }}
      >
        <Card
          style={{ width: 300, textAlign: "center" }}
          cover={
            <div style={{ background: "gray", padding: "20px 0" }}>
              <Title level={3} style={{ color: "white", margin: 0 }}>
                Upgrade Required
              </Title>
            </div>
          }
        >
          <Paragraph>
            To access this feature, you need to upgrade your account.
          </Paragraph>
        </Card>
      </Content>
    </Layout>
  );
}
