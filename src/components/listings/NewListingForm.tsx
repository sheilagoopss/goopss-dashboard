"use client";

import { useState } from "react";
import { Form, Input, Button, message, Row, Col, Card } from "antd";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizeListing } from "@/hooks/useOptimizeEtsy";
import { useTaskCreate } from "@/hooks/useTask";

interface NewListingFormProps {
  customerId: string;
  storeName: string;
  onSuccess: () => void;
}

const NewListingForm: React.FC<NewListingFormProps> = ({
  customerId,
  storeName,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const { optimizeText, isOptimizing } = useOptimizeListing();
  const [optimizedContent, setOptimizedContent] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [tags, setTags] = useState<string>("");
  const { createTask } = useTaskCreate();
  const MAX_TAGS = 13;
  const [isSaving, setIsSaving] = useState(false);

  const handleOptimize = async () => {
    try {
      const values = await form.validateFields([
        "productTitle",
        "productDescription",
      ]);

      const optimized = await optimizeText({
        title: values.productTitle,
        description: values.productDescription,
        version: 1,
      });

      if (optimized) {
        setOptimizedContent(optimized);
        form.setFieldsValue({
          optimizedTitle: optimized.title,
          optimizedDescription: optimized.description,
        });

        message.success("Content optimized successfully");
      } else {
        throw new Error("Failed to optimize content");
      }
    } catch (error) {
      console.error("Error optimizing listing:", error);
      message.error("Failed to optimize listing");
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      const values = await form.validateFields();
      const tagsList = tags
        .split(/,\s*/)
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      if (tagsList.length > MAX_TAGS) {
        message.error(`Maximum ${MAX_TAGS} tags allowed`);
        return;
      }

      if (tagsList.length < MAX_TAGS) {
        message.error(`Please add ${MAX_TAGS} tags`);
        return;
      }

      if (!optimizedContent) {
        message.error("Please optimize the listing first");
        return;
      }

      const listingData = {
        listingID: values.listingId,
        listingTitle: optimizedContent.title,
        listingDescription: optimizedContent.description,
        listingTags: tagsList.join(","),
        section: values.section,
        imageCount: parseInt(values.imageCount),
        primaryImage: values.primaryImage,
        dailyViews: 0,
        totalSales: 0,
        bestseller: false,
        optimizationStatus: true,
        etsyLink: `https://${storeName}.etsy.com/listing/${values.listingId}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user?.email || "unknown",
        customer_id: customerId,
        store_name: storeName,
        duplicationStatus: false,
        hasImage: false,
        isNewListing: true,
      };

      await setDoc(doc(db, "listings", values.listingId), listingData);
      await createTask({
        customerId: customerId,
        category: "NewListing",
        taskName: `Created new listing`,
        teamMemberName: user?.name || user?.email || "unknown",
        listingId: values.listingId,
        isDone: true,
      });
      message.success("Listing created successfully");
      form.resetFields();
      setOptimizedContent(null);
      setTags("");
      onSuccess();
    } catch (error) {
      console.error("Error saving listing:", error);
      message.error("Failed to save listing");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Row gutter={24}>
        <Col span={12}>
          <Card
            title="Product Content"
            extra={
              <Button
                type="primary"
                onClick={handleOptimize}
                loading={isOptimizing}
              >
                Optimize Content
              </Button>
            }
          >
            <Form form={form} layout="vertical">
              <Form.Item
                name="productTitle"
                label="Draft Title"
                rules={[
                  { required: true, message: "Please enter the product title" },
                ]}
              >
                <Input.TextArea rows={3} placeholder="Enter draft title" />
              </Form.Item>

              <Form.Item
                name="productDescription"
                label="Product Details"
                rules={[
                  {
                    required: true,
                    message: "Please enter the product description",
                  },
                ]}
              >
                <Input.TextArea rows={6} placeholder="Enter product details" />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <div className="space-y-6">
            <Card title="Required Information">
              <Form form={form} layout="vertical">
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="listingId"
                      label="Listing ID"
                      rules={[
                        {
                          required: true,
                          message: "Please enter the listing ID",
                        },
                      ]}
                    >
                      <Input placeholder="Enter listing ID" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="section"
                      label="Section"
                      rules={[
                        { required: true, message: "Please enter the section" },
                      ]}
                    >
                      <Input placeholder="Enter section name" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="imageCount"
                      label="Image Count"
                      rules={[
                        {
                          required: true,
                          message: "Please enter the image count",
                        },
                        {
                          type: "number",
                          message: "Please enter a valid number",
                        },
                      ]}
                    >
                      <Input
                        type="number"
                        min={1}
                        placeholder="Enter number of images"
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          form.setFieldsValue({ imageCount: value });
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <Form.Item
                      name="primaryImage"
                      label="Primary Image URL"
                      rules={[
                        {
                          required: true,
                          message: "Please enter the primary image URL",
                        },
                      ]}
                    >
                      <Input placeholder="Enter the primary image URL" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>

            <Card title="Optimized Content">
              <Form form={form} layout="vertical">
                <Form.Item name="optimizedTitle" label="Optimized Title">
                  <Input.TextArea
                    rows={3}
                    placeholder="Optimized title will appear here"
                    value={optimizedContent?.title || ""}
                    onChange={(e) =>
                      setOptimizedContent((prev) => ({
                        ...prev!,
                        title: e.target.value,
                      }))
                    }
                  />
                </Form.Item>

                <Form.Item
                  name="optimizedDescription"
                  label="Optimized Description"
                >
                  <Input.TextArea
                    rows={6}
                    placeholder="Optimized description will appear here"
                    value={optimizedContent?.description || ""}
                    onChange={(e) =>
                      setOptimizedContent((prev) => ({
                        ...prev!,
                        description: e.target.value,
                      }))
                    }
                  />
                </Form.Item>

                <Form.Item
                  label={`Tags (comma-separated, exactly ${MAX_TAGS} tags required)`}
                >
                  <Input.TextArea
                    rows={4}
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Enter tags, separated by commas"
                  />
                  <div style={{ marginTop: 8 }}>
                    {
                      tags.split(/,\s*/).filter((tag) => tag.trim() !== "")
                        .length
                    }
                    /{MAX_TAGS} tags
                  </div>
                </Form.Item>

                <Button 
                  type="primary" 
                  onClick={handleSave} 
                  loading={isSaving} 
                  disabled={isSaving} 
                  block
                >
                  {isSaving ? 'Saving...' : 'Save Listing'}
                </Button>
              </Form>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default NewListingForm;
