import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Layout, Menu } from "antd";
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
} from '@ant-design/icons';
import logo from '../assets/images/logo.png';

const { Sider } = Layout;

interface AdminSidebarProps {
  isAdmin: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || 'customers';

  const items = [
    {
      key: 'customers',
      icon: <UserOutlined />,
      label: <Link to="/">Customers</Link>,
    },
    {
      key: 'design-hub',
      icon: <AppstoreOutlined />,
      label: <Link to="/design-hub">Design Hub</Link>,
    },
    {
      key: 'listings',
      icon: <FileTextOutlined />,
      label: <Link to="/listings">Listings</Link>,
    },
    {
      key: 'social',
      icon: <MessageOutlined />,
      label: <Link to="/social">Social</Link>,
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

  return (
    <Sider 
      width={200} 
      style={{ 
        background: '#fff',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        height: '100vh',
        overflowY: 'auto'
      }}
    >
      <div style={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <img src={logo} alt="goopss logo" style={{ height: 40 }} />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentPath]}
          style={{ 
            height: '100%', 
            borderRight: 0,
            flex: 1
          }}
          items={items}
        />
      </div>
    </Sider>
  );
};

export default AdminSidebar;