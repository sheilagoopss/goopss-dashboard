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
} from "antd";
import { Listing, ListingImage } from "types/Listing";
import { STATUS_COLORS } from "../constants/statusColors";
import { useState } from "react";
import RevisionCard from "./RevisionCard";

interface ImageCardProps {
  index: number;
  listing: Listing;
  listingImage: ListingImage;
  selectedImages: ListingImage[];
  setSelectedImages: (selectedImages: ListingImage[]) => void;
  handleSelect?: (id: string, isSelected: boolean) => void;
  handleApprove?: (id: string) => void;
  handleRevise?: (id: string, revisionNote: string) => void;
}

const ImageCard = ({
  index,
  listingImage,
  listing,
  selectedImages,
  setSelectedImages,
  handleSelect,
  handleApprove,
  handleRevise,
}: ImageCardProps) => {
  const [previewImage, setPreviewImage] = useState<ListingImage | null>(null);
  const handleDownload = async () => {
    try {
      const response = await fetch(listingImage.url, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = listingImage.url.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // Handle error (e.g., show a notification to the user)
    }
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  return (
    <>
      <Card
        actions={
          handleApprove &&
          handleRevise && [
            <Button
              icon={<CheckCircleFilled style={{ color: "green" }} />}
              shape="circle"
              size="large"
              key="approve"
              style={{ border: "none" }}
              onClick={() => handleApprove(listingImage.id)}
            />,
            <Button
              icon={<CloseCircleFilled style={{ color: "red" }} />}
              shape="circle"
              size="large"
              key="supersede"
              style={{ border: "none" }}
              onClick={() => handleRevise(listingImage.id, "Revision Note")}
            />,
            <Button
              icon={<DownloadOutlined style={{ color: "blue" }} />}
              shape="circle"
              size="large"
              key="download"
              style={{ border: "none" }}
              onClick={handleDownload}
            />,
          ]
        }
      >
        <Row>
          <Col span={20}>
            <Typography.Text>
              {index} {listing.listingTitle}
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
                handleSelect && handleSelect(listingImage.id, e.target.checked)
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
            <Tag
              color={STATUS_COLORS[listingImage.status]}
              style={{ width: "fit-content" }}
            >
              {listingImage.status?.toUpperCase()}
            </Tag>
            {listingImage.revisionNote && (
              <Button onClick={() => setPreviewImage(listingImage)}>
                Detail
              </Button>
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
            revisionNote={previewImage?.revisionNote || ""}
          />
        </Modal>
      )}
    </>
  );
};

export default ImageCard;
