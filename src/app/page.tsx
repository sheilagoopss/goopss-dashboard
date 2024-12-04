"use client";

import { useAuth } from "@/contexts/AuthContext";
import CustomerLayout from "./customer/layout";
import CustomerPage from "./customer/page";
import AdminPage from "./admin/page";
import Login from "./login/page";
import { Spin } from "antd";
import AdminLayout from "./admin/layout";

export default function Home() {
  const { user, customerData, loading } = useAuth();
  return loading ? (
    <Spin fullscreen />
  ) : customerData ? (
    <CustomerLayout>
      <CustomerPage />
    </CustomerLayout>
  ) : user ? (
    <AdminLayout>
      <AdminPage />
    </AdminLayout>
  ) : (
    <div className="flex justify-center items-center h-screen w-full">
      <Login />
    </div>
  );
}
