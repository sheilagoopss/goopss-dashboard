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
import { PlanTask } from "@/types/Plan"
import { IAdmin } from "@/types/Customer"

interface TaskDialogProps {
  task: PlanTask | null
  setTask: React.Dispatch<React.SetStateAction<PlanTask | null>>
  users: IAdmin[]
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
        subtasks: [
          ...(task.subtasks || []),
          {
            id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: newSubTask.trim(),
            isCompleted: false,
            completedDate: null,
            createdAt: new Date().toISOString(),
            createdBy: 'user'
          }
        ]
      })
      setNewSubTask('')
    }
  }

  const removeSubTask = (id: string) => {
    if (task) {
      setTask({
        ...task,
        subtasks: task.subtasks?.filter(st => st.id !== id) || []
      })
    }
  }

  const toggleSubTask = (id: string) => {
    if (task) {
      setTask({
        ...task,
        subtasks: task.subtasks?.map(st =>
          st.id === id ? { ...st, isCompleted: !st.isCompleted } : st
        ) || []
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
              <Label htmlFor="progress" className="text-right">
                Progress
              </Label>
              <Select
                value={task.progress}
                onValueChange={(value: 'To Do' | 'Doing' | 'Done') => {
                  setTask({ ...task, progress: value })
                }}
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
              <Label htmlFor="notes" className="text-right pt-2">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={task.notes || ''}
                onChange={(e) => setTask({ ...task, notes: e.target.value })}
                className="col-span-3"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignedTeamMembers" className="text-right">
                Team Members
              </Label>
              <div className="col-span-3">
                {users.map(user => (
                  <div key={user.email} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={user.email}
                      checked={task.assignedTeamMembers?.includes(user.email)}
                      onCheckedChange={(checked) => {
                        setTask((prev: PlanTask | null) => {
                          if (!prev) return null;
                          const newMembers = checked 
                            ? [...(prev.assignedTeamMembers || []), user.email]
                            : prev.assignedTeamMembers?.filter((email: string) => email !== user.email) || [];
                          return { ...prev, assignedTeamMembers: newMembers };
                        });
                      }}
                    />
                    <Label htmlFor={user.email}>{user.name || user.email}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleSaveTask}>
            {isCreating ? 'Create Task' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

