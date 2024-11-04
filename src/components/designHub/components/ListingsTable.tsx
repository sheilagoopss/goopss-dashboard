import {
  Col,
  Collapse,
  CollapseProps,
  Row,
  Pagination,
  Spin,
  Card,
} from "antd";
import { Listing, ListingImage } from "types/Listing";
import ImageCard from "./ImageCard";
import { CSSProperties, useState } from "react";
import { LeftOutlined } from "@ant-design/icons";

interface ListingsTableProps {
  listings: Listing[];
  listingImages: ListingImage[];
  loading: boolean;
  refresh: () => void;
  selectedImages: ListingImage[];
  setSelectedImages: (selectedImages: ListingImage[]) => void;
  handleSelect?: (id: ListingImage, isSelected: boolean) => void;
  handleApprove?: (id: string) => void;
  handleSupersede?: (id: string) => void;
}

const ListingsTable = ({
  listings,
  listingImages,
  loading,
  refresh,
  selectedImages,
  setSelectedImages,
  handleSelect,
  handleApprove,
  handleSupersede,
}: ListingsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  const paginatedListings = listings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const getItems: (panelStyle: CSSProperties) => CollapseProps["items"] = (
    panelStyle,
  ) =>
    paginatedListings.map((listing) => ({
      key: listing.listingID,
      label: listing.listingTitle,
      children: (
        <Row
          gutter={[16, 16]}
          style={{
            padding: "2ch",
            background: "white",
            borderRadius: "5px",
          }}
        >
          {listingImages
            .filter((v) => v.listing_id === listing.listingID)
            .map((listingImage, index) => (
              <Col span={6} key={index}>
                <ImageCard
                  index={index + 1}
                  listing={listing}
                  listingImage={listingImage}
                  selectedImages={selectedImages}
                  setSelectedImages={setSelectedImages}
                  handleSelect={handleSelect}
                  handleApprove={handleApprove}
                  handleSupersede={handleSupersede}
                  refetch={refresh}
                />
              </Col>
            ))}
          {listingImages.filter((v) => v.listing_id === listing.listingID)
            .length === 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <Card>No Listing Image with this status</Card>
            </div>
          )}
        </Row>
      ),
      style: panelStyle,
    }));

  return (
    <Row gutter={[16, 16]}>
      {loading && (
        <Col span={24} style={{ textAlign: "center", height: "50vh" }}>
          <Spin />
        </Col>
      )}
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
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={listings.length}
        onChange={handlePageChange}
        style={{
          textAlign: "center",
          marginTop: 16,
          width: "100%",
          justifyContent: "flex-end",
        }}
      />
    </Row>
  );
};

export default ListingsTable;
