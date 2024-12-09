"use client";
import React, { useState, useEffect } from "react";
import { Layout, Card, Space, Typography, Select, Input, Spin } from "antd";
import { CalendarOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { PlanSection, PlanTask } from "@/types/Plan";
import TaskCard from "@/components/plan/TaskCard";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const CustomerPlan: React.FC = () => {
  // States
  const { customerData } = useAuth();
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [progressFilter, setProgressFilter] = useState<
    "All" | "To Do" | "Doing" | "Done"
  >("All");
  const [dueDateFilter, setDueDateFilter] = useState<
    "all" | "overdue" | "thisWeek"
  >("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load customer's plan
  useEffect(() => {
    const loadCustomerPlan = async () => {
      if (!customerData?.id) return;

      try {
        setIsLoading(true);
        const planRef = doc(db, "plans", customerData.id);
        const planDoc = await getDoc(planRef);

        if (planDoc.exists()) {
          // Only get active tasks
          const planData = planDoc.data();
          const activeSections = planData.sections.map(
            (section: PlanSection) => ({
              ...section,
              tasks: section.tasks.filter((task: PlanTask) => task.isActive),
            }),
          );
          setSections(activeSections);
        }
      } catch (error) {
        console.error("Error loading plan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerPlan();
  }, [customerData?.id]);

  // Helper functions
  const isOverdue = (dueDate: string | null | undefined) => {
    if (!dueDate) return false;
    return dayjs(dueDate).isBefore(dayjs(), "day");
  };

  const isDueThisWeek = (dueDate: string | null | undefined) => {
    if (!dueDate) return false;
    const today = dayjs();
    const dueDay = dayjs(dueDate);
    return dueDay.isAfter(today) && dueDay.isBefore(today.add(7, "day"));
  };

  // Filter sections
  const filteredSections = sections
    .map((section) => ({
      ...section,
      tasks: section.tasks.filter(
        (task) =>
          task.isActive &&
          (progressFilter === "All" || task.progress === progressFilter) &&
          task.task.toLowerCase().includes(search.toLowerCase()) &&
          (dueDateFilter === "all" ||
            (dueDateFilter === "overdue" && isOverdue(task.dueDate)) ||
            (dueDateFilter === "thisWeek" && isDueThisWeek(task.dueDate))),
      ),
    }))
    .filter((section) => section.tasks.length > 0);

  return (
    <Layout>
      <Content style={{ padding: "16px" }}>
        {/* Filters */}
        <Card>
          <Space wrap>
            <Select
              style={{ width: 150 }}
              value={progressFilter}
              onChange={setProgressFilter}
            >
              <Option value="All">All Progress</Option>
              <Option value="To Do">To Do</Option>
              <Option value="Doing">Doing</Option>
              <Option value="Done">Done</Option>
            </Select>
            <Select
              style={{ width: 150 }}
              value={dueDateFilter}
              onChange={setDueDateFilter}
            >
              <Option value="all">All Due Dates</Option>
              <Option value="overdue">
                <Space>
                  <WarningOutlined style={{ color: "#ff4d4f" }} />
                  <span>Overdue</span>
                </Space>
              </Option>
              <Option value="thisWeek">
                <Space>
                  <CalendarOutlined style={{ color: "#1890ff" }} />
                  <span>Due This Week</span>
                </Space>
              </Option>
            </Select>
            <Search
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
          </Space>
        </Card>

        {/* Loading State */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
          </div>
        ) : filteredSections.length === 0 ? (
          <Card style={{ marginTop: 16, textAlign: "center" }}>
            <Text>No tasks found</Text>
          </Card>
        ) : (
          // Tasks by Section
          filteredSections.map((section) => (
            <Card
              key={section.title}
              style={{
                marginTop: 16,
                background: "#fff", // White background for section
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)", // Subtle shadow
              }}
            >
              <Title level={4} style={{ marginBottom: "20px" }}>
                {section.title}
              </Title>
              {section.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  editMode={false}
                  onEdit={() => {}}
                  customer={null}
                />
              ))}
            </Card>
          ))
        )}
      </Content>
    </Layout>
  );
};

export default CustomerPlan;
