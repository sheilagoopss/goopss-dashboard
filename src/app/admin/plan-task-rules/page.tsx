import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Typography,
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Alert,
  DatePicker,
  Tooltip,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import type { PlanTaskRule, SubTask } from "@/types/PlanTasks";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  setDoc,
} from "firebase/firestore";
import { message, Switch, notification } from "antd";
import dayjs from "dayjs";
import { ICustomer } from "@/types/Customer";
import { usePlanTaskRules } from "@/hooks/usePlanTaskRules";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/config";
import { Plan } from "@/types/Plan";

const packageTypes = {
  acceleratorBasic: "Accelerator - Basic",
  acceleratorStandard: "Accelerator - Standard",
  acceleratorPro: "Accelerator - Pro",
  extendedMaintenance: "Extended Maintenance",
  regularMaintenance: "Regular Maintenance",
  social: "Social",
  default: "Default",
} as const;

const { Header, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const calculateDueDate = (customer: ICustomer, rule: PlanTaskRule) => {
  console.log("Calculating due date - Input:", {
    customer: {
      id: customer.id,
      date_joined: customer.date_joined,
      store_name: customer.store_name,
    },
    rule: {
      id: rule.id,
      task: rule.task,
      frequency: rule.frequency,
      daysAfterJoin: rule.daysAfterJoin,
      monthlyDueDate: rule.monthlyDueDate,
    },
  });

  let dueDate = null;

  if (!customer.date_joined) {
    console.log("No join date found for customer");
    return null;
  }

  if (rule.frequency === "Monthly" && rule.monthlyDueDate) {
    dueDate = dayjs().date(rule.monthlyDueDate).format("YYYY-MM-DD");
    console.log("Monthly task - Due date set to:", dueDate);
  } else if (rule.frequency === "As Needed") {
    console.log("As Needed task - No due date needed");
    dueDate = null;
  } else if (rule.frequency === "One Time" && rule.daysAfterJoin) {
    dueDate = dayjs(customer.date_joined)
      .add(rule.daysAfterJoin, "day")
      .format("YYYY-MM-DD");
    console.log("One Time task - Due date calculated:", {
      joinDate: customer.date_joined,
      daysAfterJoin: rule.daysAfterJoin,
      calculatedDueDate: dueDate,
    });
  } else {
    console.log("No due date calculation applied:", {
      frequency: rule.frequency,
      daysAfterJoin: rule.daysAfterJoin,
    });
  }

  console.log("Final due date:", dueDate);
  return dueDate;
};

const PlanTaskRulesPage: React.FC = () => {
  const [rules, setRules] = useState<PlanTaskRule[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<PlanTaskRule | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const { fetchTaskRules, fetchSections } = usePlanTaskRules();
  const { user } = useAuth();
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    changes: Array<{
      task: string;
      field: string;
      oldValue: any;
      newValue: any;
    }>;
  }>({ visible: false, changes: [] });
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(
    null,
  );
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("default");

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const loadData = useCallback(async () => {
    const fetchedRules = await fetchTaskRules();
    const fetchedSections = await fetchSections();
    setRules(fetchedRules);
    setSections(fetchedSections);
  }, [fetchTaskRules, fetchSections]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadPackageRules = async (packageId: string) => {
    try {
      const rulesRef = doc(db, "planTaskRules", packageId);
      const rulesDoc = await getDoc(rulesRef);

      if (rulesDoc.exists()) {
        const data = rulesDoc.data();
        setRules(data.tasks || []);
        setSections(data.sections || []);
      } else {
        // Clear the rules and sections
        setRules([]);
        setSections([]);
        // Show alert message
        message.warning(
          `No rules found for ${
            packageTypes[packageId as keyof typeof packageTypes]
          }. Please initialize rules for this package.`,
        );
      }
    } catch (error) {
      console.error("Error loading package rules:", error);
      message.error("Failed to load package rules");
    }
  };

  const columns = [
    {
      title: "Order",
      dataIndex: "order",
      key: "order",
      width: 80,
      render: (order: number) => order || "-", // Show dash for missing order numbers
      sorter: {
        compare: (a: PlanTaskRule, b: PlanTaskRule) => {
          const orderA =
            typeof a.order === "number" ? a.order : Number.MAX_VALUE;
          const orderB =
            typeof b.order === "number" ? b.order : Number.MAX_VALUE;
          return orderA - orderB;
        },
        multiple: 1,
      },
      defaultSortOrder: "ascend" as const,
      sortDirections: ["ascend" as const, "descend" as const],
    },
    {
      title: "Task ID",
      dataIndex: "id",
      key: "id",
      width: 150,
      render: (id: string) => (
        <Tooltip title="Click to copy">
          <Tag
            color="blue"
            style={{ cursor: "pointer" }}
            onClick={() => {
              navigator.clipboard.writeText(id);
              message.success("Task ID copied to clipboard");
            }}
          >
            {id}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "Task",
      dataIndex: "task",
      key: "task",
    },
    {
      title: "Section",
      dataIndex: "section",
      key: "section",
    },
    {
      title: "Days After Join",
      dataIndex: "daysAfterJoin",
      key: "daysAfterJoin",
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      key: "frequency",
    },
    {
      title: "Goal",
      dataIndex: "defaultGoal",
      key: "defaultGoal",
      width: 100,
      render: (defaultGoal: number | null, record: PlanTaskRule) => {
        if (!record.requiresGoal) return "-";
        return defaultGoal || 0;
      },
    },
    {
      title: "Subtasks",
      dataIndex: "subtasks",
      key: "subtasks",
      render: (subtasks: SubTask[] | undefined) => (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {subtasks?.map((subtask: SubTask) => (
            <li key={subtask.id}>{subtask.text}</li>
          ))}
        </ul>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: PlanTaskRule) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="primary" onClick={() => handleApplyToAll(record)}>
            Apply Changes
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  const handleEdit = (rule: PlanTaskRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      id: rule.id.replace("task-", ""),
      task: rule.task,
      section: rule.section,
      frequency: rule.frequency,
      daysAfterJoin: rule.daysAfterJoin,
      monthlyDueDate: rule.monthlyDueDate
        ? dayjs().date(rule.monthlyDueDate)
        : null,
      requiresGoal: rule.requiresGoal,
      defaultGoal: rule.defaultGoal,
      defaultCurrent: rule.defaultCurrent,
      order: rule.order,
      subtasks: rule.subtasks || [],
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (ruleToDelete: PlanTaskRule) => {
    Modal.confirm({
      title: "Delete Task Rule",
      content: (
        <div>
          <p>Are you sure you want to delete this task?</p>
          <p>
            <strong>{ruleToDelete.task}</strong>
          </p>
          <Alert
            message="Note"
            description="This will only remove the task from the task rules. Existing customer plans will not be affected."
            type="info"
            showIcon
            style={{ marginTop: "16px" }}
          />
        </div>
      ),
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      async onOk() {
        try {
          // Delete from rules collection only
          const packageId =
            Object.keys(packageTypes).find(
              (key) =>
                packageTypes[key as keyof typeof packageTypes] ===
                selectedPackage,
            ) || "default";

          const rulesRef = doc(db, "planTaskRules", packageId);
          const rulesDoc = await getDoc(rulesRef);

          if (rulesDoc.exists()) {
            const currentRules = rulesDoc.data();
            const updatedTasks = currentRules.tasks.filter(
              (task: PlanTaskRule) => task.id !== ruleToDelete.id,
            );

            await setDoc(rulesRef, {
              ...currentRules,
              tasks: updatedTasks,
              updatedAt: new Date().toISOString(),
            });

            message.success(`Task deleted from ${selectedPackage} rules`);
            loadPackageRules(packageId);
          }
        } catch (error) {
          console.error("Error deleting rule:", error);
          message.error("Failed to delete rule");
        }
      },
    });
  };

  const generateUniqueTaskId = (existingTasks: PlanTaskRule[]): string => {
    let taskId: string;
    do {
      const randomId = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0");
      taskId = `task-${randomId}`; // e.g., task-123456
    } while (existingTasks.some((task) => task.id === taskId));

    return taskId;
  };

  const handleSubmit = async (values: any) => {
    try {
      const packageId =
        Object.keys(packageTypes).find(
          (key) =>
            packageTypes[key as keyof typeof packageTypes] === selectedPackage,
        ) || "default";

      const rulesRef = doc(db, "planTaskRules", packageId);
      const rulesDoc = await getDoc(rulesRef);

      if (rulesDoc.exists()) {
        const currentRules = rulesDoc.data();

        // For editing, use the new ID from the form if provided
        const taskId = editingRule
          ? `task-${values.id}`.replace("task-task-", "task-")
          : generateUniqueTaskId(currentRules.tasks);

        // Process subtasks properly
        const subtasks: SubTask[] =
          values.subtasks?.map((subtask: { text: string; id?: string }) => ({
            id:
              subtask.id ||
              `subtask-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            text: subtask.text,
            isCompleted: false,
            completedDate: null,
          })) || [];

        const newTask: PlanTaskRule = {
          id: taskId,
          task: values.task,
          section: values.section,
          order: values.order || currentRules.tasks.length + 1,
          frequency: values.frequency,
          daysAfterJoin: values.daysAfterJoin,
          monthlyDueDate:
            values.frequency === "Monthly"
              ? dayjs(values.monthlyDueDate).date()
              : null,
          isActive: true,
          requiresGoal: values.requiresGoal || false,
          defaultGoal: values.requiresGoal ? values.defaultGoal : null,
          defaultCurrent: values.requiresGoal
            ? values.defaultCurrent || 0
            : null,
          subtasks: subtasks, // Use the new subtasks array instead of keeping old ones
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || "",
        };

        // Update or add task
        const updatedTasks = editingRule
          ? currentRules.tasks.map((task: PlanTaskRule) =>
              task.id === editingRule.id ? newTask : task,
            )
          : [...currentRules.tasks, newTask];

        await setDoc(rulesRef, {
          ...currentRules,
          tasks: updatedTasks,
          updatedAt: new Date().toISOString(),
        });

        message.success(
          `Task ${editingRule ? "updated" : "added"} in ${selectedPackage}`,
        );
        setIsModalVisible(false);
        loadPackageRules(packageId);
      }
    } catch (error) {
      console.error("Error saving task rule:", error);
      message.error("Failed to save task rule");
    }
  };

  const handleApplyToAll = async (rule: PlanTaskRule) => {
    Modal.confirm({
      title: "Apply Changes to All Customers",
      content: (
        <div>
          <p>
            The following changes will be applied to all{" "}
            <strong>{selectedPackage}</strong> customers for task:
          </p>
          <p>
            <strong>{rule.task}</strong>
          </p>
          <ul>
            {rule.frequency === "Monthly" && rule.monthlyDueDate ? (
              <li>
                Due Date: Every {rule.monthlyDueDate}
                {getOrdinalSuffix(rule.monthlyDueDate)} of the month
              </li>
            ) : rule.daysAfterJoin ? (
              <li>Due Date: {rule.daysAfterJoin} days after join date</li>
            ) : null}
            {rule.frequency && <li>Frequency: {rule.frequency}</li>}
            {rule.isActive !== undefined && (
              <li>Active Status: {rule.isActive ? "Active" : "Inactive"}</li>
            )}
            {rule.defaultGoal && <li>Default Goal: {rule.defaultGoal}</li>}
          </ul>
          <p>
            This will update all {selectedPackage} customer plans while
            preserving their:
          </p>
          <ul>
            <li>Progress (To Do/Doing/Done)</li>
            <li>Notes</li>
            <li>Completed dates</li>
            <li>Current values</li>
          </ul>
          {rule.subtasks && rule.subtasks.length > 0 && (
            <>
              <p>Subtasks:</p>
              <ul>
                {rule.subtasks.map((subtask) => (
                  <li key={subtask.id}>{subtask.text}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      ),
      async onOk() {
        try {
          console.log("Selected Package:", selectedPackage);

          // Get all paid customers with the selected package type
          const customersRef = collection(db, "customers");
          const q = query(
            customersRef,
            where("customer_type", "==", "Paid"),
            where("package_type", "==", selectedPackage), // Use the display name directly
          );

          console.log("Query conditions:", {
            customerType: "Paid",
            packageType: selectedPackage, // Using display name instead of key
          });

          const customersSnapshot = await getDocs(q);

          console.log("Found customers:", customersSnapshot.docs.length);

          const customers = customersSnapshot.docs.map((doc) => {
            const data = doc.data();
            console.log("Customer data:", {
              id: doc.id,
              packageType: data.package_type,
              customerType: data.customer_type,
            });
            return { id: doc.id, ...data } as ICustomer;
          });

          if (customers.length === 0) {
            message.warning(
              `No customers found with package type: ${selectedPackage}`,
            );
            return;
          }

          // Rest of the function remains the same...
          const batch = writeBatch(db);
          let batchCount = 0;
          const BATCH_LIMIT = 500;

          for (const customer of customers) {
            const planRef = doc(db, "plans", customer.id);
            const planDoc = await getDoc(planRef);

            if (!planDoc.exists()) continue;

            const plan = planDoc.data() as Plan;
            let needsUpdate = false;

            // Find or create section
            let sectionIndex = plan.sections.findIndex(
              (s) => s.title === rule.section,
            );
            if (sectionIndex === -1) {
              plan.sections.push({
                title: rule.section,
                tasks: [],
              });
              sectionIndex = plan.sections.length - 1;
              needsUpdate = true;
            }

            // Get current tasks in this section
            const currentTasks = [...plan.sections[sectionIndex].tasks];

            // Check if task exists
            const existingTaskIndex = currentTasks.findIndex(
              (t) => t.id === rule.id,
            );
            if (existingTaskIndex !== -1) {
              console.log("Updating existing task:", {
                customerId: customer.id,
                taskId: rule.id,
                beforeUpdate: currentTasks[existingTaskIndex],
                rule: rule,
              });

              const newDueDate = calculateDueDate(customer, rule);
              console.log("Calculated new due date:", newDueDate);

              currentTasks[existingTaskIndex] = {
                ...currentTasks[existingTaskIndex],
                task: rule.task,
                section: rule.section,
                order: rule.order,
                isActive: rule.isActive,
                frequency: rule.frequency,
                daysAfterJoin: rule.daysAfterJoin,
                dueDate: newDueDate,
                goal: rule.defaultGoal || currentTasks[existingTaskIndex].goal,
                subtasks:
                  rule.subtasks?.map((subtask: SubTask) => ({
                    ...subtask,
                    isCompleted:
                      currentTasks[existingTaskIndex].subtasks?.find(
                        (s: SubTask) => s.id === subtask.id,
                      )?.isCompleted || false,
                    completedDate:
                      currentTasks[existingTaskIndex].subtasks?.find(
                        (s: SubTask) => s.id === subtask.id,
                      )?.completedDate || null,
                  })) || [],
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email || "",
              };

              console.log(
                "Task after update:",
                currentTasks[existingTaskIndex],
              );
            } else {
              // Add new task
              currentTasks.push({
                id: rule.id,
                task: rule.task,
                section: rule.section,
                order: rule.order,
                progress: "To Do" as const,
                isActive: rule.isActive,
                notes: "",
                frequency: rule.frequency,
                daysAfterJoin: rule.daysAfterJoin,
                dueDate: calculateDueDate(customer, rule),
                completedDate: null,
                current: rule.defaultCurrent || 0,
                goal: rule.defaultGoal || 0,
                subtasks:
                  rule.subtasks?.map((subtask) => ({
                    ...subtask,
                    isCompleted: false,
                    completedDate: null,
                  })) || [],
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email || "",
              });
            }

            // Update section tasks
            plan.sections[sectionIndex].tasks = currentTasks;
            needsUpdate = true;

            if (needsUpdate) {
              if (batchCount >= BATCH_LIMIT) {
                await batch.commit();
                batchCount = 0;
              }
              batch.update(planRef, { sections: plan.sections });
              batchCount++;
            }
          }

          // Commit any remaining updates
          if (batchCount > 0) {
            await batch.commit();
          }

          notification.success({
            message: "Success",
            description: `Task rule has been applied to all ${selectedPackage} customers.`,
          });
        } catch (error) {
          console.error("Error applying changes:", error);
          message.error("Failed to apply changes");
        }
      },
    });
  };

  const applyToAllCustomers = async () => {
    Modal.confirm({
      title: "Apply Changes",
      content: (
        <div>
          <p>Are you sure you want to apply these changes?</p>
          <p>This will:</p>
          <ul>
            <li>Update all customer plans with this package type</li>
            <li>Update task IDs and content</li>
            <li>Preserve customer progress and customizations</li>
          </ul>
        </div>
      ),
      async onOk() {
        try {
          setIsApplying(true);
          console.log("Starting to apply changes...");

          // Get current package rules
          const packageId =
            Object.keys(packageTypes).find(
              (key) =>
                packageTypes[key as keyof typeof packageTypes] ===
                selectedPackage,
            ) || "default";

          const rulesRef = doc(db, "planTaskRules", packageId);
          const rulesDoc = await getDoc(rulesRef);

          if (!rulesDoc.exists()) {
            throw new Error("Package rules not found");
          }

          const currentRules = rulesDoc.data();
          console.log("Current rules:", currentRules.tasks.length);

          // Get all paid customers with this package
          const customersRef = collection(db, "customers");
          const customersSnapshot = await getDocs(
            query(
              customersRef,
              where("customer_type", "==", "Paid"),
              where("package_type", "==", selectedPackage),
            ),
          );

          console.log("Found customers:", customersSnapshot.size);

          const batch = writeBatch(db);
          let batchCount = 0;
          const BATCH_LIMIT = 500;

          for (const customerDoc of customersSnapshot.docs) {
            const customerData = customerDoc.data() as ICustomer;
            const planRef = doc(db, "plans", customerDoc.id);
            const planDoc = await getDoc(planRef);

            if (planDoc.exists()) {
              const plan = planDoc.data() as Plan;
              let needsUpdate = false;

              const updatedSections = plan.sections.map((section) => ({
                title: section.title,
                tasks: section.tasks.map((task) => {
                  // Try to find matching task by ID first
                  let updatedRule = currentRules.tasks.find(
                    (r: PlanTaskRule) => r.id === task.id,
                  );

                  // If no match by ID, try to find by task name and section
                  if (!updatedRule) {
                    updatedRule = currentRules.tasks.find(
                      (r: PlanTaskRule) =>
                        r.task === task.task && r.section === task.section,
                    );
                  }

                  if (updatedRule) {
                    needsUpdate = true;
                    console.log(
                      `Updating task ${task.id} to ${updatedRule.id} for customer ${customerData.store_name}`,
                    );

                    return {
                      ...task,
                      id: updatedRule.id,
                      task: updatedRule.task,
                      section: updatedRule.section,
                      isActive: updatedRule.isActive ?? true,
                      frequency: updatedRule.frequency,
                      daysAfterJoin: updatedRule.daysAfterJoin || null,
                      dueDate:
                        calculateDueDate(customerData, updatedRule) || null,
                      goal: updatedRule.defaultGoal || task.goal || 0,
                      order: updatedRule.order || 0,
                      subtasks:
                        updatedRule.subtasks?.map(
                          (subtask: { id: string }) => ({
                            ...subtask,
                            isCompleted:
                              task.subtasks?.find((s) => s.id === subtask.id)
                                ?.isCompleted || false,
                            completedDate:
                              task.subtasks?.find((s) => s.id === subtask.id)
                                ?.completedDate || null,
                          }),
                        ) || [],
                      updatedAt: new Date().toISOString(),
                      updatedBy: user?.email || "system",
                    };
                  }
                  return task;
                }),
              }));

              if (needsUpdate) {
                if (batchCount >= BATCH_LIMIT) {
                  await batch.commit();
                  batchCount = 0;
                }

                batch.update(planRef, {
                  sections: updatedSections,
                  updatedAt: new Date().toISOString(),
                });
                batchCount++;
              }
            }
          }

          if (batchCount > 0) {
            await batch.commit();
          }

          message.success("Changes applied successfully");
        } catch (error) {
          console.error("Error applying changes:", error);
          message.error("Failed to apply changes");
        } finally {
          setIsApplying(false);
        }
      },
    });
  };

  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.task.toLowerCase().includes(searchText.toLowerCase()) ||
      rule.section.toLowerCase().includes(searchText.toLowerCase());

    const matchesFrequency =
      !selectedFrequency || rule.frequency === selectedFrequency;
    const matchesSection = !selectedSection || rule.section === selectedSection;

    return matchesSearch && matchesFrequency && matchesSection;
  });

  return (
    <Layout>
      <Header style={{ background: "#fff", padding: "0 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={2}>Plan Task Rules</Title>
          <Button
            type="primary"
            onClick={applyToAllCustomers}
            loading={isApplying}
          >
            Apply Changes to All Plans
          </Button>
        </div>
      </Header>
      <Content style={{ padding: "16px" }}>
        <Card>
          <Space
            direction="vertical"
            style={{ width: "100%", marginBottom: 16 }}
          >
            <Space wrap>
              <Input.Search
                placeholder="Search tasks..."
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
                style={{ maxWidth: 400 }}
              />
              <Select
                placeholder="Filter by Frequency"
                allowClear
                style={{ width: 200 }}
                onChange={(value) => setSelectedFrequency(value)}
              >
                <Option value="One Time">One Time</Option>
                <Option value="Monthly">Monthly</Option>
                <Option value="As Needed">As Needed</Option>
              </Select>
              <Select
                placeholder="Filter by Section"
                allowClear
                style={{ width: 200 }}
                onChange={(value) => setSelectedSection(value)}
              >
                {sections.map((section) => (
                  <Option key={section} value={section}>
                    {section}
                  </Option>
                ))}
              </Select>
              <Select
                style={{ width: 200 }}
                placeholder="Select Package"
                value={selectedPackage}
                onChange={(value) => {
                  setSelectedPackage(value);
                  const packageId = Object.entries(packageTypes).find(
                    ([, displayName]) => displayName === value,
                  )?.[0];
                  if (packageId) {
                    loadPackageRules(packageId);
                  }
                }}
              >
                {Object.entries(packageTypes).map(([key, displayName]) => (
                  <Option key={key} value={displayName}>
                    {displayName}
                  </Option>
                ))}
              </Select>
              {selectedPackage !== "Default" && (
                <Button
                  onClick={async () => {
                    Modal.confirm({
                      title: "Initialize from Default Plan",
                      content: (
                        <div>
                          <p>This will:</p>
                          <ul>
                            <li>
                              Copy all tasks from Default plan to{" "}
                              {selectedPackage}
                            </li>
                            <li>
                              <strong>Note:</strong> Customer plans will not be
                              updated automatically
                            </li>
                            <li>
                              After initialization, click &quot;Apply Changes to
                              All Plans&quot; to update customer plans
                            </li>
                          </ul>
                        </div>
                      ),
                      onOk: async () => {
                        try {
                          // Get default rules
                          const defaultRulesRef = doc(
                            db,
                            "planTaskRules",
                            "default",
                          );
                          const defaultRulesDoc = await getDoc(defaultRulesRef);

                          if (defaultRulesDoc.exists()) {
                            const defaultRules = defaultRulesDoc.data();

                            // Get current package rules
                            const packageId = Object.entries(packageTypes).find(
                              ([, displayName]) =>
                                displayName === selectedPackage,
                            )?.[0];

                            if (packageId) {
                              await setDoc(
                                doc(db, "planTaskRules", packageId),
                                {
                                  sections: defaultRules.sections,
                                  tasks: defaultRules.tasks,
                                  updatedAt: new Date().toISOString(),
                                  updatedBy: user?.email || "",
                                },
                              );

                              message.success(
                                'Package initialized from Default plan. Please click "Apply Changes to All Plans" to update customer plans.',
                              );
                            }
                          }
                        } catch (error) {
                          console.error(
                            "Error initializing from default:",
                            error,
                          );
                          message.error(
                            "Failed to initialize from Default plan",
                          );
                        }
                      },
                    });
                  }}
                >
                  Initialize from Default
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingRule(null);
                  form.resetFields();
                  setIsModalVisible(true);
                }}
              >
                Add New Rule
              </Button>
            </Space>
          </Space>
          <Table
            columns={columns}
            dataSource={filteredRules}
            rowKey="id"
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} tasks`,
            }}
            onChange={(pagination, filters, sorter) => {
              console.log("Table change:", { pagination, filters, sorter });
            }}
          />
        </Card>

        <Modal
          title={editingRule ? "Edit Task Rule" : "Add Task Rule"}
          open={isModalVisible}
          onOk={form.submit}
          onCancel={() => setIsModalVisible(false)}
          width={800}
          style={{ top: 20 }}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {editingRule && (
              <Form.Item
                name="id"
                label="Task ID"
                rules={[{ required: true, message: "Please enter task ID" }]}
              >
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="123456"
                    addonBefore="task-"
                    value={form.getFieldValue("id")}
                    onChange={(e) => {
                      const value = e.target.value.replace("task-", "");
                      form.setFieldsValue({ id: value });
                    }}
                  />
                  <Tooltip title="Generate new ID">
                    <Button
                      onClick={() => {
                        const newId = generateUniqueTaskId(rules);
                        const numberPart = newId.replace("task-", "");
                        form.setFieldsValue({ id: numberPart });
                      }}
                      icon={<RedoOutlined />}
                    >
                      Generate New ID
                    </Button>
                  </Tooltip>
                </Space.Compact>
              </Form.Item>
            )}

            <Form.Item
              name="task"
              label="Task Name"
              rules={[{ required: true, message: "Please enter task name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="section"
              label="Section"
              rules={[{ required: true, message: "Please select section" }]}
            >
              <Select>
                {sections.map((section) => (
                  <Option key={section} value={section}>
                    {section}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="frequency"
              label="Frequency"
              rules={[{ required: true, message: "Please select frequency" }]}
            >
              <Select>
                <Option value="One Time">One Time</Option>
                <Option value="Monthly">Monthly</Option>
                <Option value="As Needed">As Needed</Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.frequency !== currentValues.frequency
              }
            >
              {({ getFieldValue }) => (
                <>
                  <Form.Item
                    name="daysAfterJoin"
                    label="Days After Join"
                    rules={[
                      {
                        required: getFieldValue("frequency") === "One Time",
                        message: "Please enter days after join",
                      },
                    ]}
                  >
                    <InputNumber min={0} />
                  </Form.Item>

                  {getFieldValue("frequency") === "Monthly" && (
                    <Form.Item
                      name="monthlyDueDate"
                      label="Monthly Due Date"
                      rules={[
                        {
                          required: true,
                          message: "Please select monthly due date",
                        },
                      ]}
                    >
                      <DatePicker
                        picker="date"
                        disabledDate={(current) => {
                          return current && current.date() > 28;
                        }}
                        format="DD"
                        placeholder="Select day of month"
                        showToday={false}
                      />
                    </Form.Item>
                  )}
                </>
              )}
            </Form.Item>

            <Form.Item
              name="requiresGoal"
              label="Requires Goal"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.requiresGoal !== currentValues.requiresGoal
              }
            >
              {({ getFieldValue }) =>
                getFieldValue("requiresGoal") ? (
                  <>
                    <Form.Item
                      name="defaultGoal"
                      label="Default Goal"
                      rules={[
                        {
                          required: true,
                          message: "Please enter default goal",
                        },
                      ]}
                    >
                      <InputNumber min={0} />
                    </Form.Item>
                    <Form.Item
                      name="defaultCurrent"
                      label="Default Current"
                      initialValue={0}
                    >
                      <InputNumber min={0} />
                    </Form.Item>
                  </>
                ) : null
              }
            </Form.Item>

            <Form.Item
              name="order"
              label="Order"
              rules={[{ required: true, message: "Please enter task order" }]}
            >
              <InputNumber min={1} />
            </Form.Item>

            <Typography.Title level={5}>Subtasks</Typography.Title>
            <Form.List name="subtasks">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Space
                      key={field.key}
                      style={{ display: "flex", marginBottom: 8 }}
                      align="baseline"
                    >
                      <Form.Item
                        {...field}
                        name={[field.name, "text"]}
                        rules={[
                          { required: true, message: "Missing subtask text" },
                        ]}
                      >
                        <Input placeholder="Subtask text" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Add Subtask
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form>
        </Modal>
      </Content>

      {/* Add Confirmation Modal */}
      <Modal
        title="Confirm Changes"
        open={confirmModal.visible}
        onOk={applyToAllCustomers}
        onCancel={() => setConfirmModal({ visible: false, changes: [] })}
        width={800}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Alert
            message="Warning"
            description="This will update all customer plans. Please review the changes below:"
            type="warning"
            showIcon
          />
          <Table
            dataSource={confirmModal.changes}
            columns={[
              {
                title: "Task",
                dataIndex: "task",
                key: "task",
              },
              {
                title: "Field",
                dataIndex: "field",
                key: "field",
              },
              {
                title: "Old Value",
                dataIndex: "oldValue",
                key: "oldValue",
                render: (value) => String(value),
              },
              {
                title: "New Value",
                dataIndex: "newValue",
                key: "newValue",
                render: (value) => String(value),
              },
            ]}
            pagination={false}
            scroll={{ y: 400 }}
          />
        </Space>
      </Modal>
    </Layout>
  );
};

export default PlanTaskRulesPage;
