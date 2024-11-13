import React from 'react';
import { Button, message, Layout, Typography, Card, Space } from 'antd';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { defaultPlanTaskRules } from '../data/defaultPlanTaskRules';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const InitializePlanTaskRules: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleInitialize = async () => {
    try {
      console.log('Starting initialization...');
      const rulesRef = doc(db, 'planTaskRules', 'default');
      
      await setDoc(rulesRef, {
        sections: defaultPlanTaskRules.sections,
        tasks: defaultPlanTaskRules.tasks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || ''
      });

      console.log('Rules initialized successfully');
      message.success('Default rules initialized successfully');
      
      // Add delay before navigation
      setTimeout(() => {
        navigate('/plan-task-rules', { replace: true });
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to initialize default rules');
    }
  };

  return (
    <Layout>
      <Header style={{ background: '#fff', padding: '0 16px' }}>
        <Title level={2}>Initialize Plan Task Rules</Title>
      </Header>
      <Content style={{ padding: '16px' }}>
        <Card>
          <Space direction="vertical" size="large">
            <Text>
              This will initialize the default plan task rules in Firestore.
              This should only be done once.
            </Text>
            <Button type="primary" onClick={handleInitialize}>
              Initialize Default Rules
            </Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default InitializePlanTaskRules; 