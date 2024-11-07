import React, { useState } from 'react';
import { Table, Input, Typography, Layout, Space, Switch, Button, Form, Alert } from 'antd';
import type { TableProps } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ICustomer } from '../types/Customer';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import CustomersDropdown from './CustomersDropdown';

const { Title } = Typography;
const { Content } = Layout;

interface Task {
  key: string;
  section: string;
  task: string;
  progress: string;
  isActive: boolean;
}

interface Section {
  title: string;
  tasks: Task[];
}

// Update the interface for Plan props
interface PlanProps {
  customers: ICustomer[];
  selectedCustomer: ICustomer | null;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<ICustomer | null>>;
}

function Plan({ customers, selectedCustomer, setSelectedCustomer }: PlanProps) {
  const { isAdmin } = useAuth();
  const [sections, setSections] = useState<Section[]>([
    {
      title: 'Initial setup',
      tasks: [
        { key: '1-1', section: 'General', task: 'Connect your Etsy store to Vela', progress: 'Done!', isActive: true },
        { key: '1-2', section: 'General', task: 'Connect to Erank', progress: 'Done!', isActive: true },
        { key: '1-3', section: 'Social', task: 'Connect to your facebook account', progress: '', isActive: true },
        { key: '1-4', section: 'Social', task: 'Connect to your instagram account', progress: 'Done!', isActive: true },
        { key: '1-5', section: 'Social', task: 'Connect to your pinterest account', progress: 'Done!', isActive: true },
        { key: '1-6', section: 'Email Marketing', task: 'Create an Aweber account (only if they have a custom domain) / extract emails', progress: '', isActive: true },
      ]
    },
    {
      title: 'Research & Analyze',
      tasks: [
        { key: '2-1', section: 'Social', task: 'Create a social insights report', progress: '', isActive: true },
        { key: '2-2', section: 'Store Page', task: 'Analyze Store banner', progress: '', isActive: true },
        { key: '2-3', section: 'Store Page', task: 'Analyze About Shop Section', progress: 'Done!', isActive: true },
        { key: '2-4', section: 'Store Page', task: 'Analyze About Owner Section + Owner picture', progress: '', isActive: true },
        { key: '2-5', section: 'Store Page', task: 'Analyze Store Announcement, Store policies, free shipping strategy, FAQ sections', progress: '', isActive: true },
        { key: '2-6', section: 'Store Page', task: 'Analyze sale, free shipping', progress: '', isActive: true },
        { key: '2-7', section: 'Store Page', task: 'Check if store has featured listings on the shop page', progress: '', isActive: true },
        { key: '2-8', section: 'Listings', task: "Analyze which listings doesn't have 'sections'", progress: 'Done!', isActive: true },
        { key: '2-9', section: 'Listings', task: 'Analyzing which listings should have more images', progress: 'In progress', isActive: true },
        { key: '2-10', section: 'Listings', task: 'New keyword research - low competition', progress: '', isActive: true },
        { key: '2-11', section: 'Listings', task: 'New keyword research - High searches, High competition (for big stores)', progress: '', isActive: true },
        { key: '2-12', section: 'Listings', task: 'Identify bestsellers', progress: '', isActive: true },
        { key: '2-13', section: 'Listings', task: 'Identify if listings have missing, one-word, or misspelled tags', progress: '', isActive: true },
        { key: '2-14', section: 'Ads', task: 'Analyze ads data', progress: '', isActive: true },
      ]
    },
    {
      title: 'Time to work!',
      tasks: [
        { key: '3-1', section: 'Store Page', task: 'Creating/optimizing About, FAQ, Announcement, etc', progress: '', isActive: true },
        { key: '3-2', section: 'Store Page', task: 'Implement new sale and free shipping strategy', progress: '', isActive: true },
        { key: '3-3', section: 'Design', task: 'Store Banner', progress: '', isActive: true },
        { key: '3-4', section: 'Design', task: 'Create new product images', progress: '', isActive: true },
        { key: '3-5', section: 'Social', task: 'Creating new Pinterest boards', progress: '', isActive: true },
        { key: '3-6', section: 'Listings', task: 'Update the listings with no sections', progress: '', isActive: true },
        { key: '3-7', section: 'Listings', task: 'Listing Optimization (title, description, attributes, alt texts)', progress: 'Ongoing.. 10 listings optimzised', isActive: true },
        { key: '3-8', section: 'Listings', task: 'Duplication of listings', progress: 'Ongoing.. 5 listings duplicated', isActive: true },
        { key: '3-9', section: 'Listings', task: 'Update the listings with missing, one-word or misspelled tags', progress: '', isActive: true },
        { key: '3-10', section: 'Listings', task: 'New Listings', progress: '', isActive: true },
        { key: '3-11', section: 'Email Marketing', task: 'Newsletters (for customers with custom domains)', progress: 'ongoing .. 5 newsletter sent', isActive: true },
      ]
    }
  ]);

  const handleCellEdit = (key: string, field: keyof Task, value: string | boolean) => {
    setSections(prevSections => 
      prevSections.map(section => ({
        ...section,
        tasks: section.tasks.map(task => 
          task.key === key ? { ...task, [field]: value } : task
        )
      }))
    );
  };

  const handleAddTask = (sectionTitle: string, values: { section: string; task: string }) => {
    setSections(prevSections =>
      prevSections.map(section => {
        if (section.title === sectionTitle) {
          const newKey = `${section.tasks.length + 1}-${section.tasks.length + 1}`;
          const newTask: Task = {
            key: newKey,
            section: values.section,
            task: values.task,
            progress: '',
            isActive: true
          };
          return {
            ...section,
            tasks: [...section.tasks, newTask]
          };
        }
        return section;
      })
    );
  };

  const columns: TableProps<Task>['columns'] = [
    {
      title: 'Section',
      dataIndex: 'section',
      key: 'section',
      width: '15%',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleCellEdit(record.key, 'section', e.target.value)}
          suffix={<EditOutlined style={{ color: 'rgba(0,0,0,.45)' }} />}
        />
      ),
    },
    {
      title: 'Task',
      dataIndex: 'task',
      key: 'task',
      width: '50%',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleCellEdit(record.key, 'task', e.target.value)}
          suffix={<EditOutlined style={{ color: 'rgba(0,0,0,.45)' }} />}
        />
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: '20%',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleCellEdit(record.key, 'progress', e.target.value)}
          suffix={<EditOutlined style={{ color: 'rgba(0,0,0,.45)' }} />}
        />
      ),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: '15%',
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleCellEdit(record.key, 'isActive', checked)}
        />
      ),
    },
  ];

  return (
    <Layout>
      <Content style={{ padding: '0 50px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          padding: '24px 0'
        }}>
          <Title level={2}>Plan</Title>
          {isAdmin && (
            <CustomersDropdown
              customers={customers}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              isAdmin={isAdmin}
            />
          )}
        </div>

        {selectedCustomer ? (
          <Space direction="vertical" size="large" style={{ display: 'flex' }}>
            {sections.map((section) => (
              <div key={section.title}>
                <Title level={3} style={{ background: '#000000', color: '#ffffff', padding: '8px 16px', borderRadius: '4px' }}>
                  {section.title}
                </Title>
                <Table
                  columns={columns}
                  dataSource={section.tasks}
                  pagination={false}
                  bordered
                  size="middle"
                />
                <Form
                  layout="inline"
                  onFinish={(values) => handleAddTask(section.title, values as { section: string; task: string })}
                  style={{ marginTop: '16px' }}
                >
                  <Form.Item
                    name="section"
                    rules={[{ required: true, message: 'Please input the section!' }]}
                  >
                    <Input placeholder="Section" style={{ width: '150px' }} />
                  </Form.Item>
                  <Form.Item
                    name="task"
                    rules={[{ required: true, message: 'Please input the task!' }]}
                  >
                    <Input placeholder="Task" style={{ width: '300px' }} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                      Add Task
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            ))}
          </Space>
        ) : (
          <Alert
            message="Please select a customer to view their monthly plan"
            type="info"
            showIcon
            style={{ marginTop: '20px' }}
          />
        )}
      </Content>
    </Layout>
  );
}

export default Plan;
