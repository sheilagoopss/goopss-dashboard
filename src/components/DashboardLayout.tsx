import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';  // Add this import

function DashboardLayout() {
  const { isAdmin } = useAuth();  // Get isAdmin from AuthContext

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={isAdmin} />
      <div style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;