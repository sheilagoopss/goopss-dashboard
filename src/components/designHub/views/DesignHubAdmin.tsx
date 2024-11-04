/* eslint-disable react-hooks/exhaustive-deps */
import {
  Alert,
  Col,
  Input,
  message,
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
import StatusFilter from "../components/StatusFilter";
import { SearchOutlined } from "@ant-design/icons";
import { Listing, ListingImage } from "types/Listing";
import ListingsTable from "../components/ListingsTable";
import { useCustomerFetchListings } from "hooks/useListing";
import { useUploadRevision } from "hooks/useListingImage";

const DesignHubAdmin = () => {
  const { fetchAllCustomers, isLoading } = useCustomerFetchAll();
  const { fetchCustomerListings, isLoading: isFetchingListings } =
    useCustomerFetchListings();
  const { fetchCustomerListingImages, isLoading: isFetchingImages } =
    useCustomerListingImagesFetch();
  const { uploadRevision, isLoading: isUploadingRevision } =
    useUploadRevision();

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

  useEffect(() => {
    fetchAllCustomers().then((customers) => setCustomers(customers));
  }, []);

  const refetch = () => {
    if (selectedCustomer) {
      fetchCustomerListings(selectedCustomer.id).then((listings) => {
        setListings(listings);
      });
      fetchCustomerListingImages(selectedCustomer.id).then((images) => {
        setListingImages(images);
      });
    }
  };

  const handleUploadRevision = async (
    listingImage: ListingImage,
    base64Image: string,
  ) => {
    const success = await uploadRevision(
      selectedCustomer?.id || "",
      listingImage,
      base64Image,
    );
    if (success) {
      refetch();
      message.success("Revision uploaded successfully");
    } else {
      message.error("Failed to upload revision");
    }
  };

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
              />
              <Select
                placeholder="Sort by"
                options={[
                  { label: "Newest", value: "newest" },
                  { label: "Oldest", value: "oldest" },
                ]}
              />
            </div>
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
            />
          </Col>
        </>
      ) : (
        <Alert
          message="Please select a customer to view designs"
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
    </Row>
  );
};

export default DesignHubAdmin;
