import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Layout, Menu, Button, Card, Dropdown } from "antd";
import { 
  FileText,
  Home,
  LayoutGrid,
  MessageSquare,
  Tag,
  FileEdit,
  Sparkles,
  MoreVertical,
  ChevronDown
} from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import logo from '../assets/images/logo.png';
import rocket from '../assets/images/rocket.png';

const { Sider } = Layout;

interface SidebarProps {
  isAdmin: boolean;
}

interface CustomerData {
  logo: string;
  store_name: string;
  store_owner_name: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
  const { user, logout } = useAuth();
  const [homeExpanded, setHomeExpanded] = useState(() => {
    const saved = localStorage.getItem('homeExpanded');
    return saved ? JSON.parse(saved) : false;
  });
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!user?.id) return;
      try {
        const q = query(
          collection(db, "customers"),
          where("customer_id", "==", user.id)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data() as CustomerData;
          setCustomerData(data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      }
    };

    fetchCustomerData();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('homeExpanded', JSON.stringify(homeExpanded));
  }, [homeExpanded]);

  const menuItems = [
    {
      key: 'home',
      icon: <Home className="h-6 w-6" />,
      label: (
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setHomeExpanded(!homeExpanded);
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
        >
          <span>Home</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${homeExpanded ? 'rotate-180' : ''}`} />
        </div>
      ),
    },
    ...(homeExpanded ? [{
      key: 'my-info',
      label: (
        <div
          onClick={(e) => {
            e.stopPropagation();
            navigate('/my-info');
          }}
          style={{ cursor: 'pointer', paddingLeft: '32px' }}
        >
          My Info
        </div>
      )
    }] : []),
    {
      key: 'design-hub',
      icon: <LayoutGrid className="h-6 w-6" />,
      label: <Link to="/design-hub">Design Hub</Link>
    },
    {
      key: 'listings',
      icon: <FileText className="h-6 w-6" />,
      label: <Link to="/listings">Listings</Link>
    },
    {
      key: 'social',
      icon: <MessageSquare className="h-6 w-6" />,
      label: <Link to="/social">Social</Link>
    },
    {
      key: 'ai-tools',
      type: 'group' as const,
      label: 'AI Tools',
      children: [
        {
          key: 'tagify',
          icon: <Tag className="h-6 w-6" />,
          label: <Link to="/tagify">Tagify</Link>
        },
        {
          key: 'description-hero',
          icon: <FileEdit className="h-6 w-6" />,
          label: (
            <div style={{ position: 'relative', width: '100%' }}>
              <Link to="/description-hero">Description Hero</Link>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
          )
        },
        {
          key: 'ads-recommendation',
          icon: <Sparkles className="h-6 w-6" />,
          label: (
            <div style={{ position: 'relative', width: '100%' }}>
              <Link to="/ads-recommendation">Ads Analysis</Link>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
          )
        }
      ]
    }
  ];

  const dropdownItems = [
    { key: 'help', label: 'Help' },
    { key: 'signout', label: 'Sign out', onClick: logout }
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
        overflowY: 'visible',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <div style={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible'
      }}>
        <div style={{ padding: '4px 24px 0' }}>
          <img src={logo} alt="goopss logo" style={{ height: 64, marginBottom: 0 }} />
        </div>

        <Menu
          mode="inline"
          style={{ 
            borderRight: 'none',
            flex: 1,
            overflow: 'visible',
            position: 'relative',
            paddingTop: 0
          }}
          items={menuItems}
        />

        <div style={{ padding: '8px 16px' }}>
          <Card
            style={{ 
              background: '#f5f5f5',
              borderRadius: 12,
              position: 'relative',
              marginBottom: 8
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
              <p style={{ 
                fontWeight: 500, 
                marginBottom: 16,
                fontSize: '14px'
              }}>
                Want to accelerate your store?
              </p>
              <Button
                type="primary"
                block
                style={{ 
                  background: '#141414',
                  borderColor: '#141414',
                  borderRadius: '9999px',
                  height: 'auto',
                  padding: '8px 0'
                }}
              >
                Join goopss
              </Button>
            </div>
          </Card>
        </div>

        <div style={{ 
          borderTop: '1px solid #f0f0f0',
          padding: '8px',
          marginTop: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <img
              src={customerData?.logo || logo}
              alt="Store logo"
              style={{
                height: '48px',
                width: '48px',
                borderRadius: '50%',
                padding: '8px'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ 
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#000'
                  }}>
                    {customerData?.store_name || 'Goopss Store'}
                  </span>
                  <span style={{ 
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    {customerData?.store_owner_name || 'Frankie Sullivan'}
                  </span>
                </div>
                <Dropdown
                  menu={{ items: dropdownItems }}
                  placement="topRight"
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    icon={<MoreVertical size={20} />}
                    style={{ 
                      border: 'none',
                      width: '36px',
                      height: '36px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  />
                </Dropdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;
