import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Card, Space, Typography, Select, Input, Spin, Tooltip, Tag, Progress } from 'antd';
import { CalendarOutlined, WarningOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { PlanSection, PlanTask } from '../../types/Plan';
import { ICustomer } from '../../types/Customer';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const pastelColors = {
  'To Do': '#FFCCCB',
  'Doing': '#ADD8E6',
  'Done': '#90EE90',
  'Monthly': '#DDA0DD',
  'One Time': '#FFE4B5',
};

interface TaskCardProps {
  task: PlanTask;
  editMode: boolean;
  onEdit: (key: string, field: keyof PlanTask, value: string | boolean | number | null) => void;
  customer: ICustomer | null | undefined;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, editMode, onEdit, customer }) => {
  return (
    <Card 
      style={{ 
        marginBottom: '16px',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e8e8e8'
      }}
    >
      <Space size="middle" style={{ 
        width: '100%', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        minHeight: '68px',
        padding: '8px 0'
      }}>
        <Space direction="vertical" size={0} style={{ flex: 1 }}>
          <Text strong style={{ fontSize: '16px' }}>{task.task}</Text>
          {customer && (
            <Space>
              <img 
                src={customer.logo || '/placeholder.svg'} 
                alt={`${customer.store_name} logo`} 
                width={16} 
                height={16} 
                style={{ borderRadius: '50%' }} 
              />
              <Text type="secondary">{customer.store_owner_name} - {customer.store_name}</Text>
            </Space>
          )}
        </Space>
        <Space align="center" size="large">
          {task.frequency === 'Monthly' && (
            <Space direction="vertical" size={0} align="center">
              <Progress
                type="circle"
                percent={Math.round((task.current || 0) / (task.goal || 1) * 100)}
                size={50}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                format={() => (
                  <Text style={{ fontSize: '12px' }}>
                    {task.current || 0}/{task.goal || 0}
                  </Text>
                )}
              />
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                This Month
              </Text>
            </Space>
          )}
          <Space direction="vertical" size={2}>
            {task.dueDate ? (
              <Space>
                <CalendarOutlined /> 
                <Text type="secondary">Due: {task.dueDate}</Text>
              </Space>
            ) : (
              <Text type="secondary">No due date</Text>
            )}
            {task.completedDate && (
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
                <Text type="secondary">Completed: {task.completedDate}</Text>
              </Space>
            )}
          </Space>
          <Tag color={pastelColors[task.progress]} style={{ 
            padding: '4px 12px',
            borderRadius: '4px'
          }}>
            {task.progress}
          </Tag>
        </Space>
      </Space>
    </Card>
  );
};

export const CustomerPlan: React.FC = () => {
  // States
  const { user } = useAuth();
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [progressFilter, setProgressFilter] = useState<'All' | 'To Do' | 'Doing' | 'Done'>('All');
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'overdue' | 'thisWeek'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load customer's plan
  useEffect(() => {
    const loadCustomerPlan = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const planRef = doc(db, 'plans', user.id);
        const planDoc = await getDoc(planRef);

        if (planDoc.exists()) {
          // Only get active tasks
          const planData = planDoc.data();
          const activeSections = planData.sections.map((section: PlanSection) => ({
            ...section,
            tasks: section.tasks.filter((task: PlanTask) => task.isActive)
          }));
          setSections(activeSections);
        }
      } catch (error) {
        console.error('Error loading plan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerPlan();
  }, [user?.id]);

  // Helper functions
  const isOverdue = (dueDate: string | null | undefined) => {
    if (!dueDate) return false;
    return dayjs(dueDate).isBefore(dayjs(), 'day');
  };

  const isDueThisWeek = (dueDate: string | null | undefined) => {
    if (!dueDate) return false;
    const today = dayjs();
    const dueDay = dayjs(dueDate);
    return dueDay.isAfter(today) && dueDay.isBefore(today.add(7, 'day'));
  };

  // Filter sections
  const filteredSections = sections
    .map(section => ({
      ...section,
      tasks: section.tasks.filter(task => 
        task.isActive &&
        (progressFilter === 'All' || task.progress === progressFilter) &&
        task.task.toLowerCase().includes(search.toLowerCase()) &&
        (dueDateFilter === 'all' || 
          (dueDateFilter === 'overdue' && isOverdue(task.dueDate)) ||
          (dueDateFilter === 'thisWeek' && isDueThisWeek(task.dueDate))
        )
      )
    }))
    .filter(section => section.tasks.length > 0);

  // Filter tasks to only show active ones
  const filteredTasks = useMemo(() => {
    return sections.flatMap(section => 
      section.tasks.filter(task => task.isActive)
    );
  }, [sections]);

  return (
    <Layout>
      <Content style={{ padding: '16px' }}>
        {/* Filters */}
        <Card>
          <Space wrap>
            <Select
              style={{ width: 150 }}
              value={progressFilter}
              onChange={setProgressFilter}
            >
              <Option value="All">All Progress</Option>
              <Option value="To Do">To Do</Option>
              <Option value="Doing">Doing</Option>
              <Option value="Done">Done</Option>
            </Select>
            <Select
              style={{ width: 150 }}
              value={dueDateFilter}
              onChange={setDueDateFilter}
            >
              <Option value="all">All Due Dates</Option>
              <Option value="overdue">
                <Space>
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                  <span>Overdue</span>
                </Space>
              </Option>
              <Option value="thisWeek">
                <Space>
                  <CalendarOutlined style={{ color: '#1890ff' }} />
                  <span>Due This Week</span>
                </Space>
              </Option>
            </Select>
            <Search
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
          </Space>
        </Card>

        {/* Loading State */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : filteredSections.length === 0 ? (
          <Card style={{ marginTop: 16, textAlign: 'center' }}>
            <Text>No tasks found</Text>
          </Card>
        ) : (
          // Tasks by Section
          filteredSections.map(section => (
            <Card 
              key={section.title} 
              style={{ 
                marginTop: 16,
                background: '#fff',  // White background for section
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'  // Subtle shadow
              }}
            >
              <Title level={4} style={{ marginBottom: '20px' }}>{section.title}</Title>
              {section.tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  editMode={false}
                  onEdit={() => {}}
                  customer={null}
                />
              ))}
            </Card>
          ))
        )}
      </Content>
    </Layout>
  );
}; 