import { Card, Col, Divider, Row, Statistic, Typography } from "antd";
import { IStat } from "../../../types/Stat";
import PeriodStat from "./PeriodStat";

interface ExpandedRowProps {
  record: IStat;
}

const ExpandedRow: React.FC<ExpandedRowProps> = ({ record }) => {
  return (
    <Row>
      <Col span={24} style={{ padding: "2ch" }}>
        <Typography.Title level={5}>{record.thisYear?.daterange}</Typography.Title>
        <Typography.Paragraph>Metrics</Typography.Paragraph>
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
        <PeriodStat periodData={record.thisYear} />
      </Col>
      <Divider />
      <Col span={24} style={{ padding: "2ch" }}>
        <Typography.Title level={5}>{record.last30Days.daterange}</Typography.Title>
        <Typography.Paragraph>Metrics</Typography.Paragraph>
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
        <PeriodStat periodData={record.last30Days} />
      </Col>
    </Row>
  );
};

export default ExpandedRow;
