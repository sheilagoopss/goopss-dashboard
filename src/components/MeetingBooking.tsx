import React, { useState, useEffect } from 'react';
import { 
  Layout, Typography, Card, Button, Space, Row, Col 
} from 'antd';
import { 
  VideoCameraOutlined,
  LeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const MeetingBooking: React.FC = () => {
  const navigate = useNavigate();
  const [isCalendlyLoaded, setIsCalendlyLoaded] = useState(false);

  useEffect(() => {
    // Load Calendly widget script
    const script = document.createElement('script');
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => setIsCalendlyLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: '#fafafa', 
      fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, sans-serif' 
    }}>
      <Content style={{ padding: '64px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ marginBottom: 48 }}>
          <Title style={{ fontSize: 24, marginBottom: 16 }}>
            Book a Zoom Call <span style={{ display: 'inline-block', animation: 'wave 2s infinite' }}>📅</span>
          </Title>
          <Title level={2} style={{ fontSize: 16, fontWeight: 'normal', color: '#666' }}>
            Schedule a Meeting with Our Etsy Experts.
          </Title>
        </div>

        {/* Main Content */}
        <Row gutter={[24, 24]}>
          {/* Calendar Section */}
          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: 48,
                background: '#809CFF',
                border: 'none',
                transition: 'all 0.3s ease',
              }}
              bodyStyle={{ padding: 32 }}
            >
              <Title level={3} style={{ marginBottom: 24, color: '#000' }}>
                Select a Time
              </Title>
              <div 
                className="calendly-inline-widget" 
                data-url="https://calendly.com/goopss-team/tools-connection" 
                style={{ minWidth: '320px', height: '700px' }}
              />
            </Card>
          </Col>

          {/* Info Cards Section */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              {/* Why Book a Call Card */}
              <Card
                style={{
                  borderRadius: 48,
                  background: '#FFB6E1',
                  border: 'none',
                  transition: 'all 0.3s ease',
                }}
                bodyStyle={{ padding: 32 }}
              >
                <Title level={3} style={{ marginBottom: 16 }}>Why Book a Call?</Title>
                <ul style={{ 
                  listStyleType: 'disc', 
                  paddingLeft: 20,
                  fontSize: 18,
                  lineHeight: '1.6'
                }}>
                  <li>Discuss your specific needs</li>
                  <li>Get expert advice</li>
                  <li>Learn about our services</li>
                  <li>Ask any questions you have</li>
                </ul>
              </Card>

              {/* What to Expect Card */}
              <Card
                style={{
                  borderRadius: 48,
                  background: '#98FF98',
                  border: 'none',
                  transition: 'all 0.3s ease',
                }}
                bodyStyle={{ padding: 32 }}
              >
                <Title level={3} style={{ marginBottom: 16 }}>What to Expect</Title>
                <Paragraph style={{ fontSize: 18 }}>
                  Our team will guide you through our services, answer your questions, and help you determine the best solution for your needs. The call typically lasts about 30 minutes.
                </Paragraph>
              </Card>

              {/* Back Button */}
              <Button
                type="primary"
                icon={<LeftOutlined />}
                size="large"
                onClick={() => navigate(-1)}
                style={{
                  width: '100%',
                  height: 'auto',
                  padding: '24px',
                  fontSize: 20,
                  fontWeight: 600,
                  background: '#000',
                  borderRadius: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Back to Dashboard
              </Button>
            </Space>
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

export default MeetingBooking; 