'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { PlanTask, PlanSection } from "@/types/Plan"
import { IAdmin } from "@/types/Customer"
import { TaskDialog } from "./task-dialog"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfToday,
} from "date-fns"

interface TaskCalendarProps {
  taskGroups: { title: string; tasks: PlanTask[] }[]
  users: IAdmin[]
  onUpdateTask: (task: PlanTask, updates: Partial<PlanTask>) => Promise<void>
}

export function TaskCalendar({ taskGroups, users, onUpdateTask }: TaskCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = useState(today)
  const [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'))
  const [editingTask, setEditingTask] = useState<PlanTask | null>(null)
  
  const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())
  
  const days = eachDayOfInterval({
    start: startOfMonth(firstDayCurrentMonth),
    end: endOfMonth(firstDayCurrentMonth),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
  }

  const allTasks = taskGroups.flatMap(group => group.tasks)

  const tasksForDate = (date: Date) => {
    return allTasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return isSameDay(taskDate, date)
    })
  }

  const handleTaskClick = (e: React.MouseEvent, task: PlanTask) => {
    e.stopPropagation() // Prevent day selection when clicking on a task
    setEditingTask(task)
  }

  const colStartClasses = [
    '',
    'col-start-1',
    'col-start-2',
    'col-start-3',
    'col-start-4',
    'col-start-5',
    'col-start-6',
    'col-start-7',
  ]

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">
          {format(firstDayCurrentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentMonth(format(today, 'MMM-yyyy'))
              setSelectedDay(today)
            }}
          >
            Today
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDay, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDay(date)
                    setCurrentMonth(format(date, 'MMM-yyyy'))
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px mt-10">
        <div className="text-muted-foreground font-medium">Sun</div>
        <div className="text-muted-foreground font-medium">Mon</div>
        <div className="text-muted-foreground font-medium">Tue</div>
        <div className="text-muted-foreground font-medium">Wed</div>
        <div className="text-muted-foreground font-medium">Thu</div>
        <div className="text-muted-foreground font-medium">Fri</div>
        <div className="text-muted-foreground font-medium">Sat</div>
      </div>
      <div className="grid grid-cols-7 mt-2 text-sm gap-px bg-muted rounded-lg overflow-hidden">
        {days.map((day, dayIdx) => {
          const dayTasks = tasksForDate(day)
          return (
            <div
              key={day.toString()}
              className={cn(
                'relative bg-background min-h-[120px] p-2',
                dayIdx === 0 && colStartClasses[getDay(day)],
                !isSameMonth(day, firstDayCurrentMonth) && 'text-muted-foreground',
                'hover:bg-muted/50 cursor-pointer'
              )}
              onClick={() => setSelectedDay(day)}
            >
              <div className={cn(
                'flex items-center justify-center w-7 h-7 rounded-full',
                isEqual(day, selectedDay) && 'bg-primary text-primary-foreground',
                isToday(day) && !isEqual(day, selectedDay) && 'bg-muted',
                !isEqual(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && 'bg-accent'
              )}>
                <time dateTime={format(day, 'yyyy-MM-dd')}>
                  {format(day, 'd')}
                </time>
              </div>
              {dayTasks.length > 0 && (
                <ScrollArea className="h-[80px] mt-2">
                  <div className="space-y-1 pr-3">
                    {dayTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={(e) => handleTaskClick(e, task)}
                        className={cn(
                          'w-full text-left text-xs px-2 py-1 rounded-md truncate transition-colors',
                          task.progress === 'To Do' && 'bg-blue-100 text-blue-700 hover:bg-blue-200',
                          task.progress === 'Doing' && 'bg-orange-100 text-orange-700 hover:bg-orange-200',
                          task.progress === 'Done' && 'bg-green-100 text-green-700 hover:bg-green-200'
                        )}
                      >
                        {task.task}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )
        })}
      </div>

      <TaskDialog
        task={editingTask}
        setTask={setEditingTask}
        users={users}
        handleSaveTask={() => {
          if (editingTask) {
            onUpdateTask(editingTask, {})
            setEditingTask(null)
          }
        }}
        isOpen={!!editingTask}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null)
        }}
        isCreating={false}
      />
    </div>
  )
}

