import { Table } from "antd";
import dayjs from "dayjs";
import { IStat } from "../../../types/Stat";
import ExpandedRow from "./ExpandedRow";

interface StatListProps {
  stats: IStat[];
  loading: boolean;
  refresh: () => void;
}

export default function StatList({ stats, loading, refresh }: StatListProps) {
  const columns = [
    {
      title: "Store Name",
      dataIndex: "shop",
      key: "shop",
      sorter: (a: IStat, b: IStat) => a.shop.localeCompare(b.shop),
    },
    {
      title: "Date",
      dataIndex: "timestamp",
      key: "timestamp",
      sorter: (a: IStat, b: IStat) => a.timestamp.localeCompare(b.timestamp),
      render: (value: string) => {
        if (value) {
          return dayjs(value).format("MMM DD YYYY HH:mm");
        } else {
          return value;
        }
      },
    },
  ];

  const expandedRowRender = (record: IStat) => <ExpandedRow record={record} />;

  return (
    <>
      <Table
        dataSource={stats.sort((a, b) => {
          const dateA = a.timestamp ? dayjs(a.timestamp) : dayjs(0);
          const dateB = b.timestamp ? dayjs(b.timestamp) : dayjs(0);
          return dateA.isAfter(dateB) ? -1 : 1;
        })}
        columns={columns}
        rowKey="id"
        loading={loading}
        expandable={{ expandedRowRender, defaultExpandAllRows: true }}
        pagination={{
          showSizeChanger: true,
        }}
      />
    </>
  );
}
