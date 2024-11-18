import { CloseCircleFilled } from "@ant-design/icons";
import { Button, Card, Col, Image, Row, Spin, Table } from "antd";
import DragDropUpload from "components/common/DragDropUpload";
import { useAuth } from "contexts/AuthContext";
import { useState } from "react";
import { Listing, ListingImage } from "types/Listing";
import ImageCard from "./ImageCard";
import { useDownloadImage } from "hooks/useListingImage";
import { ColumnsType } from "antd/es/table";

interface ListingsTableProps {
  listings: (Listing & { uploadedImages: number; totalImages: number })[];
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
  handleMarkAsUploadedToEtsy?: (id: string) => Promise<boolean>;
  handleMarkAsNotUploadedToEtsy?: (id: string) => Promise<boolean>;
  isUpdatingStatus?: boolean;
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
  handleMarkAsUploadedToEtsy,
  handleMarkAsNotUploadedToEtsy,
  isUpdatingStatus,
}: ListingsTableProps) => {
  const { isAdmin } = useAuth();
  const { downloadMultipleImages, isDownloading } = useDownloadImage();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [newListingImages, setNewListingImages] = useState<
    Record<string, string[]>
  >({});

  const handleDownload = async (listingImages: ListingImage[]) => {
    try {
      const imageData = await downloadMultipleImages(
        listingImages.map((v) => v.id),
      );

      if (!imageData?.data) {
        throw new Error("Network response was not ok");
      }

      const base64Data = imageData.data;
      const zipBlob = new Blob(
        [Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))],
        { type: "application/zip" },
      );
      const url = URL.createObjectURL(zipBlob);
      const anchorElement = document.createElement("a");
      anchorElement.href = url;
      anchorElement.download = `${listingImages?.at(0)?.listing_id}-${new Date().getTime()}.zip`;
      document.body.appendChild(anchorElement);
      anchorElement.click();
      anchorElement.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  const columns: ColumnsType<
    Listing & { uploadedImages: number; totalImages: number }
  > = [
    {
      title: "Listing ID",
      dataIndex: "listingID",
      sorter: (a, b) => a.listingID.localeCompare(b.listingID),
    },
    {
      title: "Listing Title",
      dataIndex: "listingTitle",
      sorter: (a, b) => a.listingTitle.localeCompare(b.listingTitle),
      render: (text: string, record: Listing) => (
        <a href={record.etsyLink} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: "Uploaded Images",
      dataIndex: "uploadedImages",
      sorter: (a, b) => (a.uploadedImages || 0) - (b.uploadedImages || 0),
    },
    {
      title: "Total Images",
      dataIndex: "totalImages",
      sorter: (a, b) => (a.totalImages || 0) - (b.totalImages || 0),
    },
  ];
  const expandedRowRender = (
    listing: Listing & { uploadedImages: number; totalImages: number },
  ) => {
    return (
      <Row
        gutter={[16, 16]}
        style={{
          width: "100%",
          padding: "2ch",
          background: "white",
          borderRadius: "5px",
        }}
      >
        {isAdmin && (
          <Col
            span={24}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              loading={isDownloading}
              onClick={() =>
                handleDownload(
                  listingImages.filter(
                    (v) => v.listing_id === listing.listingID,
                  ),
                )
              }
              type="primary"
            >
              Download All
            </Button>
          </Col>
        )}
        {isAdmin && (
          <DragDropUpload
            handleUpload={(data) => {
              const newImage = (data as string[])?.at(0);
              if (newImage) {
                setNewListingImages({
                  ...newListingImages,
                  [listing.listingID]: [
                    ...(Array.isArray(newListingImages[listing.listingID])
                      ? newListingImages[listing.listingID]
                      : []),
                    newImage,
                  ],
                });
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
                handleMarkAsUploadedToEtsy={handleMarkAsUploadedToEtsy}
                handleMarkAsNotUploadedToEtsy={handleMarkAsNotUploadedToEtsy}
                refetch={refresh}
              />
            </Col>
          ))}
        {Object.entries(newListingImages[listing.listingID] || []).map(
          ([_, newImage]) => (
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
                      const newListingImagesCopy = {
                        ...newListingImages,
                        [listing.listingID]: newListingImages[
                          listing.listingID
                        ].filter((image) => image !== newImage),
                      };
                      setNewListingImages(newListingImagesCopy);
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
          ),
        )}
        {listingImages.filter((v) => v.listing_id === listing.listingID)
          .length === 0 &&
          Object.entries(newListingImages[listing.listingID] || []).length ===
            0 && (
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
        <Col span={24} style={{ display: "flex", justifyContent: "flex-end" }}>
          {handleUploadListingImages &&
            Object.entries(newListingImages[listing.listingID] || []).length >
              0 && (
              <Button
                type="primary"
                loading={isUploading}
                onClick={() =>
                  handleUploadListingImages(
                    listing,
                    newListingImages[listing.listingID],
                  ).then((resp) => {
                    if (resp) {
                      setNewListingImages({});
                    }
                  })
                }
              >
                Save Image Uploads
              </Button>
            )}
        </Col>
      </Row>
    );
  };

  return (
    <Row gutter={[16, 16]}>
      {loading && (
        <Col span={24} style={{ textAlign: "center", height: "50vh" }}>
          <Spin />
        </Col>
      )}
      <Table
        style={{ width: "100%" }}
        dataSource={listings}
        columns={columns}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: listings.length,
          onChange: handlePageChange,
        }}
        rowKey="id"
        expandable={{ expandedRowRender }}
      />
    </Row>
  );
};

export default ListingsTable;
