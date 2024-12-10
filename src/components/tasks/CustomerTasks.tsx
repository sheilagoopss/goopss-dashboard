"use client";

import { Card, DatePicker, Layout, List, Skeleton, Typography } from "antd";
import CustomersDropdown from "@/components/common/CustomersDropdown";
import { useCustomerFetchAll } from "@/hooks/useCustomer";
import { useCallback, useEffect, useState } from "react";
import { ICustomer } from "@/types/Customer";
import { useTaskFetchAll } from "@/hooks/useTask";
import { ITask } from "@/types/Task";
import dayjs from "dayjs";

const { Content, Header } = Layout;

const CustomerTasks = () => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const { fetchAllCustomers, isLoading } = useCustomerFetchAll();
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [tasks, setTasks] = useState<{ category: string; count: number }[]>([]);
  const { fetchAllTasks, isLoading: isLoadingTasks } = useTaskFetchAll();
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

      const groupedTasks = Object.entries(taskCounts).map(
        ([category, count]) => ({
          category: category === "undefined" ? "Other" : category,
          count,
        }),
      );

      setTasks(groupedTasks);
    },
    [selectedCustomer, dateRange],
  );

  useEffect(() => {
    if (selectedCustomer) {
      fetchAllTasks().then((tasks) => {
        handleDataTransform(tasks);
      });
    }
  }, [selectedCustomer, fetchAllTasks, handleDataTransform]);

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
            <List
              loading={isLoadingTasks}
              dataSource={tasks}
              renderItem={(item) => (
                <List.Item>
                  <div className="flex justify-between items-center w-full">
                    <Typography.Text strong>{item.category}</Typography.Text>
                    <Typography.Text type="secondary">
                      {item.count}
                    </Typography.Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        )}
      </Content>
    </Layout>
  );
};

export default CustomerTasks;
