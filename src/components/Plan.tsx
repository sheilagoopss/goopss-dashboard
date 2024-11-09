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
  UserOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../hooks/usePlan'
import { PlanSection, PlanTask } from '../types/Plan'
import { ICustomer } from '../types/Customer'
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'
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
    type: 'single',
    selectedCustomer: null,
    data: {}
  });

  // Add cache state
  const [cachedPlans, setCachedPlans] = useState<{
    single: { customer: ICustomer | null; plan: Plan | null };
    all: { [customerId: string]: Plan };
  }>({
    single: { customer: null, plan: null },
    all: {}
  });

  // Add loading state for sections
  const [loadingSections, setLoadingSections] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    let isMounted = true;

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
          if (isMounted) {
            setSections(plan.sections);
          }
          return;
        }

        // Plan exists, get its data
        const plan = planDoc.data() as Plan;
        
        // Check monthly progress
        await checkMonthlyProgress(customerId);
        
        // Get updated plan after monthly check
        const updatedPlanDoc = await getDoc(planRef);
        const updatedPlan = updatedPlanDoc.data() as Plan;
        
        if (isMounted) {
          setSections(updatedPlan.sections);
        }
      } catch (error) {
        console.error('Error loading plan:', error);
      }
    };

    const customerId = isAdmin ? selectedCustomer?.id : user?.id;
    if (customerId && selectedCustomer) {
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

  const handleCellEdit = async (key: string, field: keyof PlanTask, value: string | boolean | number | null) => {
    if (!selectedCustomer) return;

    try {
      const sectionTitle = sections.find(section => 
        section.tasks.some(task => task.id === key)
      )?.title;

      if (!sectionTitle) return;

      await updateTask(selectedCustomer.id, sectionTitle, key, { 
        [field]: value,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || ''
      });

      setSections(prevSections =>
        prevSections.map(section => ({
          ...section,
          tasks: section.tasks.map(task =>
            task.id === key ? { 
              ...task, 
              [field]: value,
              updatedAt: new Date().toISOString(),
              updatedBy: user?.email || ''
            } : task
          )
        }))
      );

      if (field === 'isEditing') {
        setEditMode(!!value);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      message.error('Failed to update task');
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
        progress: 'To Do',
        isActive: true,
        notes: '',
        frequency: 'One Time',
        dueDate: null,
        isEditing: false,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || '',
        current: 0,
        goal: 0,
        completedDate: ''
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
                  editMode={false}
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
              style={{ width: '100%' }}
              placeholder="Select a customer"
              value={plans.type === 'all' ? 'all-paid' : selectedCustomer?.id}
              onChange={async (value) => {
                try {
                  setIsLoading(true);
                  
                  if (value === 'all-paid') {
                    setIsLoading(true);
                    const plans = await fetchAllPlans();
                    setPlans({
                      type: 'all',
                      selectedCustomer: null,
                      data: plans
                    });
                  } else {
                    // Handle single customer selection
                    const customer = customers
                      .filter(c => c.customer_type === 'Paid')
                      .find((c) => c.id === value);
                    
                    if (customer) {
                      // Cache current view before switching
                      if (plans.type === 'all') {
                        setCachedPlans(prev => ({ ...prev, all: plans.data }));
                      }
                      
                      const planRef = doc(db, 'plans', customer.id);
                      const planDoc = await getDoc(planRef);
                      
                      if (planDoc.exists()) {
                        const planData = planDoc.data() as Plan;
                        setCachedPlans(prev => ({
                          ...prev,
                          single: { customer, plan: planData }
                        }));
                        setSelectedCustomer(customer);
                        setPlans({
                          type: 'single',
                          selectedCustomer: customer,
                          data: { [customer.id]: planData }
                        });
                      }
                    }
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
              <Select.Option 
                key="all-paid"
                value="all-paid"
                label="All Paid Customers"
              >
                <Space>
                  <UserOutlined />
                  All Paid Customers
                </Space>
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
                    label={`${customer.store_owner_name} - ${customer.store_name}`}
                  >
                    <Space>
                      {customer.logo && (
                        <img 
                          src={customer.logo} 
                          alt={customer.store_name} 
                          style={{ width: 20, height: 20, borderRadius: '50%' }} 
                        />
                      )}
                      {customer.store_owner_name} - {customer.store_name}
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
          // Show all paid customers' tasks grouped by section
          defaultSections.map(sectionTitle => {
            // For "all customers" view
            if (plans.type === 'all') {
              const allTasks = Object.entries(plans.data)
                .flatMap(([customerId, plan]) => {
                  const customer = customers.find(c => c.id === customerId);
                  if (!customer) return [];

                  const section = plan.sections.find((s: PlanSection) => s.title === sectionTitle);
                  if (!section) return [];

                  return section.tasks
                    .filter((task: PlanTask) => 
                      (!showActiveOnly || task.isActive) &&
                      (progressFilter === 'All' || task.progress === progressFilter) &&
                      task.task.toLowerCase().includes(search.toLowerCase())
                    )
                    .map(task => ({ customer, task }));
                });

              // Only render section if it has tasks after filtering
              if (allTasks.length === 0) return null;

              return (
                <Card key={sectionTitle} style={{ marginTop: 16 }}>
                  <Title level={4}>{sectionTitle}</Title>
                  {allTasks
                    .sort((a, b) => a.task.id.localeCompare(b.task.id))
                    .map(({ customer, task }) => (
                      <TaskCard
                        key={`${customer.id}-${task.id}`}
                        task={task}
                        editMode={false}
                        onEdit={handleCellEdit}
                        customer={customer}
                      />
                    ))}
                </Card>
              );
            } else {
              // For single customer view
              const customer = selectedCustomer as ICustomer | null;
              if (!customer) return null;
              
              const customerId = customer.id;
              if (!plans.data[customerId]) return null;

              const section = plans.data[customerId].sections
                .find((s: PlanSection) => s.title === sectionTitle);
              
              if (!section) return null;

              const filteredTasks = section.tasks.filter((task: PlanTask) =>
                (!showActiveOnly || task.isActive) &&
                (progressFilter === 'All' || task.progress === progressFilter) &&
                task.task.toLowerCase().includes(search.toLowerCase())
              );

              // Only render section if it has tasks after filtering
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
          // Show individual customer tasks
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