import React from 'react';
import { Button, message, Layout, Typography, Card, Space } from 'antd';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { defaultPlanTaskRules } from '../data/defaultPlanTaskRules';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const InitializePlanTaskRules: React.FC = () => {
  const { user } = useAuth();

  const handleInitialize = async () => {
    try {
      const rulesRef = doc(db, 'planTaskRules', 'default');
      const rulesDoc = await getDoc(rulesRef);
      
      if (!rulesDoc.exists()) {
        console.log('Initializing plan task rules...');
        
        // Set monthly tasks to be due on the 1st of each month
        const tasksWithMonthlyDates = defaultPlanTaskRules.tasks.map(task => {
          if (task.frequency === 'Monthly') {
            // Get first day of next month
            const nextMonth = dayjs().add(1, 'month').startOf('month');
            return {
              ...task,
              dueDate: nextMonth.format('YYYY-MM-DD')  // Will be like "2024-04-01"
            };
          }
          return task;
        });

        const planTaskRules = {
          ...defaultPlanTaskRules,
          tasks: tasksWithMonthlyDates,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || ''
        };
        
        await setDoc(rulesRef, planTaskRules);
        console.log('Plan task rules initialized successfully');
        message.success('Plan task rules initialized successfully');
      } else {
        message.info('Plan task rules already exist');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to initialize rules');
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
              This will initialize the default task rules and sections in Firestore. 
              This should only be done once.
            </Text>
            <Button type="primary" onClick={handleInitialize}>
              Initialize Plan Task Rules
            </Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default InitializePlanTaskRules; 