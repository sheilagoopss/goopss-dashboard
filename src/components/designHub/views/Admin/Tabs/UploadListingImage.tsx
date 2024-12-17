/* eslint-disable react-hooks/exhaustive-deps */
import { Checkbox, Col, Input, message, Row, Select, Switch, DatePicker } from "antd";
import { useCustomerListingImagesFetch } from "@/hooks/useCustomer";
import { useEffect, useState } from "react";
import { ICustomer } from "@/types/Customer";
import { SearchOutlined } from "@ant-design/icons";
import { Listing, ListingImage } from "@/types/Listing";
// import ListingsTable from "../components/ListingsTable";
import { useCustomerFetchListings } from "@/hooks/useListing";
import {
  useListingImageStatusUpdate,
  useUploadListingImages,
} from "@/hooks/useListingImage";
import { StatusFilterType } from "@/components/designHub/StatusFilter";
import ListingsTableV2 from "@/components/designHub/ListingsTableV2";
import type { RangePickerProps } from "antd/es/date-picker";
const { RangePicker } = DatePicker;

interface UploadListingImageProps {
  selectedCustomer: ICustomer;
}

const UploadListingImage: React.FC<UploadListingImageProps> = ({
  selectedCustomer,
}) => {
  const { fetchCustomerListings, isLoading: isFetchingListings } =
    useCustomerFetchListings();
  const { fetchCustomerListingImages, isLoading: isFetchingImages } =
    useCustomerListingImagesFetch();
  const { uploadListingImages, isUploading } = useUploadListingImages();
  const {
    markAsUploadedToEtsy,
    markAsNotUploadedToEtsy,
    supersedeImage,
    isLoading: isUpdatingStatus,
  } = useListingImageStatusUpdate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("pending");
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingImages, setListingImages] = useState<ListingImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<ListingImage[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [includeBestSellers, setIncludeBestSellers] = useState(false);
  const [includeUploadedToEtsy, setIncludeUploadedToEtsy] = useState(false);
  const [showAllListings, setShowAllListings] = useState(false);
  const [dataToDisplay, setDataToDisplay] = useState<
    (Listing & { uploadedImages: number; totalImages: number })[]
  >([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  const refetch = () => {
    if (selectedCustomer) {
      fetchCustomerListings(selectedCustomer.id).then((listings) => {
        setListings(listings);
        setFilteredListings(listings);
      });
      fetchCustomerListingImages(selectedCustomer.id).then((images) => {
        setListingImages(images);
      });
    }
  };

  const handleUploadListingImages = async (
    listing: Listing,
    data: string[],
  ) => {
    if (!selectedCustomer?.id) return false;
    const resp = await uploadListingImages(selectedCustomer?.id, listing, data);
    if (resp) {
      refetch();
      return true;
    }
    return false;
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

  const handleMarkAsUploadedToEtsy = async (imageId: string) => {
    if (!selectedCustomer?.id) return false;
    const resp = await markAsUploadedToEtsy(imageId);
    if (resp) {
      refetch();
      return true;
    }
    return false;
  };

  const handleMarkAsNotUploadedToEtsy = async (imageId: string) => {
    if (!selectedCustomer?.id) return false;
    const resp = await markAsNotUploadedToEtsy(imageId);
    if (resp) {
      refetch();
      return true;
    }
    return false;
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

  const filterImagesByDate = (images: ListingImage[]) => {
    if (!dateRange[0] || !dateRange[1]) return images;
    
    return images.filter((image) => {
      const imageDate = image.date ? new Date(image.date) : null;
      if (!imageDate) return false;
      
      return imageDate >= dateRange[0]! && imageDate <= dateRange[1]!;
    });
  };

  const filterListings = (
    filteredListings: Listing[],
  ): (Listing & { uploadedImages: number; totalImages: number })[] => {
    let filteredImages = includeUploadedToEtsy
      ? listingImages
      : listingImages.filter((image) => !image.uploadedToEtsy);

    filteredImages = filterImagesByDate(filteredImages);

    const listingsWithImages = filteredListings.filter((listing) => {
      const listingsWithImages = filteredImages.some(
        (image) => image.listing_id === listing.id,
      );
      if (statusFilter !== "all") {
        return filteredImages
          .filter((image) => image.status === statusFilter)
          .filter((image) =>
            includeUploadedToEtsy ? true : !image.uploadedToEtsy,
          )
          .some((image) => image.listing_id === listing.id);
      } else if (searchTerm === "" && !showAllListings) {
        return listingsWithImages;
      }
      return listing;
    });
    const listingsWithImageCount = listingsWithImages.map((listing) => ({
      ...listing,
      uploadedImages: listingImages
        .filter((image) => image.listing_id === listing.id)
        .filter((image) => image.status !== "superseded").length,
      totalImages:
        (listingImages
          .filter((image) => image.listing_id === listing.id)
          .filter((image) => image.status !== "superseded").length || 0) +
        (listing.imageCount || 0),
    })) as (Listing & { uploadedImages: number; totalImages: number })[];

    return listingsWithImageCount.filter((listing) => {
      if (includeBestSellers) {
        return true;
      }
      return !listing.bestseller;
    });
  };

  useEffect(() => {
    refetch();
  }, [selectedCustomer]);

  useEffect(() => {
    setDataToDisplay(filterListings(filteredListings));
  }, [
    filteredListings,
    showAllListings,
    statusFilter,
    searchTerm,
    includeBestSellers,
    includeUploadedToEtsy,
    dateRange,
    listingImages
  ]);

  return (
    <Row gutter={[16, 16]}>
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
          <RangePicker
            onChange={(dates: RangePickerProps['value']) => {
              if (dates) {
                setDateRange([
                  dates?.[0]?.toDate() || null,
                  dates?.[1]?.toDate() || null
                ]);
              } else {
                setDateRange([null, null]);
              }
            }}
            style={{ width: "280px" }}
          />
          <Select
            placeholder="Sort by"
            options={[
              { label: "Newest", value: "newest" },
              { label: "Oldest", value: "oldest" },
            ]}
            onChange={(value) => handleSort(value as "newest" | "oldest")}
          />
          <Select
            placeholder="Status"
            value={statusFilter}
            options={[
              { label: "To Approve", value: "pending" },
              { label: "For Revision", value: "revision" },
              { label: "Approved", value: "approved" },
              { label: "All Images", value: "all" },
            ]}
            onChange={(value) => setStatusFilter(value as StatusFilterType)}
          />
          <Checkbox
            checked={includeBestSellers}
            onChange={(e) => setIncludeBestSellers(e.target.checked)}
            style={{ alignSelf: "center" }}
          >
            Include Best Sellers
          </Checkbox>
          <Checkbox
            checked={includeUploadedToEtsy}
            onChange={(e) => setIncludeUploadedToEtsy(e.target.checked)}
            style={{ alignSelf: "center" }}
          >
            Include Uploaded to Etsy
          </Checkbox>
        </div>
        <Switch
          checked={showAllListings}
          onChange={(checked) => setShowAllListings(checked)}
          style={{ alignSelf: "center" }}
          checkedChildren="All Listings"
          unCheckedChildren="With Created Images Only"
        />
      </Col>
      <Col span={24}>
        <ListingsTableV2
          listings={dataToDisplay}
          listingImages={listingImages
            .filter(
              (image) =>
                statusFilter === "all" || image.status === statusFilter,
            )
            .filter((image) =>
              includeUploadedToEtsy ? true : !image.uploadedToEtsy,
            )}
          loading={isFetchingListings || isFetchingImages}
          refresh={refetch}
          selectedImages={selectedImages}
          setSelectedImages={setSelectedImages}
          handleUploadListingImages={handleUploadListingImages}
          isUploading={isUploading}
          handleMarkAsUploadedToEtsy={handleMarkAsUploadedToEtsy}
          handleMarkAsNotUploadedToEtsy={handleMarkAsNotUploadedToEtsy}
          isUpdatingStatus={isUpdatingStatus}
          handleSupersede={handleSupersede}
        />
      </Col>
    </Row>
  );
};

export default UploadListingImage;
