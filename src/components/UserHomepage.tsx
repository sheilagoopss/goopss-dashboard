import React, { useState } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh', background: '#fafafa' }}>
      <Content style={{ padding: '64px 32px' }}>
        {/* Header Section */}
        <div style={{ marginBottom: 48 }}>
          <Title style={{ fontSize: 48, marginBottom: 16 }}>
            Hi Erez <span style={{ display: 'inline-block', animation: 'wave 2s infinite' }}>👋</span>
          </Title>
          <Title level={2} style={{ fontWeight: 'normal', color: '#666' }}>
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
                minHeight: 480,
                padding: 48,
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
              }}
              bodyStyle={{ height: '100%', padding: 0 }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                alignItems: 'center'
              }}>
                <UnorderedListOutlined style={{ fontSize: 128, marginBottom: 48 }} />
                <div style={{ flex: 1 }}>
                  <Title level={2} style={{ fontSize: 32, marginBottom: 16 }}>LISTINGS</Title>
                  <Text style={{ fontSize: 20 }}>Track your product listings and performance</Text>
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
                minHeight: 480,
                padding: 48,
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
              }}
              bodyStyle={{ height: '100%', padding: 0 }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                alignItems: 'center'
              }}>
                <EditOutlined style={{ fontSize: 128, marginBottom: 48 }} />
                <div style={{ flex: 1 }}>
                  <Title level={2} style={{ fontSize: 32, marginBottom: 16 }}>DESIGN HUB</Title>
                  <Text style={{ fontSize: 20 }}>Access your design assets and templates</Text>
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
                minHeight: 480,
                padding: 48,
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
              }}
              bodyStyle={{ height: '100%', padding: 0 }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                alignItems: 'center'
              }}>
                <LikeOutlined style={{ fontSize: 128, marginBottom: 48 }} />
                <div style={{ flex: 1 }}>
                  <Title level={2} style={{ fontSize: 32, marginBottom: 16 }}>SOCIAL</Title>
                  <Text style={{ fontSize: 20 }}>Manage your social media presence</Text>
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