import {
  Collapse,
  Col,
  Divider,
  Row,
  Statistic,
  List,
  Typography,
  Image,
  Table,
} from "antd";
import {
  EtsySearchInfo,
  IPeriodData,
  SearchTermsStructure,
} from "../../../types/Stat";
import { useEffect, useState } from "react";
import { toPascalCase } from "utils/textFormater";

interface PeriodStatProps {
  periodData: IPeriodData;
}

const PeriodStat: React.FC<PeriodStatProps> = ({ periodData }) => {
  const [etsyAds, setEtsyAds] = useState<EtsySearchInfo>();

  useEffect(() => {
    const ads = periodData.trafficAnalysis?.data?.capturedData?.find(
      (value) =>
        value.name === "Etsy search" &&
        (value as unknown as EtsySearchInfo)?.info,
    ) as unknown as EtsySearchInfo;
    setEtsyAds(ads || undefined);
  }, [periodData]);

  return (
    <>
      <Divider dashed />
      <Collapse
        items={[
          {
            key: "1",
            label: "Traffic Source",
            children: (
              <Row gutter={[16, 6]}>
                {periodData?.trafficSource &&
                  Object.keys(periodData?.trafficSource)
                    ?.sort()
                    ?.map((key) => (
                      <Col span={6}>
                        <Statistic
                          title={key}
                          value={
                            periodData?.trafficSource?.[
                              key as keyof typeof periodData.trafficSource
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
                          periodData?.trafficAnalysis?.data?.capturedData?.find(
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
                  <Collapse.Panel header="Shoppers Viewed" key="1">
                    <Table
                      dataSource={periodData?.trafficAnalysis?.listingsData}
                      columns={[
                        {
                          key: "image",
                          dataIndex: "image",
                          title: "Image",
                          render: (value) => (
                            <Image
                              src={value}
                              width={50}
                              height={50}
                              preview={false}
                            />
                          ),
                        },
                        {
                          key: "Name",
                          dataIndex: "title",
                          title: "Name",
                          render: (value, record) => (
                            <Typography.Link href={record.link}>
                              {value}
                            </Typography.Link>
                          ),
                        },
                        {
                          key: "Views",
                          dataIndex: "views",
                          title: "Views",
                        },
                        {
                          key: "Favorites",
                          dataIndex: "favorites",
                          title: "Favorites",
                        },
                      ]}
                    />
                  </Collapse.Panel>
                </Collapse>
                <Divider />
                {periodData?.trafficAnalysis?.data?.capturedData?.map(
                  (captured, index) => {
                    if (
                      captured.data &&
                      Object.keys(captured.data).length > 0 &&
                      captured.name !== "Search Terms"
                    ) {
                      return (
                        <Collapse style={{ width: "100%" }}>
                          <Collapse.Panel header={captured.name} key={index}>
                            <Table
                              columns={[
                                {
                                  key: "image",
                                  dataIndex: "image",
                                  title: "Image",
                                  render: (value) => (
                                    <Image
                                      src={value}
                                      width={50}
                                      height={50}
                                      preview={false}
                                    />
                                  ),
                                },
                                {
                                  key: "title",
                                  dataIndex: "title",
                                  title: "Title",
                                },
                                {
                                  key: "visits",
                                  dataIndex: "visits",
                                  title: "Visits",
                                },
                              ]}
                              dataSource={[captured.data]}
                            />
                          </Collapse.Panel>
                        </Collapse>
                      );
                    } else {
                      return null;
                    }
                  },
                )}
                {etsyAds && (
                  <>
                    <Divider />
                    <Collapse style={{ width: "100%" }}>
                      <Collapse.Panel header="Etsy Ads" key="1">
                        {etsyAds.info.map((ad) =>
                          Object.keys(ad)
                            ?.filter((ad) =>
                              [
                                "advertising",
                                "clicks",
                                "favorites",
                                "link",
                                "listingId",
                                "orders",
                                "revenue",
                                "spend",
                                "title",
                                "usValue",
                                "views",
                              ].includes(ad),
                            )
                            ?.sort((a, b) => {
                              if (a === "title") return -1;
                              if (b === "title") return 1;
                              return a.localeCompare(b);
                            })
                            .map((key) => (
                              <List.Item
                                key={key}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                <Typography.Text strong>
                                  {toPascalCase(key)}
                                </Typography.Text>
                                <Typography.Text type="secondary">
                                  {
                                    ad[
                                      key as keyof typeof ad
                                    ] as unknown as string
                                  }
                                </Typography.Text>
                              </List.Item>
                            )),
                        )}
                      </Collapse.Panel>
                    </Collapse>
                  </>
                )}
              </Row>
            ),
          },
        ]}
      />
    </>
  );
};

export default PeriodStat;
