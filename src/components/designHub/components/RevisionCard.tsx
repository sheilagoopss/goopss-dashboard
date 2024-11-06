import {
  Card,
  Col,
  Image,
  Row,
  Divider,
  Tag,
  Button,
  Popconfirm,
  Input,
  message,
} from "antd";
import { useState } from "react";
import { ListingImage } from "types/Listing";
import { STATUS_COLORS } from "../constants/statusColors";
import { useAuth } from "contexts/AuthContext";
import DragDropUpload from "components/common/DragDropUpload";
import {
  useListingImageStatusUpdate,
  useUploadRevision,
} from "hooks/useListingImage";

const RevisionCard: React.FC<{
  selectedCustomerId: string;
  previewImage: ListingImage;
  refetch: () => void;
}> = ({ selectedCustomerId, previewImage, refetch }) => {
  const { isAdmin } = useAuth();
  const { uploadRevision, isLoading } = useUploadRevision();
  const { reviseImage, isLoading: isRevising } = useListingImageStatusUpdate();

  const { supersedeImage, isLoading: isSuperseding } =
    useListingImageStatusUpdate();
  const [uploadingRevision, setUploadingRevision] = useState(false);
  const [revisionImage, setRevisionImage] = useState<string | undefined>(
    undefined,
  );
  const [revisionNote, setRevisionNote] = useState(
    previewImage?.revisionNote || "",
  );

  const handleRevise = async (imageId: string, revisionNote: string) => {
    try {
      const success = await reviseImage(imageId, revisionNote);

      if (success) {
        message.success("Revision request submitted successfully");
        refetch();
      } else {
        message.error("Failed to submit revision request");
      }
    } catch (error) {
      console.error("Error submitting revision request:", error);
      message.error("Failed to submit revision request");
    }
  };

  return (
    <Card>
      <Row gutter={[16, 0]}>
        <Col span={12}>
          <div>
            {uploadingRevision && <p>Previous Image</p>}
            <Image
              src={previewImage?.url}
              alt="Preview"
              style={{ borderRadius: 8 }}
              height={"40vh"}
            />
            {uploadingRevision && (
              <>
                <Divider />
                <p>New Image</p>
                {revisionImage ? (
                  <Image
                    src={revisionImage}
                    alt="Revision"
                    style={{ borderRadius: 8 }}
                    height={"20vh"}
                  />
                ) : (
                  <></>
                )}
              </>
            )}
          </div>
        </Col>
        <Col span={12}>
          <div>
            <Tag
              color={
                previewImage?.status
                  ? STATUS_COLORS[previewImage?.status]
                  : "default"
              }
              style={{ marginBottom: 8 }}
            >
              {previewImage?.status?.toUpperCase()}
            </Tag>
            <Divider style={{ margin: "8px 0" }} />
            {(!isAdmin || previewImage?.revisionNote) && (
              <Input.TextArea
                placeholder="Write a note here..."
                rows={4}
                style={{ width: "100%" }}
                defaultValue={previewImage?.revisionNote}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                disabled={isAdmin}
              />
            )}
            {isAdmin && previewImage?.revisionNote && previewImage.id && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2ch",
                  marginTop: "2ch",
                }}
              >
                <Popconfirm
                  title="Delete the task"
                  description="Are you sure do you want to suspend the image?"
                  onConfirm={() => supersedeImage(previewImage.id || "")}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    danger
                    disabled={previewImage.status === "superseded"}
                    loading={isSuperseding}
                  >
                    {previewImage.status === "superseded"
                      ? "Superseded"
                      : "Supersede"}
                  </Button>
                </Popconfirm>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "2ch",
                  }}
                >
                  <Button
                    danger={uploadingRevision}
                    type={uploadingRevision ? "default" : "primary"}
                    onClick={() => {
                      if (uploadingRevision) {
                        setRevisionImage(undefined);
                      }
                      setUploadingRevision(!uploadingRevision);
                    }}
                  >
                    {uploadingRevision ? "Cancel Upload" : "Upload Revision"}
                  </Button>
                  {uploadingRevision && revisionImage && (
                    <Button
                      disabled={!Boolean(revisionImage)}
                      type={"primary"}
                      onClick={() =>
                        uploadRevision(
                          selectedCustomerId,
                          previewImage,
                          revisionImage,
                        )
                      }
                      loading={isLoading}
                    >
                      Save
                    </Button>
                  )}
                </div>
                {uploadingRevision && (
                  <DragDropUpload
                    handleUpload={(data) => {
                      setRevisionImage((data as string[])?.at(0));
                    }}
                  />
                )}
              </div>
            )}
            {!isAdmin && !previewImage?.revisionNote && (
              <div style={{ marginTop: "1ch" }}>
                <Button
                  type="primary"
                  onClick={() => handleRevise(previewImage.id, revisionNote)}
                  loading={isRevising}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default RevisionCard;
