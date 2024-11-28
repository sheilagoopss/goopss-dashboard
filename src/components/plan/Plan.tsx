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
  Avatar,
  Form,
  Checkbox,
  InputNumber,
  Upload,
  Divider,
  Row,
  Col,
  Alert
} from 'antd'
import { 
  CalendarOutlined, 
  CheckCircleOutlined, 
  EditOutlined, 
  FileTextOutlined,
  UserOutlined,
  PlusOutlined,
  UploadOutlined,
  FilterOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../../contexts/AuthContext'
import { usePlan } from '../../hooks/usePlan'
import { PlanSection, PlanTask } from '../../types/Plan'
import { ICustomer, IAdmin } from '../../types/Customer'
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, query, where, deleteDoc, Timestamp, setDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { Plan } from '../../types/Plan';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PlanTaskRule } from '../../types/PlanTasks';
import FirebaseHelper from '../../helpers/FirebaseHelper';
import TaskCalendar from './TaskCalendar';

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
  adminList: IAdmin[];
}

const TaskCard: React.FC<TaskCardProps> = ({ task, editMode, onEdit, customer, sections, updateTask, isOverdue, adminList }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [tempValues, setTempValues] = useState<Partial<PlanTask>>({});

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
  const handleTempChange = (field: keyof PlanTask, value: string | number | boolean | string[] | null) => {
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
              {task.assignedTeamMembers && task.assignedTeamMembers.length > 0 && (
                <Space size={4}>
                  <UserOutlined style={{ color: '#8c8c8c' }} />
                  <Avatar.Group maxCount={3} size="small">
                    {task.assignedTeamMembers.map((email) => {
                      const admin = adminList.find((a: IAdmin) => a.email === email);
                      return (
                        <Tooltip key={email} title={admin?.name || email}>
                          <Avatar 
                            size="small"
                            style={{ backgroundColor: '#1890ff' }}
                            src={admin?.avatarUrl}
                          >
                            {!admin?.avatarUrl && (admin?.name || email)[0].toUpperCase()}
                          </Avatar>
                        </Tooltip>
                      );
                    })}
                  </Avatar.Group>
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
          {task.section === 'Other Tasks' && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Task Name:</Text>
              <Input
                value={tempValues.task !== undefined ? tempValues.task : task.task}
                onChange={(e) => handleTempChange('task', e.target.value)}
                disabled={!isEditing}
              />
            </Space>
          )}
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

          {/* Add creator info and attachments section */}
          {(task.createdBy || (task.files && task.files.length > 0)) && (
            <div style={{ 
              marginTop: 16,
              padding: '8px 16px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '8px' 
            }}>
              {task.createdBy && (
                <Space direction="vertical" size={0}>
                  <Text type="secondary">
                    Created by: {task.createdBy}
                    {task.createdAt && ` (${dayjs(task.createdAt).format('MMM DD, YYYY')})`}
                  </Text>
                  {task.updatedBy && task.updatedBy !== task.createdBy && (
                    <Text type="secondary">
                      Last updated by: {task.updatedBy}
                      {task.updatedAt && ` (${dayjs(task.updatedAt).format('MMM DD, YYYY')})`}
                    </Text>
                  )}
                </Space>
              )}
              {task.files && task.files.length > 0 && (
                <div style={{ marginTop: task.createdBy ? 8 : 0 }}>
                  <Text type="secondary">Attachments:</Text>
                  <div style={{ marginTop: 4 }}>
                    {task.files.map((file, index) => (
                      <div key={index} style={{ marginBottom: 4 }}>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          {file.name}
                        </a>
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Team Members Selection */}
          {isEditing && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Assigned Team Members:</Text>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Select team members"
                value={tempValues.assignedTeamMembers !== undefined ? tempValues.assignedTeamMembers : (task.assignedTeamMembers || [])}
                onChange={(value) => handleTempChange('assignedTeamMembers', value)}
              >
                {adminList
                  .filter((admin: IAdmin) => admin.canBeAssignedToTasks)
                  .map((admin: IAdmin) => (
                    <Option key={admin.email} value={admin.email}>
                      {admin.name || admin.email}
                    </Option>
                  ))}
              </Select>
            </Space>
          )}
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
  progressFilter: 'All' | 'To Do and Doing' | 'Done';
  search: string;
  searchInput: string;
  frequencyFilter: FrequencyFilterType;
  teamMemberFilter: string;
  showMyTasks: boolean;
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

// // Add debounce utility at the top
// const debounce = <T extends (...args: any[]) => void>(
//   func: T,
//   wait: number
// ): ((...args: Parameters<T>) => void) => {
//   let timeout: NodeJS.Timeout;
//   return (...args: Parameters<T>) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// };

// Add interface for file type
interface TaskFile {
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

// Add at the top with other constants
const DEFAULT_FILTERS: SavedFilters = {
  showActiveOnly: true,
  showMyTasks: true,
  progressFilter: 'To Do and Doing',
  search: '',
  searchInput: '',
  frequencyFilter: 'Monthly and As Needed',
  teamMemberFilter: 'all'
};

const PlanComponent: React.FC<PlanProps> = ({ customers, selectedCustomer, setSelectedCustomer }) => {
  const { isAdmin, user } = useAuth();
  const { fetchPlan, updatePlan, updateTask, checkMonthlyProgress } = usePlan();
  const savedFilters = getFiltersFromStorage();

  // Constants
  const CACHE_DURATION = 2 * 60 * 1000;  // 2 minutes
  const PAGE_SIZE = 10;

  // All state declarations
  const [showActiveOnly, setShowActiveOnly] = useState(savedFilters?.showActiveOnly ?? DEFAULT_FILTERS.showActiveOnly);
  const [progressFilter, setProgressFilter] = useState<'All' | 'To Do and Doing' | 'Done'>(
    savedFilters?.progressFilter ?? DEFAULT_FILTERS.progressFilter
  );
  const [searchInput, setSearchInput] = useState(savedFilters?.searchInput ?? DEFAULT_FILTERS.searchInput);
  const [search, setSearch] = useState(savedFilters?.search ?? DEFAULT_FILTERS.search);
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilterType>(
    savedFilters?.frequencyFilter ?? DEFAULT_FILTERS.frequencyFilter
  );
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
  const [newTaskModal, setNewTaskModal] = useState<{
    visible: boolean;
    sectionTitle: string;
    taskName: string;
  }>({ visible: false, sectionTitle: '', taskName: '' });
  const [newCustomTaskModal, setNewCustomTaskModal] = useState(false);
  const [customTaskForm] = Form.useForm();
  const [uploadedFiles, setUploadedFiles] = useState<TaskFile[]>([]);
  const [adminList, setAdminList] = useState<IAdmin[]>([]);
  const [teamMemberFilter, setTeamMemberFilter] = useState(savedFilters?.teamMemberFilter ?? DEFAULT_FILTERS.teamMemberFilter);
  const [showMyTasks, setShowMyTasks] = useState(savedFilters?.showMyTasks ?? DEFAULT_FILTERS.showMyTasks);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [useDefaultFilters, setUseDefaultFilters] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [defaultSections, setDefaultSections] = useState<string[]>([]);

  // Helper functions
  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = dayjs().startOf('day');
    const dueDay = dayjs(dueDate).startOf('day');
    return dueDay.isBefore(today);
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
      search,
      frequencyFilter,
      teamMemberFilter,
      showMyTasks
    });
  }, [showActiveOnly, progressFilter, search, frequencyFilter, teamMemberFilter, showMyTasks]);

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

  const onEdit = async (taskId: string, field: keyof PlanTask, value: any, customerId: string): Promise<boolean> => {
    try {
      console.log('Starting edit with:', {
        taskId,
        field,
        value,
        customerId,
        selectedCustomerId: selectedCustomer?.id,
        plansType: plans.type
      });

      const planRef = doc(db, 'plans', customerId);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        console.error('Plan not found:', customerId);
        return false;
      }

      const plan = planDoc.data() as Plan;
      
      const updatedSections = plan.sections.map(section => ({
        ...section,
        tasks: section.tasks.map(task => {
          if (task.id === taskId) {
            let updatedTask;
            if (typeof value === 'object') {
              updatedTask = {
                ...task,
                ...value,
                assignedTeamMembers: value.assignedTeamMembers || task.assignedTeamMembers || [],
                completedDate: value.completedDate || task.completedDate || null,
                current: typeof value.current === 'number' ? value.current : task.current,
                dueDate: value.dueDate || task.dueDate,
                frequency: value.frequency || task.frequency,
                goal: typeof value.goal === 'number' ? value.goal : task.goal,
                isActive: typeof value.isActive === 'boolean' ? value.isActive : task.isActive,
                notes: value.notes || task.notes || '',
                progress: value.progress || task.progress,
                task: value.task || task.task,
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email || ''
              };
            } else {
              updatedTask = {
                ...task,
                [field]: value,
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email || ''
              };
            }
            return updatedTask;
          }
          return task;
        })
      }));

      const updatePayload = {
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(planRef, updatePayload);

      // Update both local states regardless of view type
      if (plans.type === 'all') {
        setPlans(prevPlans => ({
          ...prevPlans,
          data: {
            ...prevPlans.data,
            [customerId]: {
              ...prevPlans.data[customerId],
              sections: updatedSections
            }
          }
        }));
      }
      
      // Always update sections state for single customer view
      if (selectedCustomer?.id === customerId) {
        setSections(updatedSections);
      }

      return true;
    } catch (error) {
      console.error('Error in onEdit:', error);
      message.error('Failed to save changes');
      return false;
    }
  };

  // Update the filterTasks function
  const filterTasks = (task: PlanTask) => {
    const baseFilters = 
      (!showActiveOnly || task.isActive) &&
      (progressFilter === 'All' || 
        (progressFilter === 'To Do and Doing' ? 
          (task.progress === 'To Do' || task.progress === 'Doing') : 
          task.progress === progressFilter)) &&
      task.task.toLowerCase().includes(search.toLowerCase()) &&
      (frequencyFilter === 'All' || 
        (frequencyFilter === 'Monthly and As Needed' 
          ? (task.frequency === 'Monthly' || task.frequency === 'As Needed')
          : task.frequency === frequencyFilter)) &&
      (teamMemberFilter === 'all' || task.assignedTeamMembers?.includes(teamMemberFilter)) &&
      (!showMyTasks || task.assignedTeamMembers?.includes(user?.email || ''));

    return baseFilters;
  };

  const filteredSections = sections
    .map(section => ({
      ...section,
      tasks: section.tasks.filter(filterTasks)
    }))
    .filter(section => section.tasks.length > 0);

  // Deprecated - replaced by "Add Custom Task" button and modal
  // const handleAddTask = (sectionTitle: string) => {
  //   setNewTaskModal({
  //     visible: true,
  //     sectionTitle,
  //     taskName: ''
  //   });
  // };

  // Deprecated - replaced by handleCustomTaskSave
  // const handleCreateTask = async () => {
  //   if (!selectedCustomer || !newTaskModal.taskName.trim()) return;
  //   // ... implementation
  // };

  // Unused states related to fetchAllPlans
  // const [selectedValue, setSelectedValue] = useState<string>('all-paid');
  // const [switchingToAll, setSwitchingToAll] = useState(false);

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
    if (!selectedCustomer) return;
    try {
      setIsLoading(true);
      const planRef = doc(db, 'plans', selectedCustomer.id);
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        // Create new plan based on package type
        await createPlanForCustomer(selectedCustomer);
        return;
      }

      const plan = planDoc.data() as Plan;
      setSections(plan.sections);
    } catch (error) {
      console.error('Error loading plan:', error);
      message.error('Failed to load plan');
    } finally {
      setIsLoading(false);
    }
  };

  // Add useEffect to save filters
  useEffect(() => {
    const filters: SavedFilters = {
      showActiveOnly,
      progressFilter,
      search,
      searchInput,
      frequencyFilter,
      teamMemberFilter,
      showMyTasks
    };
    saveFiltersToStorage(filters);
  }, [showActiveOnly, progressFilter, search, searchInput, frequencyFilter, teamMemberFilter, showMyTasks]);

  // Update the view switching logic
  // const handleViewChange = async (viewType: 'all' | 'single') => {
  //   try {
  //     // Get current filters from state
  //     const currentFilters = {
  //       showActiveOnly,
  //       progressFilter,
  //       search,
  //       searchInput,
  //       frequencyFilter,
  //       teamMemberFilter,
  //       showMyTasks
  //     };
  //     // ... rest of function
  //   }
  // };

  // Update initial load to load all plans by default
  useEffect(() => {
    if (isAdmin) {
      loadAllPlans();  // Load all plans on initial mount
    }
  }, [isAdmin]);

  // Update customer selection handler
  const handleCustomerSelect = async (customerId: string | null) => {
    try {
      // Get current filters
      const currentFilters = {
        showActiveOnly,
        progressFilter,
        search,
        searchInput,
        frequencyFilter,
        teamMemberFilter,
        showMyTasks
      };

      // Get saved filters
      const savedFilters = getFiltersFromStorage();

      // Combine filters with priority
      const filtersToApply = {
        ...DEFAULT_FILTERS,
        ...savedFilters,
        ...currentFilters
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

      // Apply the combined filters
      setShowActiveOnly(filtersToApply.showActiveOnly);
      setProgressFilter(filtersToApply.progressFilter);
      setSearch(filtersToApply.search);
      setSearchInput(filtersToApply.searchInput);
      setFrequencyFilter(filtersToApply.frequencyFilter);
      setTeamMemberFilter(filtersToApply.teamMemberFilter);
      setShowMyTasks(filtersToApply.showMyTasks);

      // Save the combined filters to storage
      saveFiltersToStorage(filtersToApply);

    } catch (error) {
      console.error('Error selecting customer:', error);
      message.error('Failed to select customer');
    }
  };

  // Add this function before the return statement
  const handleCustomTaskSave = async (values: any) => {
    if (!selectedCustomer) return;
    try {
      setIsLoading(true);
      const planRef = doc(db, 'plans', selectedCustomer.id);
      const planDoc = await getDoc(planRef);
      
      if (planDoc.exists()) {
        const plan = planDoc.data() as Plan;
        const newTask: PlanTask = {
          id: Date.now().toString(),
          task: values.task,
          frequency: values.frequency,
          progress: 'To Do',
          dueDate: values.frequency === 'Monthly' && values.monthlyDueDate 
            ? calculateMonthlyDueDate(values.monthlyDueDate)
            : values.dueDate ? values.dueDate.format('YYYY-MM-DD') 
            : null,
          completedDate: null,
          isActive: true,
          notes: values.notes || '',
          current: values.current || 0,
          goal: values.goal || 0,
          files: uploadedFiles,
          createdBy: (user as IAdmin)?.name || user?.email || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: (user as IAdmin)?.name || user?.email || '',
          section: 'Other Tasks',
          assignedTeamMembers: values.assignedTeamMembers || []
        };

        // Add to Other Tasks section
        const updatedSections = plan.sections.map(section => 
          section.title === 'Other Tasks'
            ? { ...section, tasks: [...section.tasks, newTask] }
            : section
        );

        // If Other Tasks section doesn't exist, create it
        if (!plan.sections.some(section => section.title === 'Other Tasks')) {
          updatedSections.push({
            title: 'Other Tasks',
            tasks: [newTask]
          });
        }

        // Save to Firestore
        await updateDoc(planRef, { 
          sections: updatedSections,
          updatedAt: new Date().toISOString()
        });

        // Update local state immediately
        setSections(updatedSections);
        
        // Update plans state if in all view
        if (plans.type === 'all') {
          setPlans(prev => ({
            ...prev,
            data: {
              ...prev.data,
              [selectedCustomer.id]: {
                ...prev.data[selectedCustomer.id],
                sections: updatedSections
              }
            }
          }));
        }

        // Reset form and close modal
        customTaskForm.resetFields();
        setUploadedFiles([]);
        setNewCustomTaskModal(false);

        message.success('Task added successfully');
      }
    } catch (error) {
      console.error('Error adding custom task:', error);
      message.error('Failed to add custom task');
    } finally {
      setIsLoading(false);
    }
  };

  // Add file upload handler
  const handleFileUpload = async (file: File) => {
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `customTask/${selectedCustomer?.id}/${Date.now()}_${file.name}`);
      
      // Check file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        message.error('File size must be less than 10MB');
        return false;
      }

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setUploadedFiles(prev => [...prev, {
        name: file.name,
        url,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }]);

      return false; // Prevent default upload behavior
    } catch (error) {
      console.error('Error uploading file:', error);
      message.error('Failed to upload file');
      return false;
    }
  };

  // Add this helper function
  const calculateMonthlyDueDate = (dayOfMonth: number) => {
    const today = dayjs();
    const dueDate = dayjs().date(dayOfMonth);
    
    // If the due date for this month has passed, use next month
    if (dueDate.isBefore(today)) {
      return dueDate.add(1, 'month').format('YYYY-MM-DD');
    }
    
    return dueDate.format('YYYY-MM-DD');
  };

  // Add createPlanForCustomer inside the component
  const createPlanForCustomer = async (customer: ICustomer) => {
    try {
      console.log('Creating plan for customer:', customer);
      console.log('Customer package type:', customer.package_type);

      const packageTypes: { [key: string]: string } = {
        'Accelerator - Basic': 'acceleratorBasic',
        'Accelerator - Standard': 'acceleratorStandard',
        'Accelerator - Pro': 'acceleratorPro',
        'Extended Maintenance': 'extendedMaintenance',
        'Regular Maintenance': 'regularMaintenance',
        'Social': 'social',
        'Default': 'default',
        'Free': 'default'
      };

      const packageId = packageTypes[customer.package_type] || 'default';
      console.log('Looking for rules in document:', packageId);

      // Get the package-specific rules
      const rulesRef = doc(db, 'planTaskRules', packageId);
      const rulesDoc = await getDoc(rulesRef);
      
      if (!rulesDoc.exists()) {
        message.error('No rules found for this package');
        return;
      }

      const rules = rulesDoc.data();  // Only use package-specific rules, no fallback
      
      // Create the plan with these rules
      const planRef = doc(db, 'plans', customer.id);
      await setDoc(planRef, {
        sections: rules.sections.map((sectionTitle: string) => ({
          title: sectionTitle,
          tasks: rules.tasks
            .filter((task: PlanTaskRule) => task.section === sectionTitle)
            .map((task: PlanTaskRule) => ({
              ...task,
              progress: 'To Do',
              completedDate: null,
              current: task.defaultCurrent || 0,
              goal: task.defaultGoal || 0,
              dueDate: task.frequency === 'Monthly' && task.monthlyDueDate
                ? dayjs().date(task.monthlyDueDate).format('YYYY-MM-DD')
                : task.frequency === 'As Needed' || task.daysAfterJoin === 0
                ? null
                : dayjs(customer.date_joined).add(task.daysAfterJoin || 0, 'day').format('YYYY-MM-DD'),
              updatedAt: new Date().toISOString(),
              updatedBy: user?.email || ''
            }))
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      message.success('Plan created successfully');
      
      // Reload the plans
      if (selectedCustomer) {
        await loadPlan();
      } else {
        await loadAllPlans();
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      message.error('Failed to create plan');
    }
  };

  // Add this useEffect after other useEffects
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const admins = await FirebaseHelper.find<IAdmin>('admin');
        setAdminList(admins);
      } catch (error) {
        console.error('Error fetching admin list:', error);
        message.error('Failed to load team members');
      }
    };

    fetchAdmins();
  }, []);

  // Assume tasks is an array of PlanTask objects fetched or passed as props
  const tasks = [
    // Example task data
    { task: 'Task 1', assignedTeamMembers: ['Alice'], dueDate: '2023-11-01', progress: 'In Progress' },
    { task: 'Task 2', assignedTeamMembers: ['Bob'], dueDate: '2023-11-02', progress: 'Done' },
    // Add more tasks as needed
  ];

  const toggleView = () => {
    setViewMode(prev => prev === 'list' ? 'calendar' : 'list');
  };

  return (
    <Layout>
      <Content style={{ 
        padding: '16px',
        maxHeight: 'calc(100vh - 64px)',
        overflowY: 'auto',
        position: 'relative'
      }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Title level={4}>Select Customer</Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Select
                style={{ width: '100%' }}
                placeholder="Select a customer"
                value={selectedCustomer ? selectedCustomer.id : 'all-paid'}
                onChange={handleCustomerSelect}
                size="large"
                listHeight={400}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
                }
              >
                <Option value="all-paid">All Customers</Option>
                <Option key="divider" disabled>──────────────</Option>
                {customers
                  .filter(customer => 
                    customer.customer_type === 'Paid' && 
                    (showInactive || customer.isActive)
                  )
                  .sort((a, b) => {
                    // Sort by date_joined in descending order (most recent first)
                    if (!a.date_joined || !b.date_joined) return 0;
                    return dayjs(b.date_joined).valueOf() - dayjs(a.date_joined).valueOf();
                  })
                  .map((customer) => (
                    <Option 
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
                        {!customer.isActive && <Tag color="red">Inactive</Tag>}
                      </Space>
                    </Option>
                  ))}
              </Select>
              <Tooltip title="Show inactive customers">
                <Switch
                  size="small"
                  checked={showInactive}
                  onChange={setShowInactive}
                  checkedChildren="Showing Inactive"
                  unCheckedChildren="Show Inactive"
                />
              </Tooltip>
            </Space>
          </Space>
        </Card>

        {/* Filters Card */}
        <Card style={{ marginTop: 16 }}>
          <Alert
            message="Filter Tips"
            description={
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Click "Use Default View" for the recommended view (monthly and as needed active tasks assigned to you)</li>
              </ul>
            }
            type="info"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* First row */}
            <Row>
              <Space direction="vertical" size="small">
                <Text type="secondary">Quick Filters:</Text>
                <Space wrap>
                  <Tooltip title="Show only active tasks and monthly tasks assigned to you">
                    <Button
                      type={useDefaultFilters ? "primary" : "default"}
                      icon={<FilterOutlined />}
                      onClick={() => {
                        const newState = !useDefaultFilters;
                        setUseDefaultFilters(newState);
                        if (newState) {
                          setShowActiveOnly(DEFAULT_FILTERS.showActiveOnly);
                          setProgressFilter(DEFAULT_FILTERS.progressFilter);
                          setSearch(DEFAULT_FILTERS.search);
                          setSearchInput(DEFAULT_FILTERS.searchInput);
                          setFrequencyFilter(DEFAULT_FILTERS.frequencyFilter);
                          setTeamMemberFilter(DEFAULT_FILTERS.teamMemberFilter);
                          setShowMyTasks(DEFAULT_FILTERS.showMyTasks);
                        } else {
                          const savedFilters = getFiltersFromStorage();
                          if (savedFilters) {
                            setShowActiveOnly(savedFilters.showActiveOnly);
                            setProgressFilter(savedFilters.progressFilter);
                            setSearch(savedFilters.search);
                            setSearchInput(savedFilters.searchInput);
                            setFrequencyFilter(savedFilters.frequencyFilter);
                            setTeamMemberFilter(savedFilters.teamMemberFilter);
                            setShowMyTasks(savedFilters.showMyTasks);
                          }
                        }
                      }}
                    >
                      {useDefaultFilters ? "Using Default View" : "Use Default View"}
                    </Button>
                  </Tooltip>
                  <Space>
                    <Tooltip title="Show only tasks that are currently active">
                      <Switch
                        checked={showActiveOnly}
                        onChange={setShowActiveOnly}
                      />
                      <Text>Show Active Only</Text>
                    </Tooltip>
                  </Space>
                  <Space>
                    <Tooltip title="Show only tasks assigned to you">
                      <Switch
                        checked={showMyTasks}
                        onChange={setShowMyTasks}
                      />
                      <Text>My Tasks</Text>
                    </Tooltip>
                  </Space>
                </Space>
              </Space>
            </Row>
            
            <Divider style={{ margin: '12px 0' }}>
              <Text type="secondary">Advanced Filters</Text>
            </Divider>
            
            {/* Second row */}
            <Row>
              <Space wrap>
                <Search
                  placeholder="Search tasks..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onSearch={(value) => {
                    setSearch(value);
                  }}
                  allowClear
                  style={{ width: 200 }}
                />
                <Select
                  style={{ width: 150 }}
                  value={progressFilter}
                  onChange={(value: 'All' | 'To Do and Doing' | 'Done') => setProgressFilter(value)}
                >
                  <Option value="All">All Progress</Option>
                  <Option value="To Do and Doing">To Do & Doing</Option>
                  <Option value="Done">Done</Option>
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
                <Select
                  style={{ width: 200 }}
                  value={teamMemberFilter}
                  onChange={setTeamMemberFilter}
                  placeholder="Filter by team member"
                >
                  <Option value="all">All Team Members</Option>
                  {adminList
                    .filter((admin: IAdmin) => admin.canBeAssignedToTasks)
                    .map((admin: IAdmin) => (
                      <Option key={admin.email} value={admin.email}>
                        <Space>
                          <Avatar 
                            size="small"
                            style={{ backgroundColor: '#1890ff' }}
                            src={admin.avatarUrl}
                          >
                            {!admin.avatarUrl && (admin.name || admin.email)[0].toUpperCase()}
                          </Avatar>
                          {admin.name || admin.email}
                        </Space>
                      </Option>
                    ))}
                </Select>
                {selectedCustomer && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setNewCustomTaskModal(true)}
                  >
                    Add Custom Task
                  </Button>
                )}
                <Button onClick={toggleView}>
                  {viewMode === 'list' ? 'Calendar View' : 'List View'}
                </Button>
              </Space>
            </Row>
          </Space>
        </Card>

        {isLoading && <LoadingSpinner />}

        {/* Tasks Section - Simplified */}
        {viewMode === 'list' ? (
          <Card style={{ marginTop: 16 }}>
            {!selectedCustomer && plans.type === 'all' ? (
              <>
                {Object.entries(plans.data)
                  .flatMap(([customerId, plan]) => {
                    const customer = customers.find(c => c.id === customerId);
                    if (!customer) return [];

                    return plan.sections
                      .flatMap(section => section.tasks)
                      .filter(filterTasks)
                      .map(task => ({ customer, task }));
                  })
                  .sort((a, b) => {
                    // First sort by due date
                    if (!a.task.dueDate && !b.task.dueDate) {
                      // If neither has a due date, sort by customer join date
                      const joinDateA = a.customer.date_joined ? dayjs(a.customer.date_joined) : dayjs('1900-01-01');
                      const joinDateB = b.customer.date_joined ? dayjs(b.customer.date_joined) : dayjs('1900-01-01');
                      return joinDateB.valueOf() - joinDateA.valueOf();
                    }
                    if (!a.task.dueDate) return 1;  // Tasks without due dates go last
                    if (!b.task.dueDate) return -1;

                    // Compare due dates
                    const dateA = dayjs(a.task.dueDate);
                    const dateB = dayjs(b.task.dueDate);
                    const dateDiff = dateA.valueOf() - dateB.valueOf();
                    
                    if (dateDiff !== 0) return dateDiff;

                    // If due dates are equal, sort by customer join date
                    const joinDateA = a.customer.date_joined ? dayjs(a.customer.date_joined) : dayjs('1900-01-01');
                    const joinDateB = b.customer.date_joined ? dayjs(b.customer.date_joined) : dayjs('1900-01-01');
                    return joinDateB.valueOf() - joinDateA.valueOf();
                  })
                  .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                  .map(({ customer, task }) => (
                    <TaskCard
                      key={`${customer.id}-${task.id}`}
                      task={task}
                      editMode={editMode}
                      onEdit={onEdit}
                      customer={customer}
                      sections={sections}
                      updateTask={updateTask}
                      isOverdue={isOverdue}
                      adminList={adminList}
                    />
                  ))}
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Pagination
                    current={currentPage}
                    total={Object.entries(plans.data)
                      .flatMap(([customerId, plan]) => {
                        const customer = customers.find(c => c.id === customerId);
                        if (!customer) return [];
                        return plan.sections.flatMap(section => section.tasks).filter(filterTasks);
                      }).length}
                    pageSize={PAGE_SIZE}
                    onChange={setCurrentPage}
                    showTotal={(total) => `Total ${total} tasks`}
                  />
                </div>
              </>
            ) : (
              <>
                {sections
                  .flatMap(section => section.tasks)
                  .filter(filterTasks)
                  .sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    const dateA = dayjs(a.dueDate);
                    const dateB = dayjs(b.dueDate);
                    return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
                  })
                  .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        editMode={editMode}
                        onEdit={onEdit}
                        customer={selectedCustomer}
                        sections={sections}
                        updateTask={updateTask}
                        isOverdue={isOverdue}
                        adminList={adminList}
                      />
                    ))}
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Pagination
                    current={currentPage}
                    total={sections.flatMap(section => section.tasks).filter(filterTasks).length}
                    pageSize={PAGE_SIZE}
                    onChange={setCurrentPage}
                    showTotal={(total) => `Total ${total} tasks`}
                  />
                </div>
              </>
            )}
          </Card>
        ) : (
          <Card style={{ marginTop: 16 }}>
            <TaskCalendar 
              tasks={!selectedCustomer && plans.type === 'all' 
                ? Object.entries(plans.data)
                    .flatMap(([customerId, plan]) => {
                      const customer = customers.find(c => c.id === customerId);
                      if (!customer) return [];
                      return plan.sections
                        .flatMap(section => section.tasks)
                        .filter(task => task.isActive);
                    })
                : sections
                    .flatMap(section => section.tasks)
                    .filter(task => task.isActive)
              }
              adminList={adminList}
              onEdit={onEdit}
            />
          </Card>
        )}
      </Content>

      {/* Add Custom Task Modal */}
      <Modal
        title="Add Custom Task"
        open={newCustomTaskModal}
        onOk={customTaskForm.submit}
        onCancel={() => {
          setNewCustomTaskModal(false);
          customTaskForm.resetFields();
          setUploadedFiles([]);
        }}
      >
        <Form form={customTaskForm} onFinish={handleCustomTaskSave} layout="vertical">
          <Form.Item name="task" label="Task Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="section"
            label="Section"
            initialValue="Other Tasks"
          >
            <Select disabled value="Other Tasks">
              <Option value="Other Tasks">Other Tasks</Option>
            </Select>
          </Form.Item>

          <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}>
            <Select>
              <Option value="One Time">One Time</Option>
              <Option value="Monthly">Monthly</Option>
              <Option value="As Needed">As Needed</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.frequency !== currentValues.frequency
            }
          >
            {({ getFieldValue }) => {
              const frequency = getFieldValue('frequency');
              return (
                <>
                  {frequency === 'Monthly' && (
                    <Form.Item name="monthlyDueDate" label="Monthly Due Date">
                      <Select>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <Option key={day} value={day}>Day {day}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}
                  {(frequency === 'Monthly' || frequency === 'As Needed') && (
                    <>
                      <Form.Item name="requiresGoal" valuePropName="checked">
                        <Checkbox>Requires Goal</Checkbox>
                      </Form.Item>
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => 
                          prevValues.requiresGoal !== currentValues.requiresGoal
                        }
                      >
                        {({ getFieldValue }) => 
                          getFieldValue('requiresGoal') ? (
                            <Space>
                              <Form.Item name="current" label="Current" initialValue={0}>
                                <InputNumber min={0} />
                              </Form.Item>
                              <Form.Item name="goal" label="Goal" rules={[{ required: true }]}>
                                <InputNumber min={0} />
                              </Form.Item>
                            </Space>
                          ) : null
                        }
                      </Form.Item>
                    </>
                  )}
                  {frequency !== 'Monthly' && (
                    <Form.Item name="dueDate" label="Due Date">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  )}
                </>
              );
            }}
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={4} />
          </Form.Item>

          {/* Add file upload section */}
          <Form.Item label="Attachments">
            <Upload
              beforeUpload={handleFileUpload}
              fileList={uploadedFiles.map(file => ({
                uid: file.url,
                name: file.name,
                status: 'done',
                url: file.url,
              }))}
              onRemove={(file) => {
                setUploadedFiles(prev => 
                  prev.filter(f => f.url !== file.uid)
                );
                return true;
              }}
            >
              <Button icon={<UploadOutlined />}>Upload File</Button>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Max file size: 10MB
            </Text>
          </Form.Item>

          {/* Add creator info display */}
          <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
            <Text type="secondary">
              Created by: {(user as IAdmin)?.name || user?.email}
            </Text>
            <Text type="secondary">
              Date: {dayjs().format('MMM DD, YYYY')}
            </Text>
          </Space>

          {/* Add team member selection before the file upload section */}
          <Form.Item name="assignedTeamMembers" label="Assigned Team Members">
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select team members"
            >
              {adminList
                .filter((admin: IAdmin) => admin.canBeAssignedToTasks)
                .map((admin: IAdmin) => (
                  <Option key={admin.email} value={admin.email}>
                    {admin.name || admin.email}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default PlanComponent;