import {
  Col,
  Layout,
  Modal,
  ModalProps,
  Row,
  Spin,
  Divider,
  Image,
  Tag,
} from "antd";
import React from "react";
import { IStoreDetail } from "../../../types/StoreDetail";
import Paragraph from "antd/es/typography/Paragraph";

const { Content } = Layout;

interface ScrapeDataModalProps extends ModalProps {
  storeName: string;
  scrapedData: IStoreDetail | null | undefined;
  isLoading: boolean;
}

export type ScrapeDataKeys = Exclude<
  keyof IStoreDetail,
  "customerId" | "createdAt" | "id" | "feedback"
>;

export const SCRAPE_DATA: Record<
  ScrapeDataKeys,
  { label: string; type: "text" | "image" | "link" | "tag" }
> = {
  storeName: { label: "Store Name", type: "text" },
  sales: { label: "Sales", type: "text" },
  announcement: { label: "Announcement", type: "text" },
  about: { label: "About", type: "text" },
  faq: { label: "Faq", type: "text" },
  bannerImage: { label: "Banner Image", type: "image" },
  feeShipping: { label: "Fee Shipping", type: "tag" },
  socialAccounts: { label: "Social Accounts", type: "link" },
  activeSale: { label: "Active Sale", type: "tag" },
  starSeller: { label: "Star Seller", type: "tag" },
  ownerPhoto: { label: "Owner Photo", type: "image" },
  featureItems: { label: "Feature Items", type: "tag" },
};

const ScrapeDataModal: React.FC<ScrapeDataModalProps> = ({
  storeName,
  isLoading,
  scrapedData,
  ...modalProps
}) => {
  return (
    <Modal {...modalProps} width={"80%"} style={{ top: "2ch" }}>
      <Content
        style={{ padding: "2ch", maxHeight: "80vh", overflow: "scroll" }}
      >
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Spin />
          </div>
        ) : (
          <Col span={24}>
            {Object.keys(SCRAPE_DATA).map((key: string, i: number) => (
              <Row gutter={[16, 6]} key={i}>
                <Col span={4}>
                  <Paragraph style={{ fontWeight: "bold" }}>
                    {SCRAPE_DATA[key as ScrapeDataKeys].label}
                  </Paragraph>
                </Col>
                <Col span={20}>
                  {SCRAPE_DATA[key as ScrapeDataKeys].type === "text" ? (
                    <Paragraph>
                      {scrapedData?.[key as keyof IStoreDetail]?.toString().split("\n").map((line, index) => (
                        <span key={index}>
                          {line.replace(/&amp;/g, '&')}
                          <br />
                        </span>
                      ))}
                    </Paragraph>
                  ) : SCRAPE_DATA[key as ScrapeDataKeys].type === "image" ? (
                    <Image
                      src={scrapedData?.[key as keyof IStoreDetail] as string}
                    />
                  ) : SCRAPE_DATA[key as ScrapeDataKeys].type === "tag" ? (
                    <Tag
                      color={
                        scrapedData?.[key as keyof IStoreDetail] === "yes"
                          ? "green-inverse"
                          : "red-inverse"
                      }
                    >
                      {String(
                        scrapedData?.[key as keyof IStoreDetail],
                      )?.toUpperCase()}
                    </Tag>
                  ) : SCRAPE_DATA[key as ScrapeDataKeys].type === "link" ? (
                    (scrapedData?.[key as keyof IStoreDetail] as string[])?.map(
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
                <Divider />
              </Row>
            ))}
          </Col>
        )}
      </Content>
    </Modal>
  );
};

export default ScrapeDataModal;
