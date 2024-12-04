"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { Layout } from "antd";
import Sider from "antd/es/layout/Sider";

const { Content } = Layout;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout className="bg-white">
      <Sider width={"35ch"} style={{ backgroundColor: "#fff" }}>
        <AdminSidebar />
      </Sider>
      <Content style={{ padding: "2ch" }}>{children}</Content>
    </Layout>
  );
}
