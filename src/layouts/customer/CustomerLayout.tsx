"use client";

import { Layout, LayoutProps } from "antd";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import CustomerSidebar from "./CustomerSidebar";

const { Content } = Layout;

interface CustomerLayoutProps extends LayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({
  children,
  ...props
}: CustomerLayoutProps) {
  return (
    <ProtectedLayout>
      <Layout className="bg-white" {...props}>
        <CustomerSidebar />
        <Content className="p-4 bg-white">{children}</Content>
      </Layout>
    </ProtectedLayout>
  );
}
