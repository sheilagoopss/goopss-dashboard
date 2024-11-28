import {
  Table,
  Col,
  Row,
  Typography,
  Statistic,
  Divider,
  Card,
  Collapse,
  Image,
  List,
  Tag,
} from "antd";
import dayjs from "dayjs";
import { IStat, SearchTermsStructure } from "../../../types/Stat";

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
          {record.thisYear?.metrics &&
            Object.keys(record.thisYear?.metrics)
              .sort()
              .map((key) => (
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
                  {record.thisYear?.trafficSource &&
                    Object.keys(record.thisYear?.trafficSource)
                      ?.sort()
                      ?.map((key) => (
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
        <Divider dashed />
        <Collapse
          items={[
            {
              key: "1",
              label: "Traffic Analysis",
              children: (
                <Row gutter={[16, 6]}>
                  <Collapse style={{ width: "100%" }}>
                    <Collapse.Panel header="Search Terms" key="1">
                      <List
                        dataSource={
                          (
                            record.thisYear?.trafficAnalysis?.data?.capturedData?.find(
                              (value) => value.name === "Search Terms",
                            ) as SearchTermsStructure
                          )?.data || []
                        }
                        renderItem={(item) => (
                          <List.Item key={item.searchTerm}>
                            <Typography.Text strong>
                              {item.searchTerm}
                            </Typography.Text>
                            <Typography.Text type="secondary">
                              {item.visits}
                            </Typography.Text>
                          </List.Item>
                        )}
                      />
                    </Collapse.Panel>
                  </Collapse>
                  <Collapse style={{ width: "100%" }}>
                    <Collapse.Panel header="Listings" key="1">
                      <List
                        dataSource={
                          record.thisYear?.trafficAnalysis?.listingsData
                        }
                        renderItem={(listing) => (
                          <Row
                            gutter={[16, 0]}
                            key={listing.link}
                            style={{ borderBottom: "1px solid #f0f0f0" }}
                          >
                            <Col>
                              <Image
                                src={listing.image}
                                width={50}
                                height={50}
                                preview={false}
                              />
                            </Col>
                            <Col span={18}>
                              <Typography.Text strong>
                                {listing.title}
                              </Typography.Text>
                              <br />
                              <Typography.Link href={listing.link}>
                                {listing.link}
                              </Typography.Link>
                            </Col>
                            <Col span={4}>
                              <Typography.Text>{listing.views}</Typography.Text>
                            </Col>
                          </Row>
                        )}
                      />
                    </Collapse.Panel>
                  </Collapse>
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
          {record.last30Days?.metrics &&
            Object.keys(record.last30Days?.metrics)
              ?.sort()
              ?.map((key) => (
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
                  {record.last30Days?.trafficSource &&
                    Object.keys(record.last30Days?.trafficSource)
                      ?.sort()
                      ?.map((key) => (
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
        <Divider dashed />
        <Collapse
          items={[
            {
              key: "1",
              label: "Traffic Analysis",
              children: (
                <Row gutter={[16, 6]}>
                  <Collapse style={{ width: "100%" }}>
                    <Collapse.Panel header="Search Terms" key="1">
                      <List
                        dataSource={
                          (
                            record.last30Days?.trafficAnalysis?.data?.capturedData?.find(
                              (value) => value.name === "Search Terms",
                            ) as SearchTermsStructure
                          )?.data || []
                        }
                        renderItem={(item) => (
                          <List.Item key={item.searchTerm}>
                            <Typography.Text strong>
                              {item.searchTerm}
                            </Typography.Text>
                            <Typography.Text type="secondary">
                              {item.visits}
                            </Typography.Text>
                          </List.Item>
                        )}
                      />
                    </Collapse.Panel>
                  </Collapse>
                  <Collapse style={{ width: "100%" }}>
                    <Collapse.Panel header="Listings" key="1">
                      <List
                        dataSource={
                          record.last30Days?.trafficAnalysis?.listingsData
                        }
                        renderItem={(listing) => (
                          <Row
                            gutter={[16, 0]}
                            key={listing.link}
                            style={{ borderBottom: "1px solid #f0f0f0" }}
                          >
                            <Col>
                              <Image
                                src={listing.image}
                                width={50}
                                height={50}
                                preview={false}
                              />
                            </Col>
                            <Col span={18}>
                              <Typography.Text strong>
                                {listing.title}
                              </Typography.Text>
                              <br />
                              <Typography.Link href={listing.link}>
                                {listing.link}
                              </Typography.Link>
                            </Col>
                            <Col span={4}>
                              <Typography.Text>{listing.views}</Typography.Text>
                            </Col>
                          </Row>
                        )}
                      />
                    </Collapse.Panel>
                  </Collapse>
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
