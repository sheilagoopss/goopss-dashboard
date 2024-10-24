import {
  Table,
  Col,
  Row,
  Typography,
  Statistic,
  Divider,
  Card,
  Collapse,
} from "antd";
import dayjs from "dayjs";
import { IStat } from "../../../types/Stat";

interface StatListProps {
  stats: IStat[];
  loading: boolean;
  refresh: () => void;
}

const { Title, Paragraph } = Typography;

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

  const expandedRowRender = (record: IStat) => (
    <Row>
      <Col span={24} style={{ padding: "2ch" }}>
        <Title level={5}>{record.thisYear?.daterange}</Title>
        <Paragraph>Metrics</Paragraph>
        <Row gutter={[16, 0]}>
          {Object.keys(record.thisYear?.metrics)?.map((key) => (
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title={key}
                  value={
                    record.thisYear?.metrics?.[
                      key as keyof typeof record.thisYear.metrics
                    ]
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
        <Divider dashed />
        <Collapse
          items={[
            {
              key: "1",
              label: "Traffic Source",
              children: (
                <Row gutter={[16, 6]}>
                  {Object.keys(record.thisYear?.trafficSource)?.map((key) => (
                    <Col span={6}>
                      <Statistic
                        title={key}
                        value={
                          record.thisYear?.trafficSource?.[
                            key as keyof typeof record.thisYear.trafficSource
                          ]
                        }
                      />
                    </Col>
                  ))}
                </Row>
              ),
            },
          ]}
        />
      </Col>
      <Divider />
      <Col span={24} style={{ padding: "2ch" }}>
        <Title level={5}>{record.last30Days.daterange}</Title>
        <Paragraph>Metrics</Paragraph>
        <Row gutter={[16, 0]}>
          {Object.keys(record.last30Days?.metrics)?.map((key) => (
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title={key}
                  value={
                    record.last30Days?.metrics?.[
                      key as keyof typeof record.last30Days.metrics
                    ]
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
        <Divider dashed />
        <Collapse
          items={[
            {
              key: "1",
              label: "Traffic Source",
              children: (
                <Row gutter={[16, 6]}>
                  {Object.keys(record.last30Days?.trafficSource)?.map((key) => (
                    <Col span={6}>
                      <Statistic
                        title={key}
                        value={
                          record.last30Days?.trafficSource?.[
                            key as keyof typeof record.last30Days.trafficSource
                          ]
                        }
                      />
                    </Col>
                  ))}
                </Row>
              ),
            },
          ]}
        />
      </Col>
    </Row>
  );

  return (
    <>
      <Table
        dataSource={stats}
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
