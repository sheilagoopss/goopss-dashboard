import { Button, Col, Row, Table } from "antd";
import dayjs from "dayjs";
import { IStoreDetail } from "../../../types/StoreDetail";
import { DeleteFilled, EyeFilled } from "@ant-design/icons";

interface PreviousAnalysisProps {
  storeDetail: IStoreDetail[];
  loading: boolean;
  refresh: () => void;
}

export default function PreviousAnalysis({
  storeDetail,
  loading,
  refresh,
}: PreviousAnalysisProps) {
  const columns = [
    {
      title: "Store Name",
      dataIndex: "storeName",
      key: "storeName",
      sorter: (a: IStoreDetail, b: IStoreDetail) =>
        a.storeName.localeCompare(b.storeName),
    },
    {
      title: "Date",
      dataIndex: "storeName",
      key: "storeName",
      sorter: (a: IStoreDetail, b: IStoreDetail) =>
        a.storeName.localeCompare(b.storeName),
      render: (value: string) => {
        if (value) {
          return dayjs(value).format("MMM DD YYYY HH:mm");
        } else {
          return value;
        }
      },
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: IStoreDetail) => (
        <Row gutter={[16, 2]}>
          <Col>
            <Button
              // onClick={() => handleEdit(record)}
              icon={<EyeFilled />}
              title="View Detail"
            />
          </Col>
          <Col>
            <Button
              // onClick={() => handleDelete(record.id)}
              icon={<DeleteFilled />}
              danger
              // loading={isDeleting}
            />
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <>
      <Table
        dataSource={storeDetail}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
        }}
      />
    </>
  );
}
