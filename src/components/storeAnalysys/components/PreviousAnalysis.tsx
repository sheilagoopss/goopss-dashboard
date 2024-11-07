import { Button, Col, message, Popconfirm, Row, Table } from "antd";
import dayjs from "dayjs";
import { IStoreDetail } from "../../../types/StoreDetail";
import { DeleteFilled, EyeFilled } from "@ant-design/icons";
import { useStoreAnalysisDelete } from "hooks/useStoreAnalytics";
import { useState } from "react";
import ScrapeDataModal from "./ScrapeDataModal";

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
  const { deleteStoreAnalysis, isDeleting } = useStoreAnalysisDelete();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<
    IStoreDetail | undefined
  >(undefined);
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const resp = await deleteStoreAnalysis(id);
    if (resp) {
      setDeletingId(null);
      message.success("Store Analysis deleted successfully");
      refresh();
    }
  };

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
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a: IStoreDetail, b: IStoreDetail) =>
        dayjs(a.createdAt).isBefore(dayjs(b.createdAt)) ? -1 : 1,
      render: (value: string) =>
        value ? dayjs(value).format("MMM DD YYYY HH:mm") : null,
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: IStoreDetail) => (
        <Row gutter={[16, 2]}>
          <Col>
            <Button
              icon={<EyeFilled />}
              title="View Detail"
              onClick={() => setSelectedAnalysis(record)}
            />
          </Col>
          <Col>
            <Popconfirm
              title="Are you sure you want to delete this analysis?"
              onConfirm={() => {
                if (record.id) handleDelete(record.id);
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button
                icon={<DeleteFilled />}
                danger
                loading={isDeleting && record.id === deletingId}
              />
            </Popconfirm>
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
      <ScrapeDataModal
        title={selectedAnalysis?.storeName}
        open={Boolean(selectedAnalysis)}
        storeName={selectedAnalysis?.storeName || ""}
        isLoading={false}
        scrapedData={selectedAnalysis}
        onCancel={() => setSelectedAnalysis(undefined)}
        footer={false}
      />
    </>
  );
}
