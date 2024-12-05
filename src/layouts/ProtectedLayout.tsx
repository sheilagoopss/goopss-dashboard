"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Spin } from "antd";
import { redirect } from "next/navigation";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, customerData, loading } = useAuth();

  if (loading) {
    return <Spin fullscreen />;
  }

  if (!user && !customerData && !loading) {
    return redirect("/");
  }

  return <>{children}</>;
};

export default ProtectedLayout;
