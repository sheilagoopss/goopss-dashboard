import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  isAdmin: boolean;
}

function DashboardLayout({ isAdmin }: DashboardLayoutProps) {
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