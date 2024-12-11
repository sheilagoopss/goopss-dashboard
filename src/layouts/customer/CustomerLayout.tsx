"use client";

import { Layout, LayoutProps, Spin } from "antd";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import CustomerSidebar from "./CustomerSidebar";
import { Suspense } from "react";

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
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen w-full">
              <Spin />
            </div>
          }
        >
          <Content className="p-4 bg-white">{children}</Content>
        </Suspense>
      </Layout>
    </ProtectedLayout>
  );
}
