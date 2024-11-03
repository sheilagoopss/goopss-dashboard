import { Col, Collapse, CollapseProps, Row, Pagination, Spin } from "antd";
import { Listing, ListingImage } from "types/Listing";
import ImageUploadCard from "./ImageCard";
import { CSSProperties, useState } from "react";
import { LeftOutlined } from "@ant-design/icons";

interface ListingsTableProps {
  listings: Listing[];
  listingImages: ListingImage[];
  loading: boolean;
  refresh: () => void;
  selectedImages: ListingImage[];
  setSelectedImages: (selectedImages: ListingImage[]) => void;
  handleSelect?: (id: string, isSelected: boolean) => void;
  handleApprove?: (id: string) => void;
  handleRevise?: (id: string, revisionNote: string) => void;
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
  handleRevise,
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
          {listingImages.map((listingImage, index) => (
            <Col span={6} key={index}>
              <ImageUploadCard
                index={index + 1}
                listing={listing}
                listingImage={listingImage}
                selectedImages={selectedImages}
                setSelectedImages={setSelectedImages}
                handleSelect={handleSelect}
                handleApprove={handleApprove}
                handleRevise={handleRevise}
              />
            </Col>
          ))}
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
