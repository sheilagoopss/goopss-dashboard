/* eslint-disable react-hooks/exhaustive-deps */
import { Button, Col, Input, message, Row, Select, Typography } from "antd";
import StatusFilter, { StatusFilterType } from "../components/StatusFilter";
import ListingsTable from "../components/ListingsTable";
import { Listing } from "types/Listing";
import { ListingImage } from "types/Listing";
import { useEffect, useState } from "react";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
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
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [listingImages, setListingImages] = useState<ListingImage[]>([]);
  const {
    approveImage,
    batchApproveImages,
    supersedeImage,
    isLoading: isChangingStatus,
  } = useListingImageStatusUpdate();

  const refetch = () => {
    if (user) {
      fetchCustomerListings(user.id).then((listings) => {
        setListings(listings);
        setFilteredListings(listings);
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

  const handleSupersede = async (imageId: string) => {
    try {
      const success = await supersedeImage(imageId);

      if (success) {
        message.success("Image superseded successfully");
        refetch();
      } else {
        message.error("Failed to supersede image");
      }
    } catch (error) {
      console.error("Error approving image:", error);
      message.error("Failed to supersede image");
    }
  };

  const handleSelect = (listingImage: ListingImage, isSelected: boolean) => {
    const selectedImagesIds = selectedImages.map((img) => img?.id);
    const updatedDesigns = new Set(selectedImagesIds);

    isSelected
      ? updatedDesigns.add(listingImage.id)
      : updatedDesigns.delete(listingImage.id);

    const updatedImages = Array.from(updatedDesigns).map(
      (id) => listingImages.find((img) => img?.id === id) as ListingImage,
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
            onChange={(e) => {
              const filteredListings = listings.filter((listing) =>
                listing.listingTitle
                  .toLowerCase()
                  .includes(e.target.value.toLowerCase()),
              );
              setFilteredListings(filteredListings);
            }}
          />
          <Select
            placeholder="Sort by"
            options={[
              { label: "Newest", value: "newest" },
              { label: "Oldest", value: "oldest" },
            ]}
            onChange={(value) => {
              const sortedListings = [...filteredListings].sort(
                (a: Listing, b: Listing) => {
                  const getTimeOrDefault = (dateString?: string) =>
                    dateString ? new Date(dateString).getTime() : 0;

                  if (value === "newest") {
                    return (
                      getTimeOrDefault(b.createdAt) -
                      getTimeOrDefault(a.createdAt)
                    );
                  } else if (value === "oldest") {
                    return (
                      getTimeOrDefault(a.createdAt) -
                      getTimeOrDefault(b.createdAt)
                    );
                  }
                  return 0;
                },
              );
              setFilteredListings(sortedListings);
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "1ch" }}>
          <Button
            type="primary"
            disabled={selectedImages.length === 0}
            onClick={handleBatchApprove}
            loading={isChangingStatus}
          >
            Approve Selected ({selectedImages.length})
          </Button>
          <Button
            icon={<ReloadOutlined />}
            loading={isFetchingListings || isFetchingImages}
            onClick={refetch}
          />
        </div>
      </Col>
      <Col span={24}>
        <ListingsTable
          listings={filteredListings}
          listingImages={listingImages.filter((image) =>
            statusFilter ? image.status === statusFilter : true,
          )}
          loading={isFetchingListings || isFetchingImages}
          refresh={refetch}
          selectedImages={selectedImages}
          setSelectedImages={setSelectedImages}
          handleSelect={handleSelect}
          handleApprove={handleApprove}
          handleSupersede={handleSupersede}
        />
      </Col>
    </Row>
  );
};

export default DesignHubCustomer;
