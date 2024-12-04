"use client"

import { Col, Divider, Image, Row, Tag } from "antd";
import { IStoreDetail } from "@/types/StoreDetail";
import { SCRAPE_DATA, ScrapeDataKeys } from "@/components/storeAnalysis/ScrapeDataModal";
import Paragraph from "antd/es/typography/Paragraph";
import Title from "antd/es/typography/Title";
import TextArea from "antd/es/input/TextArea";

interface PreviousAnalysisProps {
  storeDetail: IStoreDetail | undefined;
  loading: boolean;
  refresh: () => void;
  setStoreDetail: (storeDetail: IStoreDetail) => void;
}

export default function PreviousAnalysis({
  storeDetail,
  setStoreDetail,
}: PreviousAnalysisProps) {
  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={4}>
          <Title level={5}>Store Section</Title>
        </Col>
        <Col span={10}>
          <Title level={5}>Details</Title>
        </Col>
        <Col span={10}>
          <Title level={5}>Feedback</Title>
        </Col>
        {storeDetail && (
          <Col span={24}>
            {Object.keys(SCRAPE_DATA).map((key: string, i: number) => (
              <Row gutter={[16, 6]} key={i}>
                <Col span={4}>
                  <Paragraph style={{ fontWeight: "bold" }}>
                    {SCRAPE_DATA[key as ScrapeDataKeys].label}
                  </Paragraph>
                </Col>
                <Col span={10}>
                  {SCRAPE_DATA[key as ScrapeDataKeys].type === "text" ? (
                    <Paragraph>
                      {storeDetail?.[key as keyof IStoreDetail]
                        ?.toString()
                        .replace(/\n/g, "<br>")}
                    </Paragraph>
                  ) : SCRAPE_DATA[key as ScrapeDataKeys].type === "image" ? (
                    <Image
                      src={storeDetail?.[key as keyof IStoreDetail] as string}
                      alt="listing"
                    />
                  ) : SCRAPE_DATA[key as ScrapeDataKeys].type === "tag" ? (
                    <Tag
                      color={
                        storeDetail?.[key as keyof IStoreDetail] === "yes"
                          ? "green-inverse"
                          : "red-inverse"
                      }
                    >
                      {String(
                        storeDetail?.[key as keyof IStoreDetail],
                      )?.toUpperCase()}
                    </Tag>
                  ) : SCRAPE_DATA[key as ScrapeDataKeys].type === "link" ? (
                    (storeDetail?.[key as keyof IStoreDetail] as string[])?.map(
                      (link: string, index: number) => (
                        <>
                          <a key={index} href={link.trim()}>
                            {link.trim()}
                          </a>
                          <br />
                        </>
                      ),
                    )
                  ) : null}
                </Col>
                <Col span={10}>
                  <TextArea
                    value={storeDetail?.feedback?.[key as keyof IStoreDetail]}
                    rows={
                      storeDetail?.feedback?.[key as keyof IStoreDetail]
                        ? (storeDetail?.feedback?.[key as keyof IStoreDetail]
                            ?.length || 60) / 60
                        : 4
                    }
                    onChange={(e) => {
                      setStoreDetail({
                        ...storeDetail,
                        feedback: {
                          ...storeDetail?.feedback,
                          [key as keyof IStoreDetail]: e.target.value,
                        },
                      });
                    }}
                  />
                </Col>
                <Divider />
              </Row>
            ))}
          </Col>
        )}
      </Row>
    </>
  );
}
