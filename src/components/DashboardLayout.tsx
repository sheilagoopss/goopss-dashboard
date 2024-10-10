import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

interface DashboardLayoutProps {
  openLoginModal: () => void;
}

function DashboardLayout({ openLoginModal }: DashboardLayoutProps) {
  const { isAdmin } = useAuth();

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={isAdmin} openLoginModal={openLoginModal} />
      <div style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;