import React, { useState, useEffect } from 'react';
import { 
  Layout, Typography, Card, Button, Avatar, Space, Row, Col, Tooltip 
} from 'antd';
import { 
  FileTextOutlined, 
  AppstoreOutlined, 
  MessageOutlined,
  RocketOutlined,
  LikeOutlined,
  EditOutlined,
  UnorderedListOutlined,
  MessageFilled,
  VideoCameraOutlined,
  UpOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { ICustomer } from '../types/Customer';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text } = Typography;

interface TeamMember {
  name: string;
  image: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "John Doe",
    image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop&crop=faces&q=80",
  },
  {
    name: "Jane Smith",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces&q=80",
  },
  {
    name: "David Johnson",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&q=80",
  },
  {
    name: "Emily Davis",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces&q=80",
  },
  {
    name: "Michael Wilson",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&q=80",
  },
  {
    name: "Sarah Thompson",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=faces&q=80",
  },
];

const UserHomepage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customerData, setCustomerData] = useState<ICustomer | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (user?.id) {
        const customerRef = doc(db, 'customers', user.id);
        const customerDoc = await getDoc(customerRef);
        if (customerDoc.exists()) {
          setCustomerData(customerDoc.data() as ICustomer);
        }
      }
    };

    fetchCustomerData();
  }, [user]);

  const firstName = customerData?.store_owner_name?.split(' ')[0] || 'there';

  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: '#fafafa', 
      fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, sans-serif' 
    }}>
      <Content style={{ padding: '64px 32px' }}>
        {/* Header Section */}
        <div style={{ marginBottom: 48 }}>
          <Title style={{ fontSize: 24, marginBottom: 16 }}>
            Hi {firstName} <span style={{ display: 'inline-block', animation: 'wave 2s infinite' }}>👋</span>
          </Title>
          <Title level={2} style={{ fontSize: 16, fontWeight: 'normal', color: '#666' }}>
            Here are the main things happening with your store.
          </Title>
        </div>

        {/* Cards Grid */}
        <Row gutter={[24, 24]}>
          {/* Listings Card */}
          <Col xs={24} md={8}>
            <Card
              hoverable
              style={{
                borderRadius: 48,
                background: '#FFB6E1',
                border: 'none',
                minHeight: 400,
                padding: 48,
                transition: 'all 0.3s ease',
              }}
              bodyStyle={{ 
                height: '100%', 
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <UnorderedListOutlined style={{ fontSize: 64, marginBottom: 48 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Title level={2} style={{ fontSize: 32, marginBottom: 16 }}>LISTINGS</Title>
                  <Text style={{ fontSize: 20 }}>Manage and track your Etsy listings</Text>
                </div>
                <Button
                  type="primary"
                  size="large"
                  href="/listings"
                  style={{
                    background: '#000',
                    borderRadius: 24,
                    height: 48,
                    paddingInline: 32
                  }}
                >
                  View All
                </Button>
              </div>
            </Card>
          </Col>

          {/* Design Hub Card */}
          <Col xs={24} md={8}>
            <Card
              hoverable
              style={{
                borderRadius: 48,
                background: '#809CFF',
                border: 'none',
                minHeight: 400,
                padding: 48,
                transition: 'all 0.3s ease',
              }}
              bodyStyle={{ 
                height: '100%', 
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <EditOutlined style={{ fontSize: 64, marginBottom: 48 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Title level={2} style={{ fontSize: 32, marginBottom: 16 }}>DESIGN HUB</Title>
                  <Text style={{ fontSize: 20 }}>Create and manage your designs</Text>
                </div>
                <Button
                  type="primary"
                  size="large"
                  href="/design-hub"
                  style={{
                    background: '#000',
                    borderRadius: 24,
                    height: 48,
                    paddingInline: 32
                  }}
                >
                  View All
                </Button>
              </div>
            </Card>
          </Col>

          {/* Social Card */}
          <Col xs={24} md={8}>
            <Card
              hoverable
              style={{
                borderRadius: 48,
                background: '#98FF98',
                border: 'none',
                minHeight: 400,
                padding: 48,
                transition: 'all 0.3s ease',
              }}
              bodyStyle={{ 
                height: '100%', 
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <LikeOutlined style={{ fontSize: 64, marginBottom: 48 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Title level={2} style={{ fontSize: 32, marginBottom: 16 }}>SOCIAL</Title>
                  <Text style={{ fontSize: 20 }}>Manage your social presence</Text>
                </div>
                <Button
                  type="primary"
                  size="large"
                  href="/social"
                  style={{
                    background: '#000',
                    borderRadius: 24,
                    height: 48,
                    paddingInline: 32
                  }}
                >
                  View All
                </Button>
              </div>
            </Card>
          </Col>

          {/* Help Section */}
          <Col span={24}>
            <Card
              style={{
                borderRadius: 48,
                background: '#c8ff80',
                border: 'none',
                padding: 40
              }}
            >
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={1} style={{ fontSize: 48, marginBottom: 8 }}>
                    NEED A HAND?
                  </Title>
                  <Text style={{ fontSize: 20, maxWidth: 600, display: 'block', marginBottom: 32 }}>
                    Our expert team is ready to assist you with any questions or challenges you might have.
                  </Text>
                  <Avatar.Group
                    maxCount={6}
                    size={64}
                    maxStyle={{ color: '#000', backgroundColor: '#fff' }}
                  >
                    {teamMembers.map((member) => (
                      <Avatar
                        key={member.name}
                        src={member.image}
                        style={{ border: '2px solid white' }}
                      />
                    ))}
                  </Avatar.Group>
                </Col>
                <Col>
                  <Space direction="vertical">
                    <Button
                      type="primary"
                      size="large"
                      icon={isExpanded ? <UpOutlined /> : undefined}
                      onClick={() => setIsExpanded(!isExpanded)}
                      style={{
                        background: '#000',
                        height: 56,
                        borderRadius: 28,
                        paddingInline: 32,
                        fontSize: 18
                      }}
                    >
                      {isExpanded ? 'CLOSE' : 'GET HELP NOW'}
                    </Button>
                    {isExpanded && (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button
                          type="primary"
                          icon={<MessageFilled />}
                          size="large"
                          style={{
                            background: '#000',
                            borderRadius: 28,
                            width: '100%'
                          }}
                        >
                          Chat with team
                        </Button>
                        <Button
                          type="primary"
                          icon={<VideoCameraOutlined />}
                          size="large"
                          onClick={() => navigate('/meeting-booking')}
                          style={{
                            background: '#000',
                            borderRadius: 28,
                            width: '100%'
                          }}
                        >
                          Book a Zoom call
                        </Button>
                      </Space>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Content>

      <style>
        {`
          @keyframes wave {
            0% { transform: rotate(0deg); }
            20% { transform: rotate(14deg); }
            40% { transform: rotate(-8deg); }
            60% { transform: rotate(14deg); }
            80% { transform: rotate(-4deg); }
            100% { transform: rotate(10deg); }
          }
        `}
      </style>
    </Layout>
  );
};

export default UserHomepage; 