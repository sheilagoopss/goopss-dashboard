import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, Typography, Card, Input, Space, Tooltip, Popover 
} from 'antd';
import { 
  DollarOutlined,
  InfoCircleOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;

const ROASCalculator: React.FC = () => {
  const [income, setIncome] = useState<number>(100);
  const [productCost, setProductCost] = useState<number>(70);
  const [maxAdCost, setMaxAdCost] = useState<number>(0);
  const [minRoas, setMinRoas] = useState<number>(0);

  useEffect(() => {
    const newMaxAdCost = income - productCost;
    setMaxAdCost(newMaxAdCost > 0 ? newMaxAdCost : 0);
    setMinRoas(newMaxAdCost > 0 ? income / newMaxAdCost : 0);
  }, [income, productCost]);

  return (
    <Layout style={{ minHeight: '100vh', background: 'white', padding: '16px' }}>
      <Content style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Card
          style={{
            borderRadius: 32,
            border: 'none',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)'
          }}
          bodyStyle={{ padding: 40 }}
        >
          <Space direction="vertical" size={40} style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ marginBottom: 8 }}>ROAS Calculator</Title>
              <Text type="secondary">Calculate your minimum profitable ROAS</Text>
            </div>

            {/* Income Input */}
            <div>
              <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 12 }}>
                Income (Revenue)
              </Text>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#7CD4CC',  // Colored circle background
                  width: 40,  // Bigger circle
                  height: 40,  // Bigger circle
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}>
                  <DollarOutlined 
                    style={{ 
                      fontSize: 24,  // Bigger icon
                      color: 'white'  // White icon
                    }} 
                  />
                </div>
                <Input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  style={{
                    height: 64,
                    paddingLeft: 72,  // Increased padding for bigger circle
                    fontSize: 20,
                    borderRadius: 16,
                    backgroundColor: '#f5f5f5'
                  }}
                  suffix={
                    <Space direction="vertical" size={0}>
                      <UpOutlined 
                        onClick={() => setIncome(prev => prev + 1)}
                        style={{ cursor: 'pointer', color: '#999' }}
                      />
                      <DownOutlined 
                        onClick={() => setIncome(prev => prev - 1)}
                        style={{ cursor: 'pointer', color: '#999' }}
                      />
                    </Space>
                  }
                />
              </div>
              <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                Total cost to the customer
              </Text>
            </div>

            {/* Product Cost Input */}
            <div>
              <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 12 }}>
                Product Cost
              </Text>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#FFB6C1',  // Different color for product cost
                  width: 40,  // Bigger circle
                  height: 40,  // Bigger circle
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}>
                  <DollarOutlined 
                    style={{ 
                      fontSize: 24,  // Bigger icon
                      color: 'white'  // White icon
                    }} 
                  />
                </div>
                <Input
                  type="number"
                  value={productCost}
                  onChange={(e) => setProductCost(Number(e.target.value))}
                  style={{
                    height: 64,
                    paddingLeft: 72,  // Increased padding for bigger circle
                    fontSize: 20,
                    borderRadius: 16,
                    backgroundColor: '#f5f5f5'
                  }}
                  suffix={
                    <Space direction="vertical" size={0}>
                      <UpOutlined 
                        onClick={() => setProductCost(prev => prev + 1)}
                        style={{ cursor: 'pointer', color: '#999' }}
                      />
                      <DownOutlined 
                        onClick={() => setProductCost(prev => prev - 1)}
                        style={{ cursor: 'pointer', color: '#999' }}
                      />
                    </Space>
                  }
                />
              </div>
              <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                Your cost including shipping and processing fees
              </Text>
            </div>

            {/* Results Section */}
            <Card style={{ background: '#f5f5f5', borderRadius: 24, padding: 32 }}>
              <Space direction="vertical" size={32} style={{ width: '100%' }}>
                {/* Max Ad Spend */}
                <Card style={{ borderRadius: 16 }}>
                  <Title level={4} style={{ marginBottom: 8 }}>Maximum Ad Spend</Title>
                  <Title style={{ color: '#7CD4CC', margin: 0 }}>${maxAdCost.toFixed(2)}</Title>
                  <Text type="secondary">Maximum amount you can spend on ads per product</Text>
                </Card>

                {/* Min ROAS */}
                <Card style={{ borderRadius: 16 }}>
                  <Space align="center">
                    <Title level={4} style={{ marginBottom: 8 }}>Minimum ROAS</Title>
                    <Popover
                      content={
                        <div style={{ maxWidth: 400 }}>
                          <Space direction="vertical" size={16}>
                            <Text>
                              ROAS (Return on Ad Spend) varies by product. Here's an example of different products and their ROAS performance:
                            </Text>
                            <div style={{ 
                              background: '#f5f5f5', 
                              padding: 16, 
                              borderRadius: 8 
                            }}>
                              <ul style={{ paddingLeft: 20 }}>
                                <li>Low-margin products: 3-4x ROAS</li>
                                <li>Mid-margin products: 2-3x ROAS</li>
                                <li>High-margin products: 1.5-2x ROAS</li>
                              </ul>
                            </div>
                            <Text>
                              Higher ROAS means better ad performance. Aim for a ROAS above your minimum to ensure profitability.
                            </Text>
                          </Space>
                        </div>
                      }
                      trigger="hover"
                      placement="right"
                    >
                      <InfoCircleOutlined style={{ marginLeft: 8, color: '#999' }} />
                    </Popover>
                  </Space>
                  <Title style={{ color: '#FFB6C1', margin: 0 }}>{minRoas.toFixed(2)}x</Title>
                  <Text>
                    For every $1 spent on ads, you need to make ${minRoas.toFixed(2)} to break even.
                  </Text>
                </Card>
              </Space>
            </Card>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default ROASCalculator; 