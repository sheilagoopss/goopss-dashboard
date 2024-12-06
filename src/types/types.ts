export interface User {
  id: string
  name: string
  avatar: string
}

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  dueDate: string
  status: 'To Do' | 'In Progress' | 'Done'
  assignee: User
  isActive?: boolean
  frequency: 'One Time' | 'Daily' | 'Weekly' | 'Monthly' | 'As Needed'
  goal?: string
  notes?: string
  attachments?: string[]
  subTasks: SubTask[]
}

export interface TaskGroup {
  title: string
  tasks: Task[]
}

