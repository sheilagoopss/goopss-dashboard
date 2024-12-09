'use client'

import { useState, useEffect, useMemo } from 'react'
import { PlanSection, PlanTask } from '@/types/Plan'
import { ICustomer, IAdmin } from '@/types/Customer'
import { message } from 'antd'
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore'
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

interface Props {
  customers: ICustomer[];
  selectedCustomer: ICustomer | null;
  setSelectedCustomer: (customer: ICustomer | null) => void;
}

const TaskCard = ({ 
  task, 
  customer,
  teamMembers,
  onEdit 
}: { 
  task: PlanTask;
  customer: ICustomer;
  teamMembers: IAdmin[];
  onEdit: (task: PlanTask, customer: ICustomer) => void;
}) => {
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

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${getCardColor(task.progress)} rounded-xl`}
      onClick={() => onEdit(task, customer)}
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
        <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
          <Avatar className="h-4 w-4">
            <AvatarImage src={customer.logo} alt={customer.store_name} />
            <AvatarFallback>{customer.store_name[0]}</AvatarFallback>
          </Avatar>
          <span>{customer.store_name}</span>
        </div>
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

function NewPlanView({ customers = [], selectedCustomer, setSelectedCustomer }: Props) {
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [progressFilter, setProgressFilter] = useState<'All' | 'To Do and Doing' | 'Done'>('To Do and Doing')
  const [search, setSearch] = useState('')
  const [frequencyFilter, setFrequencyFilter] = useState<'All' | 'One Time' | 'Monthly' | 'As Needed' | 'Monthly and As Needed'>('All')
  const [teamMemberFilter, setTeamMemberFilter] = useState<string>('all')
  const [teamMembers, setTeamMembers] = useState<IAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [localCustomers, setLocalCustomers] = useState<ICustomer[]>(customers)
  const [isOpen, setIsOpen] = useState(false)
  const [plans, setPlans] = useState<{ sections: PlanSection[] } | null>(null)
  const [allPlans, setAllPlans] = useState<{ [customerId: string]: { sections: PlanSection[] } }>({})
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState<{ [section: string]: number }>({})
  const ITEMS_PER_PAGE = 12
  const [selectedView, setSelectedView] = useState<'list' | 'calendar'>('list')

  const handleEditTask = (task: PlanTask, customer: ICustomer) => {
    console.log('Edit task:', task, customer)
    // Add your edit task logic here
  }

  const handleUpdateTask = async (task: Task, updates: Partial<Task>) => {
    if (!task.id) return

    try {
      const customerId = task.assignee?.id.split('-')[0]
      if (!customerId) return

      const planRef = doc(db, 'plans', customerId)
      const planDoc = await getDoc(planRef)
      
      if (planDoc.exists()) {
        const plan = planDoc.data() as Plan
        const updatedSections = plan.sections.map(section => ({
          ...section,
          tasks: section.tasks.map(t => {
            if (t.id === task.id) {
              return {
                ...t,
                ...updates,
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email || ''
              }
            }
            return t
          })
        }))

        await updateDoc(planRef, { sections: updatedSections })
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

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
          const customersSnap = await getDocs(customersRef)
          const fetchedCustomers = customersSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ICustomer[]
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
  const FiltersSection = () => {
    console.log('Current team members:', teamMembers); // Debug log

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <Select 
            open={isOpen}
            onOpenChange={setIsOpen}
            value={selectedCustomer?.id || 'all'} 
            onValueChange={(value: string) => {
              console.log('Selected value:', value); // Debug
              if (value === 'all') {
                setSelectedCustomer(null);
                loadAllPlans(); // Make sure to load all plans when "All Customers" is selected
              } else {
                const customer = localCustomers.find(c => c.id === value);
                console.log('Found customer:', customer); // Debug
                if (customer) {
                  setSelectedCustomer(customer);
                  loadPlan(); // This will load the specific customer's plan
                }
              }
              setIsOpen(false);
            }}
          >
            <SelectTrigger className="w-[320px] bg-white">
              <SelectValue placeholder="Select customer">
                {selectedCustomer ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedCustomer.logo} alt={selectedCustomer.store_name} />
                      <AvatarFallback>{selectedCustomer.store_name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{selectedCustomer.store_name} - {selectedCustomer.store_owner_name}</span>
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

          <Select value={frequencyFilter} onValueChange={(value: any) => setFrequencyFilter(value)}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Frequencies</SelectItem>
              <SelectItem value="One Time">One Time</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="As Needed">As Needed</SelectItem>
              <SelectItem value="Monthly and As Needed">Monthly & As Needed</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-8 bg-white" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
              id="active-only"
            />
            <Label htmlFor="active-only">Active Only</Label>
          </div>

          {teamMembers.length === 0 && (
            <div className="text-red-500">No team members loaded</div>
          )}

          {teamMembers.length > 0 && (
            <div className="flex items-center gap-2">
              <UserAvatars
                users={teamMembers.map(member => ({
                  id: member.email,
                  email: member.email,
                  name: member.name || member.email,
                  avatarUrl: member.avatarUrl
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
                    setFrequencyFilter('All');
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
  const getPaginatedTasks = (tasks: PlanTask[], section: string) => {
    const page = currentPage[section] || 1
    const start = (page - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return tasks.slice(start, end)
  }

  // Get total pages for a section
  const getTotalPages = (tasks: PlanTask[]) => {
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
        
        console.log('Fetching plan for customer:', selectedCustomer.id)
        console.log('Plan exists:', planDoc.exists())
        
        if (planDoc.exists()) {
          const planData = planDoc.data()
          console.log('Plan data:', planData)
          setPlans(planData as { sections: PlanSection[] })
        } else {
          // If no plan exists, create a default plan structure
          const defaultPlan = {
            sections: [
              {
                title: 'General Tasks',
                tasks: []
              },
              {
                title: 'Other Tasks',
                tasks: []
              }
            ]
          }
          setPlans(defaultPlan)
        }
      } catch (error) {
        console.error('Error fetching plan:', error)
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

  // Get all tasks grouped by sections
  const getAllTasksBySection = () => {
    const sections: { [key: string]: { tasks: (PlanTask & { customer?: ICustomer })[]; customers: ICustomer[] } } = {}
    
    // If we have a selected customer and plans data, use that
    if (selectedCustomer && plans) {
      plans.sections.forEach(section => {
        const filteredTasks = section.tasks
          .filter(task => {
            const matchesTeamMember = teamMemberFilter === 'all' || 
              (task.assignedTeamMembers && task.assignedTeamMembers.includes(teamMemberFilter));

            const matchesSearch = task.task.toLowerCase().includes(search.toLowerCase())
            const matchesProgress = progressFilter === 'All' || 
              (progressFilter === 'To Do and Doing' ? 
                (task.progress === 'To Do' || task.progress === 'Doing') : 
                task.progress === progressFilter)
            const matchesActive = !showActiveOnly || task.isActive
            const matchesFrequency = frequencyFilter === 'All' || 
              (frequencyFilter === 'Monthly and As Needed' 
                ? (task.frequency === 'Monthly' || task.frequency === 'As Needed')
                : task.frequency === frequencyFilter)
            
            return matchesTeamMember && matchesSearch && matchesProgress && matchesActive && matchesFrequency
          });

        if (filteredTasks.length > 0) {
          sections[section.title] = {
            tasks: filteredTasks.map(task => ({ ...task, customer: selectedCustomer })),
            customers: [selectedCustomer]
          };
        }
      });
      return sections;
    }

    // Otherwise, use allPlans for the "All Customers" view
    Object.entries(allPlans).forEach(([customerId, plan]) => {
      const customer = customers.find(c => c.id === customerId)
      if (!customer || !customer.isActive || customer.customer_type !== 'Paid') return;

      plan.sections.forEach(section => {
        const filteredTasks = section.tasks
          .filter(task => {
            const matchesTeamMember = teamMemberFilter === 'all' || 
              (task.assignedTeamMembers && task.assignedTeamMembers.includes(teamMemberFilter));

            const matchesSearch = task.task.toLowerCase().includes(search.toLowerCase())
            const matchesProgress = progressFilter === 'All' || 
              (progressFilter === 'To Do and Doing' ? 
                (task.progress === 'To Do' || task.progress === 'Doing') : 
                task.progress === progressFilter)
            const matchesActive = !showActiveOnly || task.isActive
            const matchesFrequency = frequencyFilter === 'All' || 
              (frequencyFilter === 'Monthly and As Needed' 
                ? (task.frequency === 'Monthly' || task.frequency === 'As Needed')
                : task.frequency === frequencyFilter)
            
            return matchesTeamMember && matchesSearch && matchesProgress && matchesActive && matchesFrequency
          });

        if (filteredTasks.length > 0) {
          if (!sections[section.title]) {
            sections[section.title] = { tasks: [], customers: [] }
          }
          
          filteredTasks.forEach(task => {
            sections[section.title].tasks.push({
              ...task,
              customer
            })
          });

          if (!sections[section.title].customers.find(c => c.id === customer.id)) {
            sections[section.title].customers.push(customer)
          }
        }
      });
    });

    return sections;
  };

  const loadAllPlans = async () => {
    try {
      setIsLoading(true);
      console.log('Loading all plans...');
      
      const plansData: { [customerId: string]: { sections: PlanSection[] } } = {};
      
      // Load plans in batches of 10
      const BATCH_SIZE = 10;
      for (let i = 0; i < customers.length; i += BATCH_SIZE) {
        const batch = customers.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(customer => 
          getDoc(doc(db, 'plans', customer.id))
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach((planDoc, index) => {
          if (planDoc.exists()) {
            plansData[batch[index].id] = planDoc.data() as { sections: PlanSection[] };
          }
        });
      }
      
      console.log('Loaded all plans:', plansData);
      setAllPlans(plansData);
      setPlans(null); // Clear single plan when viewing all
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
      
      if (planDoc.exists()) {
        const planData = planDoc.data() as { sections: PlanSection[] };
        setPlans(planData);
        setAllPlans({}); // Clear all plans when viewing single customer
      } else {
        setPlans({ sections: [] }); // Set empty plan if none exists
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      message.error('Failed to load plan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Task Management</h1>
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
          <TabsContent value="list">
            <div className="space-y-12 mt-8">
              {Object.entries(getAllTasksBySection()).map(([sectionTitle, { tasks, customers }]) => (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {getPaginatedTasks(tasks, sectionTitle).map((task) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        customer={task.customer} 
                        teamMembers={teamMembers}
                        onEdit={handleEditTask} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="calendar" className="mt-6">
            <TaskCalendar 
              taskGroups={Object.entries(getAllTasksBySection()).map(([title, { tasks }]) => ({
                title,
                tasks: tasks.map(task => ({
                  ...task,
                  assignee: {
                    id: task.assignedTeamMembers?.[0] || '',
                    name: teamMembers.find(m => m.email === task.assignedTeamMembers?.[0])?.name || '',
                    avatar: teamMembers.find(m => m.email === task.assignedTeamMembers?.[0])?.avatarUrl || ''
                  }
                }))
              }))} 
              users={teamMembers.map(member => ({
                id: member.email,
                name: member.name,
                avatar: member.avatarUrl || ''
              }))}
              onUpdateTask={handleUpdateTask}
            />
          </TabsContent>
        </Tabs>
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

