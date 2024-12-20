"use client";

//TODO: NEEDS REFACTORING A LOT

import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import CustomersDropdown from "@/components/common/CustomersDropdown";
import { ICustomer } from "@/types/Customer";
import {
  Button,
  Input,
  Table,
  Card,
  Typography,
  Image,
  Divider,
  Popconfirm,
  Avatar,
  Col,
  Row,
} from "antd";
import FacebookButton from "@/components/common/FacebookButton";
import PinterestButton from "@/components/common/PinterestButton";
import {
  useSocialDelete,
  useSocialUpdate,
} from "@/hooks/useSocial";
import {
  DeleteOutlined,
  EditOutlined,
  FacebookFilled,
  InstagramFilled,
  PinterestFilled,
  TeamOutlined,
} from "@ant-design/icons";
import { useCustomerUpdate } from "@/hooks/useCustomer";
import { ISocialPost } from "@/types/Social";
import PostCreationModal from "@/components/social/PostCreation";
import PostEditModal from "@/components/social/PostEdit";
import useSavePost from "@/hooks/useSavePost";

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

const { Title } = Typography;

const Social: React.FC = () => {
  const { isAdmin, customerData } = useAuth();
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
  const { savePost, isSavingPost } = useSavePost();

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
  }, [isAdmin, customerData]);

  const fetchListings = useCallback(async () => {
    if (selectedCustomer) {
      try {
        setLoading(true);
        const listingsCollection = collection(db, "listings");
        const q = query(
          listingsCollection,
          where("customer_id", "==", selectedCustomer.id),
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
            } as EtsyListing),
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

  const handleSavePost = async (
    newPosts: Omit<ISocialPost, "id">[],
  ): Promise<boolean> => {
    if (!selectedCustomer) {
      console.error("No customer selected");
      return false;
    }

    const savedPosts = await savePost({
      customer: selectedCustomer,
      listing: currentListing || undefined,
      newPosts,
    });

    if (!savedPosts) {
      return false;
    }

    // Update local state
    setCalendarPosts((prevPosts) => [...prevPosts, ...savedPosts]);

    // Refresh listings and posts
    fetchListings();
    fetchPostsForMonth(currentMonth);

    setIsPostCreationModalOpen(false);
    setCurrentListing(null);
    return true;
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
            } as ISocialPost),
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
