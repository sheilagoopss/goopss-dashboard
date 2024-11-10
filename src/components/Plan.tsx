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
  Collapse,
  Modal,
  message,
  Spin
} from 'antd'
import { 
  CalendarOutlined, 
  CheckCircleOutlined, 
  EditOutlined, 
  FileTextOutlined,
  SortAscendingOutlined,
  UserOutlined,
  WarningOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../hooks/usePlan'
import { PlanSection, PlanTask } from '../types/Plan'
import { ICustomer } from '../types/Customer'
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, query, where, deleteDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Plan } from '../types/Plan';

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
  onEdit: (key: string, field: keyof PlanTask, value: string | boolean | number | null) => void;
  customer: ICustomer | null | undefined;
}

const dropdownStyle = {
  height: '50px',
  fontSize: '16px'
};

const TaskCard: React.FC<TaskCardProps> = ({ task, editMode, onEdit, customer }) => {
  const { user } = useAuth();
  const [tempValues, setTempValues] = useState<Partial<PlanTask>>({});
  const [originalValues, setOriginalValues] = useState<Partial<PlanTask>>({});

  const handleProgressChange = (value: 'To Do' | 'Doing' | 'Done') => {
    const updates: Partial<PlanTask> = {
      progress: value
    };

    if (value === 'Done' && !tempValues.completedDate && !task.completedDate) {
      updates.completedDate = dayjs().format('YYYY-MM-DD');
    }

    setTempValues(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleEditClick = async () => {
    if (task.isEditing) {
      try {
        await onEdit(task.id, 'progress', tempValues.progress || task.progress);
        await onEdit(task.id, 'dueDate', tempValues.dueDate || task.dueDate);
        
        // Handle completedDate separately since it can be undefined
        const completedDate = tempValues.completedDate !== undefined 
          ? tempValues.completedDate 
          : (task.completedDate || '');  // Use empty string as fallback
        await onEdit(task.id, 'completedDate', completedDate);

        await onEdit(task.id, 'isActive', tempValues.isActive !== undefined ? tempValues.isActive : task.isActive);
        await onEdit(task.id, 'frequency', tempValues.frequency || task.frequency);
        await onEdit(task.id, 'notes', tempValues.notes !== undefined ? tempValues.notes : task.notes);
        
        if (tempValues.current !== undefined) {
          await onEdit(task.id, 'current', tempValues.current);
        }
        if (tempValues.goal !== undefined) {
          await onEdit(task.id, 'goal', tempValues.goal);
        }

        await onEdit(task.id, 'updatedAt', new Date().toISOString());
        await onEdit(task.id, 'updatedBy', user?.email || '');
        await onEdit(task.id, 'isEditing', false);

        setTempValues({});
        message.success('Changes saved successfully');
      } catch (error) {
        console.error('Error saving changes:', error);
        handleCancel();
        message.error('Failed to save changes');
      }
    } else {
      setOriginalValues({
        notes: task.notes,
        progress: task.progress,
        dueDate: task.dueDate,
        completedDate: task.completedDate,
        isActive: task.isActive,
        frequency: task.frequency,
        current: task.current,
        goal: task.goal,
      });
      onEdit(task.id, 'isEditing', true);
    }
  };

  const handleCancel = () => {
    if (originalValues.notes !== undefined) {
      onEdit(task.id, 'notes', originalValues.notes);
    }
    setTempValues({});
    onEdit(task.id, 'isEditing', false);
  };

  const handleTempChange = (field: keyof PlanTask, value: string | number | boolean) => {
    setTempValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotalProgress = (task: PlanTask) => {
    const historyTotal = (task.monthlyHistory || []).reduce((sum, month) => sum + month.current, 0);
    const currentTotal = task.current || 0;
    return historyTotal + currentTotal;
  };

  return (
    <Collapse 
      style={{ marginBottom: '12px' }}
      expandIcon={() => null}
    >
      <Panel
        key={task.id}
        header={
          <Space size="middle" style={{ 
            width: '100%', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            minHeight: '68px'
          }}>
            <Space direction="vertical" size={0} style={{ flex: 1 }}>
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
            <Space align="center" size="large">
              {task.goal !== undefined && task.frequency === 'Monthly' && (
                <Space direction="vertical" size={2} align="center">
                  <Progress 
                    type="circle" 
                    percent={Math.round((task.current || 0) / task.goal * 100)} 
                    width={40}
                    format={(percent) => `${task.current || 0}/${task.goal}`}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>This Month</Text>
                  
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Total to Date: {calculateTotalProgress(task)}
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
              {task.notes && <Tooltip title="Has notes"><FileTextOutlined /></Tooltip>}
              <Tag color={pastelColors[task.progress]}>{task.progress}</Tag>
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
              value={tempValues.progress !== undefined ? tempValues.progress : task.progress}
              onChange={handleProgressChange}
              disabled={!task.isEditing}
            >
              <Option value="To Do">To Do</Option>
              <Option value="Doing">Doing</Option>
              <Option value="Done">Done</Option>
            </Select>
            <div>
              <Text strong>Due Date:</Text>
              <DatePicker
                value={tempValues.dueDate ? dayjs(tempValues.dueDate) : dayjs(task.dueDate)}
                onChange={(date) => handleTempChange('dueDate', date ? date.toISOString().split('T')[0] : '')}
                disabled={!task.isEditing}
              />
            </div>
            <div>
              <Text strong>Completed Date:</Text>
              <DatePicker
                value={tempValues.completedDate ? dayjs(tempValues.completedDate) : (task.completedDate ? dayjs(task.completedDate) : null)}
                onChange={(date) => handleTempChange('completedDate', date ? date.toISOString().split('T')[0] : '')}
                disabled={!task.isEditing}
              />
            </div>
          </Space>
          <Space>
            <Text strong>Active:</Text>
            <Switch
              checked={tempValues.isActive !== undefined ? tempValues.isActive : task.isActive}
              onChange={(checked) => handleTempChange('isActive', checked)}
              disabled={!task.isEditing}
            />
          </Space>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Frequency:</Text>
            <Select
              style={{ width: 120 }}
              value={tempValues.frequency !== undefined ? tempValues.frequency : task.frequency}
              onChange={(value) => handleTempChange('frequency', value)}
              disabled={!task.isEditing}
            >
              <Option value="Monthly">Monthly</Option>
              <Option value="One Time">One Time</Option>
              <Option value="As Needed">As Needed</Option>
            </Select>
          </Space>
          {(tempValues.frequency || task.frequency) === 'Monthly' && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Input
                  type="number"
                  value={tempValues.current !== undefined ? tempValues.current : task.current}
                  onChange={(e) => handleTempChange('current', parseInt(e.target.value))}
                  disabled={!task.isEditing}
                  style={{ width: 80 }}
                />
                <Text>/</Text>
                <Input
                  type="number"
                  value={tempValues.goal !== undefined ? tempValues.goal : task.goal}
                  onChange={(e) => handleTempChange('goal', parseInt(e.target.value))}
                  disabled={!task.isEditing}
                  style={{ width: 80 }}
                />
              </Space>
              <Progress percent={Math.min(((tempValues.current || task.current || 0) / (tempValues.goal || task.goal || 1)) * 100, 100)} />
            </Space>
          )}
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Notes:</Text>
            <Input.TextArea
              value={tempValues.notes !== undefined ? tempValues.notes : task.notes}
              onChange={(e) => handleTempChange('notes', e.target.value)}
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
  setSelectedCustomer: (customer: ICustomer | null) => void;
}

const LoadingSpinner = () => (
  <div style={{ 
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000
  }}>
    <Space direction="vertical" size="large" align="center">
      <Spin size="large" />
      <Text>Loading plans...</Text>
    </Space>
  </div>
);

const PlanComponent: React.FC<PlanProps> = ({ customers, selectedCustomer, setSelectedCustomer }) => {
  const { isAdmin, user } = useAuth();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'none'>('none');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [progressFilter, setProgressFilter] = useState<'All' | 'To Do' | 'Doing' | 'Done'>('To Do');
  const { fetchPlan, updatePlan, updateTask, checkMonthlyProgress } = usePlan();
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [newTaskModal, setNewTaskModal] = useState({
    visible: false,
    sectionTitle: '',
    taskName: ''
  });
  const [defaultSections, setDefaultSections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<{
    type: 'single' | 'all';
    selectedCustomer: ICustomer | null;
    data: { [customerId: string]: Plan };
  }>({
    type: 'all',
    selectedCustomer: null,
    data: {}
  });

  // Add cache state
  const [cachedPlans, setCachedPlans] = useState<{ [customerId: string]: Plan }>({});

  // Add loading state for sections
  const [loadingSections, setLoadingSections] = useState<{ [key: string]: boolean }>({});

  // Add new state for due date filter
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'overdue' | 'thisWeek'>('thisWeek');

  // Add helper functions for date checks
  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;  // Tasks with no due date can't be overdue
    const today = dayjs().startOf('day');
    const dueDay = dayjs(dueDate).startOf('day');
    return dueDay.isBefore(today);  // Task is overdue if due date is before today
  };

  const isDueThisWeek = (dueDate: string | null) => {
    if (!dueDate) return false;  // Tasks with no due date aren't due this week
    const today = dayjs().startOf('day');
    const dueDay = dayjs(dueDate).startOf('day');
    const endOfWeek = today.add(7, 'days').endOf('day');
    
    // Task is due this week if:
    // 1. Due date is today or after today
    // 2. Due date is before end of week
    return !dueDay.isBefore(today) && dueDay.isBefore(endOfWeek);
  };

  useEffect(() => {
    console.log('Due Date Filter:', dueDateFilter);
    console.log('Active Only:', showActiveOnly);
    console.log('Progress Filter:', progressFilter);
  }, [dueDateFilter, showActiveOnly, progressFilter]);

  // Move loadPlan outside useEffect and make it reusable
  const loadPlan = async () => {
    try {
      const customerId = isAdmin ? selectedCustomer?.id : user?.id;
      
      if (!customerId || !selectedCustomer) {
        console.log('No customer selected, skipping plan load');
        return;
      }
      
      console.log('Loading plan for customer:', customerId);
      
      // Get the plan
      const planRef = doc(db, 'plans', customerId);
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        console.log('No plan exists, creating new one');
        const plan = await fetchPlan(customerId);
        setSections(plan.sections);
        return;
      }

      // Plan exists, get its data
      const plan = planDoc.data() as Plan;
      
      // Check monthly progress
      await checkMonthlyProgress(customerId);
      
      // Get updated plan after monthly check
      const updatedPlanDoc = await getDoc(planRef);
      const updatedPlan = updatedPlanDoc.data() as Plan;
      
      setSections(updatedPlan.sections);
    } catch (error) {
      console.error('Error loading plan:', error);
    }
  };

  // Update useEffect to use the new loadPlan function
  useEffect(() => {
    let isMounted = true;

    const customerId = isAdmin ? selectedCustomer?.id : user?.id;
    if (customerId && selectedCustomer && !plans.data[customerId]) {  // Only load if we don't have the data
      loadPlan();
    }

    return () => {
      isMounted = false;
    };
  }, [isAdmin, selectedCustomer?.id, user?.id]);

  useEffect(() => {
    const fetchDefaultSections = async () => {
      const rulesRef = doc(db, 'planTaskRules', 'default');
      const rulesDoc = await getDoc(rulesRef);
      if (rulesDoc.exists()) {
        const rules = rulesDoc.data();
        setDefaultSections(rules.sections);
      }
    };

    fetchDefaultSections();
  }, []);

  const handleCellEdit = async (taskId: string, field: keyof PlanTask, value: any) => {
    try {
      if (!selectedCustomer) return;

      // Use local sections state instead of fetching
      const updatedSections = sections.map(section => ({
        ...section,
        tasks: section.tasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              [field]: value
            };
          }
          return task;
        })
      }));

      // Update Firestore with the modified sections
      const planRef = doc(db, 'plans', selectedCustomer.id);
      await updateDoc(planRef, {
        sections: updatedSections
      });

      // Update local state
      setSections(updatedSections);

    } catch (error) {
      console.error('Error updating task:', error);
      message.error('Failed to update task');
      loadPlan();
    }
  };

  const filterTasks = (task: PlanTask) => {
    console.log(`Task: ${task.task}, Due Date: ${task.dueDate}`);
    if (task.dueDate) {
      console.log('Is Overdue:', isOverdue(task.dueDate));
      console.log('Is Due This Week:', isDueThisWeek(task.dueDate));
    }

    const baseFilters = 
      (!showActiveOnly || task.isActive) &&
      (progressFilter === 'All' || task.progress === progressFilter) &&
      task.task.toLowerCase().includes(search.toLowerCase());

    if (!baseFilters) return false;

    switch (dueDateFilter) {
      case 'overdue':
        return isOverdue(task.dueDate);
      case 'thisWeek':
        return isDueThisWeek(task.dueDate);
      default:
        return true;
    }
  };

  const filteredSections = sections
    .map(section => ({
      ...section,
      tasks: section.tasks.filter(filterTasks)
    }))
    .filter(section => section.tasks.length > 0);

  const sortedSections = filteredSections.map(section => ({
    ...section,
    tasks: sortBy === 'dueDate' 
      ? [...section.tasks].sort((a, b) => {
          // Handle null due dates
          if (!a.dueDate) return 1;  // Move null dates to end
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        })
      : section.tasks
  }));

  const handleAddTask = (sectionTitle: string) => {
    setNewTaskModal({
      visible: true,
      sectionTitle,
      taskName: ''
    });
  };

  const handleCreateTask = async () => {
    if (!selectedCustomer || !newTaskModal.taskName.trim()) return;

    try {
      const newTask: PlanTask = {
        id: `custom-${Date.now()}`,
        task: newTaskModal.taskName.trim(),
        progress: 'To Do' as const,
        isActive: true,
        notes: '',
        frequency: 'One Time',
        dueDate: null,
        completedDate: null,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || '',
        current: 0,
        goal: 0,
      };

      const planRef = doc(db, 'plans', selectedCustomer.id);
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        throw new Error('Plan not found');
      }

      const updatedSections = sections.map(section => {
        if (section.title === newTaskModal.sectionTitle) {
          return {
            ...section,
            tasks: [...section.tasks, newTask]
          };
        }
        return section;
      });

      await updateDoc(planRef, {
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      });

      setSections(updatedSections);
      setNewTaskModal({ visible: false, sectionTitle: '', taskName: '' });
      message.success('Task added successfully');
    } catch (error) {
      console.error('Error adding new task:', error);
      message.error('Failed to add task');
    }
  };

  const fetchAllPlans = async () => {
    const plans: { [customerId: string]: Plan } = {};
    const paidCustomers = customers.filter(c => c.customer_type === 'Paid');
    
    // Fetch all plans in parallel
    await Promise.all(
      paidCustomers.map(async (customer) => {
        const planRef = doc(db, 'plans', customer.id);
        const planDoc = await getDoc(planRef);
        
        if (planDoc.exists()) {
          plans[customer.id] = planDoc.data() as Plan;
        }
      })
    );
    
    return plans;
  };

  // Add state for dropdown value
  const [selectedValue, setSelectedValue] = useState<string>('all-paid');

  // Add this state to track if we're switching to all customers
  const [switchingToAll, setSwitchingToAll] = useState(false);

  // At the top of the component, log when plans state changes
  useEffect(() => {
    console.log('Plans state changed:', {
      type: plans.type,
      customersCount: Object.keys(plans.data).length,
      selectedCustomer: selectedCustomer?.store_name
    });
  }, [plans, selectedCustomer]);

  useEffect(() => {
    const loadAllPlans = async () => {
      try {
        setIsLoading(true);
        
        const newPlans: { [customerId: string]: Plan } = {};
        const paidCustomers = customers.filter(c => c.customer_type === 'Paid');
        
        await Promise.all(
          paidCustomers.map(async (customer) => {
            const planRef = doc(db, 'plans', customer.id);
            const planDoc = await getDoc(planRef);
            
            if (planDoc.exists()) {
              newPlans[customer.id] = planDoc.data() as Plan;
            }
          })
        );

        setPlans({
          type: 'all',
          selectedCustomer: null,
          data: newPlans
        });
      } catch (error) {
        console.error('Error loading all plans:', error);
        message.error('Failed to load plans');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllPlans();
  }, [customers]); // Only run when customers list changes

  if (!isAdmin) {
    return (
      <Layout>
        <Content style={{ padding: '16px' }}>
          <Card>
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
                  key={task.id}
                  task={task}
                  editMode={editMode}
                  onEdit={handleCellEdit}
                  customer={null}
                />
              ))}
            </Card>
          ))}
        </Content>
      </Layout>
    );
  }

  return (
    <Layout>
      <Content style={{ padding: '16px' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Title level={4}>Select Customer</Title>
            <Select
              style={{ width: '300px' }}
              placeholder="Select a customer"
              value={selectedCustomer ? selectedCustomer.id : plans.type === 'all' ? 'all-paid' : undefined}
              onChange={async (value) => {
                try {
                  setIsLoading(true);
                  
                  if (value === 'all-paid') {
                    // Handle all customers view
                    const newPlans: { [customerId: string]: Plan } = {};
                    const paidCustomers = customers.filter(c => c.customer_type === 'Paid');
                    
                    await Promise.all(
                      paidCustomers.map(async (customer) => {
                        const planRef = doc(db, 'plans', customer.id);
                        const planDoc = await getDoc(planRef);
                        
                        if (planDoc.exists()) {
                          newPlans[customer.id] = planDoc.data() as Plan;
                        }
                      })
                    );

                    setPlans({
                      type: 'all',
                      selectedCustomer: null,
                      data: newPlans
                    });
                    setSelectedCustomer(null);
                  } else {
                    // Handle individual customer selection
                    const customer = customers
                      .filter(c => c.customer_type === 'Paid')
                      .find((c) => c.id === value);
                    
                    setSelectedCustomer(customer || null);
                    setPlans({
                      type: 'single',
                      selectedCustomer: customer || null,
                      data: {}
                    });
                  }
                } catch (error) {
                  console.error('Error switching views:', error);
                  message.error('Failed to switch views');
                } finally {
                  setIsLoading(false);
                }
              }}
              size="large"
              listHeight={400}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Select.Option key="all-paid" value="all-paid">
                All Paid Customers
              </Select.Option>
              <Select.Option key="divider" disabled>
                ──────────────
              </Select.Option>
              {customers
                .filter(customer => customer.customer_type === 'Paid')
                .map((customer) => (
                  <Select.Option 
                    key={customer.id} 
                    value={customer.id}
                    label={`${customer.store_name} - ${customer.store_owner_name}`}
                  >
                    <Space>
                      {customer.logo && (
                        <img 
                          src={customer.logo} 
                          alt={customer.store_name} 
                          style={{ width: 20, height: 20, borderRadius: '50%' }} 
                        />
                      )}
                      {customer.store_name} - {customer.store_owner_name}
                    </Space>
                  </Select.Option>
                ))}
            </Select>
            {selectedCustomer && (
              <Text type="secondary">
                <CalendarOutlined /> Date Joined: {selectedCustomer.date_joined}
              </Text>
            )}
          </Space>
        </Card>

        {/* Always show filters */}
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
            <Select
              style={{ width: 150 }}
              value={dueDateFilter}
              onChange={(value: 'all' | 'overdue' | 'thisWeek') => setDueDateFilter(value)}
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

        {isLoading && <LoadingSpinner />}

        {!selectedCustomer && plans.type === 'all' ? (
          defaultSections.map(sectionTitle => {
            console.log(`Rendering section ${sectionTitle}:`, {
              viewType: plans.type,
              hasPlans: Object.keys(plans.data).length > 0
            });

            if (plans.type === 'all') {
              console.log('🟢 ENTERING ALL PLANS VIEW');
              console.log('Available plans:', Object.keys(plans.data).map(id => {
                const customer = customers.find(c => c.id === id);
                return customer?.store_name;
              }));
              
              // Get all tasks for this section from all customers
              const allTasks = Object.entries(plans.data).flatMap(([customerId, plan]) => {
                console.log(`Processing customer ${customerId}`);
                const customer = customers.find(c => c.id === customerId);
                if (!customer) {
                  console.log('Customer not found');
                  return [];
                }

                const section = plan.sections.find((s: PlanSection) => s.title === sectionTitle);
                if (!section) {
                  console.log(`Section ${sectionTitle} not found`);
                  return [];
                }

                console.log(`Found ${section.tasks.length} tasks in section ${sectionTitle}`);
                return section.tasks
                  .filter((task: PlanTask) => {
                    const baseFilters = 
                      (!showActiveOnly || task.isActive) &&
                      (progressFilter === 'All' || task.progress === progressFilter) &&
                      task.task.toLowerCase().includes(search.toLowerCase());

                    switch (dueDateFilter) {
                      case 'overdue':
                        return baseFilters && isOverdue(task.dueDate);
                      case 'thisWeek':
                        return baseFilters && isDueThisWeek(task.dueDate);
                      default:
                        return baseFilters;
                    }
                  })
                  .map(task => ({ customer, task }));
              });

              console.log(`Total tasks after filtering: ${allTasks.length}`);

              // Only show section if it has tasks after filtering
              if (allTasks.length === 0) {
                console.log(`No tasks in section ${sectionTitle} after filtering`);
                return null;
              }

              return (
                <Card key={sectionTitle} style={{ marginTop: 16 }}>
                  <Title level={4}>{sectionTitle}</Title>
                  {allTasks.map(({ customer, task }) => (
                    <TaskCard
                      key={`${customer.id}-${task.id}`}
                      task={task}
                      editMode={editMode}
                      onEdit={async (taskId, field, value) => {
                        // Update the task without switching views
                        try {
                          const planRef = doc(db, 'plans', customer.id);
                          const planDoc = await getDoc(planRef);
                          
                          if (planDoc.exists()) {
                            const planData = planDoc.data() as Plan;
                            const updatedSections = planData.sections.map(section => ({
                              ...section,
                              tasks: section.tasks.map(t => {
                                if (t.id === taskId) {
                                  return { ...t, [field]: value };
                                }
                                return t;
                              })
                            }));

                            await updateDoc(planRef, { sections: updatedSections });

                            // Update the plans state without changing the view
                            setPlans(prev => ({
                              ...prev,
                              data: {
                                ...prev.data,
                                [customer.id]: { ...prev.data[customer.id], sections: updatedSections }
                              }
                            }));
                          }
                        } catch (error) {
                          console.error('Error updating task:', error);
                          message.error('Failed to update task');
                        }
                      }}
                      customer={customer}
                    />
                  ))}
                </Card>
              );
            } else {
              console.log('🔵 ENTERING SINGLE CUSTOMER VIEW');
              const customer = selectedCustomer as ICustomer | null;
              if (!customer) return null;
              
              const customerId = customer.id;
              if (!plans.data[customerId]) return null;

              const section = plans.data[customerId].sections
                .find((s: PlanSection) => s.title === sectionTitle);
              
              if (!section) return null;

              const filteredTasks = section.tasks.filter(filterTasks);

              if (filteredTasks.length === 0) return null;

              return (
                <Card key={sectionTitle} style={{ marginTop: 16 }}>
                  <Title level={4}>{sectionTitle}</Title>
                  {filteredTasks.map((task: PlanTask) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      editMode={editMode}
                      onEdit={handleCellEdit}
                      customer={customer}
                    />
                  ))}
                </Card>
              );
            }
          })
        ) : (
          sortedSections.map((section) => (
            <Card key={section.title} style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4}>{section.title}</Title>
                {plans.type !== 'all' && (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => handleAddTask(section.title)}
                  >
                    Add Task
                  </Button>
                )}
              </div>
              {section.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  editMode={editMode}
                  onEdit={handleCellEdit}
                  customer={selectedCustomer}
                />
              ))}
            </Card>
          ))
        )}
      </Content>
    </Layout>
  );
};

export default PlanComponent;