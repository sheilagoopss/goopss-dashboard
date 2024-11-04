/* eslint-disable react-hooks/exhaustive-deps */
import { Alert, Col, Input, Row, Select, Spin, Typography } from "antd";
import CustomersDropdown from "components/CustomersDropdown";
import {
  useCustomerFetchAll,
  useCustomerListingImagesFetch,
} from "hooks/useCustomer";
import { useEffect, useState } from "react";
import { ICustomer } from "types/Customer";
import StatusFilter from "../components/StatusFilter";
import { SearchOutlined } from "@ant-design/icons";
import { Listing, ListingImage } from "types/Listing";
import ListingsTable from "../components/ListingsTable";
import { useCustomerFetchListings } from "hooks/useListing";
import { useUploadListingImages } from "hooks/useListingImage";

const DesignHubAdmin = () => {
  const { fetchAllCustomers, isLoading } = useCustomerFetchAll();
  const { fetchCustomerListings, isLoading: isFetchingListings } =
    useCustomerFetchListings();
  const { fetchCustomerListingImages, isLoading: isFetchingImages } =
    useCustomerListingImagesFetch();
  const { uploadListingImages, isUploading } = useUploadListingImages();

  const [statusFilter, setStatusFilter] = useState<
    "revision" | "pending" | "approved" | "all"
  >("revision");
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingImages, setListingImages] = useState<ListingImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<ListingImage[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);

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
        <Typography.Title level={4}>Design Hub - Admin View</Typography.Title>
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
        />
      )}
    </Row>
  );
};

export default DesignHubAdmin;
