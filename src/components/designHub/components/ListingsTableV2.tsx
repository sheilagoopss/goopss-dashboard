import { CloseCircleFilled } from "@ant-design/icons";
import { Button, Card, Col, Image, Pagination, Row, Spin, Table } from "antd";
import DragDropUpload from "components/common/DragDropUpload";
import { useAuth } from "contexts/AuthContext";
import { useState } from "react";
import { Listing, ListingImage } from "types/Listing";
import ImageCard from "./ImageCard";
import { useDownloadImage } from "hooks/useListingImage";
import { ColumnsType } from "antd/es/table";

interface ListingsTableProps {
  listings: (Listing & { imageCount: number })[];
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
  const { downloadMultipleImages, isDownloading } = useDownloadImage();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [newListingImages, setNewListingImages] = useState<string[]>([]);

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

  const paginatedListings = listings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const columns: ColumnsType<Listing & { imageCount: number }> = [
    {
      title: "Listing ID",
      dataIndex: "listingID",
      sorter: (a, b) => a.listingID.localeCompare(b.listingID),
    },
    {
      title: "Listing Title",
      dataIndex: "listingTitle",
      sorter: (a, b) => a.listingTitle.localeCompare(b.listingTitle),
    },
    {
      title: "Image Count",
      dataIndex: "imageCount",
      sorter: (a, b) => a.imageCount - b.imageCount,
    },
  ];

  const expandedRowRender = (listing: Listing & { imageCount: number }) => {
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
        <Col span={24} style={{ display: "flex", justifyContent: "flex-end" }}>
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
        dataSource={paginatedListings}
        columns={columns}
        loading={loading}
        pagination={false}
        rowKey="id"
        expandable={{ expandedRowRender }}
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
