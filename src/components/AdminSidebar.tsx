import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  TableOutlined,
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
  const navigate = useNavigate();

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
      key: 'plan',
      icon: <PieChartOutlined />,
      label: <span>Plan</span>,
      children: [
        {
          key: '/plan',
          icon: <PieChartOutlined />,
          label: <Link to="/plan">Default View</Link>
        },
        {
          key: '/plan-simple-view',
          icon: <TableOutlined />,
          label: <Link to="/plan-simple-view">Simple View</Link>
        },
        {
          key: '/plan-task-rules',
          icon: <FormOutlined />,
          label: <Link to="/plan-task-rules">Plan Task Rules</Link>
        }
      ]
    },
    {
      key: 'customers',
      icon: <UserOutlined />,
      label: <span>Customers</span>,
      children: [
        {
          key: '/',
          icon: <UserOutlined />,
          label: <Link to="/">Customers List</Link>
        },
        {
          key: '/customer-form',
          icon: <FormOutlined />,
          label: <Link to="/customer-form">Customer Form</Link>
        },
        {
          key: "/activity-log",
          icon: <BarChartOutlined />,
          label: <Link to="/activity-log">Activity Log</Link>
        },
      ]
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
          key: '/listings',
          label: (
            <Link to="/listings">
              Optimization
            </Link>
          )
        },
        {
          key: '/listings/duplicate',
          label: (
            <Link to="/listings/duplicate">
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
          key: '/social',
          label: (
            <Link to="/social">
              Social Calendar
            </Link>
          )
        },
        {
          key: '/social-insights',
          label: (
            <Link to="/social-insights">
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
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

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
          selectedKeys={[currentPath]}
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