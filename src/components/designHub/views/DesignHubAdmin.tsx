/* eslint-disable react-hooks/exhaustive-deps */
import { Button, Col, Input, Row, Select, Spin, Typography } from "antd";
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

const DesignHubAdmin = () => {
  const { fetchAllCustomers, isLoading } = useCustomerFetchAll();
  const { fetchCustomerListings, isLoading: isFetchingListings } =
    useCustomerFetchListings();
  const { fetchCustomerListingImages, isLoading: isFetchingImages } =
    useCustomerListingImagesFetch();

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

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerListings(selectedCustomer.id).then((listings) => {
        setListings(listings);
      });
      fetchCustomerListingImages(selectedCustomer.id).then((images) => {
        setListingImages(images);
      });
    }
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
          // onClick={handleApproveSelected}
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
          refresh={() => {}}
          selectedImages={selectedImages}
          setSelectedImages={setSelectedImages}
        />
      </Col>
    </Row>
  );
};

export default DesignHubAdmin;
