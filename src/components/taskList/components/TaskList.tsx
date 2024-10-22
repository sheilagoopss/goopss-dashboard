import dayjs from "dayjs";
import { Customer } from "../../../types/Customer";
import { ITasklist } from "../../../types/Task";
import { Avatar, Table, Tag } from "antd";

interface TaskListProps {
  tasklists: ITasklist[];
  loading?: boolean;
  refresh?: boolean;
}

export default function TaskList({ tasklists, loading }: TaskListProps) {
  return (
    <Table
      dataSource={tasklists}
      columns={[
        {
          title: "Customer",
          dataIndex: "customer",
          key: "customer",
          render: (customer: Customer) => (
            <div>
              <Avatar
                src={customer.logo}
                alt={customer.store_owner_name}
                size="default"
                style={{ marginRight: 8 }}
                icon={customer.logo ? undefined : customer.store_owner_name[0]}
              />
              {customer.store_owner_name}

              <div style={{ marginTop: 4 }}>
                <Tag color="geekblue">{customer.store_name}</Tag>{" "}
              </div>
            </div>
          ),
          sorter: (a: ITasklist, b: ITasklist) =>
            (a.customer?.store_owner_name || "").localeCompare(
              b.customer?.store_owner_name || "",
            ),
        },
        {
          title: "Task",
          dataIndex: "taskName",
          key: "taskName",
          sorter: (a: ITasklist, b: ITasklist) =>
            a.taskName.localeCompare(b.taskName),
        },
        {
          title: "Listing",
          dataIndex: "listingId",
          key: "listingId",
          sorter: (a: ITasklist, b: ITasklist) =>
            (a.listingId || "").localeCompare(b.taskName),
        },
        {
          title: "Team Member",
          dataIndex: "teamMemberName",
          key: "teamMemberName",
          render: (teamMember) => (
            <div>
              <Avatar
                size="default"
                style={{ marginRight: 8 }}
                icon={teamMember[0]?.toUpperCase()}
              />
              {teamMember}
            </div>
          ),
          sorter: (a: ITasklist, b: ITasklist) =>
            (a.teamMemberName || "").localeCompare(b.teamMemberName || ""),
        },
        {
          title: "Date Completed",
          dataIndex: "dateCompleted",
          key: "dateCompleted",
          render: (dateCompleted: string) =>
            dayjs(dateCompleted).format("MMM DD YYYY HH:mm"),
          sorter: (a: ITasklist, b: ITasklist) =>
            dayjs(a.dateCompleted).isBefore(b.dateCompleted) ? 1 : -1,
        },
        {
          title: "Status",
          dataIndex: "isDone",
          key: "isDone",
          render: (isDone: boolean) => (
            <Tag color={isDone ? "green-inverse" : "gold-inverse"}>
              {isDone ? "Marked Complete" : "Marked Incomplete"}
            </Tag>
          ),
          sorter: (a: ITasklist, b: ITasklist) =>
            dayjs(a.dateCompleted).isBefore(b.dateCompleted) ? 1 : -1,
        },
      ]}
      rowKey="id"
      loading={loading}
      pagination={{
        showSizeChanger: true,
      }}
    />
  );
}
