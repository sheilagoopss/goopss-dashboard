import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "../contexts/AuthContext";
import { Layout } from "antd";

const { Content } = Layout;

function DashboardLayout() {
  const { isAdmin } = useAuth();

  return (
    <Layout hasSider style={{ minHeight: '100vh' }}>
      {isAdmin ? (
        <AdminSidebar isAdmin={isAdmin} />
      ) : (
        <Sidebar isAdmin={isAdmin} />
      )}
      <Layout style={{ 
        marginLeft: 280,
        background: '#fff',
        width: 'calc(100% - 280px)',
      }}>
        <Content 
          className={isAdmin ? 'admin-content' : ''}
          style={{ 
            padding: isAdmin ? "8px" : "24px",
            minHeight: '100vh',
            background: '#fff',
            maxWidth: '100%',
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default DashboardLayout;
