import { Button, Segmented, Tag, List, Input, Image, Card } from "antd";
import {
  CloseCircleFilled,
  CopyOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import type { SegmentedProps } from "antd";
import { useState } from "react";
import DragDropUpload from "components/common/DragDropUpload";
import { useGenerateTags } from "hooks/useTagify";
import useEtsy from "hooks/useEtsy";

const DescriptionHero = () => {
  const { generateDescription, isGeneratingTags } = useGenerateTags();
  const { getEtsyConnectionUrl, isConnecting } = useEtsy();
  const [mode, setMode] = useState<"image" | "text">("image");
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [generatedData, setGeneratedData] = useState<{
    title: string;
    description: string;
    tags: string[];
    attributes: string[];
  } | null>(null);

  const handleGenerate = async () => {
    const response = await generateDescription(image as string, description);
    setGeneratedData(response?.data);
  };

  const handleConnectEtsy = async () => {
    const response = await getEtsyConnectionUrl();
    if (response?.data && response?.data !== "") {
      window.open(response.data, "_blank");
    }
  };

  const items: SegmentedProps["options"] = [
    {
      value: "image",
      label: "Image Upload",
    },
    {
      value: "text",
      label: "Text Description",
    },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              backgroundColor: "#000000",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", color: "#000000" }}>
            Description Hero
          </h1>
        </div>
        <Button
          type="primary"
          icon={<LinkOutlined />}
          loading={isConnecting}
          onClick={handleConnectEtsy}
        >
          Connect to Etsy Store
        </Button>
      </div>

      <div
        style={{
          backgroundColor: "#000000",
          padding: "24px",
          borderRadius: "16px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ color: "white", margin: 0, marginBottom: "8px" }}>
          Generate Etsy Listing Content
        </h2>
        <p style={{ color: "white", margin: 0 }}>
          Upload an image or enter a description to generate a full Etsy listing
        </p>
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <Segmented
          options={items}
          block
          style={{ padding: "3px" }}
          value={mode}
          onChange={(value) => setMode(value as "image" | "text")}
        />

        {mode === "image" && (
          <div style={{ marginTop: "24px" }}>
            {!image ? (
              <DragDropUpload
                handleUpload={(s) => setImage(s?.at(0) as string)}
              />
            ) : (
              <Card>
                <Button
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 1,
                  }}
                  icon={<CloseCircleFilled />}
                  type="primary"
                  onClick={() => setImage(null)}
                  danger
                />
                <Image src={image} alt="uploaded" />
              </Card>
            )}
          </div>
        )}

        {mode === "text" && (
          <Input.TextArea
            style={{ marginTop: "24px" }}
            rows={10}
            placeholder="Enter a description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}

        <Button
          type="primary"
          block
          style={{
            marginTop: "24px",
            height: "48px",
          }}
          loading={isGeneratingTags}
          onClick={handleGenerate}
        >
          Generate Listing Content
        </Button>
      </div>

      {generatedData && (
        <>
          <div
            style={{
              backgroundColor: "#000000",
              padding: "24px",
              borderRadius: "16px",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ color: "white", margin: 0 }}>
              Generated Etsy Listing Content
            </h2>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <h3 style={{ margin: 0 }}>Title</h3>
                <Button icon={<CopyOutlined />} type="text">
                  Copy
                </Button>
              </div>
              <p style={{ margin: 0 }}>{generatedData.title}</p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <h3 style={{ margin: 0 }}>Description</h3>
                <Button icon={<CopyOutlined />} type="text">
                  Copy
                </Button>
              </div>
              <div style={{ color: "#666" }}>
                <p>{generatedData.description}</p>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <h3 style={{ margin: 0 }}>Tags</h3>
                <Button icon={<CopyOutlined />} type="text">
                  Copy
                </Button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {generatedData.tags.map((tag) => (
                  <Tag
                    key={tag}
                    style={{
                      backgroundColor: "#F3E8FF",
                      color: "#000000",
                      border: "none",
                      borderRadius: "16px",
                      padding: "4px 12px",
                    }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <h3 style={{ margin: 0 }}>Attributes</h3>
                <Button icon={<CopyOutlined />} type="text">
                  Copy
                </Button>
              </div>
              <List
                dataSource={generatedData.attributes}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    {item}
                  </List.Item>
                )}
              />
            </div>

            <Button
              type="primary"
              block
              style={{
                marginTop: "24px",
                height: "48px",
              }}
            >
              Push to Store
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default DescriptionHero;
