import { ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Form, Input, message, Spin } from "antd";
import { Content } from "antd/es/layout/layout";
import { useUpdateListing } from "hooks/useEtsy";
import { useOptimizeEtsyListing } from "hooks/useOptimzeEtsy";
import { useEffect, useMemo, useState } from "react";
import { IEtsyFetchedListing, IEtsyListingUpdate } from "types/Etsy";

interface IAnalyzeListingProps {
  listing: IEtsyFetchedListing;
  customerId: string;
}

const AnalyzeListing: React.FC<IAnalyzeListingProps> = ({
  listing,
  customerId,
}) => {
  const [form] = Form.useForm();
  const { updateListing, isUpdatingListing } = useUpdateListing();
  const { generateFeedback, isGenerating } = useOptimizeEtsyListing();
  const [feedbacks, setFeedbacks] = useState<{
    titleFeedback: string;
    descriptionFeedback: string;
    tagsFeedback: string;
  }>({
    titleFeedback: "",
    descriptionFeedback: "",
    tagsFeedback: "",
  });

  const handleUpdate = () => {
    const values = form.getFieldsValue();
    if (!listing?.listing_id) return;

    const data: IEtsyListingUpdate = {
      customerId,
      listingId: String(listing?.listing_id),
      title: values.title,
      description: values.description,
      tags: values.tags?.split(",")?.map((tag: string) => tag.trim()),
    };
    updateListing(data).then((res) => {
      message.success("Listing updated successfully");
    });
  };

  const optimizationFeedback = useMemo(() => {
    return async () => {
      return await generateFeedback({
        tags: listing.tags.join(","),
        description: listing.description,
        title: listing.title,
      }).then((feedback) => {
        if (feedback?.data) {
          setFeedbacks(feedback.data);
          form.setFieldsValue({
            title: feedback.data.titleFeedback,
            description: feedback.data.descriptionFeedback,
            tags: feedback.data.tagsFeedback,
          });
        }
      });
    };
  }, [
    form,
    generateFeedback,
    listing.description,
    listing.tags,
    listing.title,
  ]);

  useEffect(() => {
    optimizationFeedback();
  }, [optimizationFeedback, form]);

  return (
    <Content>
      {isGenerating ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Spin size="large" tip="Analyzing listing..." />
        </div>
      ) : (
        <Form
          key={listing.listing_id}
          layout="vertical"
          form={form}
          initialValues={{
            title: feedbacks.titleFeedback,
            description: feedbacks.descriptionFeedback,
            tags: feedbacks.tagsFeedback,
          }}
          onFinish={handleUpdate}
        >
          <Form.Item
            label="Title"
            name="title"
            extra={
              <p>
                <span style={{ fontWeight: "bold" }}>Original Title: </span>
                {listing.title}
              </p>
            }
          >
            <Input.TextArea rows={1} />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            extra={
              <p>
                <span style={{ fontWeight: "bold" }}>
                  Original Description:{" "}
                </span>
                {listing.description}
              </p>
            }
          >
            <Input.TextArea rows={10} />
          </Form.Item>
          <Form.Item
            label="Tags"
            name="tags"
            extra={
              <p>
                <span style={{ fontWeight: "bold" }}>Original Tags: </span>
                {listing.tags.join(", ")}
              </p>
            }
          >
            <Input.TextArea rows={1} />
          </Form.Item>
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "2ch" }}
          >
            <Button onClick={optimizationFeedback} icon={<ReloadOutlined />}>
              Analyze again
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isUpdatingListing}
              icon={<SaveOutlined />}
            >
              Update Listing
            </Button>
          </div>
        </Form>
      )}
    </Content>
  );
};

export default AnalyzeListing;
