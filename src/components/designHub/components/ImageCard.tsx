import {
  CheckCircleFilled,
  CloseCircleFilled,
  DownloadOutlined,
  RightCircleFilled,
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
} from "antd";
import { Listing, ListingImage } from "types/Listing";
import { STATUS_COLORS } from "../constants/statusColors";

interface ImageCardProps {
  index: number;
  listing: Listing;
  listingImage: ListingImage;
  selectedImages: ListingImage[];
  setSelectedImages: (selectedImages: ListingImage[]) => void;
}

const ImageCard = ({
  index,
  listingImage,
  listing,
  selectedImages,
  setSelectedImages,
}: ImageCardProps) => {
  return (
    <Card
      actions={[
        <Button
          icon={<CheckCircleFilled style={{ color: "green" }} />}
          shape="circle"
          size="large"
          key="approve"
          style={{ border: "none" }}
        />,
        <Button
          icon={<CloseCircleFilled style={{ color: "red" }} />}
          shape="circle"
          size="large"
          key="supersede"
          style={{ border: "none" }}
        />,
        <Button
          icon={<DownloadOutlined style={{ color: "blue" }} />}
          shape="circle"
          size="large"
          key="download"
          style={{ border: "none" }}
          onClick={async() => {
            try {
              // const response = await fetch(listingImage.url, { mode: 'no-cors' });
              const response = await fetch(listingImage.url);
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
        
              const link = document.createElement("a");
              link.href = blobUrl;
              link.download = `${listing.listingTitle}-${new Date().toISOString()}.jpg`; // Set the downloaded file name
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(blobUrl); // Clean up blob URL
            } catch (error) {
              console.error("Error downloading the image:", error);
            }
          }}
        />,
      ]}
    >
      <Row>
        <Col span={20}>
          <Typography.Text>
            {listing.listingTitle} {index}
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
              setSelectedImages(
                e.target.checked
                  ? [...selectedImages, listingImage]
                  : selectedImages.filter(
                      (image) => image.id !== listingImage.id,
                    ),
              )
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
            style={{ width: '100%', height: 'auto' }} 
            alt={listing.listingTitle} 
          />
          <Tag
            color={STATUS_COLORS[listingImage.status]}
            style={{ width: "fit-content" }}
          >
            {listingImage.status?.toUpperCase()}
          </Tag>
        </div>
      </Row>
    </Card>
  );
};

export default ImageCard;
