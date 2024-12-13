"use client";

import { Layout, LayoutProps, Spin } from "antd";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import CustomerSidebar from "./CustomerSidebar";
import { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UpgradeNotice from "@/components/common/UpgradeNotice";

const { Content } = Layout;

interface CustomerLayoutProps extends LayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({
  children,
  ...props
}: CustomerLayoutProps) {
  const { customerData } = useAuth();
  return (
    <ProtectedLayout>
      <Layout className="bg-white" {...props}>
        <CustomerSidebar />
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen w-full">
              <Spin />
            </div>
          }
        >
          <Content className="p-4 bg-white">
            {customerData?.customer_type === "Paid" ? (
              children
            ) : (
              <UpgradeNotice />
            )}
          </Content>
        </Suspense>
      </Layout>
    </ProtectedLayout>
  );
}
