"use client";

import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Input, Layout, Popover, Tabs } from "antd";
import { useTaskFetchAll } from "@/hooks/useTask";
import { useCallback, useEffect, useState } from "react";
import TaskList from "@/components/tasks/TaskList";
import { ITasklist } from "@/types/Task";
import { caseInsensitiveSearch } from "@/utils/caseInsensitveMatch";
import dayjs, { Dayjs } from "dayjs";
import AdvancedDateFilter from "@/components/common/AdvancedDateFilter";
import CustomerTasks from "@/components/tasks/CustomerTasks";

const { Content } = Layout;

interface IFilterQueries {
  searchValue?: string;
  startDate?: Dayjs;
  endDate?: Dayjs;
}

const TaskManagement = () => {
  const { fetchAllTasks, isLoading } = useTaskFetchAll();
  const [tasklist, setTasklist] = useState<ITasklist[]>([]);
  const [filteredTasklist, setFilteredTasklist] = useState<ITasklist[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterQueries, setFilterQueries] = useState<IFilterQueries>({
    searchValue: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const refresh = useCallback(async () => {
    const tasks = await fetchAllTasks();
    setTasklist(tasks);
    setFilteredTasklist(
      tasks.sort((a, b) =>
        dayjs(a.dateCompleted).isBefore(b.dateCompleted) ? 1 : -1,
      ),
    );
  }, [fetchAllTasks]);

  const handleSearch = useCallback(
    (searchValue?: string, data?: ITasklist[]) => {
      const filterColumns: (keyof ITasklist)[] = [
        "customerName",
        "dateCompleted",
        "taskName",
        "teamMemberName",
      ];
      const filtered = (data || tasklist)?.filter((val) =>
        filterColumns.some((v) =>
          caseInsensitiveSearch(val[v] || "", searchValue),
        ),
      );
      setFilteredTasklist(filtered);
    },
    [tasklist],
  );

  const handleOpenChange = () => {
    setFilterOpen(!filterOpen);
  };

  useEffect(() => {
    if (tasklist) {
      let filteredData = tasklist;
      if (filterQueries.startDate && filterQueries.endDate) {
        filteredData = tasklist.filter(
          (task) =>
            dayjs(task.dateCompleted).isAfter(filterQueries.startDate) &&
            dayjs(task.dateCompleted).isBefore(filterQueries.endDate),
        );
      }

      handleSearch(filterQueries.searchValue, filteredData);
    }
  }, [filterQueries, handleSearch, tasklist]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Layout style={{ backgroundColor: "white" }}>
      <Content style={{ padding: "24px" }}>
        <Tabs
          defaultActiveKey="list"
          items={[
            {
              label: "Task List",
              key: "list",
              children: (
                <>
                  <div className="flex flex-row justify-between items-center mb-4">
                    <div className="flex gap-2">
                      <Popover
                        content={
                          <AdvancedDateFilter
                            handleClear={() =>
                              setFilterQueries({
                                ...filterQueries,
                                startDate: undefined,
                                endDate: undefined,
                              })
                            }
                            handleDateFilter={(params) =>
                              setFilterQueries({
                                ...filterQueries,
                                startDate: params.startDate || undefined,
                                endDate: params.endDate || undefined,
                              })
                            }
                          />
                        }
                        title="Filter"
                        trigger="click"
                        open={filterOpen}
                        onOpenChange={handleOpenChange}
                      >
                        <Button
                          icon={<FilterOutlined />}
                          style={{ width: "3rem" }}
                        />
                      </Popover>
                      <Input
                        placeholder="Search tasks"
                        prefix={
                          <SearchOutlined className="h-5 w-5 text-gray-400" />
                        }
                        onChange={(e) =>
                          setFilterQueries({
                            ...filterQueries,
                            searchValue: e.target.value,
                          })
                        }
                        allowClear
                      />
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => refresh()}
                        loading={isLoading}
                        style={{ width: "3rem" }}
                      />
                    </div>
                  </div>
                  <TaskList tasklists={filteredTasklist} loading={isLoading} />
                </>
              ),
            },
            {
              label: "Customer Task Summary",
              key: "summary",
              children: <CustomerTasks />,
            },
          ]}
        />
      </Content>
    </Layout>
  );
};

export default TaskManagement;
