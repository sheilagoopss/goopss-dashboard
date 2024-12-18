"use client";

import { useState, useEffect } from "react";
import { PlanSection, PlanTask, Plan } from "@/types/Plan";
import { ICustomer, IAdmin } from "@/types/Customer";
import { message } from "antd";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  AlertCircle,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  Pencil,
  Target,
  Paperclip,
  X,
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskCardProps {
  task: PlanTask & { customer?: ICustomer };
  teamMembers: IAdmin[];
}

const TaskCard = ({ task, teamMembers }: TaskCardProps) => {
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
      className={`relative overflow-hidden transition-all duration-300 ${getCardColor(
        task.progress,
      )} rounded-xl`}
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

function NewPlanView() {
  const [progressFilter, setProgressFilter] = useState<
    "All" | "To Do and Doing" | "Done"
  >("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<IAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<{ sections: PlanSection[] } | null>(null);
  const [allPlans, setAllPlans] = useState<{
    [customerId: string]: { sections: PlanSection[] };
  }>({});
  const { customerData } = useAuth();
  const [currentPage, setCurrentPage] = useState<{ [section: string]: number }>(
    {},
  );
  const ITEMS_PER_PAGE = 12;

  // Update filtered sections whenever filters or data change
  useEffect(() => {
    const sections: {
      [key: string]: {
        tasks: (PlanTask & { customer?: ICustomer })[];
        customers: ICustomer[];
      };
    } = {};

    if (customerData && plans) {
      plans.sections.forEach((section) => {
        const filteredTasks = section.tasks.filter((task) => {
          const matchesSearch = task.task
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          const matchesProgress =
            progressFilter === "All" ||
            (progressFilter === "To Do and Doing"
              ? task.progress === "To Do" || task.progress === "Doing"
              : task.progress === progressFilter);
          const matchesActive = task.isActive;

          return (
            matchesSearch &&
            matchesProgress &&
            matchesActive
          );
        });

        if (filteredTasks.length > 0) {
          sections[section.title] = {
            tasks: filteredTasks.map((task) => ({
              ...task,
              customer: customerData,
            })),
            customers: [customerData],
          };
        }
      });
    } else {
      Object.entries(allPlans).forEach(([, plan]) => {
        if (
          !customerData ||
          !customerData.isActive ||
          customerData.customer_type !== "Paid"
        )
          return;

        plan.sections.forEach((section) => {
          const filteredTasks = section.tasks.filter((task) => {
            const matchesSearch = task.task
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
            const matchesProgress =
              progressFilter === "All" ||
              (progressFilter === "To Do and Doing"
                ? task.progress === "To Do" || task.progress === "Doing"
                : task.progress === progressFilter);
            const matchesActive = task.isActive;

            return (
              matchesSearch &&
              matchesProgress &&
              matchesActive
            );
          });

          if (filteredTasks.length > 0) {
            if (!sections[section.title]) {
              sections[section.title] = { tasks: [], customers: [] };
            }

            sections[section.title].tasks.push(
              ...filteredTasks.map((task) => ({
                ...task,
                customer: customerData,
              })),
            );

            if (
              !sections[section.title].customers.find(
                (c) => c.id === customerData.id,
              )
            ) {
              sections[section.title].customers.push(customerData);
            }
          }
        });
      });
    }
  }, [
    customerData,
    plans,
    allPlans,
    searchQuery,
    progressFilter,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage({});
  }, [
    searchQuery,
    progressFilter,
    customerData,
  ]);

  // Filters section with new UI
  const filterTasks = (task: PlanTask) => {
    const matchesSearch =
      searchQuery === "" ||
      task.task.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgress =
      progressFilter === "All" ||
      (progressFilter === "To Do and Doing"
        ? task.progress === "To Do" || task.progress === "Doing"
        : task.progress === progressFilter);
    const matchesActive = task.isActive;

    return (
      matchesSearch && matchesProgress && matchesActive
    );
  };

  const FiltersSection = () => {
    const [inputValue, setInputValue] = useState("");

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <Select
            value={progressFilter}
            onValueChange={(value: any) => setProgressFilter(value)}
          >
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Progress</SelectItem>
              <SelectItem value="To Do and Doing">To Do & Doing</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks... (Press Enter to search)"
              className="pl-8 bg-white"
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
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setProgressFilter("All");
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
  };

  // Fetch plan data when customer changes
  useEffect(() => {
    const fetchPlan = async () => {
      if (!customerData) {
        setPlans(null);
        return;
      }

      try {
        setIsLoading(true);
        const planRef = doc(db, "plans", customerData.id);
        const planDoc = await getDoc(planRef);

        if (planDoc.exists()) {
          const planData = planDoc.data();
          setPlans(planData as { sections: PlanSection[] });
        } else {
          // If no plan exists, create a default plan structure
          const defaultPlan = {
            sections: [
              {
                title: "General Tasks",
                tasks: [],
              },
              {
                title: "Other Tasks",
                tasks: [],
              },
            ],
          };
          setPlans(defaultPlan);
        }
      } catch (error) {
        console.error("Error fetching plan:", error);
        message.error("Failed to load plan");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [customerData]);

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
            console.log("Found assignable team member:", {
              id: doc.id,
              ...data,
            });
            return {
              id: doc.id,
              email: data.email,
              name: data.name,
              avatarUrl: data.avatarUrl,
              canBeAssignedToTasks: data.canBeAssignedToTasks,
            } as IAdmin;
          });

        console.log("Loaded assignable team members:", adminUsers);
        setTeamMembers(adminUsers);
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    };

    fetchTeamMembers();
  }, []);

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
          <TabsContent
            value="list"
            key={`list-${searchQuery}-${progressFilter}-${customerData?.id || "all"
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

                if (customerData && plans) {
                  plans.sections.forEach((section) => {
                    const filteredTasks = section.tasks.filter(filterTasks);

                    if (filteredTasks.length > 0) {
                      sections[section.title] = {
                        tasks: filteredTasks.map((task) => ({
                          ...task,
                          customer: customerData,
                        })),
                        customers: [customerData],
                      };
                    }
                  });
                } else {
                  Object.entries(allPlans).forEach(([, plan]) => {
                    if (
                      !customerData ||
                      !customerData.isActive ||
                      customerData.customer_type !== "Paid"
                    )
                      return;

                    plan.sections.forEach((section) => {
                      const filteredTasks = section.tasks.filter(filterTasks);

                      if (filteredTasks.length > 0) {
                        if (!sections[section.title]) {
                          sections[section.title] = {
                            tasks: [],
                            customers: [],
                          };
                        }

                        sections[section.title].tasks.push(
                          ...filteredTasks.map((task) => ({
                            ...task,
                            customer: customerData,
                          })),
                        );

                        if (
                          !sections[section.title].customers.find(
                            (c) => c.id === customerData.id,
                          )
                        ) {
                          sections[section.title].customers.push(customerData);
                        }
                      }
                    });
                  });
                }

                return Object.entries(sections).map(
                  ([sectionTitle, { tasks }]) => (
                    <div
                      key={sectionTitle}
                      className="bg-white rounded-lg p-6 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-medium">{sectionTitle}</h2>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {getPaginatedTasks(tasks, sectionTitle).map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            teamMembers={teamMembers}
                          />
                        ))}
                      </div>
                    </div>
                  ),
                );
              })()}
            </div>
          </TabsContent>
          <TabsContent
            value="calendar"
            key={`calendar-${searchQuery}-${progressFilter}-${customerData?.id || "all"
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

                if (customerData && plans) {
                  plans.sections.forEach((section) => {
                    const filteredTasks = section.tasks.filter(filterTasks);

                    if (filteredTasks.length > 0) {
                      sections[section.title] = {
                        tasks: filteredTasks.map((task) => ({
                          ...task,
                          customer: customerData,
                        })),
                        customers: [customerData],
                      };
                    }
                  });
                } else {
                  Object.entries(allPlans).forEach(([, plan]) => {
                    if (
                      !customerData ||
                      !customerData.isActive ||
                      customerData.customer_type !== "Paid"
                    )
                      return;

                    plan.sections.forEach((section) => {
                      const filteredTasks = section.tasks.filter(filterTasks);

                      if (filteredTasks.length > 0) {
                        if (!sections[section.title]) {
                          sections[section.title] = {
                            tasks: [],
                            customers: [],
                          };
                        }

                        sections[section.title].tasks.push(
                          ...filteredTasks.map((task) => ({
                            ...task,
                            customer: customerData,
                          })),
                        );

                        if (
                          !sections[section.title].customers.find(
                            (c) => c.id === customerData.id,
                          )
                        ) {
                          sections[section.title].customers.push(customerData);
                        }
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
              readOnly={true}
            />
          </TabsContent>
        </Tabs>
      )}
                </div>
  );
}

// Wrapper component to provide state
export default function NewPlanPageWrapper() {
  return <NewPlanView />;
}
