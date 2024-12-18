"use client";

import {
  Card,
  DatePicker,
  Divider,
  Layout,
  List,
  Skeleton,
  Typography,
} from "antd";
import CustomersDropdown from "@/components/common/CustomersDropdown";
import { useCustomerFetchAll } from "@/hooks/useCustomer";
import { useCallback, useEffect, useState } from "react";
import { ICustomer } from "@/types/Customer";
import { useTaskFetchAll } from "@/hooks/useTask";
import { ITask } from "@/types/Task";
import dayjs from "dayjs";
import { usePlan } from "@/hooks/usePlan";
import { IPlanTask, PlanWithCustomer } from "@/types/Plan";
import { PlanTaskType } from "@/types/PlanTasks";

const { Content, Header } = Layout;

const CustomerTasks = () => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const { fetchAllCustomers, isLoading } = useCustomerFetchAll();
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [tasks, setTasks] = useState<{ category: string; count: number }[]>([]);
  const [plans, setPlans] = useState<{ category: string; count: number }[]>([]);
  const { fetchAllTasks, isLoading: isLoadingTasks } = useTaskFetchAll();
  const { fetchCustomerPlans, isLoading: isLoadingPlans } = usePlan();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  useEffect(() => {
    fetchAllCustomers().then((customers) => {
      setCustomers(customers);
    });
  }, [fetchAllCustomers]);

  const handleDataTransform = useCallback(
    (tasks: ITask[]) => {
      if (!selectedCustomer) return;
      let filteredTasks = tasks.filter(
        (task) => task.customerId === selectedCustomer.id,
      );

      if (dateRange) {
        filteredTasks = filteredTasks.filter(
          (task) =>
            dayjs(task.dateCompleted as string).isAfter(dateRange[0]) &&
            dayjs(task.dateCompleted as string).isBefore(dateRange[1]),
        );
      }

      const taskCounts = filteredTasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const groupedTasks: {
        category: string;
        count: number;
      }[] = [];

      Object.entries(taskCounts).forEach(([category, count]) => {
        if (category !== "undefined" && category !== "Other") {
          groupedTasks.push({
            category,
            count,
          });
        }
      });

      setTasks(groupedTasks);
    },
    [selectedCustomer, dateRange],
  );

  const toNormalText = (camelCaseText: string) => {
    return camelCaseText
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
      .trim();
  };

  const getPlanLabel = useCallback((plan: PlanTaskType) => {
    switch (plan) {
      case "NewKeywordResearchHighSearches":
        return "New keyword research - High searches";
      case "NewKeywordResearchLowCompetition":
        return "New keyword research - Low Competition";
      case "Newsletter":
        return "Newsletters";
      case "PinterestBanner":
        return "Pinterest Banner";
      case "StoreBanner":
        return "Store Banner";
      default:
        return toNormalText(plan);
    }
  }, []);

  const handlePlanGrouping = useCallback(
    (plans: PlanWithCustomer) => {
      const groupedPlans = plans.sections.reduce((acc, section) => {
        section.tasks?.forEach((task) => {
          if (task.progress === "Done") {
            const taskType = task.type || "Other";
            if (!acc[taskType]) {
              acc[taskType] = [];
            }
            acc[taskType].push(task);
          }
        });
        return acc;
      }, {} as Record<string, IPlanTask[]>);

      const groupedTasks: {
        category: string;
        count: number;
      }[] = [];
      Object.entries(groupedPlans).forEach(([category, count]) => {
        if (category !== "undefined" && category !== "Other") {
          groupedTasks.push({
            category: getPlanLabel(category as PlanTaskType),
            count: count.length,
          });
        }
      });
      setPlans(groupedTasks);
    },
    [getPlanLabel],
  );

  useEffect(() => {
    if (selectedCustomer) {
      fetchAllTasks().then((tasks) => {
        handleDataTransform(tasks);
      });
      fetchCustomerPlans(selectedCustomer.id).then((plans) => {
        handlePlanGrouping(plans);
      });
    }
  }, [
    selectedCustomer,
    fetchAllTasks,
    handleDataTransform,
    fetchCustomerPlans,
    handlePlanGrouping,
  ]);

  return (
    <Layout style={{ backgroundColor: "white" }}>
      <Header style={{ backgroundColor: "white" }}>
        <Typography.Title level={4}>
          Task Summary for Major Tasks
        </Typography.Title>
      </Header>
      <Content>
        <div className="flex justify-between items-center">
          <DatePicker.RangePicker
            onChange={(value) => {
              if (value && value.at(0) && value.at(1)) {
                setDateRange([
                  value.at(0)!.format("YYYY-MM-DD"),
                  value.at(1)!.format("YYYY-MM-DD"),
                ]);
              } else {
                setDateRange(null);
              }
            }}
          />
          {isLoading ? (
            <Skeleton.Input size="large" />
          ) : (
            <CustomersDropdown
              customers={customers}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              isAdmin={true}
              hideExtras={true}
            />
          )}
        </div>
        {selectedCustomer && (
          <Card
            style={{ marginTop: "1rem" }}
            title={`Customer ${selectedCustomer?.store_name} - Task Summary`}
          >
            {tasks.length > 0 && (
              <>
                <List
                  loading={isLoadingTasks}
                  dataSource={tasks}
                  renderItem={(item) => (
                    <List.Item>
                      <div className="flex justify-between items-center w-full">
                        <Typography.Text strong>
                          {item.category}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          {item.count}
                        </Typography.Text>
                      </div>
                    </List.Item>
                  )}
                />
              </>
            )}
            <Divider />
            {plans.length > 0 && (
              <>
                <List
                  loading={isLoadingPlans}
                  dataSource={plans}
                  renderItem={(item) => (
                    <List.Item>
                      <div className="flex justify-between items-center w-full">
                        <Typography.Text strong>
                          {item.category}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          {item.count}
                        </Typography.Text>
                      </div>
                    </List.Item>
                  )}
                />
              </>
            )}
          </Card>
        )}
      </Content>
    </Layout>
  );
};

export default CustomerTasks;
