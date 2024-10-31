import { Col, Collapse, CollapseProps, Row } from "antd";
import { Listing, ListingImage } from "types/Listing";
import ImageUploadCard from "./ImageCard";
import { CSSProperties } from "react";
import {
  LeftOutlined,
} from "@ant-design/icons";

interface ListingsTableProps {
  listings: Listing[];
  listingImages: ListingImage[];
  loading: boolean;
  refresh: () => void;
  selectedImages: ListingImage[];
  setSelectedImages: (selectedImages: ListingImage[]) => void;
}

const ListingsTable = ({
  listings,
  listingImages,
  loading,
  refresh,
  selectedImages,
  setSelectedImages,
}: ListingsTableProps) => {
  const getItems: (panelStyle: CSSProperties) => CollapseProps["items"] = (
    panelStyle,
  ) =>
    listings.map((listing) => ({
      key: listing.listingID,
      label: listing.listingTitle,
      children: (
        <Row
          gutter={[16, 16]}
          style={{ padding: "2ch", background: "white", borderRadius: "5px" }}
        >
          {listingImages.map((listingImage, index) => (
            <Col span={6}>
              <ImageUploadCard
                index={index + 1}
                listing={listing}
                listingImage={listingImage}
                selectedImages={selectedImages}
                setSelectedImages={setSelectedImages}
              />
            </Col>
          ))}
        </Row>
      ),
      style: panelStyle,
    }));

  return (
    <Row gutter={[16, 16]}>
      <Collapse
        bordered={false}
        defaultActiveKey={["1"]}
        expandIconPosition="right"
        expandIcon={({ isActive }) => (
          <LeftOutlined rotate={isActive ? 90 : 0} />
        )}
        items={getItems({
          padding: 16,
          marginBottom: 16,
          border: "none",
          background: "whitesmoke",
          borderRadius: "10px",
        })}
        style={{ background: "white", width: "100%", borderRadius: "10px" }}
      />
    </Row>
  );
};

export default ListingsTable;
