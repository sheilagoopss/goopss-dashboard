"use client";

import {
  CloseCircleFilled,
  CloseCircleOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Image,
  Input,
  message,
  Row,
  Tag,
  Typography,
} from "antd";
import DragDropUpload from "@/components/common/DragDropUpload";
import { useGenerateTags } from "@/hooks/useTagify";
import { useState } from "react";

const Tagify = () => {
  const { generateTagsBase64, isGeneratingTags } = useGenerateTags();
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState<string>("");
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);

  const handleUpload = (data: string[]) => {
    setImages([...images, ...data]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleGenerateTags = async () => {
    const resp = await generateTagsBase64(images, description);
    if (resp?.data?.tags) {
      message.success("Tags generated successfully");
      setGeneratedTags(resp?.data?.tags || []);
    } else {
      message.error(resp?.message || "Failed to generate tags");
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "2ch",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Tagify</h1>
      </div>

      <Card
        style={{
          paddingBottom: "2ch",
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert
              type="info"
              message="Tip: Upload images AND enter a description for better tag generation!"
              banner
            />
          </Col>
          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1ch",
                  }}
                >
                  <Typography.Text strong>Upload Images</Typography.Text>
                  <DragDropUpload
                    multiple
                    handleUpload={(data) => handleUpload(data as string[])}
                    placeholder="Click to upload or drag and drop PNG, JPG or GIF"
                  />
                  <Row gutter={[16, 16]}>
                    {images.map((image, index) => (
                      <Col span={8} key={index}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                          }}
                        >
                          <Button
                            type="text"
                            size="large"
                            onClick={() => removeImage(index)}
                            icon={<CloseCircleFilled />}
                            danger
                            style={{
                              marginBottom: "-2ch",
                              zIndex: 1000,
                              marginRight: "-2ch",
                            }}
                          />
                          <Image src={image} alt="uploaded" />
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Col>
              <Col span={12}>
                <Typography.Text strong>Enter Description</Typography.Text>
                <Input.TextArea
                  placeholder="Enter a description of your product"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <Button
                  type="primary"
                  style={{ marginTop: "2ch" }}
                  loading={isGeneratingTags}
                  onClick={handleGenerateTags}
                >
                  Generate Tags
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
      {generatedTags?.length > 0 && (
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingBottom: "1ch",
            }}
          >
            <Typography.Text strong>Generated Tags</Typography.Text>
            <div style={{ display: "flex", gap: "1ch" }}>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(generatedTags.join(", "));
                  message.success("Tags copied to clipboard!");
                }}
              >
                Copy Tags
              </Button>
              <Button
                icon={<CloseCircleOutlined />}
                onClick={() => setGeneratedTags([])}
              >
                Clear
              </Button>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1ch" }}>
            {generatedTags.map((tag) => (
              <Tag style={{ cursor: "pointer", maxWidth: "100%" }} key={tag}>
                {tag}
              </Tag>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Tagify;
