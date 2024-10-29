import { Col, Layout, Modal, ModalProps, Row, Spin } from "antd";
import React from "react";
import { IStoreDetail } from "../../../types/StoreDetail";
import Paragraph from "antd/es/typography/Paragraph";

const { Content } = Layout;

interface ScrapeDataModalProps extends ModalProps {
  storeName: string;
  scrapedData: IStoreDetail | null | undefined;
  isLoading: boolean;
}

const SCRAPE_DATA: Record<keyof IStoreDetail, string> = {
  storeName: "Store Name",
  sales: "Sales",
  announcement: "Announcement",
  about: "About",
  faq: "Faq",
  bannerImage: "Banner Image",
  feeShipping: "Fee Shipping",
  socialAccounts: "Social Accounts",
  activeSale: "Active Sale",
  starSeller: "Star Seller",
  ownerPhoto: "Owner Photo",
  featureItems: "Feature Items",
};

const ScrapeDataModal: React.FC<ScrapeDataModalProps> = ({
  storeName,
  isLoading,
  scrapedData,
  ...modalProps
}) => {
  return (
    <Modal {...modalProps}>
      <Content style={{ padding: "2ch" }}>
        {isLoading ? (
          <Spin />
        ) : (
          <Col span={24}>
            {Object.keys(SCRAPE_DATA).map((key: string, i: number) => (
              <Row gutter={[16, 6]} key={i}>
                <Col span={12}>
                  <Paragraph style={{ fontWeight: "bold" }}>
                    {SCRAPE_DATA[key as keyof IStoreDetail]}
                  </Paragraph>
                </Col>
                <Col span={12}>{scrapedData?.[key as keyof IStoreDetail]}</Col>
              </Row>
            ))}
          </Col>
        )}
      </Content>
    </Modal>
  );
};

export default ScrapeDataModal;
