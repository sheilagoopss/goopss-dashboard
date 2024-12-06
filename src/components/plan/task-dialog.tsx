'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Task, User } from "@/types/types"

interface TaskDialogProps {
  task: Task | null
  setTask: (task: Task | null) => void
  users: User[]
  handleSaveTask: () => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isCreating: boolean
}

export function TaskDialog({ 
  task, 
  setTask, 
  users, 
  handleSaveTask, 
  isOpen, 
  onOpenChange,
  isCreating
}: TaskDialogProps) {
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

