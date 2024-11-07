import { CloseCircleFilled, LeftOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Collapse,
  CollapseProps,
  Image,
  Pagination,
  Row,
  Spin,
  Typography,
} from "antd";
import DragDropUpload from "components/common/DragDropUpload";
import { useAuth } from "contexts/AuthContext";
import { CSSProperties, useState } from "react";
import { Listing, ListingImage } from "types/Listing";
import dayjs from "dayjs";
import ImageCard from "./ImageCard";

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
  handleUploadListingImages?: (
    listing: Listing,
    data: string[],
  ) => Promise<boolean>;
  isUploading?: boolean;
}

const ListingsTable = ({
  listings,
  listingImages,
  loading,
  refresh,
  isUploading,
  selectedImages,
  setSelectedImages,
  handleSelect,
  handleApprove,
  handleSupersede,
  handleUploadListingImages,
}: ListingsTableProps) => {
  const { isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [newListingImages, setNewListingImages] = useState<string[]>([]);

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
      label: (
        <>
          {listing.listingTitle}
          <Typography.Text type="secondary" style={{ display: 'block' }}>
            ID: {listing.listingID}
          </Typography.Text>
        </>
      ),
      extra: (
        <Typography.Text type="secondary">
          {listingImages.find((img) => img.listing_id === listing.listingID)
            ?.date
            ? dayjs(listingImages.find((img) => img.listing_id === listing.listingID)?.date).format("MMM DD, YYYY HH:mm")
            : ""}
        </Typography.Text>
      ),
      children: (
        <Row
          gutter={[16, 16]}
          style={{
            padding: "2ch",
            background: "white",
            borderRadius: "5px",
          }}
        >
          {isAdmin && (
            <DragDropUpload
              handleUpload={(data) => {
                const newImage = (data as string[])?.at(0);
                if (newImage) {
                  setNewListingImages([...newListingImages, newImage]);
                }
              }}
            />
          )}
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
          {newListingImages.map((newImage) => (
            <Col span={6} key={Math.random() * 999}>
              <Card
                style={{
                  position: "relative",
                  borderRadius: "5px",
                  overflow: "hidden",
                }}
                title={
                  <Button
                    type="text"
                    icon={<CloseCircleFilled />}
                    onClick={() => {
                      setNewListingImages(
                        newListingImages.filter((image) => image !== newImage),
                      );
                    }}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      color: "red",
                    }}
                  />
                }
              >
                <Image
                  src={newImage}
                  alt="New Listing"
                  style={{ width: "100%", minHeight: "200px" }}
                />
              </Card>
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
          <Col
            span={24}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            {handleUploadListingImages && newListingImages.length > 0 && (
              <Button
                type="primary"
                loading={isUploading}
                onClick={() =>
                  handleUploadListingImages(listing, newListingImages).then(
                    (resp) => {
                      if (resp) {
                        setNewListingImages([]);
                      }
                    },
                  )
                }
              >
                Save Image Uploads
              </Button>
            )}
          </Col>
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
