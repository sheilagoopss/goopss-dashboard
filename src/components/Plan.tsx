'use client'

import React, { useState, useEffect } from 'react'
import { 
  Layout, 
  Typography, 
  Card, 
  Select, 
  Switch, 
  Input, 
  Button, 
  Space, 
  Table, 
  Tag, 
  Tooltip, 
  Progress,
  DatePicker,
  Collapse
} from 'antd'
import { 
  CalendarOutlined, 
  CheckCircleOutlined, 
  EditOutlined, 
  FileTextOutlined,
  SortAscendingOutlined,
  UserOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../hooks/usePlan'
import { PlanSection, PlanTask } from '../types/Plan'
import { ICustomer } from '../types/Customer'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input
const { Column } = Table
const { Panel } = Collapse

const pastelColors = {
  'To Do': '#FFCCCB',
  'Doing': '#ADD8E6',
  'Done': '#90EE90',
  'Monthly': '#DDA0DD',
  'One Time': '#FFE4B5',
}

interface TaskCardProps {
  task: PlanTask;
  editMode: boolean;
  onEdit: (key: string, field: keyof PlanTask, value: string | boolean | number) => void;
  customer?: ICustomer;
}

const dropdownStyle = {
  height: '40px',
  '.ant-select-selection-item': {
    lineHeight: '40px'
  }
};

const collapseStyle = {
  marginBottom: '12px',
  '.ant-collapse-header': {
    padding: '16px !important',
    minHeight: '80px !important'
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, editMode, onEdit, customer }) => {
  const [originalValues, setOriginalValues] = useState<Partial<PlanTask>>({});

  const handleEditClick = () => {
    if (!task.isEditing) {
      setOriginalValues({
        progress: task.progress,
        dueDate: task.dueDate,
        completedDate: task.completedDate,
        isActive: task.isActive,
        frequency: task.frequency,
        current: task.current,
        goal: task.goal,
        notes: task.notes,
      });
    }
    onEdit(task.key, 'isEditing', !task.isEditing);
  };

  const handleCancel = () => {
    Object.entries(originalValues).forEach(([key, value]) => {
      if (value instanceof Date) {
        onEdit(task.key, key as keyof PlanTask, value.toISOString().split('T')[0]);
      } else if (value !== undefined) {
        onEdit(task.key, key as keyof PlanTask, value as string | number | boolean);
      }
    });
    onEdit(task.key, 'isEditing', false);
  };

  return (
    <Collapse style={collapseStyle}>
      <Panel
        key={task.key}
        header={
          <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space direction="vertical" size="small">
              <Text strong>{task.task}</Text>
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
            <Space direction="vertical" size={4} align="end">
              <Space>
                <CalendarOutlined /> 
                <Text type="secondary">Due: {task.dueDate}</Text>
              </Space>
              {task.completedDate && (
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
                  <Text type="secondary">Completed: {task.completedDate}</Text>
                </Space>
              )}
              <Space>
                {task.notes && <Tooltip title="Has notes"><FileTextOutlined /></Tooltip>}
                <Tag color={pastelColors[task.progress]}>{task.progress}</Tag>
              </Space>
            </Space>
          </Space>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <Space>
            {task.isEditing ? (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleEditClick}
                  style={{
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                  }}
                >
                  Save
                </Button>
                <Button
                  danger
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                icon={<EditOutlined />}
                onClick={handleEditClick}
              >
                Edit
              </Button>
            )}
          </Space>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space>
            <Select
              style={{ width: 120 }}
              value={task.progress}
              onChange={(value) => {
                onEdit(task.key, 'progress', value)
                if (value === 'Done' && !task.completedDate) {
                  onEdit(task.key, 'completedDate', new Date().toISOString().split('T')[0])
                }
              }}
              disabled={!task.isEditing}
            >
              <Option value="To Do">To Do</Option>
              <Option value="Doing">Doing</Option>
              <Option value="Done">Done</Option>
            </Select>
            <div>
              <Text strong>Due Date:</Text>
              <DatePicker
                value={task.dueDate ? dayjs(task.dueDate) : null}
                onChange={(date) => onEdit(task.key, 'dueDate', date ? date.toISOString().split('T')[0] : '')}
                disabled={!task.isEditing}
              />
            </div>
            <div>
              <Text strong>Completed Date:</Text>
              <DatePicker
                value={task.completedDate ? dayjs(task.completedDate) : null}
                onChange={(date) => onEdit(task.key, 'completedDate', date ? date.toISOString().split('T')[0] : '')}
                disabled={!task.isEditing}
              />
            </div>
          </Space>
          <Space>
            <Text strong>Active:</Text>
            <Switch
              checked={task.isActive}
              onChange={(checked) => onEdit(task.key, 'isActive', checked)}
              disabled={!task.isEditing}
            />
          </Space>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Frequency:</Text>
            <Select
              style={{ width: 120 }}
              value={task.frequency}
              onChange={(value) => onEdit(task.key, 'frequency', value)}
              disabled={!task.isEditing}
            >
              <Option value="Monthly">Monthly</Option>
              <Option value="One Time">One Time</Option>
            </Select>
          </Space>
          {task.frequency === 'Monthly' && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Input
                  type="number"
                  value={task.current}
                  onChange={(e) => onEdit(task.key, 'current', parseInt(e.target.value))}
                  disabled={!task.isEditing}
                  style={{ width: 80 }}
                />
                <Text>/</Text>
                <Input
                  type="number"
                  value={task.goal}
                  onChange={(e) => onEdit(task.key, 'goal', parseInt(e.target.value))}
                  disabled={!task.isEditing}
                  style={{ width: 80 }}
                />
              </Space>
              <Progress percent={Math.min((task.current! / task.goal!) * 100, 100)} />
            </Space>
          )}
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Notes:</Text>
            <Input.TextArea
              value={task.notes}
              onChange={(e) => onEdit(task.key, 'notes', e.target.value)}
              disabled={!task.isEditing}
              rows={4}
            />
          </Space>
        </Space>
      </Panel>
    </Collapse>
  )
}

interface PlanProps {
  customers: ICustomer[];
  selectedCustomer: ICustomer | null;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<ICustomer | null>>;
}

const Plan: React.FC<PlanProps> = ({ customers, selectedCustomer, setSelectedCustomer }) => {
  const { isAdmin } = useAuth();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'none'>('none');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [progressFilter, setProgressFilter] = useState<'All' | 'To Do' | 'Doing' | 'Done'>('All');
  const { fetchPlan, updateTask } = usePlan();
  const [sections, setSections] = useState<PlanSection[]>([]);

  useEffect(() => {
    const loadPlan = async () => {
      if (isAdmin && !selectedCustomer) return;
      
      try {
        const customerId = selectedCustomer?.id;
        if (!customerId) return;
        
        const plan = await fetchPlan(customerId);
        setSections(plan.sections);
      } catch (error) {
        console.error('Error loading plan:', error);
      }
    };

    loadPlan();
  }, [isAdmin, selectedCustomer, fetchPlan]);

  const handleCellEdit = async (key: string, field: keyof PlanTask, value: string | boolean | number) => {
    if (!selectedCustomer) return;

    try {
      const sectionTitle = sections.find(section => 
        section.tasks.some(task => task.key === key)
      )?.title;

      if (!sectionTitle) return;

      await updateTask(selectedCustomer.id, sectionTitle, key, { [field]: value });

      setSections(prevSections =>
        prevSections.map(section => ({
          ...section,
          tasks: section.tasks.map(task =>
            task.key === key ? { ...task, [field]: value } : task
          )
        }))
      );

      if (field === 'isEditing') {
        setEditMode(!!value);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const filteredSections = sections
    .map(section => ({
      ...section,
      tasks: section.tasks.filter(task =>
        (!showActiveOnly || task.isActive) &&
        (progressFilter === 'All' || task.progress === progressFilter) &&
        task.task.toLowerCase().includes(search.toLowerCase())
      )
    }))
    .filter(section => section.tasks.length > 0);

  const sortedSections = filteredSections.map(section => ({
    ...section,
    tasks: sortBy === 'dueDate' 
      ? [...section.tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      : section.tasks
  }));

  return (
    <Layout>
      <Header style={{ background: '#fff', padding: '0 16px' }}>
        <Title level={2} style={{ margin: '16px 0' }}>Etsy Store Management Dashboard</Title>
      </Header>
      <Content style={{ padding: '0 16px' }}>
        <Card style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Title level={4}>Select Customer</Title>
            <Select
              style={{ width: '100%', ...dropdownStyle }}
              placeholder="Select a customer"
              value={selectedCustomer?.id}
              onChange={(value) => {
                const customer = customers.find(c => c.id === value);
                setSelectedCustomer(customer || null);
              }}
              listHeight={400}
            >
              {customers.map((customer) => (
                <Option key={customer.id} value={customer.id}>
                  <Space>
                    <img 
                      src={customer.logo || '/placeholder.svg'} 
                      alt={`${customer.store_name} logo`}
                      width={24} 
                      height={24} 
                      style={{ borderRadius: '50%' }} 
                    />
                    <span>{customer.store_owner_name} - {customer.store_name}</span>
                    <Text type="secondary">Joined: {customer.date_joined}</Text>
                  </Space>
                </Option>
              ))}
            </Select>
            {selectedCustomer && (
              <Text type="secondary">
                <CalendarOutlined /> Date Joined: {selectedCustomer.date_joined}
              </Text>
            )}
          </Space>
        </Card>

        {!selectedCustomer ? (
          <Card style={{ marginTop: 16, textAlign: 'center' }}>
            <Title level={3}>Welcome to the Etsy Store Management Dashboard</Title>
            <Text>Please select a customer to view their tasks.</Text>
          </Card>
        ) : (
          <>
            <Card style={{ marginTop: 16 }}>
              <Space wrap>
                <Space>
                  <Switch
                    checked={showActiveOnly}
                    onChange={setShowActiveOnly}
                  />
                  <Text>Show Active Only</Text>
                </Space>
                <Select
                  style={{ width: 150 }}
                  value={progressFilter}
                  onChange={(value: 'All' | 'To Do' | 'Doing' | 'Done') => setProgressFilter(value)}
                >
                  <Option value="All">All Progress</Option>
                  <Option value="To Do">To Do</Option>
                  <Option value="Doing">Doing</Option>
                  <Option value="Done">Done</Option>
                </Select>
                <Search
                  placeholder="Search tasks..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: 200 }}
                />
                <Select
                  style={{ width: 150 }}
                  value={sortBy}
                  onChange={(value: 'dueDate' | 'none') => setSortBy(value)}
                >
                  <Option value="none">
                    <Space>
                      <SortAscendingOutlined />
                      <span>No sorting</span>
                    </Space>
                  </Option>
                  <Option value="dueDate">
                    <Space>
                      <SortAscendingOutlined />
                      <span>Due Date</span>
                    </Space>
                  </Option>
                </Select>
              </Space>
            </Card>

            {sortedSections.map((section) => (
              <Card key={section.title} style={{ marginTop: 16 }}>
                <Title level={4}>{section.title}</Title>
                {section.tasks.map((task) => (
                  <TaskCard
                    key={task.key}
                    task={task}
                    editMode={editMode}
                    onEdit={handleCellEdit}
                    customer={customers.find(c => c.id === task.customerId)}
                  />
                ))}
              </Card>
            ))}
          </>
        )}
      </Content>
    </Layout>
  );
};

export default Plan;