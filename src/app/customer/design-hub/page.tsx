"use client";

import { Button, Col, Input, message, Row, Select, Typography } from "antd";
import StatusFilter, {
  StatusFilterType,
} from "@/components/designHub/StatusFilter";
import ListingsTable from "@/components/designHub/ListingsTable";
import { Listing } from "@/types/Listing";
import { ListingImage } from "@/types/Listing";
import { useCallback, useEffect, useState } from "react";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useCustomerListingImagesFetch } from "@/hooks/useCustomer";
import { useCustomerFetchListings } from "@/hooks/useListing";
import { useAuth } from "@/contexts/AuthContext";
import { useListingImageStatusUpdate } from "@/hooks/useListingImage";
import { Content } from "antd/es/layout/layout";

const DesignHubCustomerPage = () => {
  const { customerData } = useAuth();
  const { fetchCustomerListings, isLoading: isFetchingListings } =
    useCustomerFetchListings();
  const { fetchCustomerListingImages, isLoading: isFetchingImages } =
    useCustomerListingImagesFetch();
  const {
    approveImage,
    batchApproveImages,
    supersedeImage,
    isLoading: isChangingStatus,
  } = useListingImageStatusUpdate();

  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("pending");
  const [selectedImages, setSelectedImages] = useState<ListingImage[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [listingImages, setListingImages] = useState<ListingImage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const refetch = useCallback(() => {
    if (customerData) {
      fetchCustomerListings(customerData.id).then((listings) => {
        setListings(listings);
        setFilteredListings(listings);
      });
      fetchCustomerListingImages(customerData.id).then((images) => {
        setListingImages(images);
      });
    }
  }, [customerData, fetchCustomerListingImages, fetchCustomerListings]);

  useEffect(() => {
    refetch();
  }, [customerData, refetch]);

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

    if (isSelected) {
      updatedDesigns.add(listingImage.id);
    } else {
      updatedDesigns.delete(listingImage.id);
    }

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

  const handleSort = (sortType: "newest" | "oldest") => {
    const sortedListings = [...filteredListings].sort((a, b) => {
      const dateA = listingImages.find((img) => img.listing_id === a.id)?.date;
      const dateB = listingImages.find((img) => img.listing_id === b.id)?.date;
      return sortType === "newest"
        ? (dateB ? new Date(dateB).getTime() : 0) -
            (dateA ? new Date(dateA).getTime() : 0)
        : (dateA ? new Date(dateA).getTime() : 0) -
            (dateB ? new Date(dateB).getTime() : 0);
    });
    setFilteredListings(sortedListings);
  };

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filteredListings = listings.filter(
      (listing) =>
        listing.listingTitle.toLowerCase().includes(lowercasedSearchTerm) ||
        listing.listingID.toLowerCase().includes(lowercasedSearchTerm),
    );
    setFilteredListings(filteredListings);
  };

  return (
    <Content className="p-4 bg-white">
      <Row gutter={[16, 16]}>
        <Col
        span={24}
        style={{
          display: "flex",
          marginBottom: "1ch",
        }}
      >
        <Typography.Title level={4}>Design Hub</Typography.Title>
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
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Select
            placeholder="Sort by"
            options={[
              { label: "Newest", value: "newest" },
              { label: "Oldest", value: "oldest" },
            ]}
            onChange={(value) => handleSort(value as "newest" | "oldest")}
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
          listings={filteredListings.filter((listing) => {
            const listingsWithImages = listingImages.some(
              (image) => image.listing_id === listing.id,
            );
            if (statusFilter !== "all") {
              return listingImages
                .filter((image) => image.status === statusFilter)
                .some((image) => image.listing_id === listing.id);
            } else if (searchTerm === "") {
              return listingsWithImages;
            }
            return listing;
          })}
          listingImages={listingImages.filter(
            (image) => statusFilter === "all" || image.status === statusFilter,
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
    </Content>
  );
};

export default DesignHubCustomerPage;
