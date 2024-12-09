'use client'

import { useState, useMemo } from 'react'
import { Search, AlertCircle, RefreshCw, Calendar, Clock, CheckCircle2, Pencil, Info, Target, Paperclip, Plus, X } from 'lucide-react'
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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { UserAvatars } from '@/components/plan/user-avatars'
import { TaskCalendar } from '@/components/plan/task-calendar'
import { User, Task, TaskGroup, SubTask } from '@/types/types'

const users: User[] = [
  { id: '1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Bob Smith', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'Charlie Davis', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', name: 'Diana Miller', avatar: 'https://i.pravatar.cc/150?img=4' },
  { id: '5', name: 'Edward Wilson', avatar: 'https://i.pravatar.cc/150?img=5' },
]

const initialTaskGroups: TaskGroup[] = [
  {
    title: "General",
    tasks: [
      {
        id: "1",
        title: "Connect to Erank",
        dueDate: "2024-10-31",
        status: "To Do",
        assignee: users[0],
        isActive: true,
        frequency: "One Time",
        goal: "Integrate Erank for better SEO tracking",
        notes: "Contact Erank support for API documentation",
        attachments: [],
        subTasks: []
      },
      {
        id: "2",
        title: "Update user documentation",
        dueDate: "2024-11-15",
        status: "In Progress",
        assignee: users[1],
        isActive: true,
        frequency: "Weekly",
        goal: "Keep documentation up-to-date with new features",
        notes: "Focus on new UI changes",
        attachments: ["doc_outline.pdf"],
        subTasks: []
      },
      {
        id: "5",
        title: "Review marketing strategy",
        dueDate: "2024-11-30",
        status: "To Do",
        assignee: users[4],
        isActive: true,
        frequency: "Monthly",
        goal: "Align marketing efforts with business objectives",
        notes: "Focus on digital channels and ROI",
        attachments: ["marketing_plan.pdf"],
        subTasks: [
          { id: "5-1", title: "Analyze current performance", completed: false },
          { id: "5-2", title: "Identify key growth areas", completed: false }
        ]
      },
      {
        id: "6",
        title: "Prepare quarterly financial report",
        dueDate: "2024-12-15",
        status: "In Progress",
        assignee: users[2],
        isActive: true,
        frequency: "Monthly",
        goal: "Provide accurate financial overview to stakeholders",
        notes: "Include year-over-year comparison",
        attachments: [],
        subTasks: [
          { id: "6-1", title: "Gather data from all departments", completed: true },
          { id: "6-2", title: "Draft initial report", completed: false }
        ]
      },
      {
        id: "7",
        title: "Conduct team building workshop",
        dueDate: "2024-11-20",
        status: "To Do",
        assignee: users[1],
        isActive: true,
        frequency: "One Time",
        goal: "Improve team cohesion and communication",
        notes: "Book offsite venue",
        attachments: ["team_building_ideas.docx"],
        subTasks: []
      },
      {
        id: "8",
        title: "Update company handbook",
        dueDate: "2024-12-31",
        status: "To Do",
        assignee: users[3],
        isActive: true,
        frequency: "Monthly",
        goal: "Ensure all policies are up-to-date",
        notes: "Collaborate with HR and Legal departments",
        attachments: ["current_handbook.pdf"],
        subTasks: []
      },
      {
        id: "9",
        title: "Implement new CRM system",
        dueDate: "2025-01-31",
        status: "In Progress",
        assignee: users[0],
        isActive: true,
        frequency: "One Time",
        goal: "Improve customer relationship management",
        notes: "Schedule training sessions for staff",
        attachments: ["crm_proposal.pdf"],
        subTasks: [
          { id: "9-1", title: "Data migration", completed: false },
          { id: "9-2", title: "User acceptance testing", completed: false }
        ]
      },
      {
        id: "10",
        title: "Conduct annual performance reviews",
        dueDate: "2024-12-20",
        status: "To Do",
        assignee: users[4],
        isActive: true,
        frequency: "As Needed",
        goal: "Evaluate employee performance and set goals",
        notes: "Prepare evaluation forms",
        attachments: [],
        subTasks: []
      }
    ]
  },
  {
    title: "Development",
    tasks: [
      {
        id: "3",
        title: "Implement new security features",
        dueDate: "2024-12-01",
        status: "To Do",
        assignee: users[2],
        isActive: true,
        frequency: "One Time",
        goal: "Enhance overall system security",
        notes: "Review latest security best practices",
        attachments: [],
        subTasks: []
      },
      {
        id: "4",
        title: "Optimize database queries",
        dueDate: "2024-12-05",
        status: "In Progress",
        assignee: users[3],
        isActive: true,
        frequency: "Daily",
        goal: "Improve application performance",
        notes: "Focus on high-traffic queries",
        attachments: ["query_analysis.xlsx"],
        subTasks: []
      },
      {
        id: "11",
        title: "Refactor legacy codebase",
        dueDate: "2025-03-31",
        status: "To Do",
        assignee: users[2],
        isActive: true,
        frequency: "One Time",
        goal: "Improve code maintainability and performance",
        notes: "Focus on high-impact areas first",
        attachments: ["refactoring_plan.md"],
        subTasks: [
          { id: "11-1", title: "Identify critical modules", completed: false },
          { id: "11-2", title: "Create test suite", completed: false }
        ]
      },
      {
        id: "12",
        title: "Implement CI/CD pipeline",
        dueDate: "2024-12-15",
        status: "In Progress",
        assignee: users[1],
        isActive: true,
        frequency: "One Time",
        goal: "Streamline deployment process",
        notes: "Use Jenkins for automation",
        attachments: [],
        subTasks: [
          { id: "12-1", title: "Set up test environment", completed: true },
          { id: "12-2", title: "Configure deployment scripts", completed: false }
        ]
      },
      {
        id: "13",
        title: "Develop mobile app prototype",
        dueDate: "2025-01-31",
        status: "To Do",
        assignee: users[3],
        isActive: true,
        frequency: "One Time",
        goal: "Create MVP for investor presentation",
        notes: "Focus on core features only",
        attachments: ["app_wireframes.pdf"],
        subTasks: []
      },
      {
        id: "14",
        title: "Upgrade server infrastructure",
        dueDate: "2024-11-30",
        status: "In Progress",
        assignee: users[0],
        isActive: true,
        frequency: "One Time",
        goal: "Improve system reliability and performance",
        notes: "Coordinate with IT department for hardware upgrades",
        attachments: ["server_specs.xlsx"],
        subTasks: [
          { id: "14-1", title: "Backup current data", completed: true },
          { id: "14-2", title: "Install new hardware", completed: false }
        ]
      },
      {
        id: "15",
        title: "Implement two-factor authentication",
        dueDate: "2024-12-31",
        status: "To Do",
        assignee: users[4],
        isActive: true,
        frequency: "One Time",
        goal: "Enhance account security",
        notes: "Research best 2FA solutions",
        attachments: [],
        subTasks: []
      },
      {
        id: "16",
        title: "Optimize database queries",
        dueDate: "2024-12-15",
        status: "To Do",
        assignee: users[2],
        isActive: true,
        frequency: "Monthly",
        goal: "Improve application response time",
        notes: "Focus on slow-performing queries",
        attachments: ["query_analysis.sql"],
        subTasks: []
      },
      {
        id: "17",
        title: "Conduct security audit",
        dueDate: "2025-01-15",
        status: "To Do",
        assignee: users[1],
        isActive: true,
        frequency: "As Needed",
        goal: "Identify and address security vulnerabilities",
        notes: "Engage external security consultant",
        attachments: [],
        subTasks: [
          { id: "17-1", title: "Prepare audit scope", completed: false },
          { id: "17-2", title: "Review audit findings", completed: false }
        ]
      },
      {
        id: "18",
        title: "Implement error logging and monitoring",
        dueDate: "2024-12-31",
        status: "In Progress",
        assignee: users[3],
        isActive: true,
        frequency: "One Time",
        goal: "Improve issue detection and resolution",
        notes: "Evaluate ELK stack implementation",
        attachments: ["logging_requirements.docx"],
        subTasks: []
      },
      {
        id: "19",
        title: "Develop API documentation",
        dueDate: "2025-01-31",
        status: "To Do",
        assignee: users[0],
        isActive: true,
        frequency: "One Time",
        goal: "Improve developer onboarding and API usability",
        notes: "Use Swagger for interactive documentation",
        attachments: [],
        subTasks: [
          { id: "19-1", title: "Document core endpoints", completed: false },
          { id: "19-2", title: "Create usage examples", completed: false }
        ]
      },
      {
        id: "20",
        title: "Implement data backup strategy",
        dueDate: "2024-12-15",
        status: "To Do",
        assignee: users[4],
        isActive: true,
        frequency: "Daily",
        goal: "Ensure data integrity and disaster recovery",
        notes: "Consider off-site backup solutions",
        attachments: ["backup_policy.pdf"],
        subTasks: []
      }
    ]
  }
]

export default function PlanPage() {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>(initialTaskGroups)
  const [progressFilter, setProgressFilter] = useState('all')
  const [overdueFilter, setOverdueFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showColorInfo, setShowColorInfo] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)

  const filteredTaskGroups = useMemo(() => {
    return taskGroups.map(group => ({
      ...group,
      tasks: group.tasks.filter(task => {
        const matchesProgress = progressFilter === 'all' || task.status.toLowerCase().replace(' ', '') === progressFilter
        const matchesOverdue = overdueFilter === 'all' || 
          (overdueFilter === 'overdue' && new Date(task.dueDate) < new Date()) ||
          (overdueFilter === 'upcoming' && new Date(task.dueDate) >= new Date()) ||
          (overdueFilter === 'completed' && task.status === 'Done')
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.assignee.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesUser = selectedUser === null || task.assignee.id === selectedUser
        return matchesProgress && matchesOverdue && matchesSearch && matchesUser
      })
    })).filter(group => group.tasks.length > 0)
  }, [taskGroups, progressFilter, overdueFilter, searchQuery, selectedUser])

  const handleEditTask = (task: Task) => {
    setEditingTask({ ...task })
  }

  const handleSaveTask = () => {
    if (editingTask) {
      if (isCreatingTask) {
        // Add the new task to the first group (you might want to let the user choose the group)
        setTaskGroups(prevGroups => [
          {
            ...prevGroups[0],
            tasks: [...prevGroups[0].tasks, editingTask]
          },
          ...prevGroups.slice(1)
        ])
      } else {
        // Update existing task
        setTaskGroups(prevGroups =>
          prevGroups.map(group => ({
            ...group,
            tasks: group.tasks.map(task =>
              task.id === editingTask.id ? editingTask : task
            )
          }))
        )
      }
      setEditingTask(null)
      setIsCreatingTask(false)
    }
  }

  const resetFilters = () => {
    setProgressFilter('all')
    setOverdueFilter('all')
    setSearchQuery('')
    setSelectedUser(null)
  }

  const getCardColor = (status: string) => {
    switch (status) {
      case 'To Do':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'In Progress':
        return 'bg-orange-500 hover:bg-orange-600'
      case 'Done':
        return 'bg-green-500 hover:bg-green-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'To Do':
        return <Clock className="w-8 h-8" />
      case 'In Progress':
        return <RefreshCw className="w-8 h-8" />
      case 'Done':
        return <CheckCircle2 className="w-8 h-8" />
      default:
        return <AlertCircle className="w-8 h-8" />
    }
  }

  const handleCreateTask = () => {
    setIsCreatingTask(true)
    setEditingTask({
      id: String(Date.now()), // Generate a temporary ID
      title: '',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'To Do',
      assignee: users[0],
      isActive: true,
      frequency: 'One Time',
      goal: '',
      notes: '',
      attachments: [],
      subTasks: []
    })
  }

  const handleUpdateTask = (updatedTask: Task) => {
    setTaskGroups(prevGroups =>
      prevGroups.map(group => ({
        ...group,
        tasks: group.tasks.map(task =>
          task.id === updatedTask.id ? updatedTask : task
        )
      }))
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <Button onClick={handleCreateTask}>
          <Plus className="mr-2 h-4 w-4" /> Add Custom Task
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Select value={progressFilter} onValueChange={setProgressFilter}>
          <SelectTrigger className="w-[140px] bg-white">
            <SelectValue placeholder="All Progress" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Progress</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="inprogress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={overdueFilter} onValueChange={setOverdueFilter}>
          <SelectTrigger className="w-[140px] bg-white">
            <SelectValue placeholder="All Tasks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks..." 
            className="pl-8 bg-white" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={resetFilters}
                className="ml-2"
                aria-label="Reset filters"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset all filters</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="ml-2"
                onMouseEnter={() => setShowColorInfo(true)}
                onMouseLeave={() => setShowColorInfo(false)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Blue: To Do</p>
              <p>Orange: In Progress</p>
              <p>Green: Done</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <UserAvatars
          users={users}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
        />
      </div>

      {showColorInfo && (
        <div className="bg-white p-4 mb-4 rounded-lg shadow-md text-sm">
          <p><span className="inline-block w-4 h-4 bg-blue-500 rounded-full mr-2"></span> Blue: To Do</p>
          <p><span className="inline-block w-4 h-4 bg-orange-500 rounded-full mr-2"></span> Orange: In Progress</p>
          <p><span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2"></span> Green: Done</p>
        </div>
      )}

      <Tabs defaultValue="list" className="mt-6">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <div className="space-y-12">
            {filteredTaskGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-2xl font-medium mb-6">{group.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {group.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      handleEditTask={handleEditTask}
                      getCardColor={getCardColor}
                      getStatusIcon={getStatusIcon}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="calendar" className="mt-6">
          <TaskCalendar taskGroups={filteredTaskGroups} users={users} onUpdateTask={handleUpdateTask} />
        </TabsContent>
      </Tabs>

      <TaskDialog
        task={editingTask}
        setTask={setEditingTask}
        users={users}
        handleSaveTask={handleSaveTask}
        isOpen={!!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTask(null)
            setIsCreatingTask(false)
          }
        }}
        isCreating={isCreatingTask}
      />
    </div>
  )
}

const TaskCard = ({ task, handleEditTask, getCardColor, getStatusIcon }: { task: Task; handleEditTask: (task: Task) => void; getCardColor: (status: string) => string; getStatusIcon: (status: string) => JSX.Element }) => {
  return (
    <Card 
      key={task.id} 
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${getCardColor(task.status)} rounded-xl`}
      onClick={() => handleEditTask(task)}
    >
      <div className="absolute top-2 right-2 flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="bg-white/20 hover:bg-white/30 text-white h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8 border-2 border-white/20">
          <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
          <AvatarFallback>{task.assignee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
      </div>
      <div className="p-3 text-white" style={{ minHeight: '180px' }}>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center" >
          {getStatusIcon(task.status)}
        </div>
        <h3 className="text-base font-semibold mb-1 line-clamp-2">{task.title}</h3>
        <p className="text-xs text-white/80 mb-0.5">
          Assigned to {task.assignee.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
          <Calendar className="h-3 w-3" />
          <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
          <RefreshCw className="h-3 w-3" />
          <span>Frequency: {task.frequency}</span>
        </div>
        {task.goal && (
          <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
            <Target className="h-3 w-3" />
            <span className="line-clamp-1">Goal: {task.goal}</span>
          </div>
        )}
        {task.attachments && task.attachments.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
            <Paperclip className="h-3 w-3" />
            <span>Attachments: {task.attachments.length}</span>
          </div>
        )}
        {task.subTasks && task.subTasks.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-white/80 mb-0.5">
            <CheckCircle2 className="h-3 w-3" />
            <span>Sub-tasks: {task.subTasks.length}</span>
          </div>
        )}
        <Button 
          variant="secondary" 
          className="w-full bg-black/20 hover:bg-black/30 text-white border-white/20 mt-1 text-xs py-0.5 h-6"
        >
          View Details
        </Button>
      </div>
    </Card>
  )
}

const TaskDialog = ({ 
  task, 
  setTask, 
  users, 
  handleSaveTask, 
  isOpen, 
  onOpenChange,
  isCreating
}: { 
  task: Task | null; 
  setTask: (task: Task | null) => void; 
  users: User[]; 
  handleSaveTask: () => void; 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void;
  isCreating: boolean;
}) => {
  const [newSubTask, setNewSubTask] = useState('')

  const addSubTask = () => {
    if (task && newSubTask.trim() !== '') {
      setTask({
        ...task,
        subTasks: [
          ...task.subTasks,
          { id: Date.now().toString(), title: newSubTask.trim(), completed: false }
        ]
      })
      setNewSubTask('')
    }
  }

  const removeSubTask = (id: string) => {
    if (task) {
      setTask({
        ...task,
        subTasks: task.subTasks.filter(st => st.id !== id)
      })
    }
  }

  const toggleSubTask = (id: string) => {
    if (task) {
      setTask({
        ...task,
        subTasks: task.subTasks.map(st =>
          st.id === id ? { ...st, completed: !st.completed } : st
        )
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{isCreating ? 'Create Task' : 'Edit Task'}</DialogTitle>
          <DialogDescription>
            {isCreating ? 'Create a new task here.' : 'Make changes to the task here.'} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        {task && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Task Name
              </Label>
              <Input
                id="title"
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">
                Frequency
              </Label>
              <Select
                value={task.frequency}
                onValueChange={(value: Task['frequency']) => setTask({ ...task, frequency: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="One Time">One Time</SelectItem>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="As Needed">As Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                {task.frequency === 'Monthly' ? 'Monthly Due Date' : 'Due Date'}
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={task.dueDate}
                onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goal" className="text-right">
                Goal
              </Label>
              <Input
                id="goal"
                value={task.goal}
                onChange={(e) => setTask({ ...task, goal: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignee" className="text-right">
                Team Member
              </Label>
              <Select
                value={task.assignee.id}
                onValueChange={(value) => setTask({ ...task, assignee: users.find(u => u.id === value) || task.assignee })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={task.notes}
                onChange={(e) => setTask({ ...task, notes: e.target.value })}
                className="col-span-3"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="attachments" className="text-right">
                Attachments
              </Label>
              <div className="col-span-3">
                <Input
                  id="attachments"
                  type="file"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
                    setTask({
                      ...task,
                      attachments: [...(task.attachments || []), ...validFiles.map(f => f.name)]
                    });
                  }}
                  accept="*/*"
                  multiple
                />
                <p className="text-sm text-gray-500 mt-1">Max file size: 10MB. Max 10 files.</p>
                {task.attachments && task.attachments.length > 0 && (
                  <ul className="mt-2">
                    {task.attachments.map((attachment, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <span>{attachment}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTask({
                            ...task,
                            attachments: task.attachments?.filter((_, i) => i !== index)
                          })}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={task.status}
                onValueChange={(value: 'To Do' | 'In Progress' | 'Done') => setTask({ ...task, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <Switch
                id="isActive"
                checked={task.isActive}
                onCheckedChange={(checked) => setTask({ ...task, isActive: checked })}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Sub-tasks
              </Label>
              <div className="col-span-3 space-y-2">
                {task.subTasks.map((subTask) => (
                  <div key={subTask.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subtask-${subTask.id}`}
                      checked={subTask.completed}
                      onCheckedChange={() => toggleSubTask(subTask.id)}
                    />
                    <Label htmlFor={`subtask-${subTask.id}`} className="flex-grow">
                      {subTask.title}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubTask(subTask.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <Input
                    value={newSubTask}
                    onChange={(e) => setNewSubTask(e.target.value)}
                    placeholder="New sub-task"
                    className="flex-grow"
                  />
                  <Button onClick={addSubTask}>Add</Button>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="submit" onClick={handleSaveTask}>
            {isCreating ? 'Create Task' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

