import { useEffect, useState } from "react";

import { usePinterestBoard } from "@/hooks/usePinterest";
import { EtsyListing, ISocialPost } from "@/types/Social";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  Form,
  Modal,
  Button,
  Space,
  Radio,
  Divider,
  Typography,
  Input,
  Select,
  Image,
  Skeleton,
  Popconfirm,
  message,
  DatePicker,
  Card,
} from "antd";
import dayjs from "dayjs";
import DragDropUpload from "../common/DragDropUpload";
import { CloseCircleFilled } from "@ant-design/icons";
import { useImageUpload } from "@/hooks/useFileUpload";

const PostCreationModal: React.FC<{
  isOpen: boolean;
  listing: EtsyListing | null;
  customerId: string;
  onSave: (posts: Omit<ISocialPost, "id">[]) => Promise<boolean>;
  onCancel: () => void;
  isSaving: boolean;
}> = ({ isOpen, listing, customerId, onSave, onCancel, isSaving }) => {
  const [form] = Form.useForm();
  const { fetchBoards, isFetchingBoards } = usePinterestBoard();
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [platform, setPlatform] = useState<
    "facebook" | "instagram" | "both" | "pinterest" | "facebookGroup"
  >("facebook");
  const [facebookContent, setFacebookContent] = useState("");
  const [instagramContent, setInstagramContent] = useState("");
  const [facebookGroupContent, setFacebookGroupContent] = useState("");
  const [pinterestBoards, setPinterestBoards] = useState<any[]>([]);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [postImages, setPostImages] = useState<string[]>([]);
  const { uploadImages, isUploading } = useImageUpload();

  useEffect(() => {
    setScheduledDate(null);
    setPlatform("facebook");
    setFacebookContent("");
    setInstagramContent("");
    setFacebookGroupContent("");
    setPostImages([]);
  }, [isOpen, listing, customerId]);

  const handleGenerateContent = async () => {
    setIsGeneratingContent(true);
    try {
      // First fetch customer data
      const customerDoc = await getDoc(doc(db, "customers", customerId));
      if (!customerDoc.exists()) {
        throw new Error("Customer not found");
      }

      // Fetch only specific listing fields
      const listingDoc = await getDoc(doc(db, "listings", listing?.id || ""));
      const listingData = listingDoc.exists() ? listingDoc.data() : null;

      // Structure listing data with only the fields we need
      const listingInfo = {
        title: listingData?.optimizedTitle || listingData?.listingTitle || "", //listing title
        description:
          listingData?.optimizedDescription ||
          listingData?.listingDescription ||
          "", //listing description
        primaryImage: listingData?.primaryImage || "", //listing image lin
        etsyLink: listingData?.etsyLink || "", //listing link
        store_name: listingData?.store_name || "", //store name
      };

      const customerData = customerDoc.data();

      // Get all the required customer fields
      const customerInfo = {
        industry: customerData.industry || "", // industry
        about: customerData.about || "", // store about
        target_audience: customerData.target_audience || "", // target audience
        content_tone: customerData.content_tone || "", // content tone
        etsy_store_url: customerData.etsy_store_url || "", // etsy store url
        past_facebook_posts: customerData.past_facebook_posts || "", // past facebook posts
        past_instagram_posts: customerData.past_instagram_posts || "", // past instagram posts
        content_guideline: customerData.content_guideline || "", // content guideline or restriction like what not to post or use first person etc
        instagram_hashtags_goopss: customerData.instagram_hashtags_goopss || "", // instagram hashtags that goopss will use
        competitor_social: customerData.competitor_social || "", // competitor social
      };

      const payload = [
        {
          image_path: listingInfo.primaryImage || "",
          store_name: listingInfo.store_name || "",
          about: customerInfo.about || "",
          description: listingInfo.description || "",
          url: listingInfo.etsyLink || "",
          content_guideline: customerInfo.content_guideline || "",
          content_tone: customerInfo.content_tone || "", // new field to incorporate to prompt
          target_audience: customerInfo.target_audience || "", // new field to incorporate to prompt
          goopss_hashtags: customerInfo.instagram_hashtags_goopss || "", // new field to incorporate to prompt
          past_facebook_posts: customerInfo.past_facebook_posts || "", // new field to incorporate to prompt
          past_instagram_posts: customerInfo.past_instagram_posts || "", // new field to incorporate to prompt
        },
      ];

      const API_URL = "https://goopss.onrender.com/gen_posts_dashboard";

      // Make the POST request
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();

      if (data.result && Array.isArray(data.result) && data.result.length > 0) {
        const firstResult = data.result[0];

        // Always set both contents regardless of platform selection
        setFacebookContent(firstResult.facebook_post || "");
        setInstagramContent(firstResult.instagram_post || "");
        setFacebookGroupContent(firstResult.facebook_post || "");
      } else {
        throw new Error("Failed to generate content. Please try again.");
      }
    } catch (error) {
      console.error("Error generating content:", error);
      message.error("Failed to generate content. Please try again.");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSave = async () => {
    if (!scheduledDate) {
      Modal.error({ content: "Please select a date before saving the post." });
      return;
    }

    // Check if selected date is at least 12 minutes in the future
    const minScheduleTime = dayjs().add(12, "minutes");
    if (dayjs(scheduledDate).isBefore(minScheduleTime)) {
      Modal.error({
        content: "Schedule time must be at least 12 minutes from now.",
      });
      return;
    }

    const basePost = {
      scheduledDate, // This is already a Date object now
      dateCreated: new Date(),
      listingId: listing?.listingID || "",
      customerId,
    };

    const postsToSave: Omit<ISocialPost, "id">[] = [];

    if (platform === "both") {
      const images = await uploadImages(postImages);
      if (facebookContent.trim()) {
        postsToSave.push({
          ...basePost,
          platform: "facebook",
          content: facebookContent,
          images: images,
        });
      }
      if (instagramContent.trim()) {
        postsToSave.push({
          ...basePost,
          platform: "instagram",
          content: instagramContent,
          images: images,
        });
      }
    } else if (platform === "facebook" && facebookContent.trim()) {
      const images = await uploadImages(postImages);
      postsToSave.push({
        ...basePost,
        platform: "facebook",
        content: facebookContent,
        images: images,
      });
    } else if (platform === "facebookGroup" && facebookGroupContent.trim()) {
      postsToSave.push({
        ...basePost,
        platform: "facebookGroup",
        content: facebookGroupContent,
      });
    } else if (platform === "instagram" && instagramContent.trim()) {
      const images = await uploadImages(postImages);
      postsToSave.push({
        ...basePost,
        platform: "instagram",
        content: instagramContent,
        images: images,
      });
    } else if (platform === "pinterest") {
      const values = form.getFieldsValue();
      const data = {
        boardId: values.pinterestBoard,
        content: {
          title: values.pinterestTitle,
          description: values.pinterestDescription,
          link: listing?.etsyLink,
          media_source: {
            source_type: "image_url",
            url: listing?.primaryImage,
          },
        },
        customerId,
      };
      postsToSave.push({
        ...basePost,
        content: data.content.title || "",
        platform: "pinterest",
        pinterest: data,
      });
    }

    if (postsToSave.length === 0) {
      Modal.error({
        content:
          "Please enter content for at least one platform before saving.",
      });
      return;
    }

    onSave(postsToSave).then((success) => {
      if (success) {
        form.resetFields();
      }
    });
  };

  const handleCancel = () => {
    setScheduledDate(null);
    setPlatform("facebook");
    setFacebookContent("");
    setInstagramContent("");
    setFacebookGroupContent("");
    onCancel();
  };

  useEffect(() => {
    fetchBoards({ customerId }).then((boards) => {
      setPinterestBoards(boards);
    });
  }, [customerId, fetchBoards]);

  const disabledDate = (current: dayjs.Dayjs) => {
    // Can't select days before today
    return current && current < dayjs().startOf("day");
  };

  const disabledTime = (date: dayjs.Dayjs | null) => {
    const now = dayjs();
    const selectedDate = date || now;

    // If it's today, we need to check the time
    if (selectedDate.isSame(now, "day")) {
      const currentHour = now.hour();
      const currentMinute = now.minute();

      return {
        // Block all past hours AND the current hour if we're too close to next hour
        disabledHours: () => {
          const hours = Array.from({ length: currentHour }, (_, i) => i);
          // If we're within 12 minutes of the next hour, also disable current hour
          if (currentMinute > 48) {
            hours.push(currentHour);
          }
          return hours;
        },
        disabledMinutes: (selectedHour: number) => {
          // If selected hour is current hour, disable minutes up to current minute + 12
          if (selectedHour === currentHour) {
            return Array.from({ length: currentMinute + 12 }, (_, i) => i);
          }
          // If selected hour is next hour but we're within 12 minutes of it
          else if (selectedHour === currentHour + 1 && currentMinute > 48) {
            return Array.from({ length: currentMinute - 48 }, (_, i) => i);
          }
          return [];
        },
      };
    }

    return {};
  };

  const handleFacebookUpload = (files: string[]) => {
    setPostImages([...postImages, ...files]);
  };

  return (
    <Modal
      title={`Create Post for ${listing?.listingTitle}`}
      open={isOpen}
      onCancel={handleCancel}
      width={800}
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        platform !== "pinterest" ? (
          <Popconfirm
            title="Are you sure you want to schedule this post?"
            onConfirm={handleSave}
            okText="Yes"
            cancelText="No"
          >
            <Button key="save" type="primary" loading={isSaving || isUploading}>
              Save
            </Button>
          </Popconfirm>
        ) : (
          <Button
            key="save"
            type="primary"
            onClick={handleSave}
            loading={isSaving || isUploading}
          >
            Save
          </Button>
        ),
      ]}
    >
      <Space
        direction="vertical"
        style={{ width: "100%", marginTop: "32px" }}
        size="large"
      >
        <Radio.Group
          onChange={(e) => {
            setPlatform(e.target.value);
            setPostImages([]);
          }}
          value={platform}
        >
          <Radio value="facebook">Facebook Page</Radio>
          <Radio value="facebookGroup">Facebook Group</Radio>
          <Radio value="instagram">Instagram</Radio>
          <Radio value="both">Facebook Page & Instagram</Radio>
          <Divider />
          <Radio value="pinterest">Pinterest</Radio>
        </Radio.Group>

        {platform !== "pinterest" && (
          <Button
            onClick={handleGenerateContent}
            type="default"
            loading={isGeneratingContent}
          >
            Generate Content
          </Button>
        )}

        {(platform === "facebook" ||
          platform === "instagram" ||
          platform === "both") && (
          <>
            <DragDropUpload
              handleUpload={(files) => handleFacebookUpload(files as string[])}
              multiple={true}
            />
            <div className="flex flex-row gap-2 pt-4">
              {postImages.map((image, index) => (
                <Card
                  key={index}
                  style={{ width: "150px", height: "150px" }}
                  bordered={false}
                  cover={
                    <Image
                      src={image}
                      alt="uploaded"
                      preview={false}
                      width={150}
                      height={150}
                    />
                  }
                >
                  <Button
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 1,
                    }}
                    icon={<CloseCircleFilled />}
                    type="primary"
                    onClick={() =>
                      setPostImages(postImages.filter((_, i) => i !== index))
                    }
                    danger
                  />
                </Card>
              ))}
            </div>
          </>
        )}

        {(platform === "facebook" || platform === "both") && (
          <div>
            <Typography.Text strong>Facebook Content:</Typography.Text>
            <Input.TextArea
              value={facebookContent}
              onChange={(e) => setFacebookContent(e.target.value)}
              placeholder="Facebook content"
              autoSize={{ minRows: 6, maxRows: 12 }}
              style={{
                whiteSpace: "pre-line",
                fontSize: "14px",
                marginTop: "8px",
              }}
            />
          </div>
        )}

        {platform === "facebookGroup" && (
          <div>
            <Typography.Text strong>Facebook Group Content:</Typography.Text>
            <Input.TextArea
              value={facebookGroupContent}
              onChange={(e) => setFacebookGroupContent(e.target.value)}
              placeholder="Facebook Group content"
              autoSize={{ minRows: 6, maxRows: 12 }}
              style={{
                whiteSpace: "pre-line",
                fontSize: "14px",
                marginTop: "8px",
              }}
            />
          </div>
        )}

        {(platform === "instagram" || platform === "both") && (
          <div>
            <Typography.Text strong>Instagram Content:</Typography.Text>
            <Input.TextArea
              value={instagramContent}
              onChange={(e) => setInstagramContent(e.target.value)}
              placeholder="Instagram content"
              autoSize={{ minRows: 6, maxRows: 12 }}
              style={{
                whiteSpace: "pre-line",
                fontSize: "14px",
                marginTop: "8px",
              }}
            />
          </div>
        )}
        {platform === "pinterest" && (
          <div>
            <Form layout="vertical" form={form}>
              <div style={{ display: "flex", gap: "2ch" }}>
                <Image
                  src={listing?.primaryImage}
                  alt={listing?.listingTitle}
                  width={200}
                />
                <Typography.Link href={listing?.etsyLink} target="_blank">
                  <Typography.Text strong>Link: </Typography.Text>
                  {listing?.etsyLink}
                </Typography.Link>
              </div>

              <Form.Item
                label="Title"
                name="pinterestTitle"
                rules={[{ required: true, message: "Please enter a title" }]}
              >
                <Input placeholder="Enter Pinterest post title" />
              </Form.Item>
              <Form.Item
                label="Description"
                name="pinterestDescription"
                rules={[
                  { required: true, message: "Please enter a description" },
                ]}
              >
                <Input.TextArea
                  placeholder="Enter Pinterest post description"
                  autoSize={{ minRows: 4, maxRows: 8 }}
                />
              </Form.Item>
              {isFetchingBoards ? (
                <Skeleton.Input active />
              ) : (
                <Form.Item
                  label="Select Board"
                  name="pinterestBoard"
                  rules={[{ required: true, message: "Please select a board" }]}
                >
                  <Select placeholder="Select a Pinterest board">
                    {pinterestBoards.map((board) => (
                      <Select.Option key={board.id} value={board.id}>
                        {board.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            </Form>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Typography.Text strong style={{ whiteSpace: "nowrap" }}>
            Schedule Date and Time:
          </Typography.Text>
          <DatePicker
            showTime
            style={{ width: "300px" }}
            onChange={(date) => setScheduledDate(date ? date.toDate() : null)}
            disabledDate={disabledDate}
            disabledTime={disabledTime}
            showNow={false}
            placeholder="Select date and time"
          />
        </div>
      </Space>
    </Modal>
  );
};

export default PostCreationModal;
