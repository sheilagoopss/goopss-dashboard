/* eslint-disable react-hooks/exhaustive-deps */
import {
  Button,
  Segmented,
  Input,
  Image,
  Card,
  message,
  Row,
  Col,
  Form,
  Select,
  Skeleton,
} from "antd";
import {
  CloseCircleFilled,
  DisconnectOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import type { SegmentedProps } from "antd";
import { useEffect, useState } from "react";
import DragDropUpload from "components/common/DragDropUpload";
import { useGenerateTags } from "hooks/useTagify";
import useEtsy, {
  ITaxonomy,
  useCreateListing,
  useShopShippingProfile,
  useTaxonomy,
} from "hooks/useEtsy";
import { useSearchParams } from "react-router-dom";
import { useCustomerUpdate } from "hooks/useCustomer";
import { useAuth } from "contexts/AuthContext";
import { IEtsyShippingProfile } from "types/Etsy";

const DescriptionHero = () => {
  const [form] = Form.useForm();
  const { customerData } = useAuth();
  const { generateDescription, isGeneratingTags } = useGenerateTags();
  const { getEtsyConnectionUrl, isConnecting } = useEtsy();
  const { fetchTaxonomies, isFetchingTaxonomies } = useTaxonomy();
  const { createListing, isCreatingListing } = useCreateListing();
  const { fetchShopShippingProfile, isFetchingShopShippingProfile } =
    useShopShippingProfile();
  const { updateCustomer } = useCustomerUpdate();
  const [mode, setMode] = useState<"image" | "text">("text");
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [taxonomies, setTaxonomies] = useState<ITaxonomy[]>([]);
  const [shopShippingProfiles, setShopShippingProfiles] = useState<
    IEtsyShippingProfile[]
  >([]);
  const [generatedData, setGeneratedData] = useState<{
    title: string;
    description: string;
    tags: string[];
    attributes: string[];
  } | null>(null);
  const [searchParams] = useSearchParams();
  const codeValue = searchParams.get("code");

  const handleGenerate = async () => {
    const response = await generateDescription(image as string, description);
    setGeneratedData(response?.data);
    form.setFieldsValue({
      title: response?.data?.title,
      description: response?.data?.description,
    });
  };

  const handleConnectEtsy = async () => {
    const response = await getEtsyConnectionUrl();
    if (response?.data && response?.data !== "") {
      window.open(response.data, "_blank");
    }
  };

  const items: SegmentedProps["options"] = [
    {
      value: "text",
      label: "Text Description",
    },
    {
      value: "image",
      label: "Image Upload",
    },
  ];

  const handleSaveToken = async (code: string) => {
    const response = await updateCustomer(customerData?.id as string, {
      etsyToken: code,
    });
    if (response) {
      message.success("Etsy Store connected successfully");
      window.location.href = window.location.pathname;
    }
  };

  const handleDisconnectEtsy = async () => {
    const response = await updateCustomer(customerData?.id as string, {
      etsyToken: "",
    });
    if (response) {
      message.success("Etsy Store disconnected successfully");
      window.location.href = window.location.pathname;
    }
  };

  const handlePushToStore = async () => {
    const values = await form.validateFields();
    const response = await createListing({
      customerId: customerData?.id as string,
      ...values,
    });
    if (response) {
      message.success("Listing created successfully");
      form.resetFields();
      setGeneratedData(null);
    }
  };

  useEffect(() => {
    if (codeValue && codeValue.length > 32) {
      handleSaveToken(codeValue);
    }
  }, [codeValue]);

  const getTaxonomies = () => {
    fetchTaxonomies().then((taxonomies) => {
      setTaxonomies(taxonomies);
    });
  };
  const getShopShippingProfiles = () => {
    fetchShopShippingProfile({ customerId: customerData?.id as string }).then(
      (shopShippingProfiles) => {
        if (Array.isArray(shopShippingProfiles) && shopShippingProfiles?.length > 0) {
          setShopShippingProfiles(shopShippingProfiles);
        }
      },
    );
  };

  useEffect(() => {
    getTaxonomies();
    getShopShippingProfiles();
  }, []);

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
        {!customerData?.etsyToken ? (
          <Button
            type="primary"
            icon={<LinkOutlined />}
            loading={isConnecting}
            onClick={handleConnectEtsy}
          >
            Connect to Etsy Store
          </Button>
        ) : (
          <Button
            icon={<DisconnectOutlined />}
            type="primary"
            onClick={handleDisconnectEtsy}
            danger
          >
            Disconnect from Etsy Store
          </Button>
        )}
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
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                title: generatedData.title,
                description: generatedData.description,
              }}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="title" label="Title">
                    <Input size="middle" style={{ marginTop: "8px" }} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="description" label="Description">
                    <Input.TextArea
                      rows={5}
                      size="middle"
                      style={{ marginTop: "8px" }}
                    />
                  </Form.Item>
                </Col>

                {/* <div style={{ marginBottom: "24px" }}>
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
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
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
                </div> */}

                <Col span={12}>
                  <Form.Item name="price" label="Price">
                    <Input
                      size="middle"
                      type="number"
                      min={0}
                      style={{ marginTop: "24px" }}
                      placeholder="Enter a price"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="quantity" label="Quantity">
                    <Input
                      size="middle"
                      type="number"
                      min={0}
                      style={{ marginTop: "24px" }}
                      placeholder="Enter a quantity"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="who_made" label="Who Made">
                    <Select>
                      <Select.Option value="i_did">I did</Select.Option>
                      <Select.Option value="someone_else">
                        Someone else
                      </Select.Option>
                      <Select.Option value="collective">
                        Collective
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="when_made" label="When Made">
                    <Select>
                      <Select.Option value="made_to_order">
                        Made to Order
                      </Select.Option>
                      <Select.Option value="2020_2024">2020-2024</Select.Option>
                      <Select.Option value="2010_2019">2010-2019</Select.Option>
                      <Select.Option value="2005_2009">2005-2009</Select.Option>
                      <Select.Option value="before_2005">
                        Before 2005
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="taxonomy_id" label="Taxonomy">
                    {isFetchingTaxonomies ? (
                      <Skeleton.Input
                        style={{ width: "100%" }}
                        active
                        size="default"
                      />
                    ) : (
                      <Select
                        onFocus={() => {
                          if (taxonomies?.length === 0) {
                            getTaxonomies();
                          }
                        }}
                      >
                        {taxonomies?.map((taxonomy) => (
                          <Select.Option key={taxonomy.id} value={taxonomy.id}>
                            {taxonomy.name}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="shipping_profile_id"
                    label="Shop Shipping Profile"
                  >
                    {isFetchingShopShippingProfile ? (
                      <Skeleton.Input
                        style={{ width: "100%" }}
                        active
                        size="default"
                      />
                    ) : (
                      <Select
                        onFocus={() => {
                          if (Array.isArray(shopShippingProfiles) && shopShippingProfiles?.length === 0) {
                            getShopShippingProfiles();
                          }
                        }}
                      >
                        {Array.isArray(shopShippingProfiles) &&
                          shopShippingProfiles?.map((shopShippingProfile) => (
                            <Select.Option
                              key={shopShippingProfile.shipping_profile_id}
                            value={shopShippingProfile.shipping_profile_id}
                          >
                            {shopShippingProfile.title}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>
                </Col>
              </Row>

              <Button
                type="primary"
                htmlType="submit"
                block
                style={{
                  marginTop: "24px",
                  height: "48px",
                }}
                onClick={handlePushToStore}
                loading={isCreatingListing}
              >
                Push to Store
              </Button>
            </Form>
          </div>
        </>
      )}
    </div>
  );
};

export default DescriptionHero;
