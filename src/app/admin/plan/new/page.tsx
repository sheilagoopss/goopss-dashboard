"use client";

import { useState, useEffect, useCallback } from "react";
import { PlanSection, PlanTask, Plan, TaskFile, ISubtask } from "@/types/Plan";
import { ICustomer, IAdmin } from "@/types/Customer";
import { message } from "antd";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  Search,
  AlertCircle,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  Target,
  Paperclip,
  X,
  Plus,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserAvatars } from "@/components/plan/user-avatars";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskCalendar } from "@/components/plan/task-calendar";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import dayjs from "dayjs";
import { PlanTaskRule } from "@/types/PlanTasks";
import { Form } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Modal } from "antd";
import { Alert } from "antd";
import { Button as AntButton } from "antd";  // Import Antd Button

interface Props {
  customers: ICustomer[];
  selectedCustomer: ICustomer | null;
  setSelectedCustomer: (customer: ICustomer | null) => void;
}

interface TaskCardProps {
  task: PlanTask & { customer?: ICustomer };
  teamMembers: IAdmin[];
  onEdit: (task: PlanTask & { customer?: ICustomer }) => void;
}

const TaskCard = ({ task, onEdit }: TaskCardProps) => {
  const getCardColor = (progress: string) => {
    switch (progress) {
      case "To Do":
        return "bg-blue-500 hover:bg-blue-600";
      case "Doing":
        return "bg-orange-500 hover:bg-orange-600";
      case "Done":
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getStatusIcon = (progress: string) => {
    switch (progress) {
      case "To Do":
        return <Clock className="w-8 h-8" />;
      case "Doing":
        return <RefreshCw className="w-8 h-8" />;
      case "Done":
        return <CheckCircle2 className="w-8 h-8" />;
      default:
        return <AlertCircle className="w-8 h-8" />;
    }
  };

  const calculateProgress = () => {
    if (task.frequency === "Monthly" || task.frequency === "As Needed") {
      const current = task.current || 0;
      const goal = task.goal || 0;
      return { current, goal };
    }
    return null;
  };

  const progress = calculateProgress();

  return (
    <Card
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${getCardColor(
        task.progress,
      )} rounded-xl`}
      onClick={() => onEdit(task)}
    >
      <div className="p-3 text-white" style={{ minHeight: "180px" }}>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          {getStatusIcon(task.progress)}
        </div>
        <h3 className="text-base font-semibold mb-1 line-clamp-2">
          {task.task}
        </h3>
        {task.customer && (
          <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
            <Avatar className="h-4 w-4">
              <AvatarImage
                src={task.customer.logo}
                alt={task.customer.store_name}
              />
              <AvatarFallback>{task.customer.store_name[0]}</AvatarFallback>
            </Avatar>
            <span>{task.customer.store_name}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
          <Calendar className="h-3 w-3" />
          <span>
            Due{" "}
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString()
              : "No date"}
          </span>
        </div>
        {/* Rest of your existing card content */}
        {progress && (
          <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
            <Target className="h-3 w-3" />
            <span>
              Progress: {progress.current}/{progress.goal}
            </span>
          </div>
        )}
        {task.files && task.files.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
            <Paperclip className="h-3 w-3" />
            <span>Files: {task.files.length}</span>
          </div>
        )}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
            <CheckCircle2 className="h-3 w-3" />
            <span>Subtasks: {task.subtasks.length}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

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

// Add this type at the top of the file
type PlanTaskFrequency = "One Time" | "Monthly" | "As Needed";

// Add this type near the top of the file
type PlanTaskWithCustomer = PlanTask & { customer?: ICustomer };

// Add this new component near the BulkEditModal
const BulkDeleteButton = ({ selectedRows, onSuccess }: { 
  selectedRows: (PlanTask & { customer?: ICustomer })[],
  onSuccess: () => void 
}) => {
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      message.warning("Please select tasks to delete");
      return;
    }

    Modal.confirm({
      title: "Delete Selected Tasks",
      content: (
        <div>
          <p>Are you sure you want to delete {selectedRows.length} selected tasks?</p>
          <Alert
            message="Warning"
            description="This action cannot be undone. Tasks will be permanently removed from customer plans."
            type="warning"
            showIcon
            className="mt-4"
          />
        </div>
      ),
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          // Group tasks by customer for batch processing
          const tasksByCustomer: { [customerId: string]: PlanTask[] } = {};
          selectedRows.forEach(task => {
            if (task.customer?.id) {
              if (!tasksByCustomer[task.customer.id]) {
                tasksByCustomer[task.customer.id] = [];
              }
              tasksByCustomer[task.customer.id].push(task);
            }
          });

          // Process each customer's tasks
          for (const [customerId, tasks] of Object.entries(tasksByCustomer)) {
            const planRef = doc(db, "plans", customerId);
            const planDoc = await getDoc(planRef);

            if (planDoc.exists()) {
              const plan = planDoc.data() as Plan;
              const taskIds = tasks.map(t => t.id);

              // Filter out the deleted tasks from each section
              const updatedSections = plan.sections.map(section => ({
                ...section,
                tasks: section.tasks.filter(task => !taskIds.includes(task.id))
              }));

              // Update the plan
              await updateDoc(planRef, {
                sections: updatedSections,
                updatedAt: new Date().toISOString()
              });
            }
          }

          message.success(`Successfully deleted ${selectedRows.length} tasks`);
          onSuccess(); // Clear selection and refresh data
        } catch (error) {
          console.error("Error deleting tasks:", error);
          message.error("Failed to delete tasks");
        }
      }
    });
  };

  return (
    <AntButton  // Use AntButton instead of Button
      onClick={handleBulkDelete}
      disabled={selectedRows.length === 0}
      danger
      className="ml-2"
    >
      Delete Selected ({selectedRows.length})
    </AntButton>
  );
};

function NewPlanView({
  customers = [],
  selectedCustomer,
  setSelectedCustomer,
}: Props) {
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [progressFilter, setProgressFilter] = useState<
    "All" | "To Do" | "Doing" | "To Do and Doing" | "Done"
  >("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [teamMemberFilter, setTeamMemberFilter] = useState("all");
  const [teamMembers, setTeamMembers] = useState<IAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localCustomers, setLocalCustomers] = useState<ICustomer[]>(customers);
  const [isOpen, setIsOpen] = useState(false);
  const [plans, setPlans] = useState<{ sections: PlanSection[] } | null>(null);
  const [allPlans, setAllPlans] = useState<{
    [customerId: string]: { sections: PlanSection[] };
  }>({});
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<{ [section: string]: number }>(
    {},
  );
  const ITEMS_PER_PAGE = 12;
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<PlanTask | null>(null);
  const [newTask, setNewTask] = useState<PlanTask | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(
    null,
  );
  const [newSubTask, setNewSubTask] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState<
    "all" | "overdue" | "upcoming"
  >("all");
  const [selectedRows, setSelectedRows] = useState<
    (PlanTask & { customer?: ICustomer })[]
  >([]);
  const [bulkEditModalVisible, setBulkEditModalVisible] = useState(false);
  const [bulkEditForm] = Form.useForm();
  const [bulkEditFormState, setBulkEditFormState] = useState<{
    progress?: string;
    dueDate?: Date;
    completedDate?: Date;
    frequency?: string;
    isActive?: boolean;
    notes?: string;
    current?: number;
    goal?: number;
    assignedTeamMembers?: string[];
  }>({});
  // Add this state to track unsaved changes
  const [unsavedTask, setUnsavedTask] = useState<PlanTask | null>(null);

  const clearAllStates = () => {
    setEditingTask(null);
    setNewTask(null);
    setEditingCustomer(null);
    setNewSubTask("");
    setSelectedRows([]);
    setBulkEditModalVisible(false);
    setBulkEditFormState({});
    bulkEditForm.resetFields();
    setEditModalVisible(false);
  };

  const createPlanForCustomer = async (customer: ICustomer) => {
    try {
      const packageTypes: { [key: string]: string } = {
        "Accelerator - Basic": "acceleratorBasic",
        "Accelerator - Standard": "acceleratorStandard",
        "Accelerator - Pro": "acceleratorPro",
        "Extended Maintenance": "extendedMaintenance",
        "Regular Maintenance": "regularMaintenance",
        Social: "social",
        Default: "default",
        Free: "default",
      };

      const packageId = packageTypes[customer.package_type] || "default";

      // Get the package-specific rules
      const rulesRef = doc(db, "planTaskRules", packageId);
      const rulesDoc = await getDoc(rulesRef);

      if (!rulesDoc.exists()) {
        message.error("No rules found for this package");
        return;
      }

      const rules = rulesDoc.data();

      // Create the initial plan data
      const newPlan = {
        sections: (rules.sections || []).map((sectionTitle: string) => ({
          title: sectionTitle,
          tasks: (rules.tasks || [])
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
      };

      // Create the plan with these rules
      const planRef = doc(db, "plans", customer.id);
      await setDoc(planRef, newPlan);

      message.success("Plan created successfully");

      // Set the plan data immediately after creation
      if (selectedCustomer) {
        // If we're in single customer view, set the plans state
        setPlans(newPlan);
      } else {
        // If we're in all customers view, update the allPlans state
        setAllPlans((prev) => ({
          ...prev,
          [customer.id]: newPlan,
        }));
      }

      return newPlan; // Return the new plan data
    } catch (error) {
      console.error("Error creating plan:", error);
      message.error("Failed to create plan");
      return null;
    }
  };

  const loadAllPlans = async () => {
    try {
      setIsLoading(true);

      // Get only active paid customers first
      const customersRef = collection(db, "customers");
      const customersSnapshot = await getDocs(
        query(
          customersRef,
          where("customer_type", "==", "Paid"),
          where("isActive", "==", true),
        ),
      );

      // Load plans in batches of 10
      const BATCH_SIZE = 10;
      const plansData: { [customerId: string]: { sections: PlanSection[] } } =
        {};

      for (let i = 0; i < customersSnapshot.docs.length; i += BATCH_SIZE) {
        const batch = customersSnapshot.docs.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map((customerDoc) =>
          getDoc(doc(db, "plans", customerDoc.id)),
        );

        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach((planDoc, index) => {
          if (planDoc.exists()) {
            plansData[batch[index].id] = planDoc.data() as {
              sections: PlanSection[];
            };
          }
        });
      }

      setAllPlans(plansData);
      setPlans(null); // Clear single plan when viewing all
    } catch (error) {
      console.error("Error loading all plans:", error);
      message.error("Failed to load plans");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlan = async () => {
    if (!selectedCustomer) return;
    try {
      // First, reset everything
      setEditModalVisible(false);
      setEditingTask(null);
      setEditingCustomer(null);
      setNewTask(null);
      setNewSubTask("");
      setSelectedRows([]);
      setBulkEditModalVisible(false);
      setBulkEditFormState({});
      bulkEditForm.resetFields();
      
      // Clear plans first
      setPlans(null);
      setAllPlans({});
      
      // Wait for state to clear completely
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setIsLoading(true);
      const planRef = doc(db, "plans", selectedCustomer.id);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        await createPlanForCustomer(selectedCustomer);
        return;
      }

      const planData = planDoc.data() as Plan;

      // Add this before processing the plan
      console.log('Raw plan data:', JSON.stringify(planData, null, 2));

      // Process and set new plan data with proper typing
      const processedPlan = {
        ...planData,
        sections: (planData?.sections || []).map((section) => {
          if (!section) {
            return {
              title: 'Other Tasks',
              tasks: [] as PlanTask[]  // Explicitly type the empty array
            };
          }

          const processedTasks = (section?.tasks || [])
            .map((task) => {
              if (!task) return null;
              
              return {
                id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                task: task.task || 'Untitled Task',
                section: task.section || section.title || 'Other Tasks',
                files: (task?.files || []).map(file => {
                  if (typeof file === 'string') {
                    return {
                      name: file,
                      url: file,
                      size: 0,
                      uploadedAt: new Date().toISOString()
                    } as TaskFile;
                  }
                  return file as TaskFile;
                }),
                subtasks: (task?.subtasks || []).map(subtask => {
                  if (typeof subtask === 'string') {
                    return {
                      id: subtask,
                      text: subtask,
                      isCompleted: false,
                      completedDate: null,
                      completedBy: null,
                      createdAt: new Date().toISOString(),
                      createdBy: 'system'
                    } as ISubtask;
                  }
                  return subtask as ISubtask;
                }),
                assignedTeamMembers: task?.assignedTeamMembers || [],
                current: task?.current || 0,
                goal: task?.goal || 0,
                progress: task?.progress || 'To Do',
                frequency: task?.frequency || 'One Time',
                isActive: task?.isActive ?? true,
                notes: task?.notes || '',
                dueDate: task?.dueDate || null,
                completedDate: task?.completedDate || null,
                createdAt: task?.createdAt || new Date().toISOString(),
                createdBy: task?.createdBy || 'system',
                updatedAt: task?.updatedAt || new Date().toISOString(),
                updatedBy: task?.updatedBy || 'system'
              } as PlanTask;
            })
            .filter((task): task is PlanTask => task !== null); // Type guard to remove nulls

          return {
            ...section,
            title: section.title || 'Other Tasks',
            tasks: processedTasks
          };
        })
      };

      // Set new plan data
      await new Promise(resolve => setTimeout(resolve, 50));
      setPlans(processedPlan);

    } catch (error) {
      console.error("Error loading plan:", error);
      message.error("Failed to load plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSelect = async (value: string) => {
    // First, force close any open modals and clear ALL states
    setEditModalVisible(false);
    setEditingTask(null);
    setEditingCustomer(null);
    setNewTask(null);
    setNewSubTask("");
    setSelectedRows([]);
    setBulkEditModalVisible(false);
    setBulkEditFormState({});
    bulkEditForm.resetFields();
    
    // Important: Clear plans BEFORE setting new customer
    setPlans(null);
    setAllPlans({});
    
    // Wait for states to clear
    await new Promise(resolve => setTimeout(resolve, 50));

    // Then set the new customer or clear it
    if (value === "all") {
      setSelectedCustomer(null);
      await loadAllPlans();
    } else {
      const customer = customers.find((c) => c.id === value);
      if (customer) {
        setSelectedCustomer(customer);
        
        // Load the new customer's plan
        const planRef = doc(db, "plans", customer.id);
        const planDoc = await getDoc(planRef);

        if (!planDoc.exists()) {
          const newPlan = await createPlanForCustomer(customer);
          if (newPlan) {
            setPlans(newPlan);
          }
        } else {
          const planData = planDoc.data() as Plan;
          setPlans({
            ...planData,
            sections: planData.sections.map((section) => ({
              ...section,
              tasks: (section?.tasks || []).filter(Boolean),
            })),
          });
        }
      }
    }
    setIsOpen(false);
  };

  const handleEditTask = (task: PlanTask & { customer?: ICustomer }) => {
    // Close any open modal first
    setEditModalVisible(false);
    setEditingTask(null);
    setEditingCustomer(null);
    setNewTask(null);
    setNewSubTask("");
    
    // Get the current customer
    const customer = task.customer || selectedCustomer;
    if (!customer) return;

    // Set the task data directly first
    const baseTask = {
      ...task,
      files: task.files || [],
      customer: customer, // Explicitly attach customer info to the task
    } as PlanTaskWithCustomer;

    // Try to get additional data from plans if available
    let taskData;
    if (selectedCustomer && plans) {
      taskData = plans.sections
        .find(s => s.title === task.section)
        ?.tasks.find(t => t.id === task.id);
    } else if (allPlans[customer.id]) {
      taskData = allPlans[customer.id].sections
        .find(s => s.title === task.section)
        ?.tasks.find(t => t.id === task.id);
    }

    // Set the task and customer data
    setEditingCustomer(customer);
    setEditingTask(taskData ? { ...taskData, customer } : baseTask);  // Ensure customer info is attached
    
    // Open the modal
    setEditModalVisible(true);
  };

  const handleCreateTask = async (newTask: Partial<PlanTask>) => {
    if (!selectedCustomer && !editingCustomer) {
      message.error("Please select a customer");
      return;
    }

    const targetCustomer = selectedCustomer || editingCustomer;
    if (!targetCustomer) {
      message.error("Please select a customer");
      return;
    }

    try {
      setIsLoading(true);
      const planRef = doc(db, "plans", targetCustomer.id);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        throw new Error("Plan not found");
      }

      // Create a new task with all required fields
      const taskId = doc(collection(db, "temp")).id; // Generate Firebase ID

      if (!newTask.task || !newTask.section) {
        throw new Error("Task name and section are required");
      }

      const createdTask: PlanTask = {
        id: taskId,
        task: newTask.task,
        section: newTask.section,
        progress: newTask.progress || "To Do",
        frequency: newTask.frequency || "One Time",
        current: newTask.current || 0,
        goal: newTask.goal || 0,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
        completedDate: newTask.completedDate ? new Date(newTask.completedDate).toISOString() : null,
        isActive: true,
        notes: newTask.notes || "",
        assignedTeamMembers: newTask.assignedTeamMembers || [],
        subtasks: newTask.subtasks || [],
        files: newTask.files || [],
        createdAt: new Date().toISOString(),
        createdBy: user?.email || "system",
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || "system",
        monthlyHistory: [],
        order: newTask.order || 0,  // Add this line
        daysAfterJoin: newTask.daysAfterJoin || null  // Add this line
      };

      const plan = planDoc.data() as Plan;

      // Add the new task to the specified section
      const updatedSections = plan.sections.map((section) => {
        if (section.title === newTask.section) {
          return {
            ...section,
            tasks: [...section.tasks, createdTask],
          };
        }
        return section;
      });

      // Save to Firestore
      await updateDoc(planRef, {
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
      });

      // Update local state based on whether we're in single or all customers view
      if (selectedCustomer) {
        setPlans((prevPlans) => {
          if (!prevPlans) return null;

          return {
            ...prevPlans,
            sections: prevPlans.sections.map((section) => {
              if (section.title === newTask.section) {
                return {
                  ...section,
                  tasks: [...section.tasks, createdTask],
                };
              }
              return section;
            }),
          };
        });
      } else {
        setAllPlans((prev) => {
          const currentPlan = prev[targetCustomer.id] || { sections: [] };

          return {
            ...prev,
            [targetCustomer.id]: {
              ...currentPlan,
              sections: currentPlan.sections.map((section) => {
                if (section.title === newTask.section) {
                  return {
                    ...section,
                    tasks: [...section.tasks, createdTask],
                  };
                }
                return section;
              }),
            },
          };
        });
      }

      setEditModalVisible(false);
      setEditingTask(null);
      setEditingCustomer(null);
      message.success("Task created successfully");
    } catch (error) {
      console.error("Error creating task:", error);
      message.error("Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSave = async (updates: Partial<PlanTask>) => {
    try {
      if (!editingTask) return;

      // Type assertion to include customer property
      const taskWithCustomer = editingTask as PlanTaskWithCustomer;
      
      // Get the correct customer ID either from selected customer or from the task's customer
      const targetCustomerId = selectedCustomer?.id || taskWithCustomer.customer?.id;
      if (!targetCustomerId) {
        message.error("Cannot find customer");
        return;
      }

      setIsLoading(true);
      const planRef = doc(db, "plans", targetCustomerId);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        throw new Error("Plan not found");
      }

      const planData = planDoc.data() as Plan;
      const updatedSections = planData.sections.map((section) => ({
        ...section,
        tasks: (section?.tasks || []).filter(Boolean).map((task) =>
          task.id === editingTask.id ? { ...task, ...updates } : task
        ),
      }));

      await updateDoc(planRef, {
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || "unknown",
      });

      // Update local state
      if (selectedCustomer) {
        // Single customer view
        setPlans((prev) =>
          prev
            ? {
                ...prev,
                sections: updatedSections,
              }
            : null
        );
      } else {
        // All customers view
        setAllPlans((prev) => ({
          ...prev,
          [targetCustomerId]: {
            ...prev[targetCustomerId],
            sections: updatedSections,
          },
        }));
      }

      message.success("Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      message.error("Failed to update task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (
    task: PlanTask,
    updates: Partial<PlanTask>,
  ) => {
    if (!selectedCustomer) return;

    try {
      setIsLoading(true);
      const planRef = doc(db, "plans", selectedCustomer.id);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        throw new Error("Plan not found");
      }

      const plan = planDoc.data() as Plan;
      const updatedSections = plan.sections.map((section) => ({
        ...section,
        tasks: (section?.tasks || []).filter(Boolean).map((t) =>
          t.id === task.id ? { ...t, ...updates } : t,
        ),
      }));

      await updateDoc(planRef, {
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setPlans((prevPlans) => {
        if (!prevPlans) return null;
        return {
          ...prevPlans,
          sections: prevPlans.sections.map((section) => ({
            ...section,
            tasks: (section?.tasks || []).filter(Boolean).map((t) =>
              t.id === task.id ? { ...t, ...updates } : t,
            ),
          })),
        };
      });

      message.success("Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      message.error("Failed to update task");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all plans when in "All Customers" view
  useEffect(() => {
    const fetchAllPlans = async () => {
      if (selectedCustomer) return; // Skip if a specific customer is selected

      try {
        setIsLoading(true);
        const plansData: { [customerId: string]: { sections: PlanSection[] } } =
          {};

        // Load plans in batches of 10
        const BATCH_SIZE = 10;
        for (let i = 0; i < customers.length; i += BATCH_SIZE) {
          const batch = customers.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map((customer) =>
            getDoc(doc(db, "plans", customer.id)),
          );

          const batchResults = await Promise.all(batchPromises);

          batchResults.forEach((planDoc, index) => {
            if (planDoc.exists()) {
              plansData[batch[index].id] = planDoc.data() as {
                sections: PlanSection[];
              };
            }
          });
        }

        setAllPlans(plansData);
      } catch (error) {
        console.error("Error loading all plans:", error);
        message.error("Failed to load plans");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllPlans();
  }, [customers, selectedCustomer]);

  // Get all tasks for all customers

  // Update localCustomers when props change
  useEffect(() => {
    if (customers.length > 0) {
      setLocalCustomers(customers);
      setIsLoading(false);
    }
  }, [customers]);

  // Fetch customers if not provided
  useEffect(() => {
    const fetchCustomers = async () => {
      if (customers.length === 0 && localCustomers.length === 0) {
        try {
          setIsLoading(true);
          const customersRef = collection(db, "customers");
          const customersQuery = query(
            customersRef,
            where("customer_type", "==", "Paid"),
            where("isActive", "==", true),
          );
          const customersSnap = await getDocs(customersQuery);

          const fetchedCustomers = customersSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ICustomer[];

          setLocalCustomers(fetchedCustomers);
        } catch (error) {
          console.error("Error fetching customers:", error);
          message.error("Failed to load customers");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCustomers();
  }, [customers.length, localCustomers.length]);

  // Filters section with new UI
  const filterTasks = useCallback(
    (task: PlanTask) => {
      const matchesTeamMember =
        teamMemberFilter === "all"
          ? true
          : Boolean(task.assignedTeamMembers?.includes(teamMemberFilter));

      const matchesSearch =
        searchQuery === "" ||
        task.task.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Updated progress matching logic
      const matchesProgress =
        progressFilter === "All" ||
        (progressFilter === "To Do and Doing"
          ? task.progress === "To Do" || task.progress === "Doing"
          : progressFilter === task.progress);
        
      const matchesActive = !showActiveOnly || task.isActive;

      let matchesDueDate = true;
      if (dueDateFilter === "overdue") {
        matchesDueDate = isOverdue(task);
      } else if (dueDateFilter === "upcoming") {
        matchesDueDate = isUpcoming(task);
      }

      return (
        matchesTeamMember &&
        matchesSearch &&
        matchesProgress &&
        matchesActive &&
        matchesDueDate
      );
    },
    [
      teamMemberFilter,
      searchQuery,
      progressFilter,
      showActiveOnly,
      dueDateFilter,
    ],
  );

  // Add helper functions for date filtering
  const isOverdue = (task: PlanTask) => {
    if (!task.dueDate) return false;
    if (task.progress === "Done") return false; // Exclude completed tasks
    return new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  const isUpcoming = (task: PlanTask) => {
    if (!task.dueDate) return false;
    if (task.progress === "Done") return false; // Exclude completed tasks
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const dueDate = new Date(task.dueDate);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return dueDate >= today && dueDate <= sevenDaysFromNow;
  };

  const FiltersSection = () => {
    const [inputValue, setInputValue] = useState(searchQuery);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <Select
            open={isOpen}
            onOpenChange={setIsOpen}
            value={selectedCustomer?.id || "all"}
            onValueChange={handleCustomerSelect}
          >
            <SelectTrigger className="w-[250px] bg-white">
              <SelectValue placeholder="Select customer">
                {selectedCustomer ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={selectedCustomer.logo}
                        alt={selectedCustomer.store_name}
                      />
                      <AvatarFallback>
                        {selectedCustomer.store_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                      {selectedCustomer.store_name} -{" "}
                      {selectedCustomer.store_owner_name}
                    </span>
                  </div>
                ) : (
                  "All Customers"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {localCustomers &&
                localCustomers.length > 0 &&
                localCustomers
                  .filter(
                    (customer) =>
                      customer.customer_type === "Paid" && customer.isActive,
                  )
                  .sort((a, b) => a.store_name.localeCompare(b.store_name)) // Sort alphabetically
                  .map((customer) => (
                    <SelectItem
                      key={customer.id}
                      value={customer.id}
                      textValue={`${customer.store_name} ${customer.store_owner_name}`} // Add textValue prop for searching
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={customer.logo}
                            alt={customer.store_name}
                          />
                          <AvatarFallback>
                            {customer.store_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {customer.store_name} - {customer.store_owner_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>

          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks... (Press Enter to search)"
              className="pl-8 pr-10 bg-white"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setSearchQuery(inputValue);
                }
              }}
            />
            {(inputValue || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 w-7 p-0 hover:bg-muted"
                onClick={() => {
                  setInputValue("");
                  setSearchQuery("");
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>

          <Select
            value={progressFilter}
            onValueChange={(value: any) => setProgressFilter(value)}
          >
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Progress</SelectItem>
              <SelectItem value="To Do">To Do</SelectItem>
              <SelectItem value="Doing">Doing</SelectItem>
              <SelectItem value="To Do and Doing">To Do & Doing</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={dueDateFilter}
            onValueChange={(value: "all" | "overdue" | "upcoming") =>
              setDueDateFilter(value)
            }
          >
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by due date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="upcoming">Due This Week</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
              id="active-only"
            />
            <Label htmlFor="active-only">Active Only</Label>
          </div>

          {teamMembers.length > 0 && (
            <div className="flex items-center gap-2">
              <UserAvatars
                users={teamMembers.map((member) => ({
                  id: member.email,
                  email: member.email,
                  name: member.name,
                  avatarUrl: member.avatarUrl || "",
                  role: "Admin",
                  isAdmin: true,
                }))}
                selectedUsers={
                  teamMemberFilter !== "all" ? [teamMemberFilter] : []
                }
                onUserClick={(userId: string) => {
                  if (teamMemberFilter === userId) {
                    setTeamMemberFilter("all");
                  } else {
                    setTeamMemberFilter(userId);
                  }
                }}
              />
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setProgressFilter("All");
                    setShowActiveOnly(false);
                    setTeamMemberFilter("all");
                    setDueDateFilter("all");
                  }}
                  className="ml-2"
                  aria-label="Reset filters"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset all filters</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  };

  // Get tasks for the current page
  const getPaginatedTasks = (
    tasks: (PlanTask & { customer?: ICustomer })[],
    section: string,
  ) => {
    const page = currentPage[section] || 1;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return tasks.slice(start, end);
  };

  // Get total pages for a section
  const getTotalPages = (tasks: (PlanTask & { customer?: ICustomer })[]) => {
    return Math.ceil(tasks.length / ITEMS_PER_PAGE);
  };

  // Handle page change
  const handlePageChange = (section: string, page: number) => {
    setCurrentPage((prev) => ({
      ...prev,
      [section]: page,
    }));
    // Optionally scroll to top of section
    const sectionElement = document.getElementById(section);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Fetch plan data when customer changes
  useEffect(() => {
    const fetchPlan = async () => {
      if (!selectedCustomer) {
        setPlans(null);
        return;
      }

      try {
        setIsLoading(true);
        const planRef = doc(db, "plans", selectedCustomer.id);
        const planDoc = await getDoc(planRef);

        if (planDoc.exists()) {
          const planData = planDoc.data() as Plan;
          // Ensure files array exists for each task
          const processedPlan = {
            ...planData,
            sections: planData.sections.map((section) => ({
              ...section,
              tasks: (section?.tasks || []).filter(Boolean).map((task) => ({
                ...task,
                files: task.files || [],
              })),
            })),
          };
          setPlans(processedPlan);
        } else {
          setPlans({ sections: [] });
        }
      } catch (error) {
        console.error("Error loading plan:", error);
        message.error("Failed to load plan");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [selectedCustomer]);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const adminsRef = collection(db, "admin");
        const adminsSnapshot = await getDocs(adminsRef);

        const adminUsers = adminsSnapshot.docs
          .filter((doc) => doc.data().canBeAssignedToTasks === true)
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              email: data.email,
              name: data.name,
              avatarUrl: data.avatarUrl,
              canBeAssignedToTasks: data.canBeAssignedToTasks,
            } as IAdmin;
          });
        setTeamMembers(adminUsers);
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    };

    fetchTeamMembers();
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `tasks/${editingCustomer?.id || selectedCustomer?.id}/${Date.now()}_${
          file.name
        }`,
      );

      if (file.size > 10 * 1024 * 1024) {
        message.error("File size must be less than 10MB");
        return false;
      }

      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      const newFile = {
        name: file.name,
        url,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };

      // Update unsavedTask instead of editingTask
      setUnsavedTask(prev => {
        if (!prev && editingTask) {
          // Initialize unsavedTask with editingTask if it doesn't exist
          return {
            ...editingTask,
            files: [...(editingTask.files || []), newFile],
          };
        }
        return prev ? {
          ...prev,
          files: [...(prev.files || []), newFile],
        } : null;
      });

      message.success("File uploaded successfully");
      return false;
    } catch (error) {
      console.error("Error uploading file:", error);
      message.error("Failed to upload file");
      return false;
    }
  };

  // Add this function to handle bulk edits
  const handleBulkEdit = async (values: any) => {
    try {
      // Check if any values were actually changed
      const hasChanges = Object.keys(values).length > 0;

      if (!hasChanges) {
        message.info("No changes were made");
        setBulkEditModalVisible(false);
        setSelectedRows([]);
        bulkEditForm.resetFields();
        return;
      }

      setIsLoading(true);

      for (const task of selectedRows) {
        if (!task.customer) continue;

        const planRef = doc(db, "plans", task.customer.id);
        const planDoc = await getDoc(planRef);

        if (planDoc.exists()) {
          const plan = planDoc.data() as Plan;
          const updatedSections = plan.sections.map((section) => ({
            ...section,
            tasks: (section?.tasks || []).filter(Boolean).map((t) => {
              if (t.id === task.id) {
                // Calculate due date based on frequency
                let dueDate = t.dueDate;
                if (values.dueDate) {
                  dueDate =
                    t.frequency === "Monthly"
                      ? calculateMonthlyDueDate(
                          new Date(values.dueDate).getDate(),
                        )
                      : format(new Date(values.dueDate), "yyyy-MM-dd");
                }

                const updatedTask = {
                  ...t,
                  ...(values.progress && { progress: values.progress }),
                  ...(values.dueDate && { dueDate }),
                  ...(values.completedDate && {
                    completedDate: format(
                      new Date(values.completedDate),
                      "yyyy-MM-dd",
                    ),
                  }),
                  ...(values.frequency && { frequency: values.frequency }),
                  ...(values.isActive !== undefined && {
                    isActive: values.isActive,
                  }),
                  ...(values.notes && { notes: values.notes }),
                  ...(values.current !== undefined && {
                    current: parseInt(values.current),
                  }),
                  ...(values.goal !== undefined && {
                    goal: parseInt(values.goal),
                  }),
                  ...(values.assignedTeamMembers?.length > 0 && {
                    assignedTeamMembers: values.assignedTeamMembers,
                  }),
                  updatedAt: new Date().toISOString(),
                  updatedBy: user?.email || "unknown",
                };

                return updatedTask;
              }
              return t;
            }),
          }));

          await updateDoc(planRef, {
            sections: updatedSections,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // Reload data
      if (selectedCustomer) {
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

  // Modify the selection check function
  const isTaskSelected = (task: PlanTask & { customer?: ICustomer }) => {
    return selectedRows.some(
      (r) => r.id === task.id && r.customer?.id === task.customer?.id,
    );
  };

  // Add this check for Monthly/As Needed tasks
  const hasMonthlyOrAsNeededTasks = selectedRows.some((task) =>
    ["Monthly", "As Needed"].includes(task.frequency),
  );

  // Update filtered sections whenever filters or data change
  useEffect(() => {
    const sections: {
      [key: string]: {
        tasks: (PlanTask & { customer?: ICustomer })[];
        customers: ICustomer[];
      };
    } = {};

    if (selectedCustomer && plans) {
      // Single customer view
      (plans.sections || []).forEach((section) => {
        // Add null check for tasks
        const tasks = section?.tasks || [];
        const filteredTasks = tasks.filter(filterTasks);

        if (filteredTasks?.length > 0) {
          sections[section.title || 'Other Tasks'] = {
            tasks: filteredTasks.map((task) => ({
              ...task,
              customer: selectedCustomer,
              customerId: selectedCustomer.id,
            })),
            customers: [selectedCustomer],
          };
        }
      });
    } else {
      // All customers view
      Object.entries(allPlans).forEach(([customerId, plan]) => {
        const customer = customers.find((c) => c.id === customerId);
        if (!customer || !customer.isActive || customer.customer_type !== "Paid") return;

        (plan.sections || []).forEach((section) => {
          // Add null check for tasks
          const tasks = section?.tasks || [];
          const filteredTasks = tasks.filter(filterTasks);

          if (filteredTasks?.length > 0) {
            const sectionTitle = section.title || 'Other Tasks';
            if (!sections[sectionTitle]) {
              sections[sectionTitle] = { tasks: [], customers: [] };
            }

            sections[sectionTitle].tasks.push(
              ...filteredTasks.map((task) => ({
                ...task,
                customer,
                customerId,
              }))
            );

            if (!sections[sectionTitle].customers.find((c) => c.id === customer.id)) {
              sections[sectionTitle].customers.push(customer);
            }
          }
        });
      });
    }
  }, [
    selectedCustomer,
    plans,
    allPlans,
    customers,
    teamMemberFilter,
    searchQuery,
    progressFilter,
    showActiveOnly,
    filterTasks,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage({});
  }, [
    searchQuery,
    progressFilter,
    teamMemberFilter,
    showActiveOnly,
    selectedCustomer,
  ]);

  // Add this useEffect to watch for selectedCustomer changes
  useEffect(() => {
    // Clear all editing states when customer changes
    clearAllStates();
  }, [selectedCustomer]); // This will run whenever selectedCustomer changes

  // Add cleanup to useEffect that watches plans
  useEffect(() => {
    if (plans) {
      clearAllStates();
    }
  }, [plans]);

  // Modify the task editing handlers to update unsavedTask instead of directly calling handleEditSave
  const handleTaskChange = (changes: Partial<PlanTask>) => {
    if (editingTask) {
      setUnsavedTask(prev => ({
        ...(prev || editingTask),
        ...changes
      }));
    } else if (newTask) {
      setNewTask(prev => prev ? {
        ...prev,
        ...changes
      } : null);
    }
  };

  // Add this function to handle subtask completion
  const handleSubtaskComplete = async (
    task: PlanTask,
    subtaskId: string,
    isCompleted: boolean,
    customerId: string
  ) => {
    try {
      // Immediately update the UI for both views
      setEditingTask(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          subtasks: prev.subtasks.map(st => {
            if (st.id === subtaskId) {
              return {
                ...st,
                isCompleted,
                completedDate: isCompleted ? new Date().toISOString() : null,
                completedBy: isCompleted ? user?.email || "unknown" : null
              };
            }
            return st;
          })
        };
        return updated;
      });

      // Then update Firestore
      const planRef = doc(db, "plans", customerId);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        message.error("Plan not found");
        return;
      }

      const plan = planDoc.data() as Plan;
      const updatedSections = plan.sections.map(section => ({
        ...section,
        tasks: section.tasks.map(t => {
          if (t.id === task.id) {
            return {
              ...t,
              subtasks: t.subtasks.map(st => {
                if (st.id === subtaskId) {
                  return {
                    ...st,
                    isCompleted,
                    completedDate: isCompleted ? new Date().toISOString() : null,
                    completedBy: isCompleted ? user?.email || "unknown" : null
                  };
                }
                return st;
              })
            };
          }
          return t;
        })
      }));

      // Update Firestore first
      await updateDoc(planRef, {
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      });

      // Then update local state for both views consistently
      if (selectedCustomer) {
        setPlans(currentPlans => {
          if (!currentPlans) return currentPlans;
          const newPlans = {
            ...currentPlans,
            sections: updatedSections
          };
          return newPlans;
        });
      } else {
        setAllPlans(currentPlans => ({
          ...currentPlans,
          [customerId]: {
            sections: updatedSections
          }
        }));
      }

      message.success("Subtask updated successfully");
    } catch (error) {
      console.error("Error updating subtask:", error);
      message.error("Failed to update subtask");
    }
  };

  // Update the subtask addition handler
  const handleAddSubtask = async () => {
    if (!newSubTask.trim()) return;

    const subtask = {
      id: `subtask-${Date.now()}`,
      text: newSubTask.trim(),
      isCompleted: false,
      completedDate: null,
      completedBy: null,
      createdAt: new Date().toISOString(),
      createdBy: user?.email || "unknown"
    };

    // If it's a new task that hasn't been saved yet
    if (newTask) {
      // Just update the local state
      setNewTask(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          subtasks: [...(prev.subtasks || []), subtask]
        };
      });
    } 
    // If it's an existing task being edited
    else if (editingTask) {
      // Update both UI and Firestore
      try {
        setEditingTask(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            subtasks: [...(prev.subtasks || []), subtask]
          };
        });

        // Then update Firestore if it's an existing task
        if (editingCustomer || selectedCustomer) {
          const customerId = editingCustomer?.id || selectedCustomer?.id;
          const planRef = doc(db, "plans", customerId!);
          const planDoc = await getDoc(planRef);

          if (planDoc.exists()) {
            const plan = planDoc.data() as Plan;
            const updatedSections = plan.sections.map(section => ({
              ...section,
              tasks: section.tasks.map(t => {
                if (t.id === editingTask.id) {
                  return {
                    ...t,
                    subtasks: [...(t.subtasks || []), subtask]
                  };
                }
                return t;
              })
            }));

            await updateDoc(planRef, {
              sections: updatedSections,
              updatedAt: new Date().toISOString()
            });

            // Update local state
            if (selectedCustomer) {
              setPlans(prev => ({
                ...prev!,
                sections: updatedSections
              }));
            } else {
              setAllPlans(prev => ({
                ...prev,
                [customerId!]: {
                  sections: updatedSections
                }
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error adding subtask:", error);
        message.error("Failed to add subtask");
        return;
      }
    }

    // Clear the input
    setNewSubTask("");
    message.success("Subtask added");
  };

  // When saving the entire new task
  const handleSaveNewTask = async () => {
    try {
      // Validate the task has required fields
      if (!newTask?.task || !newTask?.section) {
        message.error("Please fill in all required fields");
        return;
      }

      const customerId = selectedCustomer?.id;
      if (!customerId) {
        message.error("No customer selected");
        return;
      }

      // First save the main task with its subtasks
      const planRef = doc(db, "plans", customerId);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        message.error("Plan not found");
        return;
      }

      const plan = planDoc.data() as Plan;
      const updatedSections = plan.sections.map(section => {
        if (section.title === newTask.section) {
          return {
            ...section,
            tasks: [...section.tasks, newTask]
          };
        }
        return section;
      });

      // Save everything to Firestore
      await updateDoc(planRef, {
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      if (selectedCustomer) {
        setPlans(prev => ({
          ...prev!,
          sections: updatedSections
        }));
      } else {
        setAllPlans(prev => ({
          ...prev,
          [customerId]: {
            sections: updatedSections
          }
        }));
      }

      // Clear states
      setNewTask(null);
      setEditModalVisible(false);
      message.success("Task created successfully");
    } catch (error) {
      console.error("Error saving new task:", error);
      message.error("Failed to create task");
    }
  };

  return (
    <div 
      key={`view-${selectedCustomer?.id || 'all'}`}  // Add this key
      className="w-full max-w-7xl mx-auto p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <Button
          onClick={() => {
            const today = new Date();
            const date = today.getDate().toString().padStart(2, "0");
            const month = (today.getMonth() + 1).toString().padStart(2, "0");
            const random = Math.floor(Math.random() * 1000)
              .toString()
              .padStart(3, "0"); // 3 digits
            const newTaskId = `task-${date}${month}${random}`;

            setNewTask({
              id: newTaskId,
              task: "",
              section: "Other Tasks",
              progress: "To Do",
              frequency: "One Time",
              isActive: true,
              dueDate: null,
              completedDate: null,
              current: 0,
              goal: 0,
              notes: "",
              assignedTeamMembers: [],
              subtasks: [],
              files: [],
              createdAt: new Date().toISOString(),
              createdBy: user?.email || "unknown",
              updatedAt: new Date().toISOString(),
              updatedBy: user?.email || "unknown",
              order: 0,  // Add this line
              daysAfterJoin: null  // Add this line
            });
            setEditingTask(null);
            setEditingCustomer(null);
            setEditModalVisible(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Custom Task
        </Button>
      </div>

      <FiltersSection />

      <div className="flex items-center gap-2 mb-4">
        {selectedRows.length > 0 && (
          <>
            <Button
              onClick={() => setBulkEditModalVisible(true)}
              disabled={selectedRows.length === 0}
            >
              Bulk Edit ({selectedRows.length})
            </Button>
            <BulkDeleteButton 
              selectedRows={selectedRows}
              onSuccess={() => {
                setSelectedRows([]);
                loadAllPlans(); // Refresh the data
              }}
            />
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <Tabs defaultValue="list" className="mt-6">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>
          <TabsContent
            value="list"
            key={`list-${teamMemberFilter}-${searchQuery}-${progressFilter}-${showActiveOnly}-${
              selectedCustomer?.id || "all"
            }`}
          >
            <div className="space-y-12 mt-8">
              {(() => {
                const sections: {
                  [key: string]: {
                    tasks: (PlanTask & { customer?: ICustomer })[];
                    customers: ICustomer[];
                  };
                } = {};

                if (selectedCustomer && plans) {
                  (plans.sections || []).forEach((section) => {
                    // Add null check for tasks
                    const tasks = section?.tasks || [];
                    const filteredTasks = tasks.filter(filterTasks);

                    if (filteredTasks?.length > 0) {
                      sections[section.title || 'Other Tasks'] = {
                        tasks: filteredTasks.map((task) => ({
                          ...task,
                          customer: selectedCustomer,
                          customerId: selectedCustomer.id,
                        })),
                        customers: [selectedCustomer],
                      };
                    }
                  });
                } else {
                  Object.entries(allPlans).forEach(([customerId, plan]) => {
                    const customer = customers.find((c) => c.id === customerId);
                    if (!customer || !customer.isActive || customer.customer_type !== "Paid") return;

                    (plan.sections || []).forEach((section) => {
                      // Add null check for tasks
                      const tasks = section?.tasks || [];
                      const filteredTasks = tasks.filter(filterTasks);

                      if (filteredTasks?.length > 0) {
                        const sectionTitle = section.title || 'Other Tasks';
                        if (!sections[sectionTitle]) {
                          sections[sectionTitle] = { tasks: [], customers: [] };
                        }

                        sections[sectionTitle].tasks.push(
                          ...filteredTasks.map((task) => ({
                            ...task,
                            customer,
                            customerId,
                          }))
                        );

                        if (!sections[sectionTitle].customers.find((c) => c.id === customer.id)) {
                          sections[sectionTitle].customers.push(customer);
                        }
                      }
                    });
                  });
                }

                return Object.entries(sections).map(
                  ([sectionTitle, { tasks }]) => (
                    <div
                      key={sectionTitle}
                      id={sectionTitle}
                      className="bg-white rounded-lg p-6 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                          <h2 className="text-2xl font-medium">
                            {sectionTitle}
                          </h2>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const sectionTasks = getPaginatedTasks(
                                tasks,
                                sectionTitle,
                              );
                              if (
                                sectionTasks.every((task) =>
                                  selectedRows.some(
                                    (r) =>
                                      r.id === task.id &&
                                      r.customer?.id === task.customer?.id
                                  )
                                )) {
                                // If all tasks are selected, deselect them
                                setSelectedRows((prev) =>
                                  prev.filter(
                                    (row) =>
                                      !sectionTasks.some(
                                        (task) =>
                                          task.id === row.id &&
                                          row.customer?.id === row.customer?.id
                                      )
                                  )
                                );
                              } else {
                                // If not all tasks are selected, select all
                                const newTasks = sectionTasks.filter(
                                  (task) =>
                                    !selectedRows.some(
                                      (r) =>
                                        r.id === task.id &&
                                        r.customer?.id === task.customer?.id
                                    )
                                );
                                setSelectedRows([...selectedRows, ...newTasks]);
                              }
                            }}
                          >
                            {getPaginatedTasks(tasks, sectionTitle).every(
                              (task) =>
                                selectedRows.some(
                                  (r) =>
                                    r.id === task.id &&
                                    r.customer?.id === task.customer?.id
                                )
                              )
                                ? "Deselect All"
                                : "Select All"}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTotalPages(tasks) > 1 && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handlePageChange(
                                    sectionTitle,
                                    (currentPage[sectionTitle] || 1) - 1,
                                  )
                                }
                                disabled={(currentPage[sectionTitle] || 1) <= 1}
                              >
                                Previous
                              </Button>
                              <span className="text-sm">
                                Page {currentPage[sectionTitle] || 1} of{" "}
                                {getTotalPages(tasks)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handlePageChange(
                                    sectionTitle,
                                    (currentPage[sectionTitle] || 1) + 1,
                                  )
                                }
                                disabled={
                                  (currentPage[sectionTitle] || 1) >=
                                  getTotalPages(tasks)
                                }
                              >
                                Next
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        {(() => {
                          const paginatedTasks = getPaginatedTasks(
                            tasks,
                            sectionTitle,
                          );
                          return paginatedTasks.map((task) => {
                            // Ensure we're using the correct customer
                            const taskWithCustomer = {
                              ...task,
                              customer: task.customer,
                              customerId: task.customer?.id,
                            };

                            const assignedMembers = teamMembers.filter(
                              (member) =>
                                taskWithCustomer.assignedTeamMembers?.includes(
                                  member.email,
                                ),
                            );

                            return (
                              <div
                                key={`${taskWithCustomer.id}-${taskWithCustomer.customerId}`}
                                className="relative cursor-pointer group"
                              >
                                {/* Add team member avatars next to checkbox */}
                                <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
                                  {/* Team member avatars */}
                                  {assignedMembers.length > 0 && (
                                    <div className="flex -space-x-3">
                                      {" "}
                                      {/* Increased negative space for larger avatars */}
                                      {assignedMembers.map((member: IAdmin) => (
                                        <TooltipProvider key={member.email}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Avatar className="h-8 w-8 border-2 border-white/20">
                                                {" "}
                                                {/* Increased size to match icon */}
                                                <AvatarImage
                                                  src={member.avatarUrl}
                                                />
                                                <AvatarFallback>
                                                  {member.name?.[0] ||
                                                    member.email[0]}
                                                </AvatarFallback>
                                              </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>
                                                {member.name || member.email}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ))}
                                    </div>
                                  )}

                                  {/* Checkbox */}
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const isSelected =
                                        isTaskSelected(taskWithCustomer);
                                      if (!isSelected) {
                                        setSelectedRows((prev) => [
                                          ...prev,
                                          taskWithCustomer,
                                        ]);
                                      } else {
                                        setSelectedRows((prev) =>
                                          prev.filter(
                                            (r) =>
                                              !(
                                                r.id === taskWithCustomer.id &&
                                                r.customer?.id ===
                                                  taskWithCustomer.customer?.id
                                              ),
                                          ),
                                        );
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      checked={isTaskSelected(taskWithCustomer)}
                                      className="bg-white/80 hover:bg-white"
                                    />
                                  </div>
                                </div>

                                {/* Highlight overlay when selected */}
                                {isTaskSelected(taskWithCustomer) && (
                                  <div className="absolute inset-0 bg-primary/20 z-10 rounded-lg" />
                                )}

                                {/* Remove the team member avatars from the card content */}
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTask(taskWithCustomer);
                                  }}
                                >
                                  <TaskCard
                                    key={`task-${task.id}-${task.customer?.id || selectedCustomer?.id}`}
                                    task={taskWithCustomer}
                                    teamMembers={teamMembers}
                                    onEdit={handleEditTask}
                                  />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ),
                );
              })()}
            </div>
          </TabsContent>
          <TabsContent
            value="calendar"
            key={`calendar-${teamMemberFilter}-${searchQuery}-${progressFilter}-${showActiveOnly}-${
              selectedCustomer?.id || "all"
            }`}
            className="mt-6"
          >
            <TaskCalendar
              taskGroups={(() => {
                const sections: {
                  [key: string]: {
                    tasks: (PlanTask & { customer?: ICustomer })[];
                    customers: ICustomer[];
                  };
                } = {};

                if (selectedCustomer && plans) {
                  (plans.sections || []).forEach((section) => {
                    // Add null check for tasks
                    const tasks = section?.tasks || [];
                    const filteredTasks = tasks.filter(filterTasks);

                    if (filteredTasks?.length > 0) {
                      sections[section.title || 'Other Tasks'] = {
                        tasks: filteredTasks.map((task) => ({
                          ...task,
                          customer: selectedCustomer,
                          customerId: selectedCustomer.id,
                        })),
                        customers: [selectedCustomer],
                      };
                    }
                  });
                } else {
                  Object.entries(allPlans).forEach(([customerId, plan]) => {
                    const customer = customers.find((c) => c.id === customerId);
                    if (!customer || !customer.isActive || customer.customer_type !== "Paid") return;

                    (plan.sections || []).forEach((section) => {
                      // Add null check for tasks
                      const tasks = section?.tasks || [];
                      const filteredTasks = tasks.filter(filterTasks);

                      if (filteredTasks?.length > 0) {
                        sections[section.title || 'Other Tasks'] = {
                          tasks: filteredTasks.map((task) => ({
                            ...task,
                            customer,
                            customerId,
                          })),
                          customers: [customer], // Changed from [selectedCustomer] to [customer]
                        };
                      }
                    });
                  });
                }

                return Object.entries(sections).map(([title, { tasks }]) => ({
                  title,
                  tasks,
                }));
              })()}
              users={teamMembers.map((member) => ({
                id: member.email,
                email: member.email,
                name: member.name,
                avatarUrl: member.avatarUrl || "",
                role: "Admin",
                isAdmin: true,
              }))}
              onUpdateTask={handleUpdateTask}
              onEdit={handleEditTask}
            />
          </TabsContent>
        </Tabs>
      )}

      {editModalVisible && (
        <Dialog
          open={editModalVisible}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setEditModalVisible(false);
              setEditingTask(null);
              setEditingCustomer(null);
              setNewTask(null);
              setNewSubTask("");
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTask
                  ? editingTask.section === "Other Tasks"
                    ? `Edit Task: ${editingTask.task}`
                    : editingTask.task
                  : "Create New Task"}
                {editingCustomer && (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={editingCustomer.logo}
                        alt={editingCustomer.store_name}
                      />
                      <AvatarFallback>
                        {editingCustomer.store_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <a
                      href={`https://${editingCustomer.store_name}.etsy.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-normal text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {editingCustomer.store_name}
                    </a>
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>
            {(editingTask || newTask) && (
              <div className="grid grid-cols-2 gap-12">
                {/* Left Column - Main Task Details */}
                <div className="space-y-4 border-r pr-6">
                  {/* Only show task name field for custom tasks or new tasks */}
                  {(!editingTask || editingTask.section === "Other Tasks") && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="task" className="text-sm text-right">
                        Task Name
                      </Label>
                      <Input
                        id="task"
                        value={editingTask?.task || newTask?.task || ""}
                        onChange={(e) => {
                          handleTaskChange({ task: e.target.value });
                        }}
                        className="col-span-3"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="progress" className="text-sm text-right">
                      Progress
                    </Label>
                    <Select
                      value={unsavedTask?.progress || editingTask?.progress || newTask?.progress || "To Do"}
                      onValueChange={(value: "To Do" | "Doing" | "Done") => {
                        handleTaskChange({ progress: value });
                      }}
                    >
                      <SelectTrigger className="col-span-3 text-sm">
                        <SelectValue placeholder="Select progress" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="Doing">Doing</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dueDate" className="text-sm text-right">
                      Due Date
                    </Label>
                    <div className="col-span-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !unsavedTask?.dueDate && !editingTask?.dueDate && !newTask?.dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {unsavedTask?.dueDate ? (
                              format(new Date(unsavedTask.dueDate), "PPP")
                            ) : editingTask?.dueDate ? (
                              format(new Date(editingTask.dueDate), "PPP")
                            ) : newTask?.dueDate ? (
                              format(new Date(newTask.dueDate), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={
                              unsavedTask?.dueDate
                                ? new Date(unsavedTask.dueDate)
                                : editingTask?.dueDate
                                ? new Date(editingTask.dueDate)
                                : newTask?.dueDate
                                ? new Date(newTask.dueDate)
                                : undefined
                            }
                            onSelect={(date) => {
                              handleTaskChange({
                                dueDate: date ? format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : null
                              });
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="completedDate" className="text-sm text-right">
                      Completed Date
                    </Label>
                    <div className="col-span-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !unsavedTask?.completedDate && !editingTask?.completedDate && !newTask?.completedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {unsavedTask?.completedDate ? (
                              format(new Date(unsavedTask.completedDate), "PPP")
                            ) : editingTask?.completedDate ? (
                              format(new Date(editingTask.completedDate), "PPP")
                            ) : newTask?.completedDate ? (
                              format(new Date(newTask.completedDate), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={
                              unsavedTask?.completedDate
                                ? new Date(unsavedTask.completedDate)
                                : editingTask?.completedDate
                                ? new Date(editingTask.completedDate)
                                : newTask?.completedDate
                                ? new Date(newTask.completedDate)
                                : undefined
                            }
                            onSelect={(date) => {
                              handleTaskChange({
                                completedDate: date ? format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : null
                              });
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="frequency" className="text-sm text-right">
                      Frequency
                    </Label>
                    <Select
                      name="frequency"
                      value={unsavedTask?.frequency || editingTask?.frequency || newTask?.frequency}
                      onValueChange={(value: PlanTaskFrequency) => {
                        handleTaskChange({ frequency: value });
                      }}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="One Time">One Time</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="As Needed">As Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Add this block for Monthly and As Needed tasks */}
                  {(unsavedTask?.frequency === "Monthly" || 
                    unsavedTask?.frequency === "As Needed" ||
                    editingTask?.frequency === "Monthly" || 
                    editingTask?.frequency === "As Needed" ||
                    newTask?.frequency === "Monthly" || 
                    newTask?.frequency === "As Needed") && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Progress</Label>
                      <div className="col-span-3 flex gap-4">
                        <div className="flex-1">
                          <Label htmlFor="current">Current</Label>
                          <Input
                            id="current"
                            type="number"
                            min={0}
                            value={unsavedTask?.current || editingTask?.current || newTask?.current || 0}
                            onChange={(e) => {
                              handleTaskChange({ current: parseInt(e.target.value) });
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="goal">Goal</Label>
                          <Input
                            id="goal"
                            type="number"
                            min={0}
                            value={unsavedTask?.goal || editingTask?.goal || newTask?.goal || 0}
                            onChange={(e) => {
                              handleTaskChange({ goal: parseInt(e.target.value) });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="isActive" className="text-right">
                      Active
                    </Label>
                    <div className="col-span-3">
                      <Switch
                        id="isActive"
                        checked={unsavedTask?.isActive ?? editingTask?.isActive ?? newTask?.isActive ?? true}
                        onCheckedChange={(checked) => {
                          handleTaskChange({ isActive: checked });
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={unsavedTask?.notes || editingTask?.notes || newTask?.notes || ""}
                      onChange={(e) => {
                        handleTaskChange({ notes: e.target.value });
                      }}
                      className="col-span-3"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="assignedTeamMembers" className="text-right">
                      Team Members
                    </Label>
                    <div className="col-span-3">
                      <div className="grid grid-cols-2 gap-2">
                        {teamMembers
                          .filter((admin) => admin.canBeAssignedToTasks)
                          .map((admin) => (
                            <div
                              key={admin.email}
                              className="flex items-center gap-2 bg-secondary/10 rounded-md p-1.5"
                            >
                              <Checkbox
                                id={admin.email}
                                checked={
                                  unsavedTask?.assignedTeamMembers?.includes(
                                    admin.email,
                                  ) ||
                                  editingTask?.assignedTeamMembers?.includes(
                                    admin.email,
                                  ) ||
                                  newTask?.assignedTeamMembers?.includes(
                                    admin.email,
                                  ) ||
                                  false
                                }
                                onCheckedChange={(checked) => {
                                  handleTaskChange({
                                    assignedTeamMembers: checked
                                      ? [
                                          ...(unsavedTask?.assignedTeamMembers || []),
                                          admin.email,
                                        ]
                                      : (unsavedTask?.assignedTeamMembers || []).filter(
                                          (email) => email !== admin.email,
                                        ) || []
                                  });
                                }}
                              />
                              <Label
                                htmlFor={admin.email}
                                className="flex items-center gap-1.5 text-sm"
                              >
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={admin.avatarUrl} />
                                  <AvatarFallback>
                                    {admin.name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">
                                  {admin.name || admin.email}
                                </span>
                              </Label>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Subtasks and Files */}
                <div className="space-y-6">
                  {/* Subtasks Section */}
                  <div>
                    <Label className="text-sm font-semibold">Subtasks</Label>
                    <div className="mt-2 space-y-2">
                      {editingTask?.subtasks?.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center justify-between bg-secondary/20 p-2 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={subtask.id}
                              checked={subtask.isCompleted}
                              onCheckedChange={(checked) => {
                                if (editingTask && editingCustomer) {
                                  handleSubtaskComplete(
                                    editingTask,
                                    subtask.id,
                                    checked as boolean,
                                    editingCustomer.id
                                  );
                                } else if (editingTask && selectedCustomer) {
                                  // Handle single customer view
                                  handleSubtaskComplete(
                                    editingTask,
                                    subtask.id,
                                    checked as boolean,
                                    selectedCustomer.id
                                  );
                                }
                              }}
                            />
                            <div className="flex flex-col">
                              <span
                                className={`text-sm ${
                                  subtask.isCompleted ? "line-through" : ""
                                }`}
                              >
                                {subtask.text}
                              </span>
                              <div className="flex flex-col text-xs text-muted-foreground">
                                <span>
                                  Added by{" "}
                                  {teamMembers.find(
                                    (m) => m.email === subtask.createdBy,
                                  )?.name || subtask.createdBy}{" "}
                                  on{" "}
                                  {subtask.createdAt
                                    ? format(
                                        new Date(subtask.createdAt),
                                        "MMM dd, yyyy",
                                      )
                                    : "Unknown date"}
                                </span>
                                {subtask.isCompleted &&
                                  subtask.completedDate && (
                                    <span>
                                      Completed by{" "}
                                      {teamMembers.find(
                                        (m) => m.email === subtask.completedBy,
                                      )?.name || subtask.completedBy}{" "}
                                      on{" "}
                                      {subtask.completedDate
                                        ? format(
                                            new Date(subtask.completedDate),
                                            "MMM dd, yyyy",
                                          )
                                        : "Unknown date"}
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleTaskChange({
                                subtasks: editingTask?.subtasks?.filter(
                                  (st) => st.id !== subtask.id
                                ) || []
                              });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2">
                        <Input
                          value={newSubTask}
                          onChange={(e) => setNewSubTask(e.target.value)}
                          placeholder="Add new subtask"
                          className="text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newSubTask.trim()) {
                              handleAddSubtask();
                            }
                          }}
                        />
                        <Button
                          className="text-sm"
                          onClick={() => {
                            handleAddSubtask();
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Files Section */}
                  <div>
                    <Label className="text-sm font-semibold">Attachments</Label>
                    <div className="mt-2">
                      <Input
                        type="file"
                        className="text-sm"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file);
                            // Clear the input
                            e.target.value = "";
                          }
                        }}
                      />
                      <div className="mt-4">
                        {editingTask?.files && editingTask.files.length > 0 ? (
                          <div className="space-y-2">
                            {editingTask.files.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-secondary/20 p-3 rounded"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex-shrink-0">
                                    <Paperclip className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline block truncate"
                                    >
                                      {file.name}
                                    </a>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                      <span>
                                        {(file.size / 1024).toFixed(1)} KB
                                      </span>
                                      <span>•</span>
                                      <span>
                                        Uploaded{" "}
                                        {format(
                                          new Date(file.uploadedAt),
                                          "MMM dd, yyyy",
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    handleTaskChange({
                                      files: editingTask?.files?.filter(
                                        (_, i) => i !== index
                                      ) || []
                                    });
                                  }}
                                  className="flex-shrink-0 ml-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            No files attached
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                className="text-sm"
                onClick={() => {
                  setEditModalVisible(false);
                  setNewTask(null);
                  setEditingTask(null);
                  setEditingCustomer(null);
                  setUnsavedTask(null); // Clear unsaved changes
                }}
              >
                Cancel
              </Button>
              <Button
                className="text-sm"
                onClick={() => {
                  if (editingTask && unsavedTask) {
                    // Only save the changes that are different from the original task
                    const updates = Object.entries(unsavedTask).reduce((acc, [key, value]) => {
                      if (editingTask[key as keyof PlanTask] !== value) {
                        acc[key as keyof PlanTask] = value;
                      }
                      return acc;
                    }, {} as Partial<PlanTask>);

                    if (Object.keys(updates).length > 0) {
                      handleEditSave(updates);
                    }
                    setUnsavedTask(null); // Clear unsaved changes
                  } else if (newTask) {
                    handleSaveNewTask();
                  }
                  setEditModalVisible(false);
                }}
              >
                {editingTask ? "Save Changes" : "Create Task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={bulkEditModalVisible}
        onOpenChange={(open) => {
          if (!open) {
            setBulkEditModalVisible(false);
            setBulkEditFormState({});
            bulkEditForm.resetFields();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit {selectedRows.length} Tasks</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              // Create an object with only the filled values
              const values = {
                ...(bulkEditForm.getFieldValue("progress") && {
                  progress: bulkEditForm.getFieldValue("progress"),
                }),
                ...(bulkEditFormState.dueDate && {
                  dueDate: bulkEditFormState.dueDate,
                }),
                ...(bulkEditFormState.completedDate && {
                  completedDate: bulkEditFormState.completedDate,
                }),
                ...(bulkEditForm.getFieldValue("frequency") && {
                  frequency: bulkEditForm.getFieldValue("frequency"),
                }),
                ...(bulkEditForm.getFieldValue("isActive") !== undefined && {
                  isActive: bulkEditForm.getFieldValue("isActive"),
                }),
                ...(bulkEditForm.getFieldValue("notes") && {
                  notes: bulkEditForm.getFieldValue("notes"),
                }),
                ...(bulkEditForm.getFieldValue("current") !== undefined && {
                  current: parseInt(bulkEditForm.getFieldValue("current")),
                }),
                ...(bulkEditForm.getFieldValue("goal") !== undefined && {
                  goal: parseInt(bulkEditForm.getFieldValue("goal")),
                }),
                ...(bulkEditForm.getFieldValue("assignedTeamMembers") && {
                  assignedTeamMembers: bulkEditForm.getFieldValue(
                    "assignedTeamMembers",
                  ),
                }),
              };

              await handleBulkEdit(values);
            }}
          >
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="progress" className="text-right">
                  Progress
                </Label>
                <Select
                  name="progress"
                  onValueChange={(value) =>
                    bulkEditForm.setFieldValue("progress", value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select progress" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="Doing">Doing</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">
                  Due Date
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {bulkEditFormState.dueDate ? (
                          format(bulkEditFormState.dueDate, "PPP")
                        ) : (
                          <span className="text-muted-foreground">
                            Pick a date
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={bulkEditFormState.dueDate}
                        onSelect={(date) => {
                          if (date) {
                            setBulkEditFormState((prev) => ({
                              ...prev,
                              dueDate: date,
                            }));
                            bulkEditForm.setFieldValue("dueDate", date);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="completedDate" className="text-right">
                  Completed Date
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {bulkEditFormState.completedDate ? (
                          format(bulkEditFormState.completedDate, "PPP")
                        ) : (
                          <span className="text-muted-foreground">
                            Pick a date
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={bulkEditFormState.completedDate}
                        onSelect={(date) => {
                          if (date) {
                            setBulkEditFormState((prev) => ({
                              ...prev,
                              completedDate: date,
                            }));
                            bulkEditForm.setFieldValue("completedDate", date);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">
                  Frequency
                </Label>
                <Select
                  name="frequency"
                  onValueChange={(value) =>
                    bulkEditForm.setFieldValue("frequency", value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="One Time">One Time</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="As Needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  Status
                </Label>
                <Select
                  name="isActive"
                  onValueChange={(value) =>
                    bulkEditForm.setFieldValue("isActive", value === "true")
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="assignedTeamMembers" className="text-right">
                  Team Members
                </Label>
                <div className="col-span-3">
                  <div className="grid grid-cols-2 gap-2">
                    {teamMembers
                      .filter((admin) => admin.canBeAssignedToTasks)
                      .map((member) => (
                        <div
                          key={member.email}
                          className="flex items-center gap-2 bg-secondary/10 rounded-md p-1.5"
                        >
                          <Checkbox
                            id={member.email}
                            checked={bulkEditForm
                              .getFieldValue("assignedTeamMembers")
                              ?.includes(member.email)}
                            onCheckedChange={(checked) => {
                              const currentMembers =
                                bulkEditForm.getFieldValue(
                                  "assignedTeamMembers",
                                ) || [];
                              const newMembers = checked
                                ? [...currentMembers, member.email]
                                : currentMembers.filter(
                                    (email: string) => email !== member.email,
                                  );
                              bulkEditForm.setFieldValue(
                                "assignedTeamMembers",
                                newMembers,
                              );
                            }}
                          />
                          <Label
                            htmlFor={member.email}
                            className="flex items-center gap-1.5 text-sm"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.avatarUrl} />
                              <AvatarFallback>
                                {member.name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              {member.name || member.email}
                            </span>
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  name="notes"
                  className="col-span-3"
                  onChange={(e) =>
                    bulkEditForm.setFieldValue("notes", e.target.value)
                  }
                />
              </div>

              {/* Add Current/Goal fields for Monthly/As Needed tasks */}
              {hasMonthlyOrAsNeededTasks && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Progress</Label>
                  <div className="col-span-3 flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="current">Current</Label>
                      <Input
                        id="current"
                        type="number"
                        min={0}
                        value={unsavedTask?.current || editingTask?.current || newTask?.current || 0}
                        onChange={(e) => {
                          handleTaskChange({ current: parseInt(e.target.value) });
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="goal">Goal</Label>
                      <Input
                        id="goal"
                        type="number"
                        min={0}
                        value={unsavedTask?.goal || editingTask?.goal || newTask?.goal || 0}
                        onChange={(e) => {
                          handleTaskChange({ goal: parseInt(e.target.value) });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Add info alert */}
              <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-md text-sm">
                <p>
                  Only filled fields will be updated. Empty fields will be
                  ignored.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setBulkEditModalVisible(false);
                  setBulkEditFormState({});
                  bulkEditForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrapper component to provide state
export default function NewPlanPageWrapper() {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const customersRef = collection(db, "customers");
        const customersQuery = query(
          customersRef,
          where("customer_type", "==", "Paid"),
          where("isActive", "==", true),
        );
        const customersSnap = await getDocs(customersQuery);

        const fetchedCustomers = customersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ICustomer[];

        setCustomers(fetchedCustomers);
      } catch (error) {
        console.error("Error fetching customers:", error);
        message.error("Failed to load customers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <NewPlanView
      customers={customers}
      selectedCustomer={selectedCustomer}
      setSelectedCustomer={setSelectedCustomer}
    />
  );
}
