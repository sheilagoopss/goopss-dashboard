import { Form, Input, Spin, Typography } from "antd";
import { Content } from "antd/es/layout/layout";
import { useOptimizeEtsyListing } from "hooks/useOptimzeEtsy";
import { useEffect, useMemo, useState } from "react";
import { IEtsyFetchedListing } from "types/Etsy";

interface IAnalyzeListingProps {
  listing: IEtsyFetchedListing;
}

const AnalyzeListing: React.FC<IAnalyzeListingProps> = ({ listing }) => {
  const [form] = Form.useForm();
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

  const optimizationFeedback = useMemo(() => {
    return async () => {
      return await generateFeedback({
        tags: listing.tags.join(","),
        description: listing.description,
        title: listing.title,
      });
    };
  }, [generateFeedback, listing.description, listing.tags, listing.title]);

  useEffect(() => {
    optimizationFeedback().then((feedback) => {
      if (feedback?.data) {
        setFeedbacks(feedback.data);
        form.setFieldsValue({
          title: feedback.data.titleFeedback,
          description: feedback.data.descriptionFeedback,
          tags: feedback.data.tagsFeedback,
        });
      }
    });
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
        </Form>
      )}
    </Content>
  );
};

export default AnalyzeListing;
