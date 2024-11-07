import React, { useState } from 'react';
import { Table, Input, Typography, Layout, Space, Switch, Button, Form, Alert, Tabs, Select, Modal } from 'antd';
import type { TableProps } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ICustomer } from '../types/Customer';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import CustomersDropdown from './CustomersDropdown';

const { Title } = Typography;
const { Content } = Layout;

type ProgressStatus = 'In Progress' | 'Done' | string;

interface Task {
  key: string;
  section: string;
  task: string;
  progress: ProgressStatus;
  isActive: boolean;
  completedAt?: string;
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
        { key: '1-1', section: 'General', task: 'Connect your Etsy store to Vela', progress: 'In Progress', isActive: true },
        { key: '1-2', section: 'General', task: 'Connect to Erank', progress: 'In Progress', isActive: true },
        { key: '1-3', section: 'Social', task: 'Connect to your facebook account', progress: 'In Progress', isActive: true },
        { key: '1-4', section: 'Social', task: 'Connect to your instagram account', progress: 'In Progress', isActive: true },
        { key: '1-5', section: 'Social', task: 'Connect to your pinterest account', progress: 'In Progress', isActive: true },
        { key: '1-6', section: 'Email Marketing', task: 'Create an Aweber account (only if they have a custom domain) / extract emails', progress: 'In Progress', isActive: true },
      ]
    },
    {
      title: 'Research & Analyze',
      tasks: [
        { key: '2-1', section: 'Social', task: 'Create a social insights report', progress: 'In Progress', isActive: true },
        { key: '2-2', section: 'Store Page', task: 'Analyze Store banner', progress: 'In Progress', isActive: true },
        { key: '2-3', section: 'Store Page', task: 'Analyze About Shop Section', progress: 'Done', isActive: true },
        { key: '2-4', section: 'Store Page', task: 'Analyze About Owner Section + Owner picture', progress: 'In Progress', isActive: true },
        { key: '2-5', section: 'Store Page', task: 'Analyze Store Announcement, Store policies, free shipping strategy, FAQ sections', progress: 'In Progress', isActive: true },
        { key: '2-6', section: 'Store Page', task: 'Analyze sale, free shipping', progress: 'In Progress', isActive: true },
        { key: '2-7', section: 'Store Page', task: 'Check if store has featured listings on the shop page', progress: 'In Progress', isActive: true },
        { key: '2-8', section: 'Listings', task: "Analyze which listings doesn't have 'sections'", progress: 'Done', isActive: true },
        { key: '2-9', section: 'Listings', task: 'Analyzing which listings should have more images', progress: 'In Progress', isActive: true },
        { key: '2-10', section: 'Listings', task: 'New keyword research - low competition', progress: 'In Progress', isActive: true },
        { key: '2-11', section: 'Listings', task: 'New keyword research - High searches, High competition (for big stores)', progress: 'In Progress', isActive: true },
        { key: '2-12', section: 'Listings', task: 'Identify bestsellers', progress: 'In Progress', isActive: true },
        { key: '2-13', section: 'Listings', task: 'Identify if listings have missing, one-word, or misspelled tags', progress: 'In Progress', isActive: true },
        { key: '2-14', section: 'Ads', task: 'Analyze ads data', progress: 'In Progress', isActive: true },
      ]
    },
    {
      title: 'Time to work!',
      tasks: [
        { key: '3-1', section: 'Store Page', task: 'Creating/optimizing About, FAQ, Announcement, etc', progress: 'In Progress', isActive: true },
        { key: '3-2', section: 'Store Page', task: 'Implement new sale and free shipping strategy', progress: 'In Progress', isActive: true },
        { key: '3-3', section: 'Design', task: 'Store Banner', progress: 'In Progress', isActive: true },
        { key: '3-4', section: 'Design', task: 'Create new product images', progress: 'In Progress', isActive: true },
        { key: '3-5', section: 'Social', task: 'Creating new Pinterest boards', progress: 'In Progress', isActive: true },
        { key: '3-6', section: 'Listings', task: 'Update the listings with no sections', progress: 'In Progress', isActive: true },
        { key: '3-7', section: 'Listings', task: 'Listing Optimization (title, description, attributes, alt texts)', progress: 'Ongoing.. 10 listings optimzised', isActive: true },
        { key: '3-8', section: 'Listings', task: 'Duplication of listings', progress: 'Ongoing.. 5 listings duplicated', isActive: true },
        { key: '3-9', section: 'Listings', task: 'Update the listings with missing, one-word or misspelled tags', progress: 'In Progress', isActive: true },
        { key: '3-10', section: 'Listings', task: 'New Listings', progress: 'In Progress', isActive: true },
        { key: '3-11', section: 'Email Marketing', task: 'Newsletters (for customers with custom domains)', progress: 'ongoing .. 5 newsletter sent', isActive: true },
      ]
    }
  ]);

  const [activeTab, setActiveTab] = useState('Initial setup');

  const handleCellEdit = (key: string, field: keyof Task, value: string | boolean) => {
    setSections(prevSections => 
      prevSections.map(section => ({
        ...section,
        tasks: section.tasks.map(task => {
          if (task.key === key) {
            if (field === 'progress' && value === 'Done') {
              return { 
                ...task, 
                [field]: value,
                completedAt: new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })
              };
            }
            if (field === 'progress' && value === 'In Progress') {
              return { 
                ...task, 
                [field]: value,
                completedAt: undefined  // Clear the date when moving back to In Progress
              };
            }
            return { ...task, [field]: value };
          }
          return task;
        })
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
            progress: 'In Progress',
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
      width: '15%',
      render: (text: ProgressStatus, record) => {
        const needsInput = [
          'Listing Optimization (title, description, attributes, alt texts)',
          'Duplication of listings',
          'Newsletters (for customers with custom domains)'
        ];

        if (needsInput.includes(record.task)) {
          return (
            <Input
              value={text}
              onChange={(e) => handleCellEdit(record.key, 'progress', e.target.value)}
              suffix={<EditOutlined style={{ color: 'rgba(0,0,0,.45)' }} />}
            />
          );
        }

        return (
          <Button
            type={text === 'Done' ? 'primary' : 'default'}
            onClick={() => {
              if (text === 'In Progress') {
                Modal.confirm({
                  title: 'Mark as Done?',
                  content: 'Are you sure you want to mark this task as done?',
                  okText: 'Yes',
                  cancelText: 'No',
                  onOk: () => handleCellEdit(record.key, 'progress', 'Done')
                });
              } else {
                Modal.confirm({
                  title: 'Mark as In Progress?',
                  content: 'Are you sure you want to change this task back to in progress?',
                  okText: 'Yes',
                  cancelText: 'No',
                  onOk: () => handleCellEdit(record.key, 'progress', 'In Progress')
                });
              }
            }}
            style={{ 
              width: '100%',
              ...(text === 'Done' ? {
                backgroundColor: '#b7eb8f',  // Light green color
                borderColor: '#b7eb8f',
                color: '#000000'  // Black text for better contrast
              } : {
                backgroundColor: '#ffd591',  // Light orange color
                borderColor: '#ffd591',
                color: '#000000'  // Black text for better contrast
              })
            }}
          >
            {text}
          </Button>
        );
      },
    },
    {
      title: 'Completed Date',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: '15%',
      render: (text: string | undefined) => text || '-'
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: '10%',
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
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            items={sections.map((section) => ({
              key: section.title,
              label: section.title,
              children: (
                <Space direction="vertical" size="large" style={{ display: 'flex', width: '100%' }}>
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
                </Space>
              ),
            }))}
          />
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
