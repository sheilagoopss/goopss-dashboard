/* eslint-disable react-hooks/exhaustive-deps */
import { Button, Col, Input, message, Row, Select, Typography } from "antd";
import StatusFilter, { StatusFilterType } from "../components/StatusFilter";
import ListingsTable from "../components/ListingsTable";
import { Listing } from "types/Listing";
import { ListingImage } from "types/Listing";
import { useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { useCustomerListingImagesFetch } from "hooks/useCustomer";
import { useCustomerFetchListings } from "hooks/useListing";
import { useAuth } from "contexts/AuthContext";
import { useListingImageStatusUpdate } from "hooks/useListingImage";

const DesignHubCustomer = () => {
  const { user } = useAuth();
  const { fetchCustomerListings, isLoading: isFetchingListings } =
    useCustomerFetchListings();
  const { fetchCustomerListingImages, isLoading: isFetchingImages } =
    useCustomerListingImagesFetch();

  const [statusFilter, setStatusFilter] =
    useState<StatusFilterType>("revision");
  const [selectedImages, setSelectedImages] = useState<ListingImage[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingImages, setListingImages] = useState<ListingImage[]>([]);
  const {
    approveImage,
    reviseImage,
    batchApproveImages,
    isLoading: isChangingStatus,
  } = useListingImageStatusUpdate();

  const refetch = () => {
    if (user) {
      fetchCustomerListings(user.id).then((listings) => {
        setListings(listings);
      });
      fetchCustomerListingImages(user.id).then((images) => {
        setListingImages(images);
      });
    }
  };

  useEffect(() => {
    refetch();
  }, [user]);

  const handleApprove = async (imageId: string) => {
    try {
      const success = await approveImage(imageId);

      if (success) {
        message.success("Image approved successfully");
        refetch();
      } else {
        message.error("Failed to approve image");
      }
    } catch (error) {
      console.error("Error approving image:", error);
      message.error("Failed to approve image");
    }
  };

  const handleRevise = async (imageId: string, revisionNote: string) => {
    try {
      const success = await reviseImage(imageId, revisionNote);

      if (success) {
        message.success("Revision request submitted successfully");
        refetch();
      } else {
        message.error("Failed to submit revision request");
      }
    } catch (error) {
      console.error("Error submitting revision request:", error);
      message.error("Failed to submit revision request");
    }
  };

  const handleSelect = (imageId: string, isSelected: boolean) => {
    const updatedDesigns = new Set(selectedImages.map((img) => img.id));
    isSelected ? updatedDesigns.add(imageId) : updatedDesigns.delete(imageId);
    const updatedImages = Array.from(updatedDesigns).map(
      (id) => selectedImages.find((img) => img.id === id) as ListingImage,
    );
    setSelectedImages(updatedImages);
  };

  const handleBatchApprove = async () => {
    try {
      const success = await batchApproveImages(
        selectedImages.map((img) => img.id),
      );
      if (success) {
        message.success("Batch approval successful");
        refetch();
      } else {
        message.error("Failed to approve selected images");
      }
    } catch (error) {
      console.error("Error in batch approval:", error);
      message.error("Failed to approve selected images");
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col
        span={24}
        style={{
          display: "flex",
          marginBottom: "1ch",
        }}
      >
        <Typography.Title level={4}>
          Design Hub - Customer View
        </Typography.Title>
      </Col>
      <Col span={24}>
        <StatusFilter
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </Col>

      <Col
        span={24}
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", gap: "1ch" }}>
          <Input
            placeholder="Search listings..."
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: "30ch" }}
          />
          <Select
            placeholder="Sort by"
            options={[
              { label: "Newest", value: "newest" },
              { label: "Oldest", value: "oldest" },
            ]}
          />
        </div>
        <Button
          type="primary"
          disabled={selectedImages.length === 0}
          onClick={handleBatchApprove}
          loading={isChangingStatus}
        >
          Approve Selected ({selectedImages.length})
        </Button>
      </Col>
      <Col span={24}>
        <ListingsTable
          listings={listings}
          listingImages={listingImages.filter((image) =>
            statusFilter ? image.status === statusFilter : true,
          )}
          loading={isFetchingListings || isFetchingImages}
          refresh={refetch}
          selectedImages={selectedImages}
          setSelectedImages={setSelectedImages}
          handleSelect={handleSelect}
          handleApprove={handleApprove}
          handleRevise={handleRevise}
        />
      </Col>
    </Row>
  );
};

export default DesignHubCustomer;
