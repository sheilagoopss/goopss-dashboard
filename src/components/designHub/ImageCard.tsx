import {
  CheckCircleFilled,
  CloseCircleFilled,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  Card,
  Checkbox,
  Col,
  Divider,
  Row,
  Typography,
  Image,
  Tag,
  Button,
  Modal,
  Popconfirm,
} from "antd";
import { Listing, ListingImage } from "@/types/Listing";
import { useState } from "react";
import RevisionCard from "./RevisionCard";
import { useAuth } from "@/contexts/AuthContext";
import { useDownloadImage } from "@/hooks/useListingImage";
import dayjs from "dayjs";
import { STATUS_COLORS } from "./constants/statusColors";

interface ImageCardProps {
  index: number;
  listing: Listing;
  listingImage: ListingImage;
  selectedImages: ListingImage[];
  setSelectedImages: (selectedImages: ListingImage[]) => void;
  handleSelect?: (id: ListingImage, isSelected: boolean) => void;
  handleApprove?: (id: string) => void;
  handleSupersede?: (id: string) => void;
  handleMarkAsUploadedToEtsy?: (id: string) => Promise<boolean>;
  handleMarkAsNotUploadedToEtsy?: (id: string) => Promise<boolean>;
  refetch: () => void;
}

const ImageCard = ({
  index,
  listingImage,
  listing,
  selectedImages,
  handleSelect,
  handleApprove,
  handleSupersede,
  handleMarkAsUploadedToEtsy,
  handleMarkAsNotUploadedToEtsy,
  refetch,
}: ImageCardProps) => {
  const { isAdmin } = useAuth();
  const { downloadImage, isDownloading } = useDownloadImage();
  const [previewImage, setPreviewImage] = useState<ListingImage | null>(null);

  const handleDownload = async () => {
    try {
      const imageData = await downloadImage(listingImage.id);

      if (!imageData?.data) {
        throw new Error("Network response was not ok");
      }

      const base64Data = imageData.data;
      const blob = await (
        await fetch(`data:image/jpeg;base64,${base64Data}`)
      ).blob();
      const url = URL.createObjectURL(blob);
      const anchorElement = document.createElement("a");
      anchorElement.href = url;
      anchorElement.download =
        listingImage.url.split("/").pop()?.split("?alt=")?.at(0) || "download";
      document.body.appendChild(anchorElement);
      anchorElement.click();
      anchorElement.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  return (
    <>
      <Card
        actions={[
          ...(handleApprove
            ? [
                <Button
                  icon={
                    <CheckCircleFilled
                      style={{
                        color: ["approved", "revision"].includes(
                          listingImage?.status,
                        )
                          ? "gray"
                          : "green",
                      }}
                    />
                  }
                  shape="circle"
                  size="large"
                  key="approve"
                  title="Approve"
                  style={{ border: "none" }}
                  disabled={["approved", "revision"].includes(
                    listingImage?.status,
                  )}
                  onClick={() => handleApprove(listingImage?.id)}
                />,
              ]
            : []),

          ...(isAdmin && handleSupersede
            ? [
                <Button
                  icon={<CloseCircleFilled />}
                  title="Supersede"
                  danger
                  shape="circle"
                  size="large"
                  key="supersede"
                  style={{ border: "none" }}
                  disabled={["superseded"].includes(listingImage?.status)}
                  onClick={() => handleSupersede(listingImage?.id)}
                />,
              ]
            : []),
          <Button
            icon={<DownloadOutlined style={{ color: "blue" }} />}
            shape="circle"
            size="large"
            key="download"
            title="Download"
            style={{ border: "none" }}
            onClick={handleDownload}
            loading={isDownloading}
          />,
        ]}
      >
        <Row>
          <Col span={20}>
            <Typography.Text>
              {index} {listing?.listingTitle}
            </Typography.Text>
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-end",
            }}
          >
            <Checkbox
              checked={selectedImages.includes(listingImage)}
              onChange={(e) =>
                handleSelect && handleSelect(listingImage, e.target.checked)
              }
            />
          </Col>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1ch",
            }}
          >
            <Image
              src={listingImage.url}
              style={{ width: "100%", minHeight: "200px" }}
              alt={listing.listingTitle}
            />
            <Typography.Text type="secondary">
              <Typography.Text strong>Uploaded at: </Typography.Text>
              {listingImage.date
                ? dayjs(listingImage.date).format("MMM DD, YYYY HH:mm")
                : ""}
            </Typography.Text>
            {listingImage.uploadedToEtsy && (
              <Typography.Text type="secondary">
                <Typography.Text strong>Uploaded to Etsy at: </Typography.Text>
                {listingImage.uploadedToEtsyAt
                  ? dayjs(listingImage.uploadedToEtsyAt).format(
                      "MMM DD, YYYY HH:mm",
                    )
                  : ""}
              </Typography.Text>
            )}
            <Tag
              color={STATUS_COLORS[listingImage.status]}
              style={{ width: "fit-content" }}
            >
              {listingImage.status?.toUpperCase()}
            </Tag>
            {(!isAdmin || listingImage.revisionNote) && (
              <Button onClick={() => setPreviewImage(listingImage)}>
                Revision Note
              </Button>
            )}
            {isAdmin && (
              <Popconfirm
                title={
                  listingImage.uploadedToEtsy
                    ? "Are you sure you want to mark this as not uploaded to Etsy?"
                    : "Are you sure you want to mark this as uploaded to Etsy?"
                }
                onConfirm={() => {
                  if (listingImage.uploadedToEtsy) {
                    if (handleMarkAsNotUploadedToEtsy)
                      handleMarkAsNotUploadedToEtsy(listingImage.id);
                  } else {
                    if (handleMarkAsUploadedToEtsy)
                      handleMarkAsUploadedToEtsy(listingImage.id);
                  }
                }}
                okText="Yes"
                cancelText="No"
              >
                <Checkbox checked={listingImage.uploadedToEtsy}>
                  Uploaded to Etsy
                </Checkbox>
              </Popconfirm>
            )}
          </div>
        </Row>
      </Card>
      {previewImage && (
        <Modal
          title="Detail"
          open={Boolean(previewImage?.url)}
          onCancel={closeImagePreview}
          width={"70%"}
          footer={false}
        >
          <RevisionCard
            selectedCustomerId={listingImage.customer_id}
            previewImage={previewImage}
            refetch={refetch}
          />
        </Modal>
      )}
    </>
  );
};

export default ImageCard;
