import { Layout, Menu } from "antd";

const { Content, Sider } = Layout;

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <Sider>
        <Menu>
          <Menu.Item>Dashboard</Menu.Item>
        </Menu>
      </Sider>
      <Content>{children}</Content>
    </Layout>
  );
}
