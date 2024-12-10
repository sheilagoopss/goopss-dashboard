'use client'

import { useState, useEffect, useMemo } from 'react'
import { PlanSection, PlanTask, Plan } from '@/types/Plan'
import { ICustomer, IAdmin } from '@/types/Customer'
import { message } from 'antd'
import { doc, getDoc, updateDoc, collection, getDocs, query, where, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
import FirebaseHelper from '@/helpers/FirebaseHelper'
import { 
  Search, AlertCircle, RefreshCw, Calendar, Clock, 
  CheckCircle2, Pencil, Info, Target, Paperclip, Plus, X 
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { UserAvatars } from '@/components/plan/user-avatars'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TaskCalendar } from '@/components/plan/task-calendar'
import { Task } from '@/types/types'
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import dayjs from 'dayjs'
import { PlanTaskRule } from '@/types/PlanTasks'

interface TaskFile {
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

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

const TaskCard = ({ task, teamMembers, onEdit }: TaskCardProps) => {
  const assignedMembers = teamMembers.filter(member => 
    task.assignedTeamMembers?.includes(member.email)
  )

  const getCardColor = (progress: string) => {
    switch (progress) {
      case 'To Do':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'Doing':
        return 'bg-orange-500 hover:bg-orange-600'
      case 'Done':
        return 'bg-green-500 hover:bg-green-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getStatusIcon = (progress: string) => {
    switch (progress) {
      case 'To Do':
        return <Clock className="w-8 h-8" />
      case 'Doing':
        return <RefreshCw className="w-8 h-8" />
      case 'Done':
        return <CheckCircle2 className="w-8 h-8" />
      default:
        return <AlertCircle className="w-8 h-8" />
    }
  }

  const calculateProgress = () => {
    if (task.frequency === 'Monthly' || task.frequency === 'As Needed') {
      const current = task.current || 0
      const goal = task.goal || 0
      return { current, goal }
    }
    return null
  }

  const progress = calculateProgress()

  console.log('Task in card:', task);
  console.log('Task files:', task.files);

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${getCardColor(task.progress)} rounded-xl`}
      onClick={() => onEdit(task)}
    >
      <div className="absolute top-2 right-2 flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="bg-white/20 hover:bg-white/30 text-white h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {assignedMembers.map(member => (
          <Avatar key={member.email} className="h-8 w-8 border-2 border-white/20">
            <AvatarImage src={member.avatarUrl} alt={member.name} />
            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="p-3 text-white" style={{ minHeight: '180px' }}>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          {getStatusIcon(task.progress)}
        </div>
        <h3 className="text-base font-semibold mb-1 line-clamp-2">{task.task}</h3>
        {task.customer && (
          <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
            <Avatar className="h-4 w-4">
              <AvatarImage src={task.customer.logo} alt={task.customer.store_name} />
              <AvatarFallback>{task.customer.store_name[0]}</AvatarFallback>
            </Avatar>
            <span>{task.customer.store_name}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
          <Calendar className="h-3 w-3" />
          <span>Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
        </div>
        {progress && (
          <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
            <Target className="h-3 w-3" />
            <span>Progress: {progress.current}/{progress.goal}</span>
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
  )
}

const calculateDueDate = (customer: ICustomer, rule: PlanTaskRule) => {
  if (rule.frequency === 'Monthly' && rule.monthlyDueDate) {
    return dayjs().date(rule.monthlyDueDate).format('YYYY-MM-DD');
  } else if (rule.frequency === 'As Needed' || rule.daysAfterJoin === 0) {
    return null;
  } else {
    return dayjs(customer.date_joined)
      .add(rule.daysAfterJoin || 0, 'day')
      .format('YYYY-MM-DD');
  }
};

function NewPlanView({ customers = [], selectedCustomer, setSelectedCustomer }: Props) {
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [progressFilter, setProgressFilter] = useState<'All' | 'To Do and Doing' | 'Done'>('All')
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [teamMemberFilter, setTeamMemberFilter] = useState('all')
  const [teamMembers, setTeamMembers] = useState<IAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [localCustomers, setLocalCustomers] = useState<ICustomer[]>(customers)
  const [isOpen, setIsOpen] = useState(false)
  const [plans, setPlans] = useState<{ sections: PlanSection[] } | null>(null)
  const [allPlans, setAllPlans] = useState<{ [customerId: string]: { sections: PlanSection[] } }>({})
  const [filteredSections, setFilteredSections] = useState<{ [key: string]: { tasks: (PlanTask & { customer?: ICustomer })[]; customers: ICustomer[] } }>({})
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState<{ [section: string]: number }>({})
  const ITEMS_PER_PAGE = 12
  const [selectedView, setSelectedView] = useState<'list' | 'calendar'>('list')
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<PlanTask | null>(null)
  const [newTask, setNewTask] = useState<PlanTask | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null)
  const [newSubTask, setNewSubTask] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<TaskFile[]>([])
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'overdue' | 'upcoming'>('all');
  const [isCreatingTask, setIsCreatingTask] = useState(false)

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

      const rules = rulesDoc.data();

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
              dueDate: calculateDueDate(customer, task),
              updatedAt: new Date().toISOString(),
              updatedBy: user?.email || ''
            }))
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || ''
      });

      message.success('Plan created successfully');
      
      // Reload the plans after creating
      if (selectedCustomer) {
        loadPlan();
      } else {
        loadAllPlans();
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      message.error('Failed to create plan');
    }
  };

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
      const plansData: { [customerId: string]: { sections: PlanSection[] } } = {};
      
      for (let i = 0; i < customersSnapshot.docs.length; i += BATCH_SIZE) {
        const batch = customersSnapshot.docs.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(customerDoc => 
          getDoc(doc(db, 'plans', customerDoc.id))
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach((planDoc, index) => {
          if (planDoc.exists()) {
            plansData[batch[index].id] = planDoc.data() as { sections: PlanSection[] };
          }
        });
      }

      setAllPlans(plansData);
      setPlans(null); // Clear single plan when viewing all
      console.log('Loaded all plans:', Object.keys(plansData).length);

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
      const planRef = doc(db, 'plans', selectedCustomer.id);
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        // Create new plan if one doesn't exist
        await createPlanForCustomer(selectedCustomer);
        return;
      }

      const planData = planDoc.data() as Plan;
      console.log('Loaded plan data:', planData);
      
      // Clear all plans when in single customer view
      setAllPlans({});
      
      // Ensure files array exists for each task
      const processedPlan = {
        ...planData,
        sections: planData.sections.map(section => ({
          ...section,
          tasks: section.tasks.map(task => ({
            ...task,
            files: task.files || []
          }))
        }))
      };
      setPlans(processedPlan);
    } catch (error) {
      console.error('Error loading plan:', error);
      message.error('Failed to load plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSelect = async (value: string) => {
    if (value === 'all') {
      setSelectedCustomer(null);
      setPlans(null); // Clear single plan view
      loadAllPlans();
    } else {
      const customer = customers.find(c => c.id === value);
      if (customer) {
        setSelectedCustomer(customer);
        setAllPlans({}); // Clear all plans when selecting single customer
        const planRef = doc(db, 'plans', customer.id);
        const planDoc = await getDoc(planRef);
        
        if (!planDoc.exists()) {
          // Create new plan if one doesn't exist
          await createPlanForCustomer(customer);
        }
        loadPlan();
      }
    }
    setIsOpen(false);
  };

  // Update filtered sections whenever filters or data change
  useEffect(() => {
    const sections: { [key: string]: { tasks: (PlanTask & { customer?: ICustomer })[]; customers: ICustomer[] } } = {}
    
    if (selectedCustomer && plans) {
      plans.sections.forEach(section => {
        const filteredTasks = section.tasks
          .filter(task => {
            const matchesTeamMember = 
              teamMemberFilter === 'all' 
                ? true
                : Boolean(task.assignedTeamMembers?.includes(teamMemberFilter));

            const matchesSearch = task.task.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesProgress = progressFilter === 'All' || 
              (progressFilter === 'To Do and Doing' ? 
                (task.progress === 'To Do' || task.progress === 'Doing') : 
                task.progress === progressFilter)
            const matchesActive = !showActiveOnly || task.isActive
            
            return matchesTeamMember && matchesSearch && matchesProgress && matchesActive
          });

        if (filteredTasks.length > 0) {
          sections[section.title] = {
            tasks: filteredTasks.map(task => ({ ...task, customer: selectedCustomer })),
            customers: [selectedCustomer]
          }
        }
      });
    } else {
      Object.entries(allPlans).forEach(([customerId, plan]) => {
        const customer = customers.find(c => c.id === customerId)
        if (!customer || !customer.isActive || customer.customer_type !== 'Paid') return

        plan.sections.forEach(section => {
          const filteredTasks = section.tasks
            .filter(task => {
              const matchesTeamMember = 
                teamMemberFilter === 'all' 
                  ? true
                  : Boolean(task.assignedTeamMembers?.includes(teamMemberFilter));

              const matchesSearch = task.task.toLowerCase().includes(searchQuery.toLowerCase())
              const matchesProgress = progressFilter === 'All' || 
                (progressFilter === 'To Do and Doing' ? 
                  (task.progress === 'To Do' || task.progress === 'Doing') : 
                  task.progress === progressFilter)
              const matchesActive = !showActiveOnly || task.isActive
              
              return matchesTeamMember && matchesSearch && matchesProgress && matchesActive
            });

          if (filteredTasks.length > 0) {
            if (!sections[section.title]) {
              sections[section.title] = { tasks: [], customers: [] }
            }
            
            sections[section.title].tasks.push(...filteredTasks.map(task => ({
              ...task,
              customer
            })))

            if (!sections[section.title].customers.find(c => c.id === customer.id)) {
              sections[section.title].customers.push(customer)
            }
          }
        })
      })
    }

    setFilteredSections(sections)
  }, [selectedCustomer, plans, allPlans, customers, teamMemberFilter, searchQuery, progressFilter, showActiveOnly])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage({})
  }, [searchQuery, progressFilter, teamMemberFilter, showActiveOnly, selectedCustomer])

  const handleEditTask = (task: PlanTask & { customer?: ICustomer }) => {
    console.log('Opening task for editing:', task);
    console.log('Task files:', task.files);

    // Make sure we get the full task data including files
    let fullTask = task;

    if (selectedCustomer && plans) {
      // Find the task in the current plans data
      const taskInPlans = plans.sections
        .find(s => s.title === task.section)
        ?.tasks.find(t => t.id === task.id);
      
      if (taskInPlans) {
        fullTask = taskInPlans;
      }
    }

    console.log('Full task data:', fullTask);

    // Set editingCustomer based on the task's customer
    if (task.customer) {
      setEditingCustomer(task.customer);
    }

    setEditingTask({
      ...fullTask,
      files: fullTask.files || []
    });
    setEditModalVisible(true);
  }

  const handleCreateTask = async (newTask: Partial<PlanTask>) => {
    if (!selectedCustomer && !editingCustomer) {
      message.error('Please select a customer');
      return;
    }

    const targetCustomer = selectedCustomer || editingCustomer;
    if (!targetCustomer) {
      message.error('Please select a customer');
      return;
    }

    try {
      setIsLoading(true);
      const planRef = doc(db, 'plans', targetCustomer.id);
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        throw new Error('Plan not found');
      }

      // Create a new task with all required fields
      const taskId = doc(collection(db, 'temp')).id; // Generate Firebase ID
      
      if (!newTask.task || !newTask.section) {
        throw new Error('Task name and section are required');
      }

      const createdTask: PlanTask = {
        id: taskId,
        task: newTask.task,
        section: newTask.section,
        progress: newTask.progress || 'To Do',
        frequency: newTask.frequency || 'One Time',
        current: newTask.current || 0,
        goal: newTask.goal || 0,
        dueDate: newTask.dueDate || null,
        completedDate: newTask.completedDate || null,
        isActive: true,
        notes: newTask.notes || '',
        assignedTeamMembers: newTask.assignedTeamMembers || [],
        subtasks: newTask.subtasks || [],
        files: newTask.files || [],
        createdAt: new Date().toISOString(),
        createdBy: user?.email || 'unknown',
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'unknown'
      };

      console.log('Creating new task:', createdTask);

      const plan = planDoc.data() as Plan;
      
      // Add the new task to the specified section
      const updatedSections = plan.sections.map(section => {
        if (section.title === newTask.section) {
          return {
            ...section,
            tasks: [...section.tasks, createdTask]
          };
        }
        return section;
      });

      // Save to Firestore
      await updateDoc(planRef, {
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      });

      // Update local state based on whether we're in single or all customers view
      if (selectedCustomer) {
        setPlans(prevPlans => {
          if (!prevPlans) return null;
          
          return {
            ...prevPlans,
            sections: prevPlans.sections.map(section => {
              if (section.title === newTask.section) {
                return {
                  ...section,
                  tasks: [...section.tasks, createdTask]
                };
              }
              return section;
            })
          };
        });
      } else {
        setAllPlans(prev => {
          const currentPlan = prev[targetCustomer.id] || { sections: [] };
          
          return {
            ...prev,
            [targetCustomer.id]: {
              ...currentPlan,
              sections: currentPlan.sections.map(section => {
                if (section.title === newTask.section) {
                  return {
                    ...section,
                    tasks: [...section.tasks, createdTask]
                  };
                }
                return section;
              })
            }
          };
        });
      }

      setEditModalVisible(false);
      setEditingTask(null);
      setEditingCustomer(null);
      message.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      message.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSave = async (updates: Partial<PlanTask>) => {
    if (!editingTask) {
      message.error('No task selected');
      return;
    }

    // Only validate customer selection for new tasks
    if (!editingTask.id && !selectedCustomer && !editingCustomer) {
      message.error('Please select a customer');
      return;
    }

    const targetCustomer = selectedCustomer || editingCustomer;
    if (!editingTask.id && !targetCustomer) {
      message.error('Please select a customer');
      return;
    }

    try {
      setIsLoading(true);
      let customerId: string;
      
      // For existing tasks in all customers view, get customer ID from the task data
      if (editingTask.id && !selectedCustomer) {
        const taskWithCustomer = editingTask as PlanTask & { customer?: ICustomer };
        if (!taskWithCustomer.customer?.id) {
          message.error('Cannot find customer for this task');
          return;
        }
        customerId = taskWithCustomer.customer.id;
      } else {
        // For new tasks or when in single customer view
        if (!targetCustomer) {
          message.error('Please select a customer');
          return;
        }
        customerId = targetCustomer.id;
      }

      const planRef = doc(db, 'plans', customerId);
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        throw new Error('Plan not found');
      }

      // Create updated task object with all fields
      const updatedTask = {
        ...editingTask,
        ...updates,
        notes: editingTask.notes || '',
        assignedTeamMembers: editingTask.assignedTeamMembers || [],
        subtasks: editingTask.subtasks || [],
        files: editingTask.files || [],
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'unknown'
      };

      console.log('Updating task:', updatedTask);

      const plan = planDoc.data() as Plan;
      
      // Update the task in its section
      const updatedSections = plan.sections.map(section => {
        if (section.title === editingTask.section) {
          return {
            ...section,
            tasks: section.tasks.map(task => 
              task.id === editingTask.id ? updatedTask : task
            )
          };
        }
        return section;
      });

      // Save to Firestore
      await updateDoc(planRef, {
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      });

      // Update local state based on whether we're in single or all customers view
      if (selectedCustomer) {
        setPlans(prevPlans => {
          if (!prevPlans) return null;
          
          return {
            ...prevPlans,
            sections: prevPlans.sections.map(section => {
              if (section.title === editingTask.section) {
                return {
                  ...section,
                  tasks: section.tasks.map(task =>
                    task.id === editingTask.id ? updatedTask : task
                  )
                };
              }
              return section;
            })
          };
        });
      } else {
        // Get the customer ID we determined earlier
        if (!customerId) {
          console.error('No customer ID available for local state update');
          return;
        }
        
        setAllPlans(prev => {
          const currentPlan = prev[customerId] || { sections: [] };
          
          return {
            ...prev,
            [customerId]: {
              ...currentPlan,
              sections: currentPlan.sections.map(section => {
                if (section.title === editingTask.section) {
                  return {
                    ...section,
                    tasks: section.tasks.map(task =>
                      task.id === editingTask.id ? updatedTask : task
                    )
                  };
                }
                return section;
              })
            }
          };
        });
      }

      setEditModalVisible(false);
      setEditingTask(null);
      setEditingCustomer(null);
      message.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      message.error('Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (task: PlanTask, updates: Partial<PlanTask>) => {
    if (!selectedCustomer) return;

    try {
      setIsLoading(true);
      const planRef = doc(db, 'plans', selectedCustomer.id);
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        throw new Error('Plan not found');
      }

      const plan = planDoc.data() as Plan;
      const updatedSections = plan.sections.map(section => ({
        ...section,
        tasks: section.tasks.map(t => 
          t.id === task.id ? { ...t, ...updates } : t
        )
      }));

      await updateDoc(planRef, {
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setPlans(prevPlans => {
        if (!prevPlans) return null
        return {
          ...prevPlans,
          sections: prevPlans.sections.map(section => ({
            ...section,
            tasks: section.tasks.map(t =>
              t.id === task.id ? { ...t, ...updates } : t
            )
          }))
        }
      })

      message.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      message.error('Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all plans when in "All Customers" view
  useEffect(() => {
    const fetchAllPlans = async () => {
      if (selectedCustomer) return // Skip if a specific customer is selected

      try {
        setIsLoading(true)
        const plansData: { [customerId: string]: { sections: PlanSection[] } } = {}
        
        // Load plans in batches of 10
        const BATCH_SIZE = 10
        for (let i = 0; i < customers.length; i += BATCH_SIZE) {
          const batch = customers.slice(i, i + BATCH_SIZE)
          const batchPromises = batch.map(customer => 
            getDoc(doc(db, 'plans', customer.id))
          )
          
          const batchResults = await Promise.all(batchPromises)
          
          batchResults.forEach((planDoc, index) => {
            if (planDoc.exists()) {
              plansData[batch[index].id] = planDoc.data() as { sections: PlanSection[] }
            }
          })
        }
        
        console.log('Loaded all plans:', plansData)
        setAllPlans(plansData)
      } catch (error) {
        console.error('Error loading all plans:', error)
        message.error('Failed to load plans')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllPlans()
  }, [customers, selectedCustomer])

  // Get all tasks for all customers
  const getAllTasks = () => {
    const allTasks: { customer: ICustomer; section: string; task: PlanTask }[] = []
    
    Object.entries(allPlans).forEach(([customerId, plan]) => {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) return

      plan.sections.forEach(section => {
        section.tasks.forEach(task => {
          allTasks.push({ customer, section: section.title, task })
        })
      })
    })

    return allTasks
  }

  // Update localCustomers when props change
  useEffect(() => {
    if (customers.length > 0) {
      setLocalCustomers(customers)
      setIsLoading(false)
    }
  }, [customers])

  // Fetch customers if not provided
  useEffect(() => {
    const fetchCustomers = async () => {
      if (customers.length === 0 && localCustomers.length === 0) {
        try {
          setIsLoading(true)
          const customersRef = collection(db, 'customers')
          const customersQuery = query(customersRef, 
            where('customer_type', '==', 'Paid'),
            where('isActive', '==', true)
          )
          const customersSnap = await getDocs(customersQuery)
          console.log('Fetched customers:', customersSnap.size)
          
          const fetchedCustomers = customersSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ICustomer[]
          
          console.log('Processed customers:', fetchedCustomers)
          setLocalCustomers(fetchedCustomers)
        } catch (error) {
          console.error('Error fetching customers:', error)
          message.error('Failed to load customers')
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchCustomers()
  }, [])

  // Add debug log
  useEffect(() => {
    console.log('Local Customers:', localCustomers)
  }, [localCustomers])

  // Filters section with new UI
  const filterTasks = (task: PlanTask) => {
    const matchesTeamMember = 
      teamMemberFilter === 'all' 
        ? true
        : Boolean(task.assignedTeamMembers?.includes(teamMemberFilter));

    const matchesSearch = searchQuery === '' || task.task.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesProgress = progressFilter === 'All' || 
      (progressFilter === 'To Do and Doing' ? 
        (task.progress === 'To Do' || task.progress === 'Doing') : 
        task.progress === progressFilter)
    const matchesActive = !showActiveOnly || task.isActive
    
    let matchesDueDate = true;
    if (dueDateFilter === 'overdue') {
      matchesDueDate = isOverdue(task);
    } else if (dueDateFilter === 'upcoming') {
      matchesDueDate = isUpcoming(task);
    }
    
    return matchesTeamMember && matchesSearch && matchesProgress && matchesActive && matchesDueDate;
  }

  // Add helper functions for date filtering
  const isOverdue = (task: PlanTask) => {
    if (!task.dueDate) return false;
    if (task.progress === 'Done') return false; // Exclude completed tasks
    return new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  const isUpcoming = (task: PlanTask) => {
    if (!task.dueDate) return false;
    if (task.progress === 'Done') return false; // Exclude completed tasks
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const dueDate = new Date(task.dueDate);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return dueDate >= today && dueDate <= sevenDaysFromNow;
  };

  const isCompleted = (task: PlanTask) => task.progress === 'Done';

  const FiltersSection = () => {
    const [inputValue, setInputValue] = useState(searchQuery)

    // Keep input value in sync with searchQuery
    useEffect(() => {
      setInputValue(searchQuery)
    }, [searchQuery])

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <Select 
            open={isOpen}
            onOpenChange={setIsOpen}
            value={selectedCustomer?.id || 'all'} 
            onValueChange={handleCustomerSelect}
          >
            <SelectTrigger className="w-[250px] bg-white">
              <SelectValue placeholder="Select customer">
                {selectedCustomer ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedCustomer.logo} alt={selectedCustomer.store_name} />
                      <AvatarFallback>{selectedCustomer.store_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{selectedCustomer.store_name} - {selectedCustomer.store_owner_name}</span>
                  </div>
                ) : 'All Customers'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {localCustomers && localCustomers.length > 0 && localCustomers
                .filter(customer => customer.customer_type === 'Paid' && customer.isActive)
                .map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={customer.logo} alt={customer.store_name} />
                        <AvatarFallback>{customer.store_name[0]}</AvatarFallback>
                      </Avatar>
                      <span>{customer.store_name} - {customer.store_owner_name}</span>
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
                if (e.key === 'Enter') {
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
                  setInputValue('');
                  setSearchQuery('');
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>

          <Select value={progressFilter} onValueChange={(value: any) => setProgressFilter(value)}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Progress</SelectItem>
              <SelectItem value="To Do and Doing">To Do & Doing</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dueDateFilter} onValueChange={(value: 'all' | 'overdue' | 'upcoming') => setDueDateFilter(value)}>
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
                users={teamMembers.map(member => ({
                  id: member.email,
                  email: member.email,
                  name: member.name,
                  avatarUrl: member.avatarUrl || '',
                  role: 'Admin',
                  isAdmin: true
                }))}
                selectedUsers={teamMemberFilter !== 'all' ? [teamMemberFilter] : []}
                onUserClick={(userId: string) => {
                  if (teamMemberFilter === userId) {
                    setTeamMemberFilter('all');
                  } else {
                    setTeamMemberFilter(userId);
                  }
                }}
              />
              {teamMemberFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTeamMemberFilter('all')}
                  className="ml-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setProgressFilter('All');
                    setSearch('');
                    setShowActiveOnly(false);
                    setTeamMemberFilter('all');
                    setDueDateFilter('all');
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
    )
  }

  // Get tasks for the current page
  const getPaginatedTasks = (tasks: (PlanTask & { customer?: ICustomer })[], section: string) => {
    const page = currentPage[section] || 1
    const start = (page - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return tasks.slice(start, end)
  }

  // Get total pages for a section
  const getTotalPages = (tasks: (PlanTask & { customer?: ICustomer })[]) => {
    return Math.ceil(tasks.length / ITEMS_PER_PAGE)
  }

  // Handle page change
  const handlePageChange = (section: string, page: number) => {
    setCurrentPage(prev => ({
      ...prev,
      [section]: page
    }))
  }

  // Fetch plan data when customer changes
  useEffect(() => {
    const fetchPlan = async () => {
      if (!selectedCustomer) {
        setPlans(null)
        return
      }

      try {
        setIsLoading(true)
        const planRef = doc(db, 'plans', selectedCustomer.id)
        const planDoc = await getDoc(planRef)
        
        console.log('Loading plan for customer:', selectedCustomer.id)
        
        if (planDoc.exists()) {
          const planData = planDoc.data() as Plan
          console.log('Loaded plan data:', planData)
          // Ensure files array exists for each task
          const processedPlan = {
            ...planData,
            sections: planData.sections.map(section => ({
              ...section,
              tasks: section.tasks.map(task => ({
                ...task,
                files: task.files || []
              }))
            }))
          }
          setPlans(processedPlan)
        } else {
          setPlans({ sections: [] })
        }
      } catch (error) {
        console.error('Error loading plan:', error)
        message.error('Failed to load plan')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlan()
  }, [selectedCustomer])

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        console.log('Starting to fetch team members...');
        const adminsRef = collection(db, 'admin');
        const adminsSnapshot = await getDocs(adminsRef);
        
        const adminUsers = adminsSnapshot.docs
          .filter(doc => doc.data().canBeAssignedToTasks === true)
          .map(doc => {
            const data = doc.data();
            console.log('Found assignable team member:', { id: doc.id, ...data });
            return {
              id: doc.id,
              email: data.email,
              name: data.name,
              avatarUrl: data.avatarUrl,
              canBeAssignedToTasks: data.canBeAssignedToTasks
            } as IAdmin;
          });

        console.log('Loaded assignable team members:', adminUsers);
        setTeamMembers(adminUsers);
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };

    fetchTeamMembers();
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `tasks/${editingCustomer?.id || selectedCustomer?.id}/${Date.now()}_${file.name}`);
      
      if (file.size > 10 * 1024 * 1024) {
        message.error('File size must be less than 10MB');
        return false;
      }

      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      const newFile = {
        name: file.name,
        url,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };

      setEditingTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          files: [...(prev.files || []), newFile]
        };
      });

      // Update local state
      if (selectedCustomer) {
        setPlans(prevPlans => {
          if (!prevPlans) return null;
          return {
            ...prevPlans,
            sections: prevPlans.sections.map(section => ({
              ...section,
              tasks: section.tasks.map(task => 
                task.id === editingTask?.id 
                  ? { ...task, files: [...(task.files || []), newFile] }
                  : task
              )
            }))
          };
        });
      }

      message.success('File uploaded successfully');
      return false;
    } catch (error) {
      console.error('Error uploading file:', error);
      message.error('Failed to upload file');
      return false;
    }
  };

  const handleFileDelete = async (fileIndex: number) => {
    if (!editingTask || !selectedCustomer) return;

    try {
      const planRef = doc(db, 'plans', selectedCustomer.id);
      const planDoc = await getDoc(planRef);
      
      if (planDoc.exists()) {
        const plan = planDoc.data() as Plan;
        const updatedSections = plan.sections.map(section => ({
          ...section,
          tasks: section.tasks.map(task => 
            task.id === editingTask.id 
              ? { 
                  ...task,
                  files: task.files?.filter((_, i) => i !== fileIndex) || []
                } 
              : task
          )
        }));

        await updateDoc(planRef, {
          sections: updatedSections,
          updatedAt: new Date().toISOString()
        });

        // Update local state
        setEditingTask(prev => {
          if (!prev) return null;
          const updatedFiles = prev.files?.filter((_, i) => i !== fileIndex) || [];
          console.log('Files after removal:', updatedFiles);
          return {
            ...prev,
            files: updatedFiles
          };
        });

        // Update plans state
        setPlans(prevPlans => {
          if (!prevPlans) return null;
          return {
            ...prevPlans,
            sections: prevPlans.sections.map(section => ({
              ...section,
              tasks: section.tasks.map(task =>
                task.id === editingTask.id
                  ? { ...task, files: task.files?.filter((_, i) => i !== fileIndex) || [] }
                  : task
              )
            }))
          };
        });

        message.success('File removed successfully');
      }
    } catch (error) {
      console.error('Error removing file:', error);
      message.error('Failed to remove file');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <Button 
          onClick={() => {
            const today = new Date();
            const date = today.getDate().toString().padStart(2, '0');
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3 digits
            const newTaskId = `task-${date}${month}${random}`;
            
            setNewTask({
              id: newTaskId,
              task: '',
              section: 'Other Tasks',
              progress: 'To Do',
              frequency: 'One Time',
              isActive: true,
              dueDate: null,
              completedDate: null,
              current: 0,
              goal: 0,
              notes: '',
              assignedTeamMembers: [],
              subtasks: [],
              files: [],
              createdAt: new Date().toISOString(),
              createdBy: user?.email || 'unknown',
              updatedAt: new Date().toISOString(),
              updatedBy: user?.email || 'unknown'
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
            key={`list-${teamMemberFilter}-${searchQuery}-${progressFilter}-${showActiveOnly}-${selectedCustomer?.id || 'all'}`}
          >
            <div className="space-y-12 mt-8">
              {(() => {
                const sections: { [key: string]: { tasks: (PlanTask & { customer?: ICustomer })[]; customers: ICustomer[] } } = {}
                
                if (selectedCustomer && plans) {
                  plans.sections.forEach(section => {
                    const filteredTasks = section.tasks.filter(filterTasks)

                    if (filteredTasks.length > 0) {
                      sections[section.title] = {
                        tasks: filteredTasks.map(task => ({ ...task, customer: selectedCustomer })),
                        customers: [selectedCustomer]
                      }
                    }
                  })
                } else {
                  Object.entries(allPlans).forEach(([customerId, plan]) => {
                    const customer = customers.find(c => c.id === customerId)
                    if (!customer || !customer.isActive || customer.customer_type !== 'Paid') return

                    plan.sections.forEach(section => {
                      const filteredTasks = section.tasks.filter(filterTasks)

                      if (filteredTasks.length > 0) {
                        if (!sections[section.title]) {
                          sections[section.title] = { tasks: [], customers: [] }
                        }
                        
                        sections[section.title].tasks.push(...filteredTasks.map(task => ({
                          ...task,
                          customer
                        })))

                        if (!sections[section.title].customers.find(c => c.id === customer.id)) {
                          sections[section.title].customers.push(customer)
                        }
                      }
                    })
                  })
                }

                return Object.entries(sections).map(([sectionTitle, { tasks }]) => (
                  <div key={sectionTitle} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-medium">{sectionTitle}</h2>
                      <div className="flex items-center gap-2">
                        {getTotalPages(tasks) > 1 && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(sectionTitle, (currentPage[sectionTitle] || 1) - 1)}
                              disabled={(currentPage[sectionTitle] || 1) <= 1}
                            >
                              Previous
                            </Button>
                            <span className="text-sm">
                              Page {currentPage[sectionTitle] || 1} of {getTotalPages(tasks)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(sectionTitle, (currentPage[sectionTitle] || 1) + 1)}
                              disabled={(currentPage[sectionTitle] || 1) >= getTotalPages(tasks)}
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {getPaginatedTasks(tasks, sectionTitle).map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          teamMembers={teamMembers}
                          onEdit={handleEditTask} 
                        />
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </TabsContent>
          <TabsContent 
            value="calendar" 
            key={`calendar-${teamMemberFilter}-${searchQuery}-${progressFilter}-${showActiveOnly}-${selectedCustomer?.id || 'all'}`}
            className="mt-6"
          >
            <TaskCalendar 
              taskGroups={(() => {
                const sections: { [key: string]: { tasks: (PlanTask & { customer?: ICustomer })[]; customers: ICustomer[] } } = {}
                
                if (selectedCustomer && plans) {
                  plans.sections.forEach(section => {
                    const filteredTasks = section.tasks.filter(filterTasks)

                    if (filteredTasks.length > 0) {
                      sections[section.title] = {
                        tasks: filteredTasks.map(task => ({ ...task, customer: selectedCustomer })),
                        customers: [selectedCustomer]
                      }
                    }
                  })
                } else {
                  Object.entries(allPlans).forEach(([customerId, plan]) => {
                    const customer = customers.find(c => c.id === customerId)
                    if (!customer || !customer.isActive || customer.customer_type !== 'Paid') return

                    plan.sections.forEach(section => {
                      const filteredTasks = section.tasks.filter(filterTasks)

                      if (filteredTasks.length > 0) {
                        if (!sections[section.title]) {
                          sections[section.title] = { tasks: [], customers: [] }
                        }
                        
                        sections[section.title].tasks.push(...filteredTasks.map(task => ({
                          ...task,
                          customer
                        })))

                        if (!sections[section.title].customers.find(c => c.id === customer.id)) {
                          sections[section.title].customers.push(customer)
                        }
                      }
                    })
                  })
                }

                return Object.entries(sections).map(([title, { tasks }]) => ({
                  title,
                  tasks
                }))
              })()}
              users={teamMembers.map(member => ({
                id: member.email,
                email: member.email,
                name: member.name,
                avatarUrl: member.avatarUrl || '',
                role: 'Admin',
                isAdmin: true
              }))}
              onUpdateTask={handleUpdateTask}
              onEdit={handleEditTask}
            />
          </TabsContent>
        </Tabs>
      )}

      {editModalVisible && (
        <Dialog open={editModalVisible} onOpenChange={(open) => !open && setEditModalVisible(false)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? `Edit Task: ${editingTask.task}` : 'Create New Task'}
                {editingCustomer && (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={editingCustomer.logo} alt={editingCustomer.store_name} />
                      <AvatarFallback>{editingCustomer.store_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-normal text-muted-foreground">
                      {editingCustomer.store_name}
                    </span>
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>
            {(editingTask || newTask) && (
              <div className="grid grid-cols-2 gap-12">
                {/* Left Column - Main Task Details */}
                <div className="space-y-4 border-r pr-6">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="task" className="text-sm text-right">
                      Task Name
                    </Label>
                    <Input
                      id="task"
                      value={editingTask?.task || newTask?.task || ''}
                      onChange={(e) => {
                        if (editingTask) {
                          setEditingTask(prev => prev ? { ...prev, task: e.target.value } : null);
                        } else {
                          setNewTask(prev => prev ? { ...prev, task: e.target.value } : null);
                        }
                      }}
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="progress" className="text-sm text-right">
                      Progress
                    </Label>
                    <Select
                      value={editingTask?.progress || newTask?.progress || 'To Do'}
                      onValueChange={(value: "To Do" | "Doing" | "Done") => {
                        if (editingTask) {
                          setEditingTask(prev => prev ? { ...prev, progress: value } : null);
                        } else {
                          setNewTask(prev => prev ? { ...prev, progress: value } : null);
                        }
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
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            {editingTask?.dueDate ? format(new Date(editingTask.dueDate), 'PPP') : 
                              <span className="text-muted-foreground">Pick a date</span>
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={editingTask?.dueDate ? new Date(editingTask.dueDate) : undefined}
                            onSelect={(date) => {
                              if (editingTask) {
                                setEditingTask(prev => prev ? {
                                  ...prev,
                                  dueDate: date ? format(date, 'yyyy-MM-dd') : null
                                } : null);
                              } else {
                                setNewTask(prev => prev ? {
                                  ...prev,
                                  dueDate: date ? format(date, 'yyyy-MM-dd') : null
                                } : null);
                              }
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
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            {editingTask?.completedDate ? format(new Date(editingTask.completedDate), 'PPP') : 
                              <span className="text-muted-foreground">Pick a date</span>
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={editingTask?.completedDate ? new Date(editingTask.completedDate) : undefined}
                            onSelect={(date) => {
                              if (editingTask) {
                                setEditingTask(prev => prev ? {
                                  ...prev,
                                  completedDate: date ? format(date, 'yyyy-MM-dd') : null
                                } : null);
                              } else {
                                setNewTask(prev => prev ? {
                                  ...prev,
                                  completedDate: date ? format(date, 'yyyy-MM-dd') : null
                                } : null);
                              }
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
                      value={editingTask?.frequency || newTask?.frequency || 'One Time'}
                      onValueChange={(value: "One Time" | "Monthly" | "As Needed") => {
                        if (editingTask) {
                          setEditingTask(prev => prev ? { ...prev, frequency: value } : null);
                        } else {
                          setNewTask(prev => prev ? { ...prev, frequency: value } : null);
                        }
                      }}
                    >
                      <SelectTrigger className="col-span-3 text-sm">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="One Time">One Time</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="As Needed">As Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editingTask?.frequency !== 'One Time' && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="current" className="text-sm text-right">
                          Current
                        </Label>
                        <Input
                          id="current"
                          type="number"
                          min={0}
                          value={editingTask?.current || newTask?.current || 0}
                          onChange={(e) => {
                            if (editingTask) {
                              setEditingTask(prev => prev ? {
                                ...prev,
                                current: parseInt(e.target.value) || 0
                              } : null);
                            } else {
                              setNewTask(prev => prev ? {
                                ...prev,
                                current: parseInt(e.target.value) || 0
                              } : null);
                            }
                          }}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="goal" className="text-sm text-right">
                          Goal
                        </Label>
                        <Input
                          id="goal"
                          type="number"
                          min={0}
                          value={editingTask?.goal || newTask?.goal || 0}
                          onChange={(e) => {
                            if (editingTask) {
                              setEditingTask(prev => prev ? {
                                ...prev,
                                goal: parseInt(e.target.value) || 0
                              } : null);
                            } else {
                              setNewTask(prev => prev ? {
                                ...prev,
                                goal: parseInt(e.target.value) || 0
                              } : null);
                            }
                          }}
                          className="col-span-3"
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="isActive" className="text-right">
                      Active
                    </Label>
                    <div className="col-span-3">
                      <Switch
                        id="isActive"
                        checked={editingTask?.isActive || newTask?.isActive || true}
                        onCheckedChange={(checked) => {
                          if (editingTask) {
                            setEditingTask(prev => prev ? { ...prev, isActive: checked } : null);
                          } else {
                            setNewTask(prev => prev ? { ...prev, isActive: checked } : null);
                          }
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
                      value={editingTask?.notes || newTask?.notes || ''}
                      onChange={(e) => {
                        if (editingTask) {
                          setEditingTask(prev => prev ? { ...prev, notes: e.target.value } : null);
                        } else {
                          setNewTask(prev => prev ? { ...prev, notes: e.target.value } : null);
                        }
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
                          .filter(admin => admin.canBeAssignedToTasks)
                          .map(admin => (
                            <div key={admin.email} className="flex items-center gap-2 bg-secondary/10 rounded-md p-1.5">
                              <Checkbox
                                id={admin.email}
                                checked={editingTask?.assignedTeamMembers?.includes(admin.email) || newTask?.assignedTeamMembers?.includes(admin.email) || false}
                                onCheckedChange={(checked) => {
                                  if (editingTask) {
                                    setEditingTask(prev => {
                                      if (!prev) return null;
                                      const newMembers = checked 
                                        ? [...(prev.assignedTeamMembers || []), admin.email]
                                        : prev.assignedTeamMembers?.filter(email => email !== admin.email) || [];
                                      return { ...prev, assignedTeamMembers: newMembers };
                                    });
                                  } else {
                                    setNewTask(prev => {
                                      if (!prev) return null;
                                      const newMembers = checked 
                                        ? [...(prev.assignedTeamMembers || []), admin.email]
                                        : prev.assignedTeamMembers?.filter(email => email !== admin.email) || [];
                                      return { ...prev, assignedTeamMembers: newMembers };
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={admin.email} className="flex items-center gap-1.5 text-sm">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={admin.avatarUrl} />
                                  <AvatarFallback>{admin.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="truncate">{admin.name || admin.email}</span>
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
                        <div key={subtask.id} className="flex items-center justify-between bg-secondary/20 p-2 rounded">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={subtask.isCompleted}
                              onCheckedChange={(checked) => {
                                if (editingTask) {
                                  setEditingTask(prev => {
                                    if (!prev) return null;
                                    return {
                                      ...prev,
                                      subtasks: prev.subtasks?.map(st =>
                                        st.id === subtask.id
                                          ? { 
                                              ...st, 
                                              isCompleted: !!checked,
                                              completedDate: checked ? new Date().toISOString() : null,
                                              completedBy: checked ? user?.email || 'unknown' : null
                                            }
                                          : st
                                      )
                                    };
                                  });
                                } else {
                                  setNewTask(prev => {
                                    if (!prev) return null;
                                    return {
                                      ...prev,
                                      subtasks: prev.subtasks?.map(st =>
                                        st.id === subtask.id
                                          ? { 
                                              ...st, 
                                              isCompleted: !!checked,
                                              completedDate: checked ? new Date().toISOString() : null,
                                              completedBy: checked ? user?.email || 'unknown' : null
                                            }
                                          : st
                                      )
                                    };
                                  });
                                }
                              }}
                            />
                            <div className="flex flex-col">
                              <span className={`text-sm ${subtask.isCompleted ? 'line-through' : ''}`}>
                                {subtask.text}
                              </span>
                              <div className="flex flex-col text-xs text-muted-foreground">
                                <span>Added by {teamMembers.find(m => m.email === subtask.createdBy)?.name || subtask.createdBy} on {subtask.createdAt ? format(new Date(subtask.createdAt), 'MMM dd, yyyy') : 'Unknown date'}</span>
                                {subtask.isCompleted && subtask.completedDate && (
                                  <span>Completed by {teamMembers.find(m => m.email === subtask.completedBy)?.name || subtask.completedBy} on {subtask.completedDate ? format(new Date(subtask.completedDate), 'MMM dd, yyyy') : 'Unknown date'}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (editingTask) {
                                setEditingTask(prev => {
                                  if (!prev) return null;
                                  return {
                                    ...prev,
                                    subtasks: prev.subtasks?.filter(st => st.id !== subtask.id)
                                  };
                                });
                              } else {
                                setNewTask(prev => {
                                  if (!prev) return null;
                                  return {
                                    ...prev,
                                    subtasks: prev.subtasks?.filter(st => st.id !== subtask.id)
                                  };
                                });
                              }
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
                            if (e.key === 'Enter' && newSubTask.trim()) {
                              if (editingTask) {
                                setEditingTask(prev => {
                                  if (!prev) return null;
                                  const newSubtask = {
                                    id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                    text: newSubTask.trim(),
                                    isCompleted: false,
                                    completedDate: null,
                                    completedBy: null,
                                    createdAt: new Date().toISOString(),
                                    createdBy: user?.email || 'unknown'
                                  };
                                  return {
                                    ...prev,
                                    subtasks: [...(prev.subtasks || []), newSubtask]
                                  };
                                });
                              } else {
                                setNewTask(prev => {
                                  if (!prev) return null;
                                  const newSubtask = {
                                    id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                    text: newSubTask.trim(),
                                    isCompleted: false,
                                    completedDate: null,
                                    completedBy: null,
                                    createdAt: new Date().toISOString(),
                                    createdBy: user?.email || 'unknown'
                                  };
                                  return {
                                    ...prev,
                                    subtasks: [...(prev.subtasks || []), newSubtask]
                                  };
                                });
                              }
                              setNewSubTask('');
                            }
                          }}
                        />
                        <Button
                          className="text-sm"
                          onClick={() => {
                            if (!newSubTask.trim()) return;
                            if (editingTask) {
                              setEditingTask(prev => {
                                if (!prev) return null;
                                const newSubtask = {
                                  id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                  text: newSubTask.trim(),
                                  isCompleted: false,
                                  completedDate: null,
                                  completedBy: null,
                                  createdAt: new Date().toISOString(),
                                  createdBy: user?.email || 'unknown'
                                };
                                return {
                                  ...prev,
                                  subtasks: [...(prev.subtasks || []), newSubtask]
                                };
                              });
                            } else {
                              setNewTask(prev => {
                                if (!prev) return null;
                                const newSubtask = {
                                  id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                  text: newSubTask.trim(),
                                  isCompleted: false,
                                  completedDate: null,
                                  completedBy: null,
                                  createdAt: new Date().toISOString(),
                                  createdBy: user?.email || 'unknown'
                                };
                                return {
                                  ...prev,
                                  subtasks: [...(prev.subtasks || []), newSubtask]
                                };
                              });
                            }
                            setNewSubTask('');
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
                            e.target.value = '';
                          }
                        }}
                      />
                      <div className="mt-4">
                        {editingTask?.files && editingTask.files.length > 0 ? (
                          <div className="space-y-2">
                            {editingTask.files.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-secondary/20 p-3 rounded">
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
                                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                                      <span>•</span>
                                      <span>Uploaded {format(new Date(file.uploadedAt), 'MMM dd, yyyy')}</span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (editingTask) {
                                      setEditingTask(prev => {
                                        if (!prev) return null;
                                        const updatedFiles = prev.files?.filter((_, i) => i !== index) || [];
                                        return {
                                          ...prev,
                                          files: updatedFiles
                                        };
                                      });
                                    } else {
                                      setNewTask(prev => {
                                        if (!prev) return null;
                                        const updatedFiles = prev.files?.filter((_, i) => i !== index) || [];
                                        return {
                                          ...prev,
                                          files: updatedFiles
                                        };
                                      });
                                    }
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
              <Button variant="outline" className="text-sm" onClick={() => {
                setEditModalVisible(false);
                setNewTask(null);
                setEditingTask(null);
                setEditingCustomer(null);
              }}>
                Cancel
              </Button>
              <Button className="text-sm" onClick={() => {
                if (editingTask) {
                  handleEditSave(editingTask);
                } else if (newTask) {
                  handleCreateTask(newTask);
                }
              }}>
                {editingTask ? 'Save Changes' : 'Create Task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Wrapper component to provide state
export default function NewPlanPageWrapper() {
  const [customers, setCustomers] = useState<ICustomer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true)
        const customersRef = collection(db, 'customers')
        const customersQuery = query(customersRef, 
          where('customer_type', '==', 'Paid'),
          where('isActive', '==', true)
        )
        const customersSnap = await getDocs(customersQuery)
        console.log('Fetched customers:', customersSnap.size)
        
        const fetchedCustomers = customersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ICustomer[]
        
        console.log('Processed customers:', fetchedCustomers)
        setCustomers(fetchedCustomers)
      } catch (error) {
        console.error('Error fetching customers:', error)
        message.error('Failed to load customers')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <NewPlanView
      customers={customers}
      selectedCustomer={selectedCustomer}
      setSelectedCustomer={setSelectedCustomer}
    />
  )
}

