/* eslint-disable react-hooks/exhaustive-deps */
import {
  Alert,
  Checkbox,
  Col,
  Input,
  Row,
  Select,
  Spin,
  Typography,
} from "antd";
import CustomersDropdown from "components/CustomersDropdown";
import {
  useCustomerFetchAll,
  useCustomerListingImagesFetch,
} from "hooks/useCustomer";
import { useEffect, useState } from "react";
import { ICustomer } from "types/Customer";
import StatusFilter, { StatusFilterType } from "../components/StatusFilter";
import { SearchOutlined } from "@ant-design/icons";
import { Listing, ListingImage } from "types/Listing";
// import ListingsTable from "../components/ListingsTable";
import ListingsTableV2 from "../components/ListingsTableV2";
import { useCustomerFetchListings } from "hooks/useListing";
import { useUploadListingImages } from "hooks/useListingImage";

const DesignHubAdmin = () => {
  const { fetchAllCustomers, isLoading } = useCustomerFetchAll();
  const { fetchCustomerListings, isLoading: isFetchingListings } =
    useCustomerFetchListings();
  const { fetchCustomerListingImages, isLoading: isFetchingImages } =
    useCustomerListingImagesFetch();
  const { uploadListingImages, isUploading } = useUploadListingImages();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("pending");
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingImages, setListingImages] = useState<ListingImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<ListingImage[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [includeBestSellers, setIncludeBestSellers] = useState(false);

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

  useEffect(() => {
    fetchAllCustomers().then((customers) => setCustomers(customers));
  }, []);

  useEffect(() => {
    refetch();
  }, [selectedCustomer]);

  return isLoading ? (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "60vh",
      }}
    >
      <Spin />
    </div>
  ) : (
    <Row gutter={[16, 16]}>
      <Col
        span={24}
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1ch",
        }}
      >
        <Typography.Title level={4}>Design Hub</Typography.Title>
        <CustomersDropdown
          customers={customers}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          isAdmin={true}
        />
      </Col>

      {selectedCustomer ? (
        <>
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
              <Checkbox
                checked={includeBestSellers}
                onChange={(e) => setIncludeBestSellers(e.target.checked)}
                style={{ alignSelf: "center" }}
              >
                Include Best Sellers
              </Checkbox>
            </div>
          </Col>
          <Col span={24}>
            <ListingsTableV2
              listings={filteredListings
                .filter((listing) => {
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
                })
                .map((listing) => ({
                  ...listing,
                  imageCount: listingImages.filter(
                    (image) => image.listing_id === listing.id,
                  ).length,
                }))
                .filter((listing) => {
                  if (includeBestSellers) {
                    return true;
                  }
                  return !listing.bestseller;
                })}
              listingImages={listingImages.filter(
                (image) =>
                  statusFilter === "all" || image.status === statusFilter,
              )}
              loading={isFetchingListings || isFetchingImages}
              refresh={refetch}
              selectedImages={selectedImages}
              setSelectedImages={setSelectedImages}
              handleUploadListingImages={handleUploadListingImages}
              isUploading={isUploading}
            />
          </Col>
        </>
      ) : (
        <Alert
          message="Please select a customer to view designs"
          type="error"
          showIcon
          style={{ padding: "4ch", width: "100%" }}
          banner
        />
      )}
    </Row>
  );
};

export default DesignHubAdmin;
