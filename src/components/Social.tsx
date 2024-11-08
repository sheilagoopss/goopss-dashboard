import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  limit,
  startAfter,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { Facebook, Instagram } from "lucide-react";
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
} from "antd";
import FacebookLoginPopup from "./FacebookLoginPopup";
import FacebookButton from "./common/FacebookButton";
import PinterestButton from "./common/PinterestButton";

interface EtsyListing {
  id: string;
  listingID: string;
  listingTitle: string;
  scheduled_post_date?: string;
  primaryImage?: string; // Added primaryImage field
}

interface Post {
  id: string;
  content: string;
  scheduledDate: Date;
  dateCreated: Date;
  platform: "facebook" | "instagram";
  listingId: string;
  customerId: string;
  imageUrl?: string; // Added imageUrl field
}

const { TextArea } = Input;
const { Title, Text } = Typography;

const PostCreationModal: React.FC<{
  isOpen: boolean;
  listing: EtsyListing | null;
  customerId: string;
  onSave: (posts: Omit<Post, "id">[]) => void;
  onCancel: () => void;
}> = ({ isOpen, listing, customerId, onSave, onCancel }) => {
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [platform, setPlatform] = useState<"facebook" | "instagram" | "both">("facebook");
  const [facebookContent, setFacebookContent] = useState("");
  const [instagramContent, setInstagramContent] = useState("");

  useEffect(() => {
    setScheduledDate(null);
    setPlatform("facebook");
    setFacebookContent("");
    setInstagramContent("");
  }, [isOpen, listing, customerId]);

  const handleGenerateContent = async () => {
    try {
      // First fetch customer data
      const customerDoc = await getDoc(doc(db, 'customers', customerId));
      if (!customerDoc.exists()) {
        throw new Error("Customer not found");
      }

      // Fetch only specific listing fields
      const listingDoc = await getDoc(doc(db, 'listings', listing?.id || ''));
      const listingData = listingDoc.exists() ? listingDoc.data() : null;

      // Structure listing data with only the fields we need
      const listingInfo = {
        title: listingData?.optimizedTitle || listingData?.listingTitle || '', //listing title
        description: listingData?.optimizedDescription || listingData?.listingDescription || '', //listing description
        primaryImage: listingData?.primaryImage || '', //listing image lin
        etsyLink: listingData?.etsyLink || '', //listing link
        store_name: listingData?.store_name || '' //store name
      };

      const customerData = customerDoc.data();
      
      // Get all the required customer fields
      const customerInfo = {
        industry: customerData.industry || '', // industry
        about: customerData.about || '', // store about
        target_audience: customerData.target_audience || '', // target audience
        content_tone: customerData.content_tone || '', // content tone
        etsy_store_url: customerData.etsy_store_url || '', // etsy store url
        past_facebook_posts: customerData.past_facebook_posts || '', // past facebook posts
        past_instagram_posts: customerData.past_instagram_posts || '', // past instagram posts
        content_guideline: customerData.content_guideline || '', // content guideline or restriction like what not to post or use first person etc
        instagram_hashtags_goopss: customerData.instagram_hashtags_goopss || '', // instagram hashtags that goopss will use 
        competitor_social: customerData.competitor_social || '' // competitor social
      };

      const payload = [{
        image_path: listingInfo.primaryImage || '',
        store_name: listingInfo.store_name || '',
        about: customerInfo.about || '',
        description: listingInfo.description || '',
        url: listingInfo.etsyLink || ''
      }];

      const API_URL = 'https://goopss.onrender.com/gen_posts';

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
        setFacebookContent(firstResult.facebook_post || '');
        setInstagramContent(firstResult.instagram_post || '');
        
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
      scheduledDate, // This is already a Date object now
      dateCreated: new Date(),
      listingId: listing?.listingID || "",
      customerId,
    };

    let postsToSave: Omit<Post, "id">[] = [];

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
    } else if (platform === "instagram" && instagramContent.trim()) {
      postsToSave.push({
        ...basePost,
        platform: "instagram",
        content: instagramContent,
      });
    }

    if (postsToSave.length === 0) {
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
    setPlatform("facebook");
    setFacebookContent("");
    setInstagramContent("");
    onCancel();
  };

  return (
    <Modal
      title={`Create Post for ${listing?.listingTitle}`}
      visible={isOpen}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Save
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <DatePicker
          style={{ width: "100%" }}
          onChange={(date) => setScheduledDate(date ? date.toDate() : null)}
        />
        <Radio.Group
          onChange={(e) => setPlatform(e.target.value)}
          value={platform}
        >
          <Radio value="facebook">Facebook</Radio>
          <Radio value="instagram">Instagram</Radio>
          <Radio value="both">Both</Radio>
        </Radio.Group>
        <Button onClick={handleGenerateContent} type="default">
          Generate Content
        </Button>
        
        {(platform === "facebook" || platform === "both") && (
          <div>
            <Text strong>Facebook Content:</Text>
            <TextArea
              value={facebookContent}
              onChange={(e) => setFacebookContent(e.target.value)}
              placeholder="Facebook content"
              autoSize={{ minRows: 3, maxRows: 5 }}
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
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </div>
        )}
      </Space>
    </Modal>
  );
};

const Social: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [listings, setListings] = useState<EtsyListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<EtsyListing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<
    "facebook" | "instagram" | "both"
  >("facebook");
  const [currentListing, setCurrentListing] = useState<EtsyListing | null>(
    null,
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarPosts, setCalendarPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedDatePosts, setSelectedDatePosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const LISTINGS_PER_PAGE = 5;
  const [editablePost, setEditablePost] = useState<Omit<Post, "id"> | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPostCreationModalOpen, setIsPostCreationModalOpen] = useState(false);

  const columns = [
    {
      title: "Listing ID",
      dataIndex: "listingID",
      key: "listingID",
    },
    {
      title: "Title",
      dataIndex: "listingTitle",
      key: "listingTitle",
    },
    {
      title: "Scheduled Date",
      dataIndex: "scheduled_post_date",
      key: "scheduled_post_date",
    },
    {
      title: "Actions",
      key: "actions",
      render: (text: string, record: EtsyListing) => (
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
          q = query(customersCollection, where("email", "==", user?.email));
        }

        const querySnapshot = await getDocs(q);
        const customersList = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as ICustomer),
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
  }, [isAdmin, user]);

  const fetchListings = async (pageNumber = 1) => {
    if (selectedCustomer) {
      try {
        const listingsCollection = collection(db, "listings");
        let q = query(
          listingsCollection,
          where("customer_id", "==", selectedCustomer.customer_id),
          orderBy("listingID"),
          limit(LISTINGS_PER_PAGE),
        );

        if (pageNumber > 1 && lastVisible) {
          q = query(
            listingsCollection,
            where("customer_id", "==", selectedCustomer.customer_id),
            orderBy("listingID"),
            startAfter(lastVisible),
            limit(LISTINGS_PER_PAGE),
          );
        }

        const listingsSnapshot = await getDocs(q);
        const listingsList = listingsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              listingID: doc.data().listingID,
              listingTitle: doc.data().listingTitle,
              scheduled_post_date: doc.data().scheduled_post_date,
              primaryImage: doc.data().primaryImage, // Added primaryImage
            } as EtsyListing),
        );

        setListings(listingsList);
        setFilteredListings(listingsList);
        setLastVisible(listingsSnapshot.docs[listingsSnapshot.docs.length - 1]);
        setCurrentPage(pageNumber);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      fetchListings();
    }
  }, [selectedCustomer]);

  useEffect(() => {
    const filtered = listings.filter(
      (listing) =>
        listing.listingID.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredListings(filtered);
  }, [searchQuery, listings]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchPostsForMonth(currentMonth);
    }
  }, [selectedCustomer, currentMonth]);

  const handleCustomerSelect = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const customer = customers.find((c) => c.id === event.target.value);
    setSelectedCustomer(customer || null);
  };

  const handleSchedulePost = (listing: EtsyListing) => {
    setCurrentListing(listing);
    setIsPostCreationModalOpen(true);
  };

  const handleSavePost = async (newPosts: Omit<Post, "id">[]) => {
    if (!selectedCustomer) {
      console.error("No customer selected");
      return;
    }

    try {
      const socialCollection = collection(db, "socials");
      let savedPosts: Post[] = [];

      for (const post of newPosts) {
        if (!post.content.trim()) {
          console.error(`Empty content for ${post.platform} post. Skipping.`);
          continue;
        }

        const docRef = await addDoc(socialCollection, {
          ...post,
          scheduledDate: post.scheduledDate,
          dateCreated: new Date(),
          imageUrl: currentListing?.primaryImage, // Added imageUrl
        });
        savedPosts.push({
          id: docRef.id,
          ...post,
          imageUrl: currentListing?.primaryImage,
        });
      }

      if (savedPosts.length === 0) {
        console.error("No posts were saved due to empty content");
        return;
      }

      // Update the scheduled_post_date in the listing
      if (currentListing) {
        const listingRef = doc(db, "listings", currentListing.id);
        await updateDoc(listingRef, {
          scheduled_post_date: savedPosts[0].scheduledDate.toISOString(),
        });
      }

      // Update local state
      setPosts((prevPosts) => [...prevPosts, ...savedPosts]);
      setCalendarPosts((prevPosts) => [...prevPosts, ...savedPosts]);

      console.log("Posts saved to Firestore:", savedPosts);

      // Refresh listings and posts
      fetchListings();
      fetchPostsForMonth(currentMonth);

      setIsPostCreationModalOpen(false);
      setCurrentListing(null);
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const fetchPosts = async () => {
    if (selectedCustomer) {
      try {
        console.log("Fetching posts for customer:", selectedCustomer.id);
        const socialCollection = collection(db, "socials");
        const q = query(
          socialCollection,
          where("customerId", "==", selectedCustomer.id),
        );
        const socialSnapshot = await getDocs(q);
        console.log("Number of posts fetched:", socialSnapshot.size);
        const postsList = socialSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              scheduledDate: doc.data().scheduledDate.toDate(),
              dateCreated: doc.data().dateCreated.toDate(),
            } as Post),
        );
        console.log("Fetched posts:", postsList);
        setPosts(postsList);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCustomer]);

  const fetchPostsForMonth = async (month: Date) => {
    if (!selectedCustomer) return;

    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    try {
      console.log("Fetching posts for month:", month);
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
          scheduledDate: data.scheduledDate.toDate(),
          dateCreated: data.dateCreated.toDate(),
        } as Post;
      });
      console.log("Fetched posts for month:", fetchedPosts);
      setPosts(fetchedPosts);
      setCalendarPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts for calendar:", error);
    }
  };

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
      const postsForDay = calendarPosts.filter(
        (post) => post.scheduledDate.toDateString() === date.toDateString(),
      );

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
                <Facebook size={16} />
              ) : (
                <Instagram size={16} />
              )}
            </div>
          ))}
        </div>,
      );
    }

    return calendarDays;
  };

  const handleDateClick = (date: Date, posts: Post[]) => {
    setSelectedDate(date);
    setSelectedDatePosts(posts);
  };

  const handleNextPage = () => {
    fetchListings(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchListings(currentPage - 1);
    }
  };

  const handleSaveEditedPost = async (editedPost: Omit<Post, "id">) => {
    try {
      const socialCollection = collection(db, "socials");
      const docRef = await addDoc(socialCollection, editedPost);
      const newPost = { id: docRef.id, ...editedPost };

      // Update local state
      setPosts((prevPosts) => [...prevPosts, newPost]);
      setCalendarPosts((prevPosts) => [...prevPosts, newPost]);

      // Update the scheduled_post_date in the listing
      if (currentListing) {
        const listingRef = doc(db, "listings", currentListing.id);
        await updateDoc(listingRef, {
          scheduled_post_date: editedPost.scheduledDate.toISOString(),
        });
      }

      // Refresh listings and posts
      fetchListings();
      fetchPostsForMonth(currentMonth);

      setIsEditModalOpen(false);
      setEditablePost(null);
    } catch (error) {
      console.error("Error saving edited post:", error);
    }
  };

  useEffect(() => {
    console.log("Current listing updated:", currentListing);
  }, [currentListing]);

  useEffect(() => {
    console.log("Post creation modal open state:", isPostCreationModalOpen);
  }, [isPostCreationModalOpen]);

  const handleFacebookLoginSuccess = async (accessToken: string) => {
    console.log("Logged in successfully, Access Token:", accessToken);

    try {
      // Use the API URL from environment variable
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/facebook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken }),
        },
      );

      const data = await response.json();
      console.log("User data:", data);
      // Process user data or perform additional actions here
    } catch (error) {
      console.error("Error:", error);
    }
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

      {/* Only show social buttons for admin */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "2ch",
          marginBottom: "1ch",
        }}
      >
        <FacebookButton />
        {isAdmin && (
          <>
            <PinterestButton />
          </>
        )}
      </div>

      <Card style={{ marginBottom: "20px" }}>
        <Title level={4}>Listings</Title>
        <Table
          dataSource={filteredListings}
          columns={columns}
          loading={loading}
          pagination={false}
          rowKey="id"
        />
      </Card>
      <Divider />

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
                      <Facebook size={16} />
                    ) : (
                      <Instagram size={16} />
                    )}
                    <span style={{ marginLeft: "5px", fontWeight: "bold" }}>
                      {post.platform}
                    </span>
                  </div>
                  <p>
                    <strong>Content:</strong>
                  </p>
                  <p>{post.content}</p>
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

      <PostCreationModal
        isOpen={isPostCreationModalOpen}
        listing={currentListing}
        customerId={selectedCustomer?.id || ""}
        onSave={handleSavePost}
        onCancel={() => setIsPostCreationModalOpen(false)}
      />
    </div>
  );
};

export default Social;
