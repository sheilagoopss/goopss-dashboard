import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import CustomersDropdown from "./CustomersDropdown";
import { ICustomer } from "../types/Customer";
import {
  Modal,
  Button,
  DatePicker,
  Radio,
  Input,
  Table,
  Card,
  Typography,
  Space,
  Image,
  Divider,
  message,
  Popconfirm,
  Avatar,
  Col,
  Row,
  Form,
  Select,
  Skeleton,
} from "antd";
import FacebookButton from "./common/FacebookButton";
import PinterestButton from "./common/PinterestButton";
import dayjs from "dayjs";
import {
  useFacebookSchedule,
  useSocialDelete,
  useSocialUpdate,
} from "hooks/useSocial";
import {
  DeleteOutlined,
  EditOutlined,
  FacebookFilled,
  InstagramFilled,
  PinterestFilled,
  TeamOutlined,
} from "@ant-design/icons";
import { useCustomerUpdate } from "hooks/useCustomer";
import { usePinterestBoard } from "hooks/usePinterest";
import { ISocialPost } from "types/Social";

interface EtsyListing {
  id: string;
  listingID: string;
  listingTitle: string;
  scheduled_post_date?: string;
  primaryImage?: string;
  totalSales?: number;
  dailyViews?: number;
  etsyLink?: string;
}

const { TextArea } = Input;
const { Title, Text } = Typography;

const   PostCreationModal: React.FC<{
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

  useEffect(() => {
    setScheduledDate(null);
    setPlatform("facebook");
    setFacebookContent("");
    setInstagramContent("");
    setFacebookGroupContent("");
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

  const handleSave = () => {
    if (!scheduledDate) {
      Modal.error({ content: "Please select a date before saving the post." });
      return;
    }

    const basePost = {
      scheduledDate, // This is already a Date object now
      dateCreated: new Date(),
      listingId: listing?.listingID || "",
      customerId,
    };

    let postsToSave: Omit<ISocialPost, "id">[] = [];

    if (platform === "both") {
      if (facebookContent.trim()) {
        postsToSave.push({
          ...basePost,
          platform: "facebook",
          content: facebookContent,
        });
      }
      if (instagramContent.trim()) {
        postsToSave.push({
          ...basePost,
          platform: "instagram",
          content: instagramContent,
        });
      }
    } else if (platform === "facebook" && facebookContent.trim()) {
      postsToSave.push({
        ...basePost,
        platform: "facebook",
        content: facebookContent,
      });
    } else if (platform === "facebookGroup" && facebookGroupContent.trim()) {
      postsToSave.push({
        ...basePost,
        platform: "facebookGroup",
        content: facebookGroupContent,
      });
    } else if (platform === "instagram" && instagramContent.trim()) {
      postsToSave.push({
        ...basePost,
        platform: "instagram",
        content: instagramContent,
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
        platform === "facebook" || platform === "both" ? (
          <Popconfirm
            title="Are you sure you want to schedule this post?"
            onConfirm={handleSave}
            okText="Yes"
            cancelText="No"
          >
            <Button key="save" type="primary" loading={isSaving}>
              Save
            </Button>
          </Popconfirm>
        ) : (
          <Button key="save" type="primary" onClick={handleSave} loading={isSaving}>
            Save
          </Button>
        ),
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <DatePicker
          showTime
          style={{ width: "100%" }}
          onChange={(date) => setScheduledDate(date ? date.toDate() : null)}
        />
        <Radio.Group
          onChange={(e) => setPlatform(e.target.value)}
          value={platform}
        >
          <Radio value="facebook">Facebook</Radio>
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

        {(platform === "facebook" || platform === "both") && (
          <div>
            <Text strong>Facebook Content:</Text>
            <TextArea
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
            <Text strong>Facebook Group Content:</Text>
            <TextArea
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
            <Text strong>Instagram Content:</Text>
            <TextArea
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
                <TextArea
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
                      <Select.Option value={board.id}>
                        {board.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            </Form>
          </div>
        )}
      </Space>
    </Modal>
  );
};
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
        <DatePicker
          showTime
          style={{ width: "100%" }}
          value={dayjs(scheduledDate)}
          onChange={(date) => setScheduledDate(date ? date.toDate() : null)}
        />

        <Button onClick={handleGenerateContent} type="default">
          Generate Content
        </Button>

        {post.platform === "facebook" && (
          <div>
            <Text strong>Facebook Content:</Text>
            <TextArea
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
            <Text strong>Instagram Content:</Text>
            <TextArea
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
      </Space>
    </Modal>
  );
};

const Social: React.FC = () => {
  const { isAdmin, customerData } = useAuth();
  const { schedulePosts } = useFacebookSchedule();
  const { updatePost, isUpdating } = useSocialUpdate();
  const { deletePost } = useSocialDelete();
  const { updateCustomer, isLoading: isUpdatingCustomer } = useCustomerUpdate();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [listings, setListings] = useState<EtsyListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<EtsyListing[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentListing, setCurrentListing] = useState<EtsyListing | null>(
    null,
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarPosts, setCalendarPosts] = useState<ISocialPost[]>([]);
  const [selectedDatePosts, setSelectedDatePosts] = useState<ISocialPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const LISTINGS_PER_PAGE = 5;
  const [editablePost, setEditablePost] = useState<ISocialPost | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPostCreationModalOpen, setIsPostCreationModalOpen] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);

  const columns = [
    {
      title: "Listing ID",
      dataIndex: "listingID",
      key: "listingID",
      sorter: (a: EtsyListing, b: EtsyListing) =>
        a.listingID.localeCompare(b.listingID),
    },
    {
      title: "Title",
      dataIndex: "listingTitle",
      key: "listingTitle",
      sorter: (a: EtsyListing, b: EtsyListing) =>
        a.listingTitle.localeCompare(b.listingTitle),
    },
    {
      title: "Total Sales",
      dataIndex: "totalSales",
      key: "totalSales",
      sorter: (a: EtsyListing, b: EtsyListing) =>
        (a.totalSales || 0) - (b.totalSales || 0),
    },
    {
      title: "Daily Views",
      dataIndex: "dailyViews",
      key: "dailyViews",
      sorter: (a: EtsyListing, b: EtsyListing) =>
        (a.dailyViews || 0) - (b.dailyViews || 0),
    },
    {
      title: "Scheduled Date",
      dataIndex: "scheduled_post_date",
      key: "scheduled_post_date",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: EtsyListing) => (
        <Button onClick={() => handleSchedulePost(record)}>
          Schedule Post
        </Button>
      ),
    },
  ];

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersCollection = collection(db, "customers");
        let q;

        if (isAdmin) {
          q = query(customersCollection);
        } else {
          q = query(
            customersCollection,
            where("email", "==", customerData?.email),
          );
        }

        const querySnapshot = await getDocs(q);
        const customersList = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as ICustomer,
        );
        setCustomers(customersList);

        if (!isAdmin && customersList.length > 0) {
          setSelectedCustomer(customersList[0]);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, [isAdmin, customerData]);

  const fetchListings = useCallback(async () => {
    if (selectedCustomer) {
      try {
        setLoading(true);
        const listingsCollection = collection(db, "listings");
        const q = query(
          listingsCollection,
          where("customer_id", "==", selectedCustomer.customer_id),
          orderBy("listingID"),
        );

        const listingsSnapshot = await getDocs(q);
        const listingsList = listingsSnapshot.docs.map(
          (doc) =>
            ({
              ...doc.data(),
              id: doc.id,
              listingID: doc.data().listingID,
              listingTitle: doc.data().listingTitle,
              scheduled_post_date: doc.data().scheduled_post_date,
              primaryImage: doc.data().primaryImage,
              totalSales: doc.data().totalSales || 0,
              dailyViews: doc.data().dailyViews || 0,
            }) as EtsyListing,
        );

        setListings(listingsList);
        setFilteredListings(listingsList);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [selectedCustomer]);

  const fetchPostsForMonth = useCallback(
    async (month: Date) => {
      if (!selectedCustomer) return;

      // Set the start of month to the beginning of the day (00:00:00)
      const startOfMonth = new Date(
        month.getFullYear(),
        month.getMonth(),
        1,
        0,
        0,
        0,
      );

      // Set the end of month to the end of the last day (23:59:59)
      const endOfMonth = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      try {
        const postsRef = collection(db, "socials");
        const q = query(
          postsRef,
          where("customerId", "==", selectedCustomer.id),
          where("scheduledDate", ">=", startOfMonth),
          where("scheduledDate", "<=", endOfMonth),
        );

        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            scheduledDate:
              typeof data.scheduledDate === "string"
                ? new Date(data.scheduledDate)
                : data.scheduledDate.toDate(),
            dateCreated:
              typeof data.dateCreated === "string"
                ? new Date(data.dateCreated)
                : data.dateCreated.toDate(),
          } as ISocialPost;
        });

        setCalendarPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts for calendar:", error);
      }
    },
    [selectedCustomer],
  );

  useEffect(() => {
    if (selectedCustomer) {
      fetchListings();
    }
  }, [fetchListings, selectedCustomer]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchPostsForMonth(currentMonth);
    }
  }, [selectedCustomer, currentMonth, fetchPostsForMonth]);

  const handleSchedulePost = (listing: EtsyListing) => {
    setCurrentListing(listing);
    setIsPostCreationModalOpen(true);
  };

  const handleSavePost = async (newPosts: Omit<ISocialPost, "id">[]): Promise<boolean> => {
    setIsSavingPost(true);
    if (!selectedCustomer) {
      console.error("No customer selected");
      return false;
    }

    try {
      const socialCollection = collection(db, "socials");
      let savedPosts: ISocialPost[] = [];

      for (const post of newPosts) {
        if (!post.content.trim()) {
          console.error(`Empty content for ${post.platform} post. Skipping.`);
          continue;
        }

        // Set scheduled field based on platform
        const scheduled = post.platform === 'pinterest' ? false : 
                         post.platform === 'facebookGroup' ? false : 
                         undefined;

        const docRef = await addDoc(socialCollection, {
          ...post,
          scheduledDate: post.scheduledDate,
          dateCreated: new Date(),
          imageUrl: currentListing?.primaryImage,
          scheduled: post.platform === "pinterest" ? false : null,
        });

        savedPosts.push({
          id: docRef.id,
          ...post,
          imageUrl: currentListing?.primaryImage,
        });
      }

      if (savedPosts.length === 0) {
        console.error("No posts were saved due to empty content");
        return false;
      }

      // Update the scheduled_post_date in the listing
      if (currentListing) {
        const listingRef = doc(db, "listings", currentListing.id);
        await updateDoc(listingRef, {
          scheduled_post_date: savedPosts[0].scheduledDate?.toISOString(),
        });
      }

      switch (savedPosts[0].platform) {
        case "facebook":
          {
            const schedulePostPromises = savedPosts.map((post) =>
              schedulePosts({
                customerId: selectedCustomer.id,
                postId: post.id,
              }),
            );
            const schedulePostResponses =
              await Promise.all(schedulePostPromises);

            if (schedulePostResponses.some((response) => !response?.data)) {
              console.error("Error scheduling posts:", schedulePostResponses);
            }
          }
          break;
        case "instagram":
          break;
        default:
          break;
      }

      // Update local state
      setCalendarPosts((prevPosts) => [...prevPosts, ...savedPosts]);

      // Refresh listings and posts
      fetchListings();
      fetchPostsForMonth(currentMonth);

      setIsPostCreationModalOpen(false);
      setCurrentListing(null);
      return true;
    } catch (error) {
      console.error("Error saving post:", error);
      return false;
    } finally {
      setIsSavingPost(false);
    }
  };

  const fetchPosts = useCallback(async () => {
    if (selectedCustomer) {
      try {
        const socialCollection = collection(db, "socials");
        const q = query(
          socialCollection,
          where("customerId", "==", selectedCustomer.id),
        );
        const socialSnapshot = await getDocs(q);
        const postsList = socialSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              scheduledDate: doc.data().scheduledDate.toDate(),
              dateCreated: doc.data().dateCreated.toDate(),
            }) as ISocialPost,
        );
        setCalendarPosts(postsList);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    }
  }, [selectedCustomer]);

  useEffect(() => {
    fetchPosts();
  }, [selectedCustomer, fetchPosts]);

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    ).getDate();
    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    ).getDay();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(
        <div key={`empty-${i}`} className="calendar-day empty"></div>,
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      );

      const postsForDay = calendarPosts.filter((post) => {
        const postDate = new Date(post.scheduledDate);

        return (
          postDate.getFullYear() === date.getFullYear() &&
          postDate.getMonth() === date.getMonth() &&
          postDate.getDate() === date.getDate()
        );
      });

      calendarDays.push(
        <div
          key={`day-${day}`}
          className="calendar-day"
          onClick={() => handleDateClick(date, postsForDay)}
          style={{ cursor: "pointer" }}
        >
          <div className="day-number">{day}</div>
          {postsForDay.map((post) => (
            <div key={post.id} className={`post-indicator ${post.platform}`}>
              {post.platform === "facebook" ? (
                <FacebookFilled
                  style={{ fontSize: "16px", color: "#1877F2" }}
                />
              ) : post.platform === "facebookGroup" ? (
                <TeamOutlined style={{ fontSize: "16px", color: "#1877F2" }} />
              ) : post.platform === "pinterest" ? (
                <PinterestFilled
                  style={{ fontSize: "16px", color: "#E60023" }}
                />
              ) : (
                <InstagramFilled
                  style={{ fontSize: "16px", color: "#E4405F" }}
                />
              )}
            </div>
          ))}
        </div>,
      );
    }

    return calendarDays;
  };

  const handleDateClick = (date: Date, posts: ISocialPost[]) => {
    setSelectedDate(date);
    setSelectedDatePosts(posts);
  };

  const handleSaveEditedPost = async (editedPost: ISocialPost) => {
    try {
      await updatePost({ post: editedPost });
      // Refresh listings and posts
      fetchListings();
      fetchPostsForMonth(currentMonth);

      setIsEditModalOpen(false);
      setEditablePost(null);
    } catch (error) {
      console.error("Error saving edited post:", error);
    }
  };

  const handleDeletePost = async (post: ISocialPost) => {
    await deletePost({ post });
  };

  const handleSearch = (value: string) => {
    const searchValue = value.toLowerCase();
    const filtered = listings.filter(
      (listing) =>
        listing.listingID.toLowerCase().includes(searchValue) ||
        listing.listingTitle.toLowerCase().includes(searchValue),
    );
    setFilteredListings(filtered);
    setCurrentPage(1);
  };

  const handleDisconnect = async () => {
    if (!selectedCustomer) return;
    const updatedCustomer = await updateCustomer(selectedCustomer.id, {
      facebook: {
        is_connected: false,
      },
    });

    if (updatedCustomer) {
      setSelectedCustomer({
        ...selectedCustomer,
        facebook: {
          is_connected: false,
        },
      });
    }
  };
  const handleDisconnectPinterest = async () => {
    if (!selectedCustomer) return;
    const updatedCustomer = await updateCustomer(selectedCustomer.id, {
      pinterest: {
        is_connected: false,
      },
    });

    if (updatedCustomer) {
      setSelectedCustomer({
        ...selectedCustomer,
        pinterest: {
          is_connected: false,
        },
      });
    }
  };

  const handleEditPost = (post: ISocialPost) => {
    setEditablePost(post);
    setIsEditModalOpen(true);
  };

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Social Media Calendar</h2>
        {isAdmin && (
          <CustomersDropdown
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {customerData && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "2ch",
            marginBottom: "1ch",
            alignItems: "center",
          }}
        >
          {selectedCustomer?.facebook?.is_connected ? (
            <Card style={{ width: "fit-content" }}>
              <Row gutter={16} style={{ alignItems: "center" }}>
                <Col>
                  <FacebookFilled
                    style={{ fontSize: "2rem", color: "#1877F2" }}
                  />
                </Col>
                <Col>
                  <Avatar
                    src={selectedCustomer?.facebook?.profile_picture_url}
                    size={64}
                  />
                </Col>
                <Col>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Typography.Text>
                      {selectedCustomer?.facebook?.page_name}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {selectedCustomer?.facebook?.user_email}
                    </Typography.Text>
                  </div>
                </Col>
                <Col>
                  <Popconfirm
                    title="Are you sure you want to disconnect?"
                    onConfirm={handleDisconnect}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="primary" danger loading={isUpdatingCustomer}>
                      Disconnect
                    </Button>
                  </Popconfirm>
                </Col>
              </Row>
            </Card>
          ) : (
            <FacebookButton email={selectedCustomer?.email || ""} />
          )}

          {(isAdmin || customerData?.isSuperCustomer) && (
            <>
              {selectedCustomer?.pinterest?.is_connected ? (
                <Card style={{ width: "fit-content" }}>
                  <Row gutter={16} style={{ alignItems: "center" }}>
                    <Col>
                      <PinterestFilled
                        style={{ fontSize: "2rem", color: "#E60023" }}
                      />
                    </Col>
                    <Col>
                      <Avatar
                        src={selectedCustomer?.pinterest?.profile_picture_url}
                        size={64}
                      />
                    </Col>
                    <Col>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <Typography.Text>
                          {selectedCustomer?.pinterest?.page_name}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          {selectedCustomer?.pinterest?.user_email}
                        </Typography.Text>
                      </div>
                    </Col>
                    <Col>
                      <Popconfirm
                        title="Are you sure you want to disconnect?"
                        onConfirm={handleDisconnectPinterest}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          type="primary"
                          danger
                          loading={isUpdatingCustomer}
                        >
                          Disconnect
                        </Button>
                      </Popconfirm>
                    </Col>
                  </Row>
                </Card>
              ) : (
                <PinterestButton email={selectedCustomer?.email || ""} />
              )}
            </>
          )}
        </div>
      )}

      {(isAdmin || customerData?.isSuperCustomer) && (
        <>
          <Card style={{ marginBottom: "20px" }}>
            <Title level={4}>Listings</Title>
            <Input.Search
              placeholder="Search listings by ID or title..."
              style={{ marginBottom: 16 }}
              onSearch={handleSearch}
              allowClear
            />
            <Table
              dataSource={filteredListings}
              columns={columns}
              loading={loading}
              pagination={{
                total: filteredListings.length,
                pageSize: LISTINGS_PER_PAGE,
                current: currentPage,
                onChange: (page) => setCurrentPage(page),
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} listings`,
              }}
              rowKey="id"
            />
          </Card>
          <Divider />
        </>
      )}

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <div className="calendar-view">
            <div
              className="calendar-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <button
                onClick={prevMonth}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f0f0f0",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Previous
              </button>
              <h2>
                {currentMonth.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <button
                onClick={nextMonth}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f0f0f0",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Next
              </button>
            </div>
            <div
              className="calendar-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "8px",
                gridAutoRows: "minmax(100px, auto)",
              }}
            >
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="calendar-day-header"
                  style={{ textAlign: "center", fontWeight: "bold" }}
                >
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>
          </div>
        </div>

        <div
          style={{
            width: "300px",
            backgroundColor: "white",
            boxShadow: "-2px 0 5px rgba(0,0,0,0.1)",
            padding: "20px",
            overflowY: "auto",
            height: "calc(100vh - 40px)",
            position: "sticky",
            top: "20px",
          }}
        >
          <h3
            style={{
              marginBottom: "20px",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            {selectedDate
              ? `Posts for ${selectedDate.toLocaleDateString()}`
              : "Select a date to view posts"}
          </h3>
          {selectedDate ? (
            selectedDatePosts.length > 0 ? (
              selectedDatePosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    marginBottom: "20px",
                    borderBottom: "1px solid #eee",
                    paddingBottom: "10px",
                  }}
                >
                  {post.imageUrl && (
                    <Image
                      src={post.imageUrl}
                      alt="Listing"
                      style={{ width: "100%", marginBottom: "10px" }}
                    />
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "5px",
                    }}
                  >
                    {post.platform === "facebook" ? (
                      <FacebookFilled
                        style={{ fontSize: "16px", color: "#1877F2" }}
                      />
                    ) : post.platform === "facebookGroup" ? (
                      <TeamOutlined
                        style={{ fontSize: "16px", color: "#1877F2" }}
                      />
                    ) : post.platform === "pinterest" ? (
                      <PinterestFilled
                        style={{ fontSize: "16px", color: "#E60023" }}
                      />
                    ) : (
                      <InstagramFilled
                        style={{ fontSize: "16px", color: "#E4405F" }}
                      />
                    )}
                    <span style={{ marginLeft: "5px", fontWeight: "bold" }}>
                      {post.platform}
                    </span>
                  </div>
                  <p style={{ whiteSpace: "pre-line" }}>{post.content}</p>
                  {isAdmin && (
                    <Row gutter={16}>
                      <Col>
                        <Button
                          onClick={() => handleEditPost(post)}
                          icon={<EditOutlined />}
                        >
                          Edit
                        </Button>
                      </Col>
                      <Col>
                        <Popconfirm
                          title="Are you sure you want to delete this post?"
                          onConfirm={() => handleDeletePost(post)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button icon={<DeleteOutlined />} danger>
                            Delete
                          </Button>
                        </Popconfirm>
                      </Col>
                    </Row>
                  )}
                </div>
              ))
            ) : (
              <p>No posts scheduled for this date.</p>
            )
          ) : (
            <p>Click on a date in the calendar to view its posts.</p>
          )}
        </div>
      </div>

      {(isAdmin || customerData?.isSuperCustomer) && (
        <PostCreationModal
          isOpen={isPostCreationModalOpen}
          listing={currentListing}
          customerId={selectedCustomer?.id || ""}
          onSave={handleSavePost}
          onCancel={() => setIsPostCreationModalOpen(false)}
          isSaving={isSavingPost}
        />
      )}
      {isEditModalOpen && editablePost && (
        <PostEditModal
          post={editablePost}
          isOpen={isEditModalOpen}
          listing={currentListing}
          customerId={selectedCustomer?.id || ""}
          onSave={handleSaveEditedPost}
          onCancel={() => setIsEditModalOpen(false)}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
};

export default Social;
