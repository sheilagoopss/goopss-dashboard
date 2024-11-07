import React, { useState, useEffect } from 'react';
import { Table, Input, Typography, Layout, Space, Switch, Button, Form, Alert, Tabs, Select, Modal, message } from 'antd';
import type { TableProps } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ICustomer } from '../types/Customer';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { PlanTask, PlanSection } from '../types/Plan';
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

interface PlanProps {
  customers: ICustomer[];
  selectedCustomer: ICustomer | null;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<ICustomer | null>>;
}

function Plan({ customers, selectedCustomer, setSelectedCustomer }: PlanProps) {
  const { isAdmin, user } = useAuth();
  const { fetchPlan, updatePlan, updateTask } = usePlan();
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [activeTab, setActiveTab] = useState('Initial setup');

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const customerId = isAdmin ? selectedCustomer?.id : user?.id;
        
        if (customerId) {
          const plan = await fetchPlan(customerId);
          setSections(plan.sections);
        }
      } catch (error) {
        message.error('Failed to load plan');
      }
    };

    loadPlan();
  }, [selectedCustomer, user?.id, isAdmin]);

  const handleCellEdit = async (key: string, field: keyof Task, value: string | boolean) => {
    if (!selectedCustomer) return;

    try {
      const sectionTitle = sections.find(section => 
        section.tasks.some(task => task.key === key)
      )?.title;

      if (!sectionTitle) return;

      setSections(prevSections => 
        prevSections.map(section => ({
          ...section,
          tasks: section.tasks.map(task => {
            if (task.key === key) {
              if (field === 'progress') {
                if (value === 'Done') {
                  return { 
                    ...task, 
                    progress: value as string,
                    completedAt: new Date().toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  };
                }
                if (value === 'In Progress') {
                  return { 
                    ...task, 
                    progress: value as string,
                    completedAt: undefined
                  };
                }
              }
              if (field === 'isActive') {
                return { ...task, isActive: value as boolean };
              }
              return { ...task, [field]: value };
            }
            return task;
          })
        }))
      );

      const updates: Partial<PlanTask> = {
        updatedAt: new Date(),
        updatedBy: user?.email || ''
      };

      if (field === 'progress') {
        updates.progress = value as string;
        if (value === 'Done') {
          updates.completedAt = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        } else if (value === 'In Progress') {
          updates.completedAt = undefined;
        }
      }

      if (field === 'isActive') {
        updates.isActive = value as boolean;
      }

      await updateTask(selectedCustomer.id, sectionTitle, key, updates);

    } catch (error) {
      console.error('Error updating task:', error);
      message.error('Failed to update task');
    }
  };

  const handleAddTask = async (sectionTitle: string, values: { section: string; task: string }) => {
    if (!selectedCustomer) return;

    try {
      const newKey = `${Date.now()}`; // Use timestamp as key
      const newTask: PlanTask = {
        key: newKey,
        section: values.section,
        task: values.task,
        progress: 'In Progress',
        isActive: true,
        updatedAt: new Date(),
        updatedBy: user?.email || ''
      };

      const updatedSections = sections.map(section => {
        if (section.title === sectionTitle) {
          return {
            ...section,
            tasks: [...section.tasks, newTask]
          };
        }
        return section;
      });

      const planSections: PlanSection[] = updatedSections.map(section => ({
        title: section.title,
        tasks: section.tasks.map(task => ({
          ...task,
          updatedAt: new Date(),
          updatedBy: user?.email || ''
        }))
      }));

      await updatePlan(selectedCustomer.id, planSections);

      setSections(updatedSections);
      message.success('Task added successfully');
    } catch (error) {
      console.error('Error adding task:', error);
      message.error('Failed to add task');
    }
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
      render: (text: ProgressStatus, record) => {
        const needsInput = [
          'Listing Optimization (title, description, attributes, alt texts)',
          'Duplication of listings',
          'Newsletters (for customers with custom domains)',
          'Create new product images'
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
      width: '10%',
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

  // Create separate columns for admin and non-admin views
  const getNonAdminColumns = (): TableProps<Task>['columns'] => [
    {
      title: 'Section',
      dataIndex: 'section',
      key: 'section',
      width: '20%',
      render: (text) => <span>{text}</span>,  // Simple text display
    },
    {
      title: 'Task',
      dataIndex: 'task',
      key: 'task',
      width: '60%',
      render: (text) => <span>{text}</span>,  // Simple text display
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: '20%',
      render: (text: ProgressStatus) => (
        <Button
          type={text === 'Done' ? 'primary' : 'default'}
          style={{ 
            width: '100%',
            ...(text === 'Done' ? {
              backgroundColor: '#b7eb8f',
              borderColor: '#b7eb8f',
              color: '#000000'
            } : {
              backgroundColor: '#ffd591',
              borderColor: '#ffd591',
              color: '#000000'
            })
          }}
          disabled  // Disable the button for non-admin users
        >
          {text}
        </Button>
      ),
    },
  ];

  // Filter out inactive tasks for non-admin users
  const getFilteredTasks = (tasks: Task[]) => {
    if (isAdmin) return tasks;
    return tasks.filter(task => task.isActive);
  };

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

        {(isAdmin ? selectedCustomer : true) ? (
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
                    columns={isAdmin ? columns : getNonAdminColumns()}
                    dataSource={getFilteredTasks(section.tasks)}
                    pagination={false}
                    bordered
                    size="middle"
                  />
                  {isAdmin && (
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
                  )}
                </Space>
              ),
            }))}
          />
        ) : (
          <Alert
            message="Please select a customer to view their plan"
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