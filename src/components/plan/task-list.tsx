import { useState, useEffect } from 'react'
import { db } from "@/firebase/config"
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

function getStoreName(taskId: number): string {
  const storeNames = ["Acme Store", "Globex Shop", "Initech Outlet", "Umbrella Mart"];
  return storeNames[taskId % storeNames.length];
}

interface TeamMember {
  name: string
  image: string
  position: string
}

interface ProgressTask {
  id: number
  task: string
  status: 'To Do' | 'Doing' | 'Done'
  teamMembers: TeamMember[]
  isOverdue?: boolean
  dueDate?: string
  completedDate?: Date;
  isActive?: boolean
  frequency?: string
}

const iconStyle = {
  fontFamily: '"Material Symbols Rounded"',
  fontWeight: 'normal',
  fontStyle: 'normal',
  fontSize: '36px',
  lineHeight: 1,
  letterSpacing: 'normal',
  textTransform: 'none' as const,
  display: 'inline-block',
  whiteSpace: 'nowrap',
  wordWrap: 'normal',
  direction: 'ltr' as const,
  WebkitFontFeatureSettings: '"liga"',
  WebkitFontSmoothing: 'antialiased',
  color: '#5f6368',
} as const

const OverdueIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#EA3323">
    <path d="M479.95-271.87q19.92 0 33.45-13.48 13.53-13.48 13.53-33.4 0-19.92-13.47-33.58-13.48-13.65-33.41-13.65-19.92 0-33.45 13.65-13.53 13.66-13.53 33.58 0 19.92 13.47 33.4 13.48 13.48 33.41 13.48ZM434.5-439.52h91v-245.5h-91v245.5ZM480-71.87q-84.91 0-159.34-32.12-74.44-32.12-129.5-87.17-55.05-55.06-87.17-129.5Q71.87-395.09 71.87-480t32.12-159.34q32.12-74.44 87.17-129.5 55.06-55.05 129.5-87.17 74.43-32.12 159.34-32.12t159.34 32.12q74.44 32.12 129.5 87.17 55.05 55.06 87.17 129.5 32.12 74.43 32.12 159.34t-32.12 159.34q-32.12 74.44-87.17 129.5-55.06 55.05-129.5 87.17Q564.91-71.87 480-71.87Zm0-91q133.04 0 225.09-92.04 92.04-92.05 92.04-225.09 0-133.04-92.04-225.09-92.05-92.04-225.09-92.04-133.04 0-225.09 92.04-92.04 92.05-92.04 225.09 0 133.04 92.04 225.09 92.05 92.04 225.09 92.04ZM480-480Z"/>
  </svg>
)

function AvatarList({ teamMembers }: { teamMembers: TeamMember[] }) {
  return (
    <div className="flex py-2">
      {teamMembers.map((member, index) => (
        <div
          key={member.name}
          className={cn(
            "group relative z-0 -ml-4 flex scale-100 items-center transition-all duration-200 ease-in-out hover:z-10 hover:scale-110",
            index === 0 && "ml-0"
          )}
        >
          <div className="relative overflow-hidden rounded-full bg-white">
            <div className="bg-size pointer-events-none absolute h-full w-full animate-bg-position from-violet-500 from-30% via-cyan-400 via-50% to-pink-500 to-80% bg-[length:300%_auto] opacity-15 group-hover:bg-gradient-to-r" />
            <div className="z-1 blur-lg" />
            <img
              src={member.image}
              alt={member.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
            />
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-2 transform whitespace-nowrap rounded bg-slate-900 p-2 text-white opacity-0 transition-all duration-300 ease-in-out group-hover:-translate-y-2 group-hover:opacity-100 dark:bg-slate-100 dark:text-slate-900">
            <div className="text-xs font-semibold">{member.name}</div>
            <div className="text-xs">{member.position}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TaskList() {
  const [tasks, setTasks] = useState<ProgressTask[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "plans"),
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => ({
          id: parseInt(doc.id),
          ...doc.data()
        })) as ProgressTask[]
        
        setTasks(fetchedTasks)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching tasks:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const toggleProgressTask = (taskId: number) => {
    setExpandedTaskId(prevId => prevId === taskId ? null : taskId)
  }

  return (
    <div
      className="w-full p-6"
      style={{
        fontFamily: '"Google Sans Text", "Google Sans", Roboto, Arial, sans-serif',
        fontSize: '14px',
        color: '#000000',
        fontStyle: 'normal',
        fontVariantCaps: 'normal',
        fontVariantEastAsian: 'normal',
        fontVariantLigatures: 'normal',
        fontVariantNumeric: 'normal',
        fontWeight: 400
      }}
    >
      <div className="flex flex-col mb-6">
        <h1 className="text-[50px] leading-[50px] font-normal mb-4" style={{ fontFamily: '"Google Sans Text", "Google Sans", Roboto, Arial, sans-serif', letterSpacing: '0px', color: '#000000' }}>Task List</h1>
      </div>

      <Card className="overflow-hidden rounded-[30px] border border-gray-200 shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="grid grid-cols-[2fr_120px_auto_auto] px-8 py-4 border-b border-gray-200" style={{ fontFamily: '"Google Sans Text", "Google Sans", Roboto, Arial, sans-serif' }}>
          <div className="font-medium text-gray-700">Task</div>
          <div className="font-medium text-gray-700">Status</div>
          <div className="font-medium text-gray-700">Assigned To</div>
          <div></div>
        </div>
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            className={`transition-colors hover:bg-gray-50 cursor-pointer ${
              index !== tasks.length - 1 ? 'border-b border-gray-200' : ''
            }`}
            onClick={() => toggleProgressTask(task.id)}
            initial={false}
            animate={{ backgroundColor: expandedTaskId === task.id ? "#F3F4F6" : "#FFFFFF" }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-[2fr_120px_auto_auto] gap-4 px-8 py-4 items-center" style={{ fontFamily: '"Google Sans Text", "Google Sans", Roboto, Arial, sans-serif' }}>
              <div className="text-gray-800 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{task.task}</span>
                  {task.isOverdue && <OverdueIcon />}
                </div>
                <span className="text-sm text-gray-500">{getStoreName(task.id)}</span>
              </div>
              <div className="flex items-center justify-center w-full">
                <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-medium w-24 h-8 ${
                  task.status === 'To Do' ? 'bg-red-100 text-red-800' :
                    task.status === 'Doing' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                }`}>
                  {task.status}
                </span>
              </div>
              <div className="flex items-center">
                <AvatarList teamMembers={task.teamMembers} />
              </div>
              <div className="flex items-center justify-end">
                <motion.span
                  style={iconStyle}
                  className="hover:text-gray-900"
                  aria-expanded={expandedTaskId === task.id}
                  aria-controls={`progress-task-details-${task.id}`}
                  animate={{ rotate: expandedTaskId === task.id ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  expand_more
                </motion.span>
              </div>
            </div>
            <AnimatePresence initial={false}>
              {expandedTaskId === task.id && (
                <motion.div
                  key={`details-${task.id}`}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={{
                    expanded: { opacity: 1, height: "auto", marginTop: 8, marginBottom: 8 },
                    collapsed: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }
                  }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                  <div
                    id={`progress-task-details-${task.id}`}
                    className="px-8 py-6 bg-white grid grid-cols-2 gap-6"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-normal text-gray-500">Status</label>
                      <Select 
                        defaultValue={task.status} 
                        onValueChange={(value) => console.log(`Status changed to ${value}`)}
                      >
                        <SelectTrigger className="w-full h-12 px-4 text-base bg-white border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-300 rounded-lg shadow-lg">
                          <SelectItem value="To Do" className="text-base">To Do</SelectItem>
                          <SelectItem value="Doing" className="text-base">Doing</SelectItem>
                          <SelectItem value="Done" className="text-base">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-normal text-gray-500">Due Date</label>
                      <Input 
                        type="date" 
                        defaultValue={task.dueDate}
                        className="w-full max-w-xs h-12 px-4 text-base bg-white border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-normal text-gray-500">Completed Date</label>
                      {task.status === 'Done' ? (
                        <div className="w-full max-w-xs h-12 px-4 flex items-center text-base bg-gray-50 rounded-full border border-gray-300">
                          {new Date().toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="w-full max-w-xs h-12 px-4 flex items-center text-base text-gray-500 bg-gray-50 rounded-full border border-gray-300">
                          Not completed yet
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-normal text-gray-500">Frequency</label>
                      <Select 
                        defaultValue={task.frequency || "One Time"} 
                        onValueChange={(value) => console.log(`Frequency changed to ${value}`)}
                      >
                        <SelectTrigger className="w-full h-12 px-4 text-base bg-white border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-300 rounded-lg shadow-lg">
                          <SelectItem value="One Time" className="text-base">One Time</SelectItem>
                          <SelectItem value="Daily" className="text-base">Daily</SelectItem>
                          <SelectItem value="Weekly" className="text-base">Weekly</SelectItem>
                          <SelectItem value="Monthly" className="text-base">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={task.isActive} 
                          onCheckedChange={(checked) => console.log(`Active status changed to ${checked}`)}
                          className="data-[state=checked]:bg-gray-900"
                        />
                        <label className="text-sm font-normal text-gray-500">Active</label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </Card>
    </div>
  )
}

