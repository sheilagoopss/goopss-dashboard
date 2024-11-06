import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Layout, Menu } from "antd";
import type { MenuProps } from 'antd';
import { 
  UserOutlined,
  LogoutOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  MessageOutlined,
  StarOutlined,
  ProjectOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  InstagramOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { ChevronDown } from 'lucide-react';
import logo from '../assets/images/logo.png';

const { Sider } = Layout;

interface AdminSidebarProps {
  isAdmin: boolean;
}

type MenuItem = Required<MenuProps>['items'][number];

const AdminSidebar: React.FC<AdminSidebarProps> = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const [socialExpanded, setSocialExpanded] = useState(() => {
    const saved = localStorage.getItem('adminSocialExpanded');
    return saved ? JSON.parse(saved) : currentPath === 'social' || currentPath === 'social-insights';
  });

  useEffect(() => {
    if (currentPath === 'social' || currentPath === 'social-insights') {
      setSocialExpanded(true);
    }
  }, [currentPath]);

  React.useEffect(() => {
    localStorage.setItem('adminSocialExpanded', JSON.stringify(socialExpanded));
  }, [socialExpanded]);

  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('adminOpenKeys');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('adminOpenKeys', JSON.stringify(openKeys));
  }, [openKeys]);

  const adminMenuItems: MenuItem[] = [
    {
      key: 'customers',
      icon: <UserOutlined />,
      label: <Link to="/">Customers</Link>,
    },
    {
      key: 'customer-form',
      icon: <FormOutlined />,
      label: <Link to="/customer-form">Customer Form</Link>,
    },
    {
      key: 'design-hub',
      icon: <AppstoreOutlined />,
      label: <Link to="/design-hub">Design Hub</Link>,
    },
    {
      key: 'listings',
      icon: <FileTextOutlined />,
      label: 'Listings',
      children: [
        {
          key: 'listings-optimization',
          label: (
            <Link to="/listings" style={{ paddingLeft: '32px' }}>
              Optimization
            </Link>
          )
        },
        {
          key: 'listings-duplication',
          label: (
            <Link to="/listings/duplicate" style={{ paddingLeft: '32px' }}>
              Duplication
            </Link>
          )
        }
      ]
    },
    {
      key: 'social',
      icon: <MessageOutlined />,
      label: 'Social',
      children: [
        {
          key: 'social-main',
          label: (
            <Link to="/social" style={{ paddingLeft: '32px' }}>
              Social Calendar
            </Link>
          )
        },
        {
          key: 'social-insights',
          label: (
            <Link to="/social-insights" style={{ paddingLeft: '32px' }}>
              Social Media Insights
            </Link>
          )
        }
      ]
    },
    {
      key: 'pinterest',
      icon: <InstagramOutlined />,
      label: <Link to="/pinterest">Pinterest</Link>,
    },
    {
      key: 'ads-recommendation',
      icon: <StarOutlined />,
      label: <Link to="/ads-recommendation">Ads Analysis</Link>,
    },
    {
      key: 'store-analysis',
      icon: <BarChartOutlined />,
      label: <Link to="/store-analysis">Store Analysis</Link>,
    },
    {
      key: 'stats',
      icon: <LineChartOutlined />,
      label: <Link to="/stats">Stats</Link>,
    },
    {
      key: 'tasks',
      icon: <ProjectOutlined />,
      label: <Link to="/tasks">Tasks Summary</Link>,
    },
    {
      key: 'plan',
      icon: <PieChartOutlined />,
      label: <Link to="/plan">Plan</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  const getSelectedKey = (path: string) => {
    if (path.startsWith('/listings/duplicate')) return 'listings-duplication';
    if (path.startsWith('/listings')) return 'listings-optimization';
    if (path === '/social') return 'social-main';
    if (path === '/social-insights') return 'social-insights';
    return path.split('/')[1] || 'customers';
  };

  return (
    <Sider 
      width={280}
      style={{ 
        background: '#fff',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        height: '100vh',
      }}
    >
      <div style={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}>
        <div style={{ 
          padding: '16px', 
          textAlign: 'center',
          flexShrink: 0
        }}>
          <img src={logo} alt="goopss logo" style={{ height: 40 }} />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey(currentPath)]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          style={{ 
            borderRight: 0,
            padding: '8px',
            height: 'auto',
            minHeight: 0,
            flexGrow: 1,
            overflow: 'visible'
          }}
          items={adminMenuItems}
          className="admin-sidebar-menu"
        />
      </div>
    </Sider>
  );
};

export default AdminSidebar;