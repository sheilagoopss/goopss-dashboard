/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Layout, Typography, Card, Select, Switch, Input, Button, Space, Table, Tag, Tooltip,
  DatePicker, Modal, message, Avatar, Form, Checkbox, InputNumber, Alert, Progress, Upload, Divider
} from 'antd'
import { 
  CalendarOutlined, CheckCircleOutlined, EditOutlined,
  UserOutlined, WarningOutlined, ReloadOutlined, PlusOutlined, FileTextOutlined, UploadOutlined, DeleteOutlined, RedoOutlined, MinusCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { PlanSection, PlanTask } from '../../types/Plan'
import { ICustomer, IAdmin } from '../../types/Customer'
import { doc, getDoc, updateDoc, collection, getDocs, setDoc, addDoc, writeBatch, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { Plan } from '../../types/Plan'
import { useAuth } from '../../contexts/AuthContext';
import { PlanTaskRule } from '../../types/PlanTasks';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import FirebaseHelper from '../../helpers/FirebaseHelper';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'react';
import { SubTask } from '../../types/PlanTasks';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;


interface TableRecord {
  key: string;
  store_name: string;
  customer: ICustomer;
  task: string;
  section: string;
  progress: "To Do" | "Doing" | "Done";
  frequency: "Monthly" | "One Time" | "As Needed";
  dueDate: string | null;
  completedDate: string | null;
  isActive: boolean;
  current: number;
  goal: number;
  notes: string;
  id: string;
  order: number;
  updatedAt: string;
  updatedBy: string;
  files?: TaskFile[];
  createdBy?: string;
  createdAt?: string;
  assignedTeamMembers?: string[];
  subtasks?: SubTask[];
}

const pastelColors = {
  "To Do": "#FFCCCB",
  Doing: "#ADD8E6",
  Done: "#90EE90",
  Monthly: "#DDA0DD",
  "One Time": "#FFE4B5",
} as const;

interface Props {
  customers: ICustomer[];
  selectedCustomer: ICustomer | null;
  setSelectedCustomer: (customer: ICustomer | null) => void;
}

// Add this interface for saved filters
interface SavedFilters {
  showActiveOnly: boolean;
  progressFilter: "All" | "To Do and Doing" | "Done";
  search: string;
  frequencyFilter:
    | "All"
    | "One Time"
    | "Monthly"
    | "As Needed"
    | "Monthly and As Needed";
  teamMemberFilter: string;
  showMyTasks: boolean;
}

// Add these helper functions
const saveFiltersToStorage = (filters: SavedFilters) => {
  localStorage.setItem("planSimpleViewFilters", JSON.stringify(filters));
};

const getFiltersFromStorage = (): SavedFilters | null => {
  const saved = localStorage.getItem("planSimpleViewFilters");
  return saved ? JSON.parse(saved) : null;
};

// Add this helper function near the top with other functions
const calculateTotalProgress = (task: PlanTask) => {
  const historyTotal = (task.monthlyHistory || []).reduce(
    (sum, month) => sum + month.current,
    0,
  );
  const currentTotal = task.current || 0;
  return historyTotal + currentTotal;
};

// Add this helper function
const calculateMonthlyDueDate = (monthlyDueDate: number) => {
  const today = dayjs();
  const dueDate = dayjs().date(monthlyDueDate);

  // If the due date for this month has passed, use next month
  if (dueDate.isBefore(today)) {
    return dueDate.add(1, "month").format("YYYY-MM-DD");
  }

  return dueDate.format("YYYY-MM-DD");
};

// Add this helper function
// const getAdjustedMonthlyDueDate = (
//   dueDate: string | null,
//   frequency: string,
// ) => {
//   if (!dueDate || frequency !== "Monthly") return dueDate;

//   const today = dayjs();
//   const dueDateObj = dayjs(dueDate);
//   const dayOfMonth = dueDateObj.date();

//   // If the due date for this month has passed, use next month
//   const adjustedDate = dayjs().date(dayOfMonth);
//   if (adjustedDate.isBefore(today)) {
//     return adjustedDate.add(1, "month").format("YYYY-MM-DD");
//   }

//   return adjustedDate.format("YYYY-MM-DD");
// };

// Add this function to create a new plan based on package type
const calculateDueDate = (customer: ICustomer, rule: PlanTaskRule) => {
  if (rule.frequency === "Monthly" && rule.monthlyDueDate) {
    return dayjs().date(rule.monthlyDueDate).format("YYYY-MM-DD");
  } else if (rule.frequency === "As Needed" || rule.daysAfterJoin === 0) {
    return null;
  } else {
    return dayjs(customer.date_joined)
      .add(rule.daysAfterJoin || 0, "day")
      .format("YYYY-MM-DD");
  }
};

interface TaskFile {
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export const PlanSimpleView: React.FC<Props> = ({
  customers,
  selectedCustomer,
  setSelectedCustomer,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<{
    type: "all" | "single";
    selectedCustomer: ICustomer | null;
    data: { [customerId: string]: Plan };
  }>({
    type: "all",
    selectedCustomer: null,
    data: {},
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<PlanTask | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(
    null,
  );
  const [form] = Form.useForm();
  const [addTaskForm] = Form.useForm();
  const [selectedRows, setSelectedRows] = useState<TableRecord[]>([]);
  const [bulkEditModalVisible, setBulkEditModalVisible] = useState(false);
  const [bulkEditForm] = Form.useForm();

  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
  const [cachedPlans, setCachedPlans] = useState<{
    [customerId: string]: Plan;
  }>({});
  const [lastCacheUpdate, setLastCacheUpdate] = useState<number>(Date.now());

  // Keep only these declarations with saved filters
  const savedFilters = getFiltersFromStorage();
  const [showActiveOnly, setShowActiveOnly] = useState(
    savedFilters?.showActiveOnly ?? false,
  );
  const [progressFilter, setProgressFilter] = useState<
    "All" | "To Do and Doing" | "Done"
  >(savedFilters?.progressFilter ?? "To Do and Doing");
  const [search, setSearch] = useState(savedFilters?.search ?? "");
  const [frequencyFilter, setFrequencyFilter] = useState<
    "All" | "One Time" | "Monthly" | "As Needed" | "Monthly and As Needed"
  >(savedFilters?.frequencyFilter ?? "All");
  const [teamMemberFilter, setTeamMemberFilter] = useState<string>(
    savedFilters?.teamMemberFilter ?? "all",
  );
  const [showMyTasks, setShowMyTasks] = useState(
    savedFilters?.showMyTasks ?? false,
  );

  // Add searchInput state if not already present
  const [searchInput, setSearchInput] = useState(savedFilters?.search ?? "");

  // Add useEffect to save filters when they change
  useEffect(() => {
    const filters: SavedFilters = {
      showActiveOnly,
      progressFilter,
      search,
      frequencyFilter,
      teamMemberFilter,
      showMyTasks,
    };
    saveFiltersToStorage(filters);
  }, [
    showActiveOnly,
    progressFilter,
    search,
    frequencyFilter,
    teamMemberFilter,
    showMyTasks,
  ]);

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = dayjs().startOf("day");
    const dueDay = dayjs(dueDate).startOf("day");
    return dueDay.isBefore(today);
  };

  // const isDueThisWeek = (dueDate: string | null) => {
  //   if (!dueDate) return false;
  //   const today = dayjs().startOf("day");
  //   const dueDay = dayjs(dueDate).startOf("day");
  //   return dueDay.isAfter(today) && dueDay.isBefore(today.add(7, "day"));
  // };

  const loadAllPlans = async () => {
    try {
      setIsLoading(true);
      console.log('Starting to load all plans...');

      // Get only active paid customers first
      const customersRef = collection(db, 'customers');
      const customersSnapshot = await getDocs(
        query(customersRef, 
          where('customer_type', '==', 'Paid'),
          where('isActive', '==', true)
        )
      );
      console.log('Found active paid customers:', customersSnapshot.size);

      // Load plans in batches of 10
      const BATCH_SIZE = 10;
      const plansData: { [customerId: string]: Plan } = {};
      
      for (let i = 0; i < customersSnapshot.docs.length; i += BATCH_SIZE) {
        const batch = customersSnapshot.docs.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(customerDoc => 
          getDoc(doc(db, 'plans', customerDoc.id))
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach((planDoc, index) => {
          if (planDoc.exists()) {
            plansData[batch[index].id] = planDoc.data() as Plan;
          }
        });

        // Update state after each batch to show progress
        setPlans({
          type: 'all',
          selectedCustomer: null,
          data: { ...plansData }
        });
      }

      console.log('Loaded plans data:', Object.keys(plansData).length);

    } catch (error) {
      console.error('Error loading all plans:', error);
      message.error('Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlan = async () => {
    if (!selectedCustomer) return;
    try {
      setIsLoading(true);
      const planRef = doc(db, "plans", selectedCustomer.id);
      const planDoc = await getDoc(planRef);
      if (planDoc.exists()) {
        const plan = planDoc.data() as Plan;
        setPlans({
          type: "single",
          selectedCustomer,
          data: { [selectedCustomer.id]: plan },
        });
      }
    } catch (error) {
      console.error("Error loading plan:", error);
      message.error("Failed to load plan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCustomer) {
      loadAllPlans();
    } else {
      loadPlan();
    }
  }, [selectedCustomer]);

  const handleEdit = (record: TableRecord, customer: ICustomer) => {
    console.log('Starting edit with record:', record);
    
    // Get the full task data from the plan
    const plan = plans.data[customer.id];
    console.log('Found plan:', plan);
    
    const section = plan?.sections.find(s => s.title === record.section);
    console.log('Found section:', section);
    
    const fullTask = section?.tasks.find(t => t.id === record.id);
    console.log('Found full task:', fullTask);
    console.log('Full task subtasks:', fullTask?.subtasks);
    
    if (!fullTask) {
      message.error('Task not found');
      return;
    }

    console.log('Task subtasks:', fullTask.subtasks);
    
    const taskData: PlanTask = {
      ...fullTask,
      id: record.id,
      task: record.task,
      section: record.section,
      progress: record.progress,
      frequency: record.frequency,
      dueDate: record.dueDate,
      completedDate: record.completedDate,
      isActive: record.isActive,
      current: record.current,
      goal: record.goal,
      notes: record.notes,
      updatedAt: record.updatedAt,
      updatedBy: record.updatedBy,
      files: record.files,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      assignedTeamMembers: record.assignedTeamMembers || [],
      order: record.order,
      subtasks: fullTask.subtasks || [] // Make sure subtasks are included
    };
    
    console.log('Final task data for editing:', taskData);
    console.log('Subtasks in final data:', taskData.subtasks);
    
    setEditingTask(taskData);
    setEditingCustomer(customer);
    
    // Log the state after setting
    setTimeout(() => {
      console.log('EditingTask state:', editingTask);
    }, 0);
    
    form.setFieldsValue({
      id: record.id.replace('task-', ''),
      progress: record.progress,
      order: record.order,
      dueDate: record.dueDate ? dayjs(record.dueDate) : null,
      completedDate: record.completedDate ? dayjs(record.completedDate) : null,
      isActive: record.isActive,
      current: record.current,
      goal: record.goal,
      notes: record.notes,
      assignedTeamMembers: record.assignedTeamMembers || [],
      subtasks: [] // Initialize empty array for new subtasks
    });

    setEditModalVisible(true);
  };

  const handleEditSave = async (values: any) => {
    if (!editingTask || !editingCustomer) {
      console.error('Missing editingTask or editingCustomer:', { editingTask, editingCustomer });
      return;
    }
    try {
      console.log('Starting update with values:', values);
      const planRef = doc(db, 'plans', editingCustomer.id);
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        console.error('Plan document not found');
        message.error('Plan not found');
        return;
      }

      // Process new subtasks
      const newSubtasks = values.subtasks?.map((subtask: { text: string }) => ({
        id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: subtask.text,
        isCompleted: false,
        completedDate: null,
        createdAt: new Date().toISOString(),
        createdBy: user?.email || 'admin'
      })) || [];

      const plan = planDoc.data() as Plan;
      const updatedSections = plan.sections.map(section => ({
        ...section,
        tasks: section.tasks.map(task => {
          if (task.id === editingTask.id) {
            console.log('Updating task:', task.id);
            
            // Combine existing and new subtasks
            const existingSubtasks = task.subtasks || [];
            const combinedSubtasks = [...existingSubtasks, ...newSubtasks];

            return {
              ...task,
              ...(values.id && { id: `task-${values.id}`.replace('task-task-', 'task-') }),
              progress: values.progress || task.progress,
              dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : task.dueDate,
              completedDate: values.completedDate ? values.completedDate.format('YYYY-MM-DD') : task.completedDate,
              isActive: typeof values.isActive === 'boolean' ? values.isActive : task.isActive,
              current: typeof values.current === 'number' ? values.current : task.current || 0,
              goal: typeof values.goal === 'number' ? values.goal : task.goal || 0,
              notes: values.notes || task.notes || '',
              assignedTeamMembers: values.assignedTeamMembers || [],
              subtasks: combinedSubtasks,
              updatedAt: new Date().toISOString(),
              updatedBy: 'admin'
            };
          }
          return task;
        })
      }));

      await updateDoc(planRef, { 
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      });
      
      message.success('Task updated successfully');
      setEditModalVisible(false);
      
      // Reload data after update
      if (plans.type === 'single') {
        await loadPlan();
      } else {
        await loadAllPlans();
      }
    } catch (error) {
      console.error('Detailed error updating task:', error);
      if (error instanceof Error) {
        message.error(`Failed to update task: ${error.message}`);
      } else {
        message.error('Failed to update task: Unknown error');
      }
    }
  };

  const handleAddTask = async (values: any) => {
    if (!selectedCustomer) return;
    try {
      const planRef = doc(db, 'plans', selectedCustomer.id);
      const planDoc = await getDoc(planRef);
      
      if (planDoc.exists()) {
        const plan = planDoc.data() as Plan;
        
        // Process subtasks
        const subtasks = values.subtasks?.map((subtask: { text: string }) => ({
          id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: subtask.text,
          isCompleted: false,
          completedDate: null,
          createdAt: new Date().toISOString(),
          createdBy: user?.email || 'admin'
        })) || [];

        const newTask: PlanTask = {
          id: Date.now().toString(),
          task: values.task,
          section: 'Other Tasks',
          frequency: values.frequency,
          progress: 'To Do',
          dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
          completedDate: null,
          isActive: true,
          notes: values.notes || '',
          current: values.current || 0,
          goal: values.goal || 0,
          order: 0,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || 'system',
          subtasks,
          files: uploadedFiles,
          createdBy: user?.email || 'system',
          createdAt: new Date().toISOString(),
          assignedTeamMembers: values.assignedTeamMembers || []
        };

  //       // Always add to Other Tasks section
  //       const updatedSections = plan.sections.map((section) =>
  //         section.title === "Other Tasks"
  //           ? { ...section, tasks: [...section.tasks, newTask] }
  //           : section,
  //       );

  //       // If Other Tasks section doesn't exist, create it
  //       if (!plan.sections.some((section) => section.title === "Other Tasks")) {
  //         updatedSections.push({
  //           title: "Other Tasks",
  //           tasks: [newTask],
  //         });
  //       }

        await updateDoc(planRef, { sections: updatedSections })
        message.success('Task added successfully')
        setAddTaskModalVisible(false)
        loadPlan()
      }
    } catch (error) {
      console.error('Error adding task:', error)
      message.error('Failed to add task')
    }
  };

  const handleBulkEdit = async (values: any) => {
    try {
      setIsLoading(true);

      for (const record of selectedRows) {
        const planRef = doc(db, "plans", record.customer.id);
        const planDoc = await getDoc(planRef);

        if (planDoc.exists()) {
          const plan = planDoc.data() as Plan;
          const updatedSections = plan.sections.map((section) => ({
            ...section,
            tasks: section.tasks.map((task) => {
              if (task.id === record.id) {
                // Calculate due date based on frequency
                let dueDate = task.dueDate;
                if (values.dueDate) {
                  dueDate =
                    task.frequency === "Monthly"
                      ? calculateMonthlyDueDate(values.dueDate.date())
                      : values.dueDate.format("YYYY-MM-DD");
                }

                return {
                  ...task,
                  ...(values.progress && { progress: values.progress }),
                  ...(values.dueDate && { dueDate }),
                  ...(values.isActive !== undefined && {
                    isActive: values.isActive,
                  }),
                  ...(values.notes !== undefined && { notes: values.notes }),
                  ...(["Monthly", "As Needed"].includes(task.frequency) && {
                    ...(values.current !== undefined && {
                      current: values.current,
                    }),
                    ...(values.goal !== undefined && { goal: values.goal }),
                  }),
                  ...(values.assignedTeamMembers && {
                    assignedTeamMembers: values.assignedTeamMembers,
                  }),
                  updatedAt: new Date().toISOString(),
                  updatedBy: "admin",
                };
              }
              return task;
            }),
          }));

          await updateDoc(planRef, { sections: updatedSections });
        }
      }

      // Reload data
      if (plans.type === "single") {
        await loadPlan();
      } else {
        await loadAllPlans();
      }

      message.success(`Successfully updated ${selectedRows.length} tasks`);
      setBulkEditModalVisible(false);
      setSelectedRows([]);
      bulkEditForm.resetFields();
    } catch (error) {
      console.error("Error in bulk edit:", error);
      message.error("Failed to update tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnsType<TableRecord> = [
    {
      title: "Store Name",
      dataIndex: "store_name",
      key: "store_name",
      render: (text: string, record: TableRecord) => (
        <Space direction="vertical" size={4}>
          <Space>
            <Avatar src={record.customer.logo} icon={<UserOutlined />} />
            <span>{text}</span>
            {record.notes && (
              <Tooltip title={record.notes}>
                <FileTextOutlined style={{ color: "#8c8c8c" }} />
              </Tooltip>
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            <CalendarOutlined />{" "}
            {dayjs(record.customer.date_joined).format("MMM DD, YYYY")}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Task Name',
      dataIndex: 'task',
      key: 'task',
      render: (text: string, record: TableRecord) => (
        <Space direction="vertical" size={2}>
          <span>{text}</span>
          {record.section === 'Other Tasks' && record.createdBy && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Created by {adminList.find(admin => admin.email === record.createdBy)?.name || record.createdBy}
              {record.createdAt && ` on ${dayjs(record.createdAt).format('MMM DD, YYYY')}`}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Section",
      dataIndex: "section",
      key: "section",
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      key: "frequency",
    },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      render: (progress: string) => (
        <Tag color={pastelColors[progress as keyof typeof pastelColors]}>
          {progress}
        </Tag>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      sorter: (a: TableRecord, b: TableRecord) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
      },
      render: (dueDate: string | null) =>
        dueDate ? (
          <Tooltip title={isOverdue(dueDate) ? "Overdue" : "Due date"}>
            <Tag color={isOverdue(dueDate) ? "red" : "blue"}>
              <CalendarOutlined /> {dayjs(dueDate).format("MMM DD")}
            </Tag>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "Completed Date",
      dataIndex: "completedDate",
      key: "completedDate",
      render: (completedDate: string | null) =>
        completedDate ? (
          <Tag color="green">
            <CheckCircleOutlined /> {dayjs(completedDate).format("MMM DD")}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Progress Total",
      key: "progressTotal",
      render: (_: any, record: TableRecord) =>
        record.frequency === "Monthly" || record.frequency === "As Needed" ? (
          <Space direction="vertical" size={0} align="center">
            <Progress
              type="circle"
              percent={Math.round(
                ((record.current || 0) / (record.goal || 1)) * 100,
              )}
              size={50}
              strokeColor={{
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
              format={() => (
                <Text style={{ fontSize: "12px" }}>
                  {record.current || 0}/{record.goal || 0}
                </Text>
              )}
            />
            <Text
              type="secondary"
              style={{ fontSize: "12px", marginTop: "4px" }}
            >
              This Month
            </Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Total:{" "}
              {calculateTotalProgress({
                ...record,
                progress: record.progress as "To Do" | "Doing" | "Done",
                frequency: record.frequency as
                  | "Monthly"
                  | "One Time"
                  | "As Needed",
              } as PlanTask)}
            </Text>
          </Space>
        ) : null,
    },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, record: TableRecord) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => handleEdit(record, record.customer)}
        />
      ),
    },
    {
      title: "Team Members",
      key: "teamMembers",
      render: (_: any, record: TableRecord) =>
        record.assignedTeamMembers && record.assignedTeamMembers.length > 0 ? (
          <Avatar.Group maxCount={3} size="small">
            {record.assignedTeamMembers.map((email) => {
              const admin = adminList.find((a: IAdmin) => a.email === email);
              return (
                <Tooltip key={email} title={admin?.name || email}>
                  <Avatar
                    size="small"
                    style={{ backgroundColor: "#1890ff" }}
                    src={admin?.avatarUrl}
                  >
                    {!admin?.avatarUrl &&
                      (admin?.name || email)[0].toUpperCase()}
                  </Avatar>
                </Tooltip>
              );
            })}
          </Avatar.Group>
        ) : null,
    },
  ]

  const [packageFilter, setPackageFilter] = useState<string>('all');

  const filteredData = useMemo(() => {
    if (!plans.data) return [];  // Add this safety check

    const allTasks = Object.entries(plans.data).flatMap(([customerId, plan]) => {
      const customer = customers.find(c => c.id === customerId);
      if (!customer || !customer.isActive || customer.customer_type !== 'Paid') return [];
      
      if (packageFilter !== 'all' && customer.package_type !== packageFilter) {
        return [];
      }
      
      return plan.sections.flatMap(section =>
        section.tasks
          .filter(task => 
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
            (!showMyTasks || task.assignedTeamMembers?.includes(user?.email || ''))
          )
          .map(task => ({
            key: `${customerId}-${task.id}`,
            store_name: customer.store_name,
            customer,
            task: task.task,
            section: section.title,
            progress: task.progress,
            frequency: task.frequency,
            dueDate: task.dueDate || null,
            completedDate: task.completedDate || null,
            isActive: task.isActive,
            current: task.current || 0,
            goal: task.goal || 0,
            notes: task.notes || '',
            id: task.id,
            order: task.order || 0,
            updatedAt: task.updatedAt,
            updatedBy: task.updatedBy,
            files: task.files,
            createdBy: task.createdBy,
            createdAt: task.createdAt,
            assignedTeamMembers: task.assignedTeamMembers || [],
            subtasks: task.subtasks || []
          }))
      );
    });

    return allTasks;
  }, [plans, showActiveOnly, progressFilter, search, frequencyFilter, teamMemberFilter, showMyTasks, customers, user, packageFilter]);

  // Update the reset filters function
  const handleResetFilters = () => {
    setShowActiveOnly(false);
    setProgressFilter("All");
    setSearch("");
    setFrequencyFilter("All");
    setTeamMemberFilter("all");
    setShowMyTasks(false);
    setPackageFilter('all');
    localStorage.removeItem('planSimpleViewFilters');
  };

  // Move createPlanForCustomer inside component
  const createPlanForCustomer = async (customer: ICustomer) => {
    try {
      console.log("Creating plan for customer:", customer);
      console.log("Customer package type:", customer.package_type);

      // Define the package types mapping with proper typing
      const packageTypes: { [key: string]: string } = {
        "Accelerator - Basic": "acceleratorBasic",
        "Accelerator - Standard": "acceleratorStandard",
        "Accelerator - Pro": "acceleratorPro",
        "Extended Maintenance": "extendedMaintenance",
        "Regular Maintenance": "regularMaintenance",
        Social: "social",
        Default: "default",
        Free: "default", // Add Free type and map it to default
      };

      // Then use it with type checking
      const packageId =
        packageTypes[customer.package_type as keyof typeof packageTypes] ||
        "default";
      console.log("Looking for rules in document:", packageId);

      // Get the package-specific rules
      const rulesRef = doc(db, "planTaskRules", packageId);
      const rulesDoc = await getDoc(rulesRef);

      console.log("Rules exist:", rulesDoc.exists());

      // Get the rules (use package rules or default as fallback)
      const rules = rulesDoc.exists()
        ? rulesDoc.data()
        : (await getDoc(doc(db, "planTaskRules", "default"))).data();

      if (!rules) {
        message.error("No rules found for this package");
        return;
      }

      // Create the plan with these rules
      const planRef = doc(db, "plans", customer.id);
      await setDoc(planRef, {
        sections: rules.sections.map((sectionTitle: string) => ({
          title: sectionTitle,
          tasks: rules.tasks
            .filter((task: PlanTaskRule) => task.section === sectionTitle)
            .map((task: PlanTaskRule) => ({
              ...task,
              progress: "To Do",
              completedDate: null,
              current: task.defaultCurrent || 0,
              goal: task.defaultGoal || 0,
              dueDate: calculateDueDate(customer, task),
              updatedAt: new Date().toISOString(),
              updatedBy: user?.email || "",
            })),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || "",
      });

      message.success("Plan created successfully");

      // Reload the plans after creating
      if (selectedCustomer) {
        loadPlan();
      } else {
        loadAllPlans();
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      message.error("Failed to create plan");
    }
  };

  // Update the handleCustomerSelect function
  const handleCustomerSelect = async (customerId: string) => {
    if (customerId === 'all-paid') {
      setSelectedCustomer(null);
      loadAllPlans();  // Make sure this is called for 'all-paid'
    } else {
      const customer = customers.find((c: ICustomer) => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        
        // Check if customer has a plan
        const planRef = doc(db, 'plans', customerId);
        const planDoc = await getDoc(planRef);
        
        if (!planDoc.exists()) {
          // Create new plan based on package type
          await createPlanForCustomer(customer);
        } else {
          loadPlan();  // Load existing plan
        }
      }
    }
  };

  const [uploadedFiles, setUploadedFiles] = useState<TaskFile[]>([]);

  // Add file upload handler
  const handleFileUpload = async (file: File) => {
    try {
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `customTask/${selectedCustomer?.id}/${Date.now()}_${file.name}`,
      );

      if (file.size > 10 * 1024 * 1024) {
        message.error("File size must be less than 10MB");
        return false;
      }

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          url,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        },
      ]);

      return false;
    } catch (error) {
      console.error("Error uploading file:", error);
      message.error("Failed to upload file");
      return false;
    }
  };

  // Add this function to handle custom task saving
  const handleCustomTaskSave = async (values: any) => {
    if (!selectedCustomer) return;
    try {
      setIsLoading(true);
      const planRef = doc(db, "plans", selectedCustomer.id);
      const planDoc = await getDoc(planRef);

      if (planDoc.exists()) {
        const plan = planDoc.data() as Plan;
        const newTask: PlanTask = {
          id: Date.now().toString(),
          task: values.task,
          section: 'Other Tasks',
          frequency: values.frequency,
          progress: 'To Do',
          dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
          completedDate: null,
          isActive: true,
          notes: values.notes || "",
          current: values.current || 0,
          goal: values.goal || 0,
          files: uploadedFiles,
          createdBy: (user as IAdmin)?.name || user?.email || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: (user as IAdmin)?.name || user?.email || '',
          assignedTeamMembers: values.assignedTeamMembers || []
        };

        // Add to Other Tasks section
        const updatedSections = plan.sections.map((section) =>
          section.title === "Other Tasks"
            ? { ...section, tasks: [...section.tasks, newTask] }
            : section,
        );

        // If Other Tasks section doesn't exist, create it
        if (!plan.sections.some((section) => section.title === "Other Tasks")) {
          updatedSections.push({
            title: "Other Tasks",
            tasks: [newTask],
          });
        }

        // Save to Firestore
        await updateDoc(planRef, { sections: updatedSections });
        message.success("Task added successfully");
        setAddTaskModalVisible(false);

        // Reload data
        if (plans.type === "single") {
          await loadPlan();
        } else {
          await loadAllPlans();
        }
      }
    } catch (error) {
      console.error("Error adding custom task:", error);
      message.error("Failed to add task");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this with other state declarations at the top of the component
  const [adminList, setAdminList] = useState<IAdmin[]>([]);

  // Add this useEffect after other useEffects
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const admins = await FirebaseHelper.find<IAdmin>("admin");
        setAdminList(admins);
      } catch (error) {
        console.error("Error fetching admin list:", error);
        message.error("Failed to load team members");
      }
    };

    fetchAdmins();
  }, []);

  // Add state for showing inactive customers
  const [showInactive, setShowInactive] = useState(false);

  // Add this near other state declarations
  const [isDeleting, setIsDeleting] = useState(false);

  // Add this function before the return statement
  const handleBulkDelete = () => {
    Modal.confirm({
      title: `Delete ${selectedRows.length} Tasks`,
      content: (
        <div>
          <p>Are you sure you want to delete these tasks?</p>
          <p>This will:</p>
          <ul>
            <li>Remove selected tasks from customer plans</li>
            <li>This action cannot be undone</li>
          </ul>
        </div>
      ),
      async onOk() {
        try {
          setIsDeleting(true);
          const batch = writeBatch(db);
          let batchCount = 0;
          const BATCH_LIMIT = 500;

          // Group tasks by customer
          const tasksByCustomer = selectedRows.reduce((acc, row) => {
            if (!acc[row.customer.id]) {
              acc[row.customer.id] = [];
            }
            acc[row.customer.id].push(row.id);
            return acc;
          }, {} as { [customerId: string]: string[] });

          // Update each customer's plan
          for (const [customerId, taskIds] of Object.entries(tasksByCustomer)) {
            const planRef = doc(db, 'plans', customerId);
            const planDoc = await getDoc(planRef);

            if (planDoc.exists()) {
              const plan = planDoc.data() as Plan;
              const updatedSections = plan.sections.map(section => ({
                ...section,
                tasks: section.tasks.filter(task => !taskIds.includes(task.id))
              }));

              if (batchCount >= BATCH_LIMIT) {
                await batch.commit();
                batchCount = 0;
              }

              batch.update(planRef, {
                sections: updatedSections,
                updatedAt: new Date().toISOString()
              });
              batchCount++;
            }
          }

          if (batchCount > 0) {
            await batch.commit();
          }

          message.success(`Successfully deleted ${selectedRows.length} tasks`);
          setSelectedRows([]);

          // Reload data
          if (selectedCustomer) {
            loadPlan();
          } else {
            loadAllPlans();
          }
        } catch (error) {
          console.error('Error deleting tasks:', error);
          message.error('Failed to delete tasks');
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  return (
    <Layout>
      <Content style={{ padding: "16px" }}>
        <Card>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Title level={4}>Select Customer</Title>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Select
                style={{ width: "100%" }}
                placeholder="Select a customer"
                value={selectedCustomer ? selectedCustomer.id : "all-paid"}
                onChange={handleCustomerSelect}
                size="large"
                listHeight={400}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label?.toString() || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                <Option value="all-paid">All Customers</Option>
                <Option key="divider" disabled>
                  ──────────────
                </Option>
                {customers
                  .filter(
                    (customer) =>
                      customer.customer_type === "Paid" &&
                      (showInactive || customer.isActive),
                  )
                  .sort((a, b) => {
                    // Sort by date_joined in descending order (most recent first)
                    if (!a.date_joined || !b.date_joined) return 0;
                    return (
                      dayjs(b.date_joined).valueOf() -
                      dayjs(a.date_joined).valueOf()
                    );
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
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                            }}
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

        <Card style={{ marginTop: 16 }}>
          <Space wrap>
            <Space>
              <Switch
                checked={showActiveOnly}
                onChange={(checked) => {
                  setShowActiveOnly(checked); // This will be immediate
                }}
              />
              <Text>Show Active Only</Text>
            </Space>
            <Space>
              <Switch
                checked={showMyTasks}
                onChange={(checked) => {
                  setShowMyTasks(checked); // This will be immediate
                }}
              />
              <Text>My Tasks</Text>
            </Space>
            <Select
              style={{ width: 150 }}
              value={progressFilter}
              onChange={setProgressFilter}
            >
              <Option value="All">All Progress</Option>
              <Option value="To Do and Doing">To Do & Doing</Option>
              <Option value="Done">Done</Option>
            </Select>
            <Search
              placeholder="Search tasks..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={(value) => {
                setSearch(value); // Only update search state when user hits enter or clicks search
              }}
              allowClear
              style={{ width: 200 }}
            />
            <Select
              style={{ width: 200 }}
              value={frequencyFilter}
              onChange={setFrequencyFilter}
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
                        style={{ backgroundColor: "#1890ff" }}
                        src={admin.avatarUrl}
                      >
                        {!admin.avatarUrl &&
                          (admin.name || admin.email)[0].toUpperCase()}
                      </Avatar>
                      {admin.name || admin.email}
                    </Space>
                  </Option>
                ))}
            </Select>
            <Select
              style={{ width: 200 }}
              value={packageFilter}
              onChange={setPackageFilter}
              placeholder="Filter by Package"
            >
              <Option value="all">All Packages</Option>
              <Option value="Accelerator - Basic">Accelerator Basic</Option>
              <Option value="Accelerator - Standard">Accelerator Standard</Option>
              <Option value="Accelerator - Pro">Accelerator Pro</Option>
              <Option value="Extended Maintenance">Extended Maintenance</Option>
              <Option value="Regular Maintenance">Regular Maintenance</Option>
              <Option value="Social">Social</Option>
            </Select>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
            {selectedCustomer && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  addTaskForm.resetFields(); // Reset form before opening
                  setUploadedFiles([]); // Reset uploaded files
                  setAddTaskModalVisible(true);
                }}
              >
                Add Custom Task
              </Button>
            )}
            {selectedRows.length > 0 && (
              <Space>
                <Button
                  type="primary"
                  onClick={() => setBulkEditModalVisible(true)}
                >
                  Bulk Edit ({selectedRows.length})
                </Button>
                <Button
                  danger
                  type="primary"
                  onClick={handleBulkDelete}
                  loading={isDeleting}
                  icon={<DeleteOutlined />}
                >
                  Delete Selected ({selectedRows.length})
                </Button>
              </Space>
            )}
          </Space>
        </Card>

        <Table 
          columns={columns as ColumnsType<TableRecord>} 
          dataSource={filteredData}
          style={{ marginTop: 16 }}
          loading={isLoading}
          rowSelection={{
            type: 'checkbox',
            onChange: (selectedRowKeys: Key[], selectedRows: TableRecord[]) => {
              setSelectedRows(selectedRows);
            },
            selectedRowKeys: selectedRows.map((row) => row.key),
          }}
        />

        <Modal
          title={editingTask ? 'Edit Task' : 'Add Task'}
          open={editModalVisible}
          onOk={form.submit}
          onCancel={() => setEditModalVisible(false)}
          width={1000}
          style={{ top: 20 }}
        >
          <Form
            form={form}
            onFinish={handleEditSave}
            layout="vertical"
            initialValues={{
              progress: editingTask?.progress,
              dueDate: editingTask?.dueDate ? dayjs(editingTask.dueDate) : null,
              completedDate: editingTask?.completedDate
                ? dayjs(editingTask.completedDate)
                : null,
              isActive: editingTask?.isActive ?? false,
              current: editingTask?.current ?? 0,
              goal: editingTask?.goal ?? 0,
              notes: editingTask?.notes ?? "",
              assignedTeamMembers: editingTask?.assignedTeamMembers || [],
            }}
          >
            <Form.Item name="progress" label="Progress">
              <Select>
                <Option value="To Do">To Do</Option>
                <Option value="Doing">Doing</Option>
                <Option value="Done">Done</Option>
              </Select>
            </Form.Item>

            <Form.Item name="id" label="Task ID">
              <Input 
                placeholder="123456"
                addonBefore="task-"
                value={form.getFieldValue('id')}
                onChange={(e) => {
                  const value = e.target.value.replace('task-', '');
                  form.setFieldsValue({ id: value });
                }}
              />
            </Form.Item>

            <Form.Item name="dueDate" label="Due Date">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="completedDate" label="Completed Date">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="isActive" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>

            {editingTask?.frequency !== "One Time" && (
              <Space>
                <Form.Item name="current" label="Current">
                  <InputNumber min={0} />
                </Form.Item>
                <Form.Item name="goal" label="Goal">
                  <InputNumber min={0} />
                </Form.Item>
              </Space>
            )}

            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={4} />
            </Form.Item>

            <Divider orientation="left">Subtasks</Divider>
            <Form.List name="subtasks">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Space key={field.key} style={{ display: 'flex', width: '100%', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...field}
                        name={[field.name, 'text']}
                        style={{ width: '500px' }}
                        rules={[{ required: true, message: 'Missing subtask text' }]}
                      >
                        <Input placeholder="Subtask text" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Subtask
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            {editingTask?.subtasks && editingTask.subtasks.length > 0 && (
              <>
                <Divider orientation="left">Existing Subtasks</Divider>
                <div style={{ marginBottom: 16 }}>
                  {editingTask.subtasks.map((subtask) => (
                    <div 
                      key={subtask.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: 8,
                        padding: 12,
                        background: '#f5f5f5',
                        borderRadius: 6,
                        width: '100%'
                      }}
                    >
                      <Checkbox
                        checked={subtask.isCompleted}
                        onChange={async (e) => {
                          try {
                            if (!editingCustomer || !editingTask) return;
                            
                            // Immediately update local state for UI feedback
                            const updatedTask = {
                              ...editingTask,
                              subtasks: editingTask.subtasks?.map(st => 
                                st.id === subtask.id 
                                  ? {
                                      ...st,
                                      isCompleted: e.target.checked,
                                      completedDate: e.target.checked ? new Date().toISOString() : null
                                    }
                                  : st
                              )
                            };
                            setEditingTask(updatedTask);
                            
                            // Then update Firestore
                            const planRef = doc(db, 'plans', editingCustomer.id);
                            const planDoc = await getDoc(planRef);
                            
                            if (planDoc.exists()) {
                              const plan = planDoc.data() as Plan;
                              const updatedSections = plan.sections.map(section => ({
                                ...section,
                                tasks: section.tasks.map(task => {
                                  if (task.id === editingTask.id) {
                                    return {
                                      ...task,
                                      subtasks: task.subtasks?.map(st => 
                                        st.id === subtask.id 
                                          ? {
                                              ...st,
                                              isCompleted: e.target.checked,
                                              completedDate: e.target.checked ? new Date().toISOString() : null
                                            }
                                          : st
                                      )
                                    };
                                  }
                                  return task;
                                })
                              }));

                              await updateDoc(planRef, { 
                                sections: updatedSections,
                                updatedAt: new Date().toISOString()
                              });

                              message.success('Subtask updated');
                              
                              // Reload data in background
                              if (plans.type === 'single') {
                                loadPlan();
                              } else {
                                loadAllPlans();
                              }
                            }
                          } catch (error) {
                            // If Firestore update fails, revert local state
                            setEditingTask(editingTask);
                            console.error('Error updating subtask:', error);
                            message.error('Failed to update subtask');
                          }
                        }}
                        style={{ marginRight: 12 }}
                      />
                      <Text 
                        style={{ 
                          textDecoration: subtask.isCompleted ? 'line-through' : 'none',
                          flex: 1,
                          fontSize: '14px'
                        }}
                      >
                        {subtask.text}
                      </Text>
                      <Space size="small">
                        {subtask.completedDate && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Completed: {dayjs(subtask.completedDate).format('MMM DD, YYYY')}
                          </Text>
                        )}
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Added by {adminList.find(admin => admin.email === subtask.createdBy)?.name || subtask.createdBy} on {dayjs(subtask.createdAt).format('MMM DD, YYYY')}
                        </Text>
                      </Space>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Form.Item label="Attachments">
              <Upload
                beforeUpload={handleFileUpload}
                fileList={(editingTask?.files || []).map(file => ({
                  uid: file.url,
                  name: file.name,
                  status: 'done',
                  url: file.url,
                }))}
                onRemove={(file) => {
                  // Handle file removal
                  const updatedFiles = editingTask?.files?.filter(f => f.url !== file.uid) || [];
                  setEditingTask(prev => prev ? { ...prev, files: updatedFiles } : null);
                  return true;
                }}
              >
                <Button icon={<UploadOutlined />}>Upload File</Button>
              </Upload>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Max file size: 10MB
              </Text>
            </Form.Item>

            <Form.Item name="assignedTeamMembers" label="Assigned Team Members">
              <Select
                mode="multiple"
                style={{ width: "100%" }}
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

            {editingTask?.section === "Other Tasks" &&
              editingTask.createdBy && (
                <>
                  <Divider />
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">
                      Created by: {editingTask.createdBy}
                    </Text>
                    <Text type="secondary">
                      Created:{" "}
                      {dayjs(editingTask.createdAt).format("MMM DD, YYYY")}
                    </Text>
                    {editingTask.updatedBy !== editingTask.createdBy && (
                      <Text type="secondary">
                        Last updated by: {editingTask.updatedBy} (
                        {dayjs(editingTask.updatedAt).format("MMM DD, YYYY")})
                      </Text>
                    )}
                  </Space>
                </>
              )}
          </Form>
        </Modal>

        <Modal
          title="Add Custom Task"
          open={addTaskModalVisible}
          onOk={addTaskForm.submit}
          onCancel={() => {
            setAddTaskModalVisible(false);
            addTaskForm.resetFields();
            setUploadedFiles([]);
          }}
          destroyOnClose={true}
          width={1000}
          style={{ top: 20 }}
        >
          <Form 
            form={addTaskForm} 
            onFinish={handleAddTask} 
            layout="vertical"
          >
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

            <Form.Item
              name="frequency"
              label="Frequency"
              rules={[{ required: true }]}
            >
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
                const frequency = getFieldValue("frequency");
                return (
                  <>
                    {frequency === "Monthly" && (
                      <Form.Item name="monthlyDueDate" label="Monthly Due Date">
                        <Select>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(
                            (day) => (
                              <Option key={day} value={day}>
                                Day {day}
                              </Option>
                            ),
                          )}
                        </Select>
                      </Form.Item>
                    )}
                    {(frequency === "Monthly" || frequency === "As Needed") && (
                      <>
                        <Form.Item name="requiresGoal" valuePropName="checked">
                          <Checkbox>Requires Goal</Checkbox>
                        </Form.Item>
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) =>
                            prevValues.requiresGoal !==
                            currentValues.requiresGoal
                          }
                        >
                          {({ getFieldValue }) =>
                            getFieldValue("requiresGoal") ? (
                              <Space>
                                <Form.Item
                                  name="current"
                                  label="Current"
                                  initialValue={0}
                                >
                                  <InputNumber min={0} />
                                </Form.Item>
                                <Form.Item
                                  name="goal"
                                  label="Goal"
                                  rules={[{ required: true }]}
                                >
                                  <InputNumber min={0} />
                                </Form.Item>
                              </Space>
                            ) : null
                          }
                        </Form.Item>
                      </>
                    )}
                    {frequency !== "Monthly" && (
                      <Form.Item name="dueDate" label="Due Date">
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    )}
                  </>
                );
              }}
            </Form.Item>

            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={4} />
            </Form.Item>

            {/* Add Subtasks section */}
            <Divider orientation="left">Subtasks</Divider>
            <Form.List name="subtasks">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Space key={field.key} style={{ display: 'flex', width: '100%', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...field}
                        name={[field.name, 'text']}
                        style={{ width: '500px' }}
                        rules={[{ required: true, message: 'Missing subtask text' }]}
                      >
                        <Input placeholder="Subtask text" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Subtask
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            {/* File upload section follows */}
            <Form.Item label="Attachments">
              <Upload
                beforeUpload={handleFileUpload}
                fileList={uploadedFiles.map((file) => ({
                  uid: file.url,
                  name: file.name,
                  status: "done",
                  url: file.url,
                }))}
                onRemove={(file) => {
                  setUploadedFiles((prev) =>
                    prev.filter((f) => f.url !== file.uid),
                  );
                  return true;
                }}
              >
                <Button icon={<UploadOutlined />}>Upload File</Button>
              </Upload>
              <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                Max file size: 10MB
              </Text>
            </Form.Item>

            {/* Add team member selection */}
            <Form.Item name="assignedTeamMembers" label="Assigned Team Members">
              <Select
                mode="multiple"
                style={{ width: "100%" }}
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

            {/* Add creator info display */}
            <Space
              direction="vertical"
              style={{ width: "100%", marginTop: 16 }}
            >
              <Text type="secondary">
                Created by: {(user as IAdmin)?.name || user?.email}
              </Text>
              <Text type="secondary">
                Date: {dayjs().format("MMM DD, YYYY")}
              </Text>
            </Space>
          </Form>
        </Modal>

        <Modal
          title={`Bulk Edit ${selectedRows.length} Tasks`}
          open={bulkEditModalVisible}
          onOk={bulkEditForm.submit}
          onCancel={() => {
            setBulkEditModalVisible(false);
            bulkEditForm.resetFields();
          }}
          destroyOnClose
        >
          <Form form={bulkEditForm} onFinish={handleBulkEdit} layout="vertical">
            <Form.Item name="progress" label="Progress">
              <Select allowClear>
                <Option value="To Do">To Do</Option>
                <Option value="Doing">Doing</Option>
                <Option value="Done">Done</Option>
              </Select>
            </Form.Item>

            <Form.Item name="dueDate" label="Due Date">
              <DatePicker style={{ width: "100%" }} allowClear />
            </Form.Item>

            <Form.Item name="isActive" label="Active Status">
              <Select allowClear>
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Form.Item>

            {selectedRows.some((row) =>
              ["Monthly", "As Needed"].includes(row.frequency),
            ) && (
              <Space>
                <Form.Item name="current" label="Current">
                  <InputNumber min={0} />
                </Form.Item>
                <Form.Item name="goal" label="Goal">
                  <InputNumber min={0} />
                </Form.Item>
              </Space>
            )}

            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={4} allowClear />
            </Form.Item>

            <Form.Item name="assignedTeamMembers" label="Assigned Team Members">
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="Select team members"
                allowClear
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

            <Alert
              message="Note"
              description="Only filled fields will be updated. Empty fields will be ignored."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};
export default PlanSimpleView;
