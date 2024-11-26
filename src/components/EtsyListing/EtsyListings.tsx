/* eslint-disable react-hooks/exhaustive-deps */
import {
  Collapse,
  Divider,
  List,
  message,
  Modal,
  Spin,
  Tag,
  Typography,
} from "antd";
import { Button } from "antd/es/radio";
import { useEtsyListings, useUpdateListing } from "hooks/useEtsy";
import { useEffect, useState } from "react";
import {
  IEtsyFetchedListing,
  IEtsyListingEdit,
  IEtsyListingUpdate,
} from "types/Etsy";
import ListingEdit from "./components/ListingEdit";
import AnalyzeListing from "./components/AnalyzeListing";

interface EtsyListingsProps {
  customerId: string;
}

const EtsyListings: React.FC<EtsyListingsProps> = ({ customerId }) => {
  const [etsyListings, setEtsyListings] = useState<IEtsyFetchedListing[]>([]);
  const { fetchEtsyListings, isFetchingEtsyListings } = useEtsyListings();
  const { updateListing, isUpdatingListing } = useUpdateListing();
  const [selectedListing, setSelectedListing] =
    useState<IEtsyListingEdit | null>(null);
  const [optimizingListing, setOptimizingListing] = useState<IEtsyFetchedListing | null>(null);

  const refetch = () => {
    fetchEtsyListings({ customerId }).then((listing) => {
      setEtsyListings(listing);
    });
  };

  const handleUpdate = (listing: {
    description: string;
    quantity: number;
    tags: string;
    materials: string;
  }) => {
    if (!selectedListing?.listing_id) return;
    const updateData: IEtsyListingUpdate = {
      ...listing,
      customerId,
      listingId: String(selectedListing?.listing_id),
      tags: listing.tags.split(","),
      materials: listing.materials.split(","),
    };
    updateListing(updateData).then((res) => {
      setSelectedListing(null);
      message.success("Listing updated successfully");
      refetch();
    });
  };

  useEffect(() => {
    if (customerId) {
      refetch();
    }
  }, [customerId]);

  return (
    <>
      {isFetchingEtsyListings ? (
        <div
          style={{
            width: "100%",
            minHeight: "30vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin />
        </div>
      ) : (
        <>
          <List
            dataSource={etsyListings}
            renderItem={(item) => (
              <Collapse style={{ marginTop: 10 }}>
                <Collapse.Panel
                  header={
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{item.title}</span>
                      <Typography.Text type="secondary" className="block">
                        ID: {item.listing_id}
                      </Typography.Text>
                    </div>
                  }
                  key={item.listing_id}
                  extra={[
                    <Button
                      type="primary"
                      onClick={() => {
                        setSelectedListing({
                          ...item,
                          tags: item.tags ? item.tags.join(",") : "",
                          materials: item.materials
                            ? item.materials.join(",")
                            : "",
                        });
                      }}
                    >
                      Edit
                    </Button>,
                    <Button onClick={() => setOptimizingListing(item)}>
                      Analyze
                    </Button>,
                  ]}
                >
                  <Typography.Paragraph>
                    <span style={{ fontWeight: "bold" }}>ID: </span>
                    {item.listing_id}
                  </Typography.Paragraph>
                  <Typography.Paragraph>
                    <span style={{ fontWeight: "bold" }}>Description: </span>
                    {item.description}
                  </Typography.Paragraph>
                  <Typography.Paragraph>
                    <span style={{ fontWeight: "bold" }}>Tags: </span>
                    {item.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Typography.Paragraph>
                  <Typography.Paragraph>
                    <span style={{ fontWeight: "bold" }}>Materials: </span>
                  </Typography.Paragraph>
                  <ul>
                    {item.materials.map((material) => (
                      <li key={material}>{material}</li>
                    ))}
                  </ul>
                  <Divider />
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography.Paragraph>
                      <span style={{ fontWeight: "bold" }}>Quantity: </span>
                      {item.quantity}
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                      <span style={{ fontWeight: "bold" }}>Price: </span>
                      {item.price.amount / item.price.divisor}{" "}
                      {item.price.currency_code}
                    </Typography.Paragraph>
                  </div>
                </Collapse.Panel>
              </Collapse>
            )}
            pagination={{
              pageSize: 10,
            }}
          />
          <Modal
            title="Edit Listing"
            open={!!selectedListing}
            footer={null}
            onCancel={() => setSelectedListing(null)}
          >
            {selectedListing && (
              <ListingEdit
                listing={selectedListing}
                handleUpdate={handleUpdate}
                isUpdating={isUpdatingListing}
              />
            )}
          </Modal>
          <Modal
            title="Analyzing Listing"
            open={!!optimizingListing}
            footer={null}
            onCancel={() => setOptimizingListing(null)}
            width={"80%"}
          >
            {optimizingListing && (
              <AnalyzeListing listing={optimizingListing} />
            )}
          </Modal>
        </>
      )}
    </>
  );
};

export default EtsyListings;
