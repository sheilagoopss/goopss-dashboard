import React, { useState, useEffect } from 'react';
import { Card, Typography, Form, Input, Layout, Menu, Space, Alert } from 'antd';
import { PinterestOutlined, FacebookOutlined, InstagramOutlined } from '@ant-design/icons';
import CustomersDropdown from '../CustomersDropdown';
import { ICustomer } from '../../types/Customer';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const { Title } = Typography;
const { Content, Sider } = Layout;
const { TextArea } = Input;

interface SocialInsightsProps {
  customerId: string;
  isAdmin: boolean;
}

const SocialInsights: React.FC<SocialInsightsProps> = ({ customerId, isAdmin }) => {
  const [form] = Form.useForm();
  const [currentSection, setCurrentSection] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch customers for admin
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!isAdmin) return;
      try {
        const customersCollection = collection(db, "customers");
        const customersSnapshot = await getDocs(customersCollection);
        const customersList = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ICustomer[];
        setCustomers(customersList);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, [isAdmin]);

  const effectiveCustomerId = isAdmin ? selectedCustomer?.id || '' : customerId;

  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!effectiveCustomerId) return;

      try {
        const customerDoc = await getDoc(doc(db, 'customers', effectiveCustomerId));
        if (customerDoc.exists()) {
          const data = customerDoc.data();
          form.setFieldsValue({
            pinterestField: data.pinterestField || '',
            facebookField: data.facebookField || '',
            instagramField: data.instagramField || '',
          });
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
        setError('Failed to load customer data');
      }
    };

    fetchCustomerData();
  }, [effectiveCustomerId, form]);

  const sections = [
    {
      title: 'Pinterest',
      icon: <PinterestOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form.Item 
            name="pinterestField" 
            label="Pinterest Field"
          >
            <TextArea rows={4} disabled={!isAdmin} />
          </Form.Item>
        </Space>
      )
    },
    {
      title: 'Facebook',
      icon: <FacebookOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form.Item 
            name="facebookField" 
            label="Facebook Field"
          >
            <TextArea rows={4} disabled={!isAdmin} />
          </Form.Item>
        </Space>
      )
    },
    {
      title: 'Instagram',
      icon: <InstagramOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form.Item 
            name="instagramField" 
            label="Instagram Field"
          >
            <TextArea rows={4} disabled={!isAdmin} />
          </Form.Item>
        </Space>
      )
    }
  ];

  return (
    <Card>
      {isAdmin && (
        <div style={{ 
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <div style={{ width: '300px' }}>
            <CustomersDropdown
              customers={customers}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              isAdmin={true}
            />
          </div>
        </div>
      )}

      {isAdmin && !selectedCustomer ? (
        <Alert
          message="Please select a customer"
          description="Use the dropdown above to select a customer and view their social insights."
          type="info"
          showIcon
        />
      ) : (
        <>
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

          <Title level={2} style={{ marginBottom: '3rem' }}>Social Media Insights</Title>

          <div style={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>
            <Layout style={{ 
              background: 'transparent', 
              minHeight: '100%',
              marginTop: '24px'  // Add top margin to layout
            }}>
              <Sider 
                theme="light" 
                width={250}
                style={{ 
                  background: 'transparent',
                  overflow: 'hidden',
                  marginRight: '24px'  // Add right margin to sider
                }}
              >
                <Menu
                  mode="inline"
                  selectedKeys={[currentSection.toString()]}
                  style={{ 
                    border: 'none',
                    width: '100%',
                    overflowX: 'hidden'
                  }}
                  items={sections.map((section, index) => ({
                    key: index.toString(),
                    icon: section.icon,
                    label: section.title,
                    onClick: () => setCurrentSection(index)
                  }))}
                />
              </Sider>

              <Content style={{ padding: '0 24px' }}>
                <Form
                  form={form}
                  layout="vertical"
                  style={{ maxWidth: 800 }}
                >
                  {sections[currentSection].content}
                </Form>
              </Content>
            </Layout>
          </div>
        </>
      )}
    </Card>
  );
};

export default SocialInsights; 