import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Layout, Menu, Button, Card, Avatar, Dropdown } from "antd";
import type { MenuProps } from 'antd';
import { 
  FileTextOutlined,
  HomeOutlined,
  AppstoreOutlined,
  MessageOutlined,
  TagOutlined,
  FileOutlined,
  StarOutlined,
  RocketOutlined,
  LogoutOutlined,
  UserOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import logo from '../assets/images/logo.png';
import rocket from '../assets/images/rocket.png';

const { Sider } = Layout;

interface SidebarProps {
  isAdmin: boolean;
}

type MenuItem = Required<MenuProps>['items'][number];

const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
  const { user, logout } = useAuth();
  const [homeExpanded, setHomeExpanded] = useState(false);

  const userMenuItems = [
    { 
      key: 'home',
      label: "Home",
      icon: <HomeOutlined />,
      children: [
        { key: 'my-info', label: "My Info", path: "/my-info" }
      ]
    },
    { key: 'design-hub', label: "Design Hub", icon: <AppstoreOutlined />, path: "/design-hub" },
    { key: 'listings', label: "Listings", icon: <FileTextOutlined />, path: "/listings" },
    { key: 'social', label: "Social", icon: <MessageOutlined />, path: "/social" },
  ];

  const aiTools = [
    { key: 'tagify', label: "Tagify", icon: <TagOutlined />, path: "/tagify" },
    { 
      key: 'description-hero', 
      label: "Description Hero", 
      icon: <FileOutlined />, 
      path: "/description-hero",
      comingSoon: true 
    },
    { 
      key: 'ads-recommendation', 
      label: "Ads Analysis", 
      icon: <StarOutlined />, 
      path: "/ads-recommendation",
      comingSoon: true 
    },
  ];

  const menuItems: MenuItem[] = [
    ...userMenuItems.map(item => ({
      key: item.key,
      icon: item.icon,
      label: item.children ? (
        item.label
      ) : (
        <Link to={item.path}>{item.label}</Link>
      ),
      children: item.children?.map(child => ({
        key: child.key,
        label: <Link to={child.path}>{child.label}</Link>,
      }))
    })),
    { type: 'divider' as const },
    {
      type: 'group' as const,
      label: 'AI Tools',
      children: aiTools.map(tool => ({
        key: tool.key,
        icon: tool.icon,
        label: (
          <Link to={tool.path}>
            <span style={{ position: 'relative' }}>
              {tool.label}
              {tool.comingSoon && (
                <span style={{
                  position: 'absolute',
                  top: -10,
                  right: -60,
                  background: '#FFF8E6',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  color: '#000'
                }}>
                  Coming Soon
                </span>
              )}
            </span>
          </Link>
        )
      }))
    }
  ];

  return (
    <Sider
      width={280}
      style={{ 
        background: '#fff',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        overflowY: 'auto',
      }}
    >
      <div style={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '24px 16px 0' }}>
          <img src={logo} alt="goopss logo" style={{ height: 64, marginBottom: 24 }} />
        </div>

        <Menu
          mode="inline"
          style={{ 
            borderRight: 'none',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
          items={menuItems}
        />

        <div style={{ padding: '20px 16px' }}>
          <Card
            style={{ 
              background: '#f5f5f5',
              borderRadius: 12,
              position: 'relative',
              marginBottom: 16
            }}
          >
            <div style={{ 
              position: 'absolute',
              top: -32,
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              <img src={rocket} alt="Rocket" style={{ width: 64, height: 64 }} />
            </div>
            <div style={{ 
              textAlign: 'center',
              marginTop: 24
            }}>
              <p style={{ fontWeight: 500, marginBottom: 16 }}>
                Want to accelerate your store?
              </p>
              <Button
                type="primary"
                shape="round"
                block
                style={{ 
                  background: '#141414',
                  borderColor: '#141414'
                }}
              >
                Join goopss
              </Button>
            </div>
          </Card>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            marginTop: 'auto'
          }}>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-full px-6 py-6 text-base font-medium hover:bg-zinc-900 hover:text-white group"
              style={{
                height: 'auto',
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '16px',
                padding: '24px',
                borderRadius: '9999px',
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;
