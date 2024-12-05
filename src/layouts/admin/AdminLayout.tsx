"use client";

import AdminSidebar from "@/layouts/admin/AdminSidebar";
import { Layout } from "antd";
import ProtectedLayout from "@/layouts/ProtectedLayout";

const { Content } = Layout;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      <Layout className="bg-white">
        <AdminSidebar />
        <Content style={{ padding: "2ch" }}>{children}</Content>
      </Layout>
    </ProtectedLayout>
  );
}
