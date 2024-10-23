import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Layout } from "antd";
import { useTaskFetchAll } from "../../hooks/useTask";
import { useEffect, useState } from "react";
import TaskList from "./components/TaskList";
import { ITasklist } from "../../types/Task";
import { caseInsensitiveSearch } from "../../utils/caseInsensitveMatch";
import dayjs from "dayjs";

const { Content } = Layout;

const TaskManagement = () => {
  const [tasklist, setTasklist] = useState<ITasklist[]>([]);
  const [filteredTasklist, setFilteredTasklist] = useState<ITasklist[]>([]);
  const { fetchAllTasks, isLoading } = useTaskFetchAll();

  const refresh = async () => {
    const tasks = await fetchAllTasks();
    setTasklist(tasks);
    setFilteredTasklist(
      tasks.sort((a, b) =>
        dayjs(a.dateCompleted).isBefore(b.dateCompleted) ? 1 : -1,
      ),
    );
  };

  const handleSearch = (searchTerm?: string) => {
    const filterColumns: (keyof ITasklist)[] = [
      "customerName",
      "dateCompleted",
      "taskName",
      "teamMemberName",
    ];
    const filtered = tasklist?.filter((val) =>
      filterColumns.some((v) =>
        caseInsensitiveSearch(val[v] || "", searchTerm),
      ),
    );
    setFilteredTasklist(filtered);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout style={{ backgroundColor: "white" }}>
      <Content style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "1ch",
            }}
          >
            <h2 style={{ fontWeight: "bolder" }}>Task List</h2>
          </div>
          <div style={{ display: "flex", gap: "2ch" }}>
            <Input
              placeholder="Search tasks"
              prefix={<SearchOutlined className="h-5 w-5 text-gray-400" />}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refresh()}
              loading={isLoading}
            />
          </div>
        </div>
        <TaskList tasklists={filteredTasklist} loading={isLoading} />
      </Content>
    </Layout>
  );
};

export default TaskManagement;
