import { ISocialPost } from "@/types/Social";
import { EtsyListing } from "@/types/Social";
import { useState } from "react";
import {
  Button,
  DatePicker,
  message,
  Popconfirm,
  Modal,
  Space,
  Typography,
  Input,
} from "antd";
import dayjs from "dayjs";
import { doc, getDoc } from "@firebase/firestore";
import { db } from "@/firebase/config";
import { FacebookFilled, InstagramFilled } from "@ant-design/icons";

const PostEditModal: React.FC<{
  isOpen: boolean;
  listing: EtsyListing | null;
  customerId: string;
  post: ISocialPost;
  onSave: (post: ISocialPost) => void;
  onCancel: () => void;
  isUpdating: boolean;
}> = ({ isOpen, listing, customerId, onSave, onCancel, post, isUpdating }) => {
  const [scheduledDate, setScheduledDate] = useState<Date | null>(
    dayjs(post?.scheduledDate).toDate() || null,
  );
  // const [platform, setPlatform] = useState<"facebook" | "instagram" | "both">(
  //   post?.platform || "facebook",
  // );
  const [facebookContent, setFacebookContent] = useState(
    post?.platform === "facebook" ? post?.content || "" : "",
  );
  const [instagramContent, setInstagramContent] = useState(
    post?.platform === "instagram" ? post?.content || "" : "",
  );

  const handleGenerateContent = async () => {
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
      } else {
        throw new Error("Failed to generate content. Please try again.");
      }
    } catch (error) {
      console.error("Error generating content:", error);
      message.error("Failed to generate content. Please try again.");
    }
  };

  const handleSave = () => {
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
      id: post.id,
      scheduledDate,
      dateCreated: new Date(),
      listingId: post.listingId || "",
      customerId,
    };

    let postsToSave: ISocialPost | null = null;

    if (post.platform === "facebook" && facebookContent.trim()) {
      postsToSave = {
        ...basePost,
        platform: "facebook",
        content: facebookContent,
      };
    } else if (post.platform === "instagram" && instagramContent.trim()) {
      postsToSave = {
        ...basePost,
        platform: "instagram",
        content: instagramContent,
      };
    }

    if (!postsToSave) {
      Modal.error({
        content:
          "Please enter content for at least one platform before saving.",
      });
      return;
    }

    onSave(postsToSave);
  };

  const handleCancel = () => {
    setScheduledDate(null);
    setFacebookContent("");
    setInstagramContent("");
    onCancel();
  };

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
        post.platform === "facebook" ? (
          <Popconfirm
            title="Are you sure you want to schedule this post?"
            onConfirm={handleSave}
            okText="Yes"
            cancelText="No"
          >
            <Button key="save" type="primary">
              Update
            </Button>
          </Popconfirm>
        ) : (
          <Button
            key="save"
            type="primary"
            onClick={handleSave}
            loading={isUpdating}
          >
            Update
          </Button>
        ),
      ]}
    >
      {post.platform === "facebook" ? <FacebookFilled /> : <InstagramFilled />}
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Button onClick={handleGenerateContent} type="default">
          Generate Content
        </Button>

        {post.platform === "facebook" && (
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

        {post.platform === "instagram" && (
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

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Typography.Text strong style={{ whiteSpace: "nowrap" }}>
            Schedule Date and Time:
          </Typography.Text>
          <DatePicker
            showTime
            style={{ width: "300px" }}
            value={dayjs(scheduledDate)}
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

export default PostEditModal;
