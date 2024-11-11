'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  Spin,
  Pagination,
  Avatar
} from 'antd'
import { 
  CalendarOutlined, 
  CheckCircleOutlined, 
  EditOutlined, 
  FileTextOutlined,
  SortAscendingOutlined,
  UserOutlined,
  WarningOutlined,
  ReloadOutlined
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
  onEdit: (taskId: string, field: keyof PlanTask, value: any, customerId: string) => void;
  customer: ICustomer | null | undefined;
  sections: PlanSection[];
  updateTask: (customerId: string, sectionTitle: string, taskId: string, updates: Partial<PlanTask>) => Promise<void>;
  isOverdue: (dueDate: string | null) => boolean;
}

const dropdownStyle = {
  height: '50px',
  fontSize: '16px'
};

const TaskCard: React.FC<TaskCardProps> = ({ task, editMode, onEdit, customer, sections, updateTask, isOverdue }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
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
    console.log('Edit clicked, isEditing:', isEditing, 'Customer:', customer);
    
    if (isEditing) {
      try {
        if (!customer) {
          console.error('No customer found');
          return;
        }

        console.log('Saving changes for customer:', customer.id);

        const updates = {
          ...tempValues,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || ''
        };

        await onEdit(task.id, 'task', updates, customer.id);

        setIsEditing(false);
        setTempValues({});
        message.success('Changes saved successfully');
      } catch (error) {
        console.error('Error saving changes:', error);
        message.error('Failed to save changes');
      }
    } else {
      console.log('Starting edit mode for task:', task.id, 'in plan:', customer?.id);
      setIsEditing(true);
      setTempValues({
        progress: task.progress,
        dueDate: task.dueDate,
        completedDate: task.completedDate,
        isActive: task.isActive,
        frequency: task.frequency,
        current: task.current,
        goal: task.goal,
        notes: task.notes
      });
    }
  };

  const handleCancel = () => {
    setTempValues({});
    setIsEditing(false);
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
            alignItems: 'flex-start'
          }}>
            <Space direction="vertical" size={4}>
              <Text strong>{task.task}</Text>
              {customer && (
                <Space>
                  {customer.logo && (
                    <Avatar
                      src={customer.logo}
                      alt={customer.store_name}
                      size="small"
                      icon={customer.logo ? undefined : customer.store_name[0]}
                    />
                  )}
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {customer.store_name}
                    {customer.date_joined && (
                      <span style={{ marginLeft: 8 }}>
                        <CalendarOutlined /> {dayjs(customer.date_joined).format('MMM DD YYYY')}
                      </span>
                    )}
                  </Text>
                  {task.notes && <FileTextOutlined style={{ color: '#8c8c8c' }} />}
                </Space>
              )}
            </Space>
            <Space>
              {(task.frequency === 'Monthly' || task.frequency === 'As Needed') && (
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
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Total: {calculateTotalProgress(task)}
                  </Text>
                </Space>
              )}
              <Tag color={pastelColors[task.progress]}>
                {task.progress}
              </Tag>
              <Space direction="vertical" size={2}>
                {task.dueDate && (
                  <Tooltip title={isOverdue(task.dueDate) ? 'Overdue' : 'Due date'}>
                    <Tag color={isOverdue(task.dueDate) ? 'red' : 'blue'}>
                      <CalendarOutlined /> Due: {dayjs(task.dueDate).format('MMM DD')}
                    </Tag>
                  </Tooltip>
                )}
                {task.progress === 'Done' && task.completedDate && (
                  <Tooltip title="Completed date">
                    <Tag color="green">
                      <CheckCircleOutlined /> Done: {dayjs(task.completedDate).format('MMM DD')}
                    </Tag>
                  </Tooltip>
                )}
              </Space>
            </Space>
          </Space>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <Space>
            {isEditing ? (
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
              disabled={!isEditing}
            >
              <Option value="To Do">To Do</Option>
              <Option value="Doing">Doing</Option>
              <Option value="Done">Done</Option>
            </Select>
            <div>
              <Text strong>Due Date:</Text>
              <DatePicker
                value={tempValues.dueDate ? dayjs(tempValues.dueDate) : (task.dueDate ? dayjs(task.dueDate) : null)}
                onChange={(date) => handleTempChange('dueDate', date ? date.format('YYYY-MM-DD') : '')}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Text strong>Completed Date:</Text>
              <DatePicker
                value={tempValues.completedDate ? dayjs(tempValues.completedDate) : (task.completedDate ? dayjs(task.completedDate) : null)}
                onChange={(date) => handleTempChange('completedDate', date ? date.format('YYYY-MM-DD') : '')}
                disabled={!isEditing}
              />
            </div>
          </Space>
          <Space>
            <Text strong>Active:</Text>
            <Switch
              checked={tempValues.isActive !== undefined ? tempValues.isActive : task.isActive}
              onChange={(checked) => handleTempChange('isActive', checked)}
              disabled={!isEditing}
            />
          </Space>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Frequency:</Text>
            <Select
              style={{ width: 120 }}
              value={tempValues.frequency !== undefined ? tempValues.frequency : task.frequency}
              onChange={(value) => handleTempChange('frequency', value)}
              disabled={!isEditing}
            >
              <Option value="Monthly">Monthly</Option>
              <Option value="One Time">One Time</Option>
              <Option value="As Needed">As Needed</Option>
            </Select>
          </Space>
          {(task.frequency === 'Monthly' || task.frequency === 'As Needed') && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Text>Progress:</Text>
                <Input
                  type="number"
                  value={tempValues.current !== undefined ? tempValues.current : task.current}
                  onChange={(e) => handleTempChange('current', parseInt(e.target.value))}
                  disabled={!isEditing}
                  style={{ width: 80 }}
                />
                <Text>/</Text>
                <Input
                  type="number"
                  value={tempValues.goal !== undefined ? tempValues.goal : task.goal}
                  onChange={(e) => handleTempChange('goal', parseInt(e.target.value))}
                  disabled={!isEditing}
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
              disabled={!isEditing}
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

// Add type definitions at the top
type FrequencyFilterType = 'All' | 'One Time' | 'Monthly' | 'As Needed' | 'Monthly and As Needed';

interface SavedFilters {
  showActiveOnly: boolean;
  progressFilter: 'All' | 'To Do' | 'Doing' | 'Done';
  dueDateFilter: 'all' | 'overdue' | 'thisWeek';
  search: string;
  searchInput: string;  // Add this for search input
  sortBy: 'dueDate' | 'none';
  frequencyFilter: FrequencyFilterType;
}

// Add helper functions at the top
const saveFiltersToStorage = (filters: SavedFilters) => {
  localStorage.setItem('planFilters', JSON.stringify(filters));
};

const getFiltersFromStorage = (): SavedFilters | null => {
  const saved = localStorage.getItem('planFilters');
  return saved ? JSON.parse(saved) : null;
};

// Add PlansState interface at the top with other interfaces
interface PlansState {
  type: 'all' | 'single';
  selectedCustomer: ICustomer | null;
  data: { [customerId: string]: Plan };
}

// Add debounce utility at the top
const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const PlanComponent: React.FC<PlanProps> = ({ customers, selectedCustomer, setSelectedCustomer }) => {
  const { isAdmin, user } = useAuth();
  const { fetchPlan, updatePlan, updateTask, checkMonthlyProgress } = usePlan();
  const savedFilters = getFiltersFromStorage();

  // Constants
  const CACHE_DURATION = 2 * 60 * 1000;  // 2 minutes
  const pageSize = 10;

  // All state declarations
  const [showActiveOnly, setShowActiveOnly] = useState(savedFilters?.showActiveOnly ?? false);
  const [progressFilter, setProgressFilter] = useState<'All' | 'To Do' | 'Doing' | 'Done'>(savedFilters?.progressFilter ?? 'All');
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'overdue' | 'thisWeek'>(savedFilters?.dueDateFilter ?? 'all');
  const [searchInput, setSearchInput] = useState(savedFilters?.searchInput ?? '');
  const [search, setSearch] = useState(savedFilters?.search ?? '');
  const [sortBy, setSortBy] = useState<'dueDate' | 'none'>(savedFilters?.sortBy ?? 'none');
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilterType>(savedFilters?.frequencyFilter ?? 'All');
  const [paginationState, setPaginationState] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [plans, setPlans] = useState<PlansState>({ 
    type: 'all',  // Default to 'all' view
    selectedCustomer: null, 
    data: {} 
  });
  const [cachedPlans, setCachedPlans] = useState<{ [customerId: string]: Plan }>({});
  const [lastCacheUpdate, setLastCacheUpdate] = useState<number>(Date.now());
  const [editMode, setEditMode] = useState(false);
  const [defaultSections, setDefaultSections] = useState<string[]>([]);
  const [newTaskModal, setNewTaskModal] = useState<{
    visible: boolean;
    sectionTitle: string;
    taskName: string;
  }>({ visible: false, sectionTitle: '', taskName: '' });

  // Helper functions
  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = dayjs().startOf('day');
    const dueDay = dayjs(dueDate).startOf('day');
    return dueDay.isBefore(today);
  };

  const isDueThisWeek = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = dayjs().startOf('day');
    const dueDay = dayjs(dueDate).startOf('day');
    return dueDay.isAfter(today) && dueDay.isBefore(today.add(7, 'day'));
  };

  // Single loadAllPlans function
  const loadAllPlans = async () => {
    try {
      setIsLoading(true);
      
      // Check cache validity
      const isCacheValid = Date.now() - lastCacheUpdate < CACHE_DURATION;
      if (isCacheValid && Object.keys(cachedPlans).length > 0) {
        console.log('Using cached plans');
        setPlans({
          type: 'all',
          selectedCustomer: null,  // No selected customer in all views
          data: cachedPlans
        });
        setIsLoading(false);
        return;
      }

      // Fetch fresh data
      const customersRef = collection(db, 'customers');
      const customersSnapshot = await getDocs(customersRef);
      const paidCustomers = customersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ICustomer))
        .filter(customer => customer.customer_type === 'Paid');

      const plansPromises = paidCustomers.map(customer => 
        getDoc(doc(db, 'plans', customer.id))
      );
      const plansSnapshots = await Promise.all(plansPromises);

      const plansData = plansSnapshots.reduce((acc, planDoc, index) => {
        if (planDoc.exists()) {
          acc[paidCustomers[index].id] = planDoc.data() as Plan;
        }
        return acc;
      }, {} as { [customerId: string]: Plan });

      // Update cache
      setCachedPlans(plansData);
      setLastCacheUpdate(Date.now());

      // Set plans while preserving selected customer
      setPlans({
        type: 'all',
        selectedCustomer: null,  // No selected customer in all views
        data: plansData
      });
    } catch (error) {
      console.error('Error loading plans:', error);
      message.error('Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  // Then useEffects
  useEffect(() => {
    console.log('Filters changed:', {
      showActiveOnly,
      progressFilter,
      dueDateFilter,
      search,
      sortBy,
      frequencyFilter
    });
  }, [showActiveOnly, progressFilter, dueDateFilter, search, sortBy, frequencyFilter]);

  // Add render log
  console.log('Plan component rendered at:', new Date().toISOString());

  // Add log for selectedCustomer changes
  useEffect(() => {
    console.log('selectedCustomer changed:', selectedCustomer?.id);
  }, [selectedCustomer]);

  // Add log for plans changes
  useEffect(() => {
    console.log('plans state changed:', {
      type: plans.type,
      customerId: plans.selectedCustomer?.id,
      numberOfPlans: Object.keys(plans.data).length
    });
  }, [plans]);

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

  const onEdit = async (taskId: string, field: keyof PlanTask, value: any, planId: string) => {
    try {
      console.log('onEdit called:', { taskId, field, planId });

      // Get current plan data
      const planRef = doc(db, 'plans', planId);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        console.error('Plan not found:', planId);
        return;
      }

      const plan = planDoc.data() as Plan;
      const updatedSections = plan.sections.map(section => ({
        ...section,
        tasks: section.tasks.map(task => {
          if (task.id === taskId) {
            if (field === 'task' && typeof value === 'object') {
              return { ...task, ...value };
            }
            return { ...task, [field]: value };
          }
          return task;
        })
      }));

      // Update Firestore
      await updateDoc(planRef, { sections: updatedSections });
      console.log('Firestore updated for plan:', planId);

      // Update local state
      if (plans.type === 'all') {
        setPlans((prevPlans: PlansState) => ({
          ...prevPlans,
          data: {
            ...prevPlans.data,
            [planId]: {
              ...prevPlans.data[planId],
              sections: updatedSections
            }
          }
        }));
      }
      setSections(updatedSections);
      console.log('Local state updated');

    } catch (error) {
      console.error('Error in onEdit:', error);
      message.error('Failed to save changes');
    }
  };

  // Update the filterTasks function to include frequency filter
  const filterTasks = (task: PlanTask) => {
    console.log('Filtering task:', {
      task: task.task,
      frequency: task.frequency,
      selectedFilter: frequencyFilter,
      matches: frequencyFilter === 'All' || 
        (frequencyFilter === 'Monthly and As Needed' 
          ? (task.frequency === 'Monthly' || task.frequency === 'As Needed')
          : task.frequency === frequencyFilter)
    });

    const baseFilters = 
      (!showActiveOnly || task.isActive) &&
      (progressFilter === 'All' || task.progress === progressFilter) &&
      task.task.toLowerCase().includes(search.toLowerCase());

    const frequencyMatches = 
      frequencyFilter === 'All' || 
      (frequencyFilter === 'Monthly and As Needed' 
        ? (task.frequency === 'Monthly' || task.frequency === 'As Needed')
        : task.frequency === frequencyFilter);

    if (!baseFilters || !frequencyMatches) return false;

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
          // Handle null or empty due dates
          if (!a.dueDate && !b.dueDate) return 0;  // Both null, keep order
          if (!a.dueDate) return 1;  // Move null dates to end
          if (!b.dueDate) return -1;  // Move null dates to end

          // Compare dates for earliest first
          const dateA = dayjs(a.dueDate);
          const dateB = dayjs(b.dueDate);
          return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
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

  // Add loadPlan function
  const loadPlan = async () => {
    try {
      console.log('loadPlan called for customer:', selectedCustomer?.id);
      setIsLoading(true);
      const customerId = selectedCustomer?.id;
      
      if (!customerId) {
        console.log('No customer selected, skipping load');
        return;
      }

      const planRef = doc(db, 'plans', customerId);
      console.log('Fetching plan from Firestore');
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        console.log('No plan exists');
        return;
      }

      const plan = planDoc.data() as Plan;
      console.log('Plan loaded successfully');
      setSections(plan.sections);
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add handleResetFilters function
  const handleResetFilters = () => {
    setShowActiveOnly(false);
    setProgressFilter('All');
    setDueDateFilter('all');
    setSearch('');
    setSortBy('none');
    setFrequencyFilter('All');
    setPaginationState({});
  };

  // Add useEffect to save filters
  useEffect(() => {
    const filtersToSave = {
      showActiveOnly,
      progressFilter,
      dueDateFilter,
      search,
      searchInput,
      sortBy,
      frequencyFilter
    };
    console.log('Saving filters:', filtersToSave);
    saveFiltersToStorage(filtersToSave);
  }, [showActiveOnly, progressFilter, dueDateFilter, search, searchInput, sortBy, frequencyFilter]);

  // Update the view switching logic
  const handleViewChange = async (viewType: 'all' | 'single') => {
    try {
      // Save current filter states
      const currentFilters = {
        showActiveOnly,
        progressFilter,
        dueDateFilter,
        search,
        searchInput,
        sortBy,
        frequencyFilter
      };
      console.log('Preserving filters:', currentFilters);

      if (viewType === 'all') {
        setSelectedCustomer(null);
        setPlans(prev => ({
          ...prev,
          type: 'all',
          selectedCustomer: null
        }));
        await loadAllPlans();

        // Restore filters after loading
        setShowActiveOnly(currentFilters.showActiveOnly);
        setProgressFilter(currentFilters.progressFilter);
        setDueDateFilter(currentFilters.dueDateFilter);
        setSearch(currentFilters.search);
        setSearchInput(currentFilters.searchInput);
        setSortBy(currentFilters.sortBy);
        setFrequencyFilter(currentFilters.frequencyFilter);
      } else {
        if (selectedCustomer) {
          setPlans(prev => ({
            ...prev,
            type: 'single',
            selectedCustomer
          }));
          await loadPlan();

          // Restore filters after loading
          setShowActiveOnly(currentFilters.showActiveOnly);
          setProgressFilter(currentFilters.progressFilter);
          setDueDateFilter(currentFilters.dueDateFilter);
          setSearch(currentFilters.search);
          setSearchInput(currentFilters.searchInput);
          setSortBy(currentFilters.sortBy);
          setFrequencyFilter(currentFilters.frequencyFilter);
        }
      }
    } catch (error) {
      console.error('Error switching views:', error);
      message.error('Failed to switch views');
    }
  };

  // Update initial load to load all plans by default
  useEffect(() => {
    if (isAdmin) {
      loadAllPlans();  // Load all plans on initial mount
    }
  }, [isAdmin]);

  // Update customer selection handler
  const handleCustomerSelect = async (customerId: string | null) => {
    // Save current filter states
    const currentFilters = {
      showActiveOnly,
      progressFilter,
      dueDateFilter,
      search,
      searchInput,
      sortBy,
      frequencyFilter
    };

    const customer = customers.find(c => c.id === customerId) || null;
    setSelectedCustomer(customer);
    
    if (customer) {
      setPlans(prev => ({
        ...prev,
        type: 'single',
        selectedCustomer: customer
      }));
      await loadPlan();
    } else {
      setPlans(prev => ({
        ...prev,
        type: 'all',
        selectedCustomer: null
      }));
      await loadAllPlans();
    }

    // Restore filters after loading
    setShowActiveOnly(currentFilters.showActiveOnly);
    setProgressFilter(currentFilters.progressFilter);
    setDueDateFilter(currentFilters.dueDateFilter);
    setSearch(currentFilters.search);
    setSearchInput(currentFilters.searchInput);
    setSortBy(currentFilters.sortBy);
    setFrequencyFilter(currentFilters.frequencyFilter);
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
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onSearch={(value) => {
                  setSearch(value);  // Only apply filter when search button is clicked
                  console.log('Searching for:', value);
                }}
                enterButton  // Add search button
                allowClear   // Keep clear button
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
              <Select
                style={{ width: 200 }}
                value={frequencyFilter}
                onChange={setFrequencyFilter}
                placeholder="Filter by frequency"
              >
                <Option value="All">All Frequencies</Option>
                <Option value="One Time">One Time</Option>
                <Option value="Monthly">Monthly</Option>
                <Option value="As Needed">As Needed</Option>
                <Option value="Monthly and As Needed">Monthly & As Needed</Option>
              </Select>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleResetFilters}
                title="Reset all filters"
              />
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
                  onEdit={onEdit}
                  customer={null}
                  sections={sections}
                  updateTask={updateTask}
                  isOverdue={isOverdue}
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
                All Customers
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
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onSearch={(value) => {
                setSearch(value);  // Only apply filter when search button is clicked
                console.log('Searching for:', value);
              }}
              enterButton  // Add search button
              allowClear   // Keep clear button
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
            <Select
              style={{ width: 200 }}
              value={frequencyFilter}
              onChange={setFrequencyFilter}
              placeholder="Filter by frequency"
            >
              <Option value="All">All Frequencies</Option>
              <Option value="One Time">One Time</Option>
              <Option value="Monthly">Monthly</Option>
              <Option value="As Needed">As Needed</Option>
              <Option value="Monthly and As Needed">Monthly & As Needed</Option>
            </Select>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleResetFilters}
              title="Reset all filters"
            />
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
              console.log('ENTERING ALL PLANS VIEW');
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

                const section = (plan as Plan).sections.find((s: PlanSection) => s.title === sectionTitle);
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

                    const frequencyMatches = 
                      frequencyFilter === 'All' || 
                      (frequencyFilter === 'Monthly and As Needed' 
                        ? (task.frequency === 'Monthly' || task.frequency === 'As Needed')
                        : task.frequency === frequencyFilter);

                    if (!baseFilters || !frequencyMatches) return false;

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

              // Then apply pagination to filtered results
              const startIndex = (paginationState[sectionTitle] || 0) * pageSize;
              const endIndex = startIndex + pageSize;
              const paginatedTasks = allTasks.slice(startIndex, endIndex);

              return (
                <Card key={sectionTitle} style={{ marginTop: 16 }}>
                  <Title level={4}>{sectionTitle}</Title>
                  {paginatedTasks.map(({ customer, task }) => (
                    <TaskCard
                      key={`${customer.id}-${task.id}`}
                      task={task}
                      editMode={editMode}
                      onEdit={onEdit}
                      customer={customer}
                      sections={plans.data[customer.id].sections}
                      updateTask={updateTask}
                      isOverdue={isOverdue}
                    />
                  ))}
                  {allTasks.length > pageSize && (
                    <Pagination
                      current={(paginationState[sectionTitle] || 0) + 1}
                      total={allTasks.length}
                      pageSize={pageSize}
                      onChange={(page) => setPaginationState(prev => ({ ...prev, [sectionTitle]: page - 1 }))}
                      style={{ marginTop: '16px', textAlign: 'right' }}
                      showTotal={(total) => `Total ${total} tasks`}
                    />
                  )}
                </Card>
              );
            } else {
              console.log('🔵 ENTERING SINGLE CUSTOMER VIEW');
              const customer = selectedCustomer as ICustomer | null;
              if (!customer) return null;
              
              const customerId = customer.id;
              if (!plans.data[customerId]) return null;

              const section = (plans.data[customerId] as Plan).sections
                .find((s: PlanSection) => s.title === sectionTitle);
              
              if (!section) return null;

              const filteredTasks = section.tasks.filter(task => 
                (!showActiveOnly || task.isActive) &&
                (progressFilter === 'All' || task.progress === progressFilter) &&
                task.task.toLowerCase().includes(search.toLowerCase()) &&
                (dueDateFilter === 'all' || 
                  (dueDateFilter === 'overdue' && isOverdue(task.dueDate)) ||
                  (dueDateFilter === 'thisWeek' && isDueThisWeek(task.dueDate))
                )
              );

              if (filteredTasks.length === 0) return null;

              // Then apply pagination
              const startIndex = (paginationState[sectionTitle] || 0) * pageSize;
              const endIndex = startIndex + pageSize;
              const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

              return (
                <Card key={sectionTitle} style={{ marginTop: 16 }}>
                  <Title level={4}>{sectionTitle}</Title>
                  {paginatedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      editMode={editMode}
                      onEdit={onEdit}
                      customer={customer}
                      sections={sections}
                      updateTask={updateTask}
                      isOverdue={isOverdue}
                    />
                  ))}
                  {filteredTasks.length > pageSize && (
                    <Pagination
                      current={(paginationState[sectionTitle] || 0) + 1}
                      total={filteredTasks.length}
                      pageSize={pageSize}
                      onChange={(page) => setPaginationState(prev => ({ ...prev, [sectionTitle]: page - 1 }))}
                      style={{ marginTop: '16px', textAlign: 'right' }}
                      showTotal={(total) => `Total ${total} tasks`}
                    />
                  )}
                </Card>
              );
            }
          })
        ) : (
          sortedSections.map((section) => {
            // Apply ALL filters first
            const filteredTasks = section.tasks.filter(task => 
              (!showActiveOnly || task.isActive) &&
              (progressFilter === 'All' || task.progress === progressFilter) &&
              task.task.toLowerCase().includes(search.toLowerCase()) &&
              (dueDateFilter === 'all' || 
                (dueDateFilter === 'overdue' && isOverdue(task.dueDate)) ||
                (dueDateFilter === 'thisWeek' && isDueThisWeek(task.dueDate))
              )
            );

            // Then paginate
            const startIndex = (paginationState[section.title] || 0) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

            return (
              <Card key={section.title} style={{ marginTop: 16 }}>
                <Title level={4}>{section.title}</Title>
                {paginatedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    editMode={editMode}
                    onEdit={onEdit}
                    customer={selectedCustomer}
                    sections={sections}
                    updateTask={updateTask}
                    isOverdue={isOverdue}
                  />
                ))}
                {filteredTasks.length > pageSize && (
                  <Pagination
                    current={(paginationState[section.title] || 0) + 1}
                    total={filteredTasks.length}
                    pageSize={pageSize}
                    onChange={(page) => setPaginationState(prev => ({ ...prev, [section.title]: page - 1 }))}
                    style={{ marginTop: '16px', textAlign: 'right' }}
                    showTotal={(total) => `Total ${total} tasks`}
                  />
                )}
              </Card>
            );
          })
        )}
      </Content>
    </Layout>
  );
};

export default PlanComponent;