import React, { useState, useEffect } from 'react';
import { Card, Typography, Form, Input, Layout, Menu, Space, Alert, message, Divider, Row, Col, Button } from 'antd';
import { PinterestOutlined, FacebookOutlined, InstagramOutlined } from '@ant-design/icons';
import CustomersDropdown from '../CustomersDropdown';
import { ICustomer } from '../../types/Customer';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const { Title } = Typography;
const { Content, Sider } = Layout;
const { TextArea } = Input;

interface SocialInsightsProps {
  customerId: string;
  isAdmin: boolean;
}

const convertLinksToClickable = (text: string) => {
  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  
  // Split text by URLs and map through parts
  const parts = text.split(urlPattern);
  
  return parts.map((part, index) => {
    // Check if part matches URL pattern
    if (part.match(urlPattern)) {
      return (
        <a 
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            color: '#1890ff',
            textDecoration: 'underline',
            wordBreak: 'break-all'
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const SocialInsights: React.FC<SocialInsightsProps> = ({ customerId, isAdmin }) => {
  const [form] = Form.useForm();
  const [currentSection, setCurrentSection] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

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
            pinterestField: data.pinterest_shared_boards_goopss || '',
            facebookField: data.facebook_groups_goopss || '',
            instagramField: data.instagram_hashtags_goopss || '',
          });
          setIsDataLoaded(true);
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
      title: 'Pinterest Shared Boards',
      icon: <PinterestOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {isAdmin ? (
            <Form.Item 
              name="pinterestField" 
              label={
                <div style={{ marginBottom: '12px' }}>
                  We've found 10 relevant Pinterest group boards, increasing your exposure to thousands of potential customers. We've selected these boards because they are relevant to your niche, have active members, and are easy to join. This combination maximizes your exposure and potential for engagement. We will join these boards.
                </div>
              }
              style={{ marginBottom: 0 }}
            >
              <TextArea rows={15} />
            </Form.Item>
          ) : (
            <div>
              <div style={{ marginBottom: '12px', fontWeight: 500 }}>
                We've found 10 relevant Pinterest group boards, increasing your exposure to thousands of potential customers. We've selected these boards because they are relevant to your niche, have active members, and are easy to join. This combination maximizes your exposure and potential for engagement. We will join these boards.
              </div>
              <div style={{ 
                whiteSpace: 'pre-wrap',
                padding: '16px',
                background: '#f5f5f5',
                borderRadius: '8px',
                minHeight: '300px',
                lineHeight: '1.8'
              }}>
                {isDataLoaded && convertLinksToClickable(form.getFieldValue('pinterestField') || '')}
              </div>
            </div>
          )}
        </Space>
      )
    },
    {
      title: 'Facebook Groups',
      icon: <FacebookOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {isAdmin ? (
            <Form.Item 
              name="facebookField" 
              label={
                <div style={{ marginBottom: '12px' }}>
                  We've found 5 relevant Facebook shared boards, increasing your exposure to thousands of potential customers.
                </div>
              }
            >
              <TextArea rows={10} />
            </Form.Item>
          ) : (
            <div>
              <div style={{ marginBottom: '12px', fontWeight: 500 }}>
                We've found 5 relevant Facebook shared boards, increasing your exposure to thousands of potential customers.
              </div>
              <div style={{ 
                whiteSpace: 'pre-wrap',
                padding: '16px',
                background: '#f5f5f5',
                borderRadius: '8px',
                minHeight: '200px',
                lineHeight: '1.8'
              }}>
                {isDataLoaded && convertLinksToClickable(form.getFieldValue('facebookField') || '')}
              </div>
            </div>
          )}
        </Space>
      )
    },
    {
      title: 'Instagram Hashtags',
      icon: <InstagramOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {isAdmin ? (
            <Form.Item 
              name="instagramField" 
              label={
                <div style={{ marginBottom: '12px' }}>
                  We've researched and compiled a list of popular hashtags relevant to your products. Using these hashtags will help people discover your content on Instagram and expand your reach. We will use these hashtags when creating new posts.
                </div>
              }
            >
              <TextArea rows={4} />
            </Form.Item>
          ) : (
            <div>
              <div style={{ marginBottom: '12px', fontWeight: 500 }}>
                We've researched and compiled a list of popular hashtags relevant to your products. Using these hashtags will help people discover your content on Instagram and expand your reach. We will use these hashtags when creating new posts.
              </div>
              <div style={{ 
                whiteSpace: 'pre-wrap',
                padding: '16px',
                background: '#f5f5f5',
                borderRadius: '8px',
                minHeight: '100px'
              }}>
                {isDataLoaded ? form.getFieldValue('instagramField') : ''}
              </div>
            </div>
          )}
        </Space>
      )
    }
  ];

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      if (!effectiveCustomerId) {
        setError('No customer selected');
        return;
      }

      const customerRef = doc(db, 'customers', effectiveCustomerId);
      
      const docSnap = await getDoc(customerRef);
      if (!docSnap.exists()) {
        setError('Customer document not found');
        return;
      }

      const updateData = {
        pinterest_shared_boards_goopss: values.pinterestField,
        facebook_groups_goopss: values.facebookField,
        instagram_hashtags_goopss: values.instagramField,
      };

      const cleanedUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      await updateDoc(customerRef, cleanedUpdateData);
      setError(null);
      
      message.success('Information saved successfully');
    } catch (error: any) {
      console.error('Error saving data:', error);
      if (error.name === 'FirebaseError') {
        message.error(`Firebase Error: ${error.message}`);
      } else if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error('Failed to save store information: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

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

          <Layout style={{ 
            background: 'transparent',
            minHeight: 'auto'
          }}>
            <Sider 
              theme="light" 
              width={250}
              style={{ 
                background: 'transparent',
                overflow: 'hidden',
                marginRight: '24px'
              }}
            >
              <Menu
                mode="inline"
                selectedKeys={[currentSection.toString()]}
                style={{ 
                  border: 'none',
                  width: '100%',
                  overflowX: 'hidden',
                  padding: '0 8px'
                }}
                className="social-insights-menu"
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

                {isAdmin && (
                  <>
                    <Divider />

                    <Row justify="space-between">
                      <Col>
                        <Button 
                          onClick={() => setCurrentSection(prev => prev - 1)}
                          disabled={currentSection === 0}
                        >
                          Previous
                        </Button>
                      </Col>
                      <Col>
                        <Space>
                          <Button onClick={() => form.resetFields()}>
                            Reset
                          </Button>
                          {currentSection === sections.length - 1 ? (
                            <Button 
                              type="primary" 
                              onClick={handleSave} 
                              loading={loading}
                              style={{ backgroundColor: '#000000', borderColor: '#000000' }}
                            >
                              Save
                            </Button>
                          ) : (
                            <Button 
                              type="primary" 
                              onClick={async () => {
                                await handleSave();
                                if (!error) {
                                  setCurrentSection(prev => prev + 1);
                                }
                              }} 
                              loading={loading}
                              style={{ backgroundColor: '#000000', borderColor: '#000000' }}
                            >
                              Next
                            </Button>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  </>
                )}
              </Form>
            </Content>
          </Layout>
        </>
      )}
    </Card>
  );
};

export default SocialInsights; 