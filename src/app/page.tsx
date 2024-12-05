"use client";

import { useAuth } from "@/contexts/AuthContext";
import CustomerPage from "./customer/page";
import AdminPage from "./admin/page";
import Login from "./login/page";
import { Spin } from "antd";

export default function Home() {
  const { user, customerData, loading } = useAuth();
  return loading ? (
    <Spin fullscreen />
  ) : customerData ? (
    <CustomerPage />
  ) : user ? (
    <AdminPage />
  ) : (
    <div className="flex justify-center items-center h-screen w-full">
      <Login />
    </div>
  );
}
