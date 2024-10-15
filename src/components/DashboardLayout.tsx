import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../contexts/AuthContext";

function DashboardLayout() {
  const { isAdmin } = useAuth();

  return (
    <div style={{ display: "flex" }}>
      <Sidebar isAdmin={isAdmin} />
      <div style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;
