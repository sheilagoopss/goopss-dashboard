"use client";
//TODO: NEEDS REFACTORING
import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  getDocs,
  where,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { Copy, Check, ExternalLink } from "lucide-react";
import DOMPurify from "dompurify";
import { Listing } from "@/types/Listing";
import Papa from "papaparse";
import dayjs from "dayjs";
import {
  Button,
  Input,
  Table,
  Tag,
  Space,
  Card,
  Typography,
  Checkbox,
  message,
  Image,
  Row,
  Col,
  Modal,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTaskCreate } from "@/hooks/useTask";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizeListing } from "@/hooks/useOptimizeEtsy";

const { Text } = Typography;

interface AdminListingsProps {
  customerId: string;
  storeName: string;
}

const formatDate = (date: Date | null | undefined | any): string => {
  if (!date) return "";

  // Handle Firestore Timestamp
  if (date.toDate && typeof date.toDate === "function") {
    return date.toDate().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  // Handle regular Date object
  if (date instanceof Date) {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  // If it's a timestamp number
  if (typeof date.seconds === "number") {
    return new Date(date.seconds * 1000).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  return "";
};

const AdminListings: React.FC<AdminListingsProps> = ({
  customerId,
  storeName,
}) => {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [displayedListings, setDisplayedListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<
    "totalSales" | "dailyViews" | "optimizedAt" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showNonBestsellers, setShowNonBestsellers] = useState(false);
  const [hideOptimized, setHideOptimized] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [optimizedContent, setOptimizedContent] = useState<{
    title: string;
    description: string;
    tags: string;
  } | null>(null);
  const [editedTags, setEditedTags] = useState("");
  const { createTask } = useTaskCreate();
  const { optimizeText, isOptimizing } = useOptimizeListing();
  const { user } = useAuth();

  const LISTINGS_PER_PAGE = 10; // Changed from 5 to 10

  const MAX_TAGS = 13;

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [isTagsModalVisible, setIsTagsModalVisible] = useState(false);
  const [tagCollections, setTagCollections] = useState<string>("");

  const copyToClipboard = (text: string, field: string) => {
    let formattedText = text;
    if (field.includes("description")) {
      // Replace <br> tags with newline characters
      formattedText = text.replace(/<br\s*\/?>/g, "\n");
    }
    navigator.clipboard.writeText(formattedText).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000); // Reset after 2 seconds
    });
  };

  const handleAddTag = (newTags: string) => {
    const currentTags = editedTags
      .split(/,\s*/)
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const tagsToAdd = newTags
      .split(/,\s*/)
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const availableSlots = MAX_TAGS - currentTags.length;
    const tagsToAddLimited = tagsToAdd.slice(0, availableSlots);

    const updatedTags = Array.from(
      new Set([...currentTags, ...tagsToAddLimited]),
    )
      .filter((tag) => tag !== "")
      .join(",");

    setEditedTags(updatedTags);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = editedTags
      .split(/,\s*/)
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const updatedTags = currentTags
      .filter((tag) => tag !== tagToRemove)
      .join(",");

    console.log("Removing tag:", {
      tagToRemove,
      before: currentTags,
      after: updatedTags.split(","),
    });

    setEditedTags(updatedTags);
  };

  const getTagCount = (tags: string): number => {
    return tags
      .split(/,\s*/)
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "").length;
  };

  const fetchAllListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const listingsCollection = collection(db, "listings");
      const q = query(
        listingsCollection,
        where("customer_id", "==", customerId),
      );
      const listingsSnapshot = await getDocs(q);
      const listingsList = listingsSnapshot.docs.map((doc) => {
        const data = doc.data();
        let optimizedAt: Date | null = null;

        if (data.optimizedAt) {
          if (
            data.optimizedAt.toDate &&
            typeof data.optimizedAt.toDate === "function"
          ) {
            optimizedAt = data.optimizedAt.toDate();
          } else if (data.optimizedAt instanceof Date) {
            optimizedAt = data.optimizedAt;
          } else if (typeof data.optimizedAt === "string") {
            optimizedAt = new Date(data.optimizedAt);
          } else if (typeof data.optimizedAt.seconds === "number") {
            optimizedAt = new Date(data.optimizedAt.seconds * 1000);
          }
        }

        return {
          id: doc.id,
          ...data,
          optimizedAt: optimizedAt,
        } as Listing;
      });

      setAllListings(listingsList);
      setFilteredListings(listingsList);
      setDisplayedListings(listingsList.slice(0, LISTINGS_PER_PAGE));
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchAllListings();
    }
  }, [customerId, fetchAllListings]);

  const applyFiltersAndSort = useCallback(
    (listings: Listing[]) => {
      let filtered = listings;

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(
          (listing) =>
            listing.listingTitle
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            listing.listingID.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }

      // Apply non-bestsellers filter
      if (showNonBestsellers) {
        filtered = filtered.filter((listing) => !listing.bestseller);
      }

      // Apply hide optimized filter
      if (hideOptimized) {
        filtered = filtered.filter((listing) => !listing.optimizationStatus);
      }

      // Apply sorting
      if (sortColumn) {
        filtered.sort((a, b) => {
          if (sortColumn === "optimizedAt") {
            const dateA = a.optimizedAt ? a.optimizedAt.getTime() : 0;
            const dateB = b.optimizedAt ? b.optimizedAt.getTime() : 0;
            return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
          } else {
            const valueA = a[sortColumn] || 0;
            const valueB = b[sortColumn] || 0;
            return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
          }
        });
      }

      setFilteredListings(filtered);
    },
    [searchTerm, showNonBestsellers, hideOptimized, sortColumn, sortDirection],
  );

  useEffect(() => {
    applyFiltersAndSort(allListings);
  }, [
    searchTerm,
    showNonBestsellers,
    hideOptimized,
    sortColumn,
    sortDirection,
    applyFiltersAndSort,
    allListings,
  ]);

  const brToNewline = (text: string) => {
    return text.replace(/<br\s*\/?>/g, "\n");
  };

  const newlineToBr = (text: string) => {
    return text.replace(/\n/g, "<br>");
  };

  const handleOptimize = async (listing: Listing) => {
    try {
      const storeUrl = `https://${storeName}.etsy.com`;
      const optimizedData = await optimizeText({
        title: listing.listingTitle,
        description: listing.listingDescription,
        version: 1,
        storeUrl,
      });
      setSelectedListing(listing);

      if (!optimizedData) return;

      setOptimizedContent({
        title: optimizedData.title,
        description: brToNewline(optimizedData.description),
        tags: listing.listingTags,
      });
      setEditedTags(listing.listingTags);

      if (!expandedRows.includes(listing.id)) {
        setExpandedRows([...expandedRows, listing.id]);
      }
    } catch (error) {
      console.error("Error optimizing listing:", error);
    }
  };

  const handleSave = async () => {
    if (!selectedListing || !optimizedContent) return;

    const tags = editedTags
      .split(/,\s*/)
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    if (tags.length > MAX_TAGS) {
      message.error(`Maximum ${MAX_TAGS} tags allowed`);
      return;
    }

    if (tags.length < MAX_TAGS) {
      message.error(`Please add ${MAX_TAGS} tags`);
      return;
    }

    setIsPublishing(true);
    try {
      const currentDate = new Date();
      const updateData = {
        optimizedTitle: optimizedContent.title,
        optimizedDescription: newlineToBr(optimizedContent.description),
        optimizedTags: tags.join(","), // Store tags with just commas
        optimizationStatus: true,
        optimizedAt: currentDate,
      };

      const listingRef = doc(db, "listings", selectedListing.id);
      await updateDoc(listingRef, updateData);

      await createTask({
        customerId: customerId,
        taskName: `Optimized Listing`,
        teamMemberName: user?.name || user?.email || "",
        dateCompleted: serverTimestamp(),
        listingId: selectedListing.listingID,
        isDone: true,
        category: "Optimization",
      });

      // Update local states
      setAllListings((prevListings) =>
        prevListings.map((l) =>
          l.id === selectedListing.id
            ? { ...l, ...updateData, optimizedAt: currentDate }
            : l,
        ),
      );

      setDisplayedListings((prevListings) =>
        prevListings.map((l) =>
          l.id === selectedListing.id
            ? { ...l, ...updateData, optimizedAt: currentDate }
            : l,
        ),
      );

      setFilteredListings((prevListings) =>
        prevListings.map((l) =>
          l.id === selectedListing.id
            ? { ...l, ...updateData, optimizedAt: currentDate }
            : l,
        ),
      );

      // Clear the optimization form
      setOptimizedContent(null);
      setSelectedListing(null);
      setEditedTags("");

      message.success("Listing optimized successfully");
    } catch (error) {
      console.error("Error saving optimized listing:", error);
      message.error("Failed to optimize listing");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCancel = () => {
    setOptimizedContent(null);
    setSelectedListing(null);
    setEditedTags("");
  };

  // Add this helper function to sanitize HTML
  const sanitizeHtml = (html: string) => {
    return {
      __html: DOMPurify.sanitize(html, { ALLOWED_TAGS: ["br"] }),
    };
  };

  // Add this function to generate the Etsy URL
  const getEtsyUrl = (listingID: string) => {
    return `https://www.etsy.com/listing/${listingID}`;
  };

  const handleCSVExport = () => {
    const csvData = allListings
      .filter((list) => list.optimizationStatus && list.optimizedAt)
      .map((listing) => ({
        "Listing ID": listing.listingID || "-",
        "Listing Title": listing.listingTitle || "-",
        "Listing Description": (listing.listingDescription || "-")
          .replace(/<br\s*\/?>/gi, "\n") // Case insensitive match
          .replace(/&nbsp;/g, " ") // Replace &nbsp; with spaces
          .replace(/<[^>]*>/g, ""), // Remove any other HTML tags
        "Listing Tags": listing.listingTags || "-",
        "Optimized At": listing.optimizedAt || "-",
        "Optimized Title": listing.optimizedTitle || "-",
        "Optimized Description": (listing.optimizedDescription || "-")
          .replace(/<br\s*\/?>/gi, "\n") // Case insensitive match
          .replace(/&nbsp;/g, " ") // Replace &nbsp; with spaces
          .replace(/<[^>]*>/g, ""), // Remove any other HTML tags
        "Optimized Tags": listing.optimizedTags || "-",
      }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `optimization_list_${dayjs().toISOString()}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Define table columns
  const columns = [
    {
      title: "Image",
      key: "image",
      width: 80,
      render: (record: Listing) => (
        <Image
          src={record.primaryImage}
          alt={record.listingTitle}
          width={50}
          height={50}
        />
      ),
    },
    {
      title: "Listing ID",
      dataIndex: "listingID",
      key: "listingID",
    },
    {
      title: "Title",
      dataIndex: "listingTitle",
      key: "title",
      render: (text: string, record: Listing) => (
        <a
          href={getEtsyUrl(record.listingID)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          {text}
          <ExternalLink size={14} className="ml-1" />
        </a>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (record: Listing) => (
        <Tag color={record.optimizationStatus ? "success" : "warning"}>
          {record.optimizationStatus ? "Optimized" : "Pending"}
        </Tag>
      ),
    },
    {
      title: "Bestseller",
      key: "bestseller",
      render: (record: Listing) => (
        <Tag color={record.bestseller ? "gold" : "default"}>
          {record.bestseller ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Total Sales",
      dataIndex: "totalSales",
      key: "totalSales",
      sorter: (a: Listing, b: Listing) =>
        (a.totalSales || 0) - (b.totalSales || 0),
    },
    {
      title: "Daily Views",
      dataIndex: "dailyViews",
      key: "dailyViews",
      sorter: (a: Listing, b: Listing) =>
        (a.dailyViews || 0) - (b.dailyViews || 0),
    },
    {
      title: "Optimized Date",
      key: "optimizedAt",
      dataIndex: "optimizedAt",
      render: (_: any, record: Listing) => formatDate(record.optimizedAt),
      sorter: {
        compare: (a: Listing, b: Listing) => {
          if (!a.optimizedAt && !b.optimizedAt) return 0;
          if (!a.optimizedAt) return -1;
          if (!b.optimizedAt) return 1;
          return a.optimizedAt.getTime() - b.optimizedAt.getTime();
        },
        multiple: 1,
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Listing) => (
        <Button
          onClick={() => handleOptimize(record)}
          disabled={isOptimizing || record.optimizationStatus}
          type="primary"
        >
          {isOptimizing ? "Optimizing..." : "Optimize"}
        </Button>
      ),
    },
  ];

  // Add this useEffect to handle search and filters
  useEffect(() => {
    let filtered = [...allListings];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (listing) =>
          listing.listingTitle
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          listing.listingID.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply non-bestsellers filter
    if (showNonBestsellers) {
      filtered = filtered.filter((listing) => !listing.bestseller);
    }

    // Apply hide optimized filter
    if (hideOptimized) {
      filtered = filtered.filter((listing) => !listing.optimizationStatus);
    }

    setFilteredListings(filtered);
    setDisplayedListings(filtered.slice(0, LISTINGS_PER_PAGE));
  }, [searchTerm, showNonBestsellers, hideOptimized, allListings]);

  // Add this function near other tag handling functions
  const handleClearAllTags = () => {
    setEditedTags("");
  };

  // Add this function to handle adding tags from collection

  // Add this function to fetch tags collection
  const fetchTagsCollection = useCallback(async () => {
    try {
      const customerRef = doc(db, "customers", customerId);
      const customerDoc = await getDoc(customerRef);

      if (customerDoc.exists()) {
        const data = customerDoc.data();
        setTagCollections(data.tags_collection || "");
      }
    } catch (error) {
      console.error("Error fetching tags collection:", error);
      message.error("Failed to load tags collection");
    }
  }, [customerId]);

  // Add this function to save new tag collection
  const saveTagCollection = async (newTags: string) => {
    try {
      const customerRef = doc(db, "customers", customerId);
      await updateDoc(customerRef, {
        tags_collection: newTags,
      });

      setTagCollections(newTags);
      message.success("Tags collection saved successfully");
    } catch (error) {
      console.error("Error saving tags collection:", error);
      message.error("Failed to save tags collection");
    }
  };

  // Add this useEffect to load tags collection when component mounts
  useEffect(() => {
    if (customerId) {
      fetchTagsCollection();
    }
  }, [customerId, fetchTagsCollection]);

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Input
              placeholder="Search listings..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Space>
              <Button onClick={handleCSVExport}>Export CSV</Button>
              <Checkbox
                checked={showNonBestsellers}
                onChange={(e) => setShowNonBestsellers(e.target.checked)}
              >
                Show Non-Bestsellers Only
              </Checkbox>
              <Checkbox
                checked={hideOptimized}
                onChange={(e) => setHideOptimized(e.target.checked)}
              >
                Hide Optimized Listings
              </Checkbox>
            </Space>
          </Space>
        </Card>

        <Table
          columns={columns}
          dataSource={displayedListings}
          rowKey="id"
          loading={isLoading}
          onChange={(pagination, filters, sorter) => {
            // Handle pagination
            const page = pagination.current || 1;
            const startIndex = (page - 1) * LISTINGS_PER_PAGE;
            const endIndex = startIndex + LISTINGS_PER_PAGE;

            // If sorting is happening
            if (!Array.isArray(sorter) && "field" in sorter && sorter.order) {
              const field = sorter.field as
                | "totalSales"
                | "dailyViews"
                | "optimizedAt";
              const order = sorter.order === "ascend" ? "asc" : "desc";

              // Sort all listings
              const sortedListings = [...allListings].sort((a, b) => {
                if (field === "optimizedAt") {
                  if (!a.optimizedAt && !b.optimizedAt) return 0;
                  if (!a.optimizedAt) return order === "asc" ? -1 : 1;
                  if (!b.optimizedAt) return order === "asc" ? 1 : -1;
                  return order === "asc"
                    ? a.optimizedAt.getTime() - b.optimizedAt.getTime()
                    : b.optimizedAt.getTime() - a.optimizedAt.getTime();
                }

                const valueA = a[field] || 0;
                const valueB = b[field] || 0;
                return order === "asc" ? valueA - valueB : valueB - valueA;
              });

              // Apply filters
              let filtered = sortedListings;
              if (searchTerm) {
                filtered = filtered.filter(
                  (listing) =>
                    listing.listingTitle
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    listing.listingID
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                );
              }
              if (showNonBestsellers) {
                filtered = filtered.filter((listing) => !listing.bestseller);
              }
              if (hideOptimized) {
                filtered = filtered.filter(
                  (listing) => !listing.optimizationStatus,
                );
              }

              setFilteredListings(filtered);
              setDisplayedListings(filtered.slice(startIndex, endIndex));
              setSortColumn(field);
              setSortDirection(order);
            } else {
              // Just handle pagination without sorting
              setDisplayedListings(
                filteredListings.slice(startIndex, endIndex),
              );
            }
          }}
          pagination={{
            pageSize: LISTINGS_PER_PAGE,
            total: filteredListings.length,
            showSizeChanger: false, // Add this to fix page size
          }}
          expandable={{
            expandedRowRender: (record) => (
              <Card>
                {selectedListing?.id === record.id && optimizedContent ? (
                  // Optimization form layout
                  <Row gutter={24}>
                    {/* Original Listing - Left Side */}
                    <Col span={12}>
                      <Card title="Original Listing" style={{ height: "100%" }}>
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div>
                            <Text strong>Title:</Text>
                            <div style={{ marginLeft: 8 }}>
                              {record.listingTitle}
                            </div>
                          </div>
                          <div>
                            <Text strong>Description:</Text>
                            <div
                              style={{ marginLeft: 8 }}
                              dangerouslySetInnerHTML={sanitizeHtml(
                                record.listingDescription,
                              )}
                            />
                          </div>
                          <div>
                            <Text strong>Tags:</Text>
                            <div style={{ marginLeft: 8 }}>
                              <Space wrap>
                                {record.listingTags
                                  .split(",")
                                  .map((tag, index) => (
                                    <Tag key={index}>{tag.trim()}</Tag>
                                  ))}
                              </Space>
                            </div>
                          </div>
                        </Space>
                      </Card>
                    </Col>

                    {/* Optimized Listing - Right Side */}
                    <Col span={12}>
                      <Card
                        title="Optimized Listing"
                        extra={
                          <Space>
                            <Button onClick={handleCancel}>Cancel</Button>
                            <Button
                              type="primary"
                              onClick={handleSave}
                              loading={isPublishing}
                            >
                              Save
                            </Button>
                          </Space>
                        }
                        style={{ height: "100%" }}
                      >
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div>
                            <Space align="center">
                              <Text strong>Title:</Text>
                              <Button
                                type="text"
                                icon={
                                  copiedField === `title-${record.id}` ? (
                                    <Check />
                                  ) : (
                                    <Copy />
                                  )
                                }
                                onClick={() =>
                                  copyToClipboard(
                                    optimizedContent.title,
                                    `title-${record.id}`,
                                  )
                                }
                              />
                            </Space>
                            <Input
                              value={optimizedContent.title}
                              onChange={(e) =>
                                setOptimizedContent({
                                  ...optimizedContent,
                                  title: e.target.value,
                                })
                              }
                              style={{ width: "100%" }}
                            />
                          </div>
                          <div>
                            <Space align="center">
                              <Text strong>Description:</Text>
                              <Button
                                type="text"
                                icon={
                                  copiedField === `description-${record.id}` ? (
                                    <Check />
                                  ) : (
                                    <Copy />
                                  )
                                }
                                onClick={() =>
                                  copyToClipboard(
                                    optimizedContent.description,
                                    `description-${record.id}`,
                                  )
                                }
                              />
                            </Space>
                            <Input.TextArea
                              value={optimizedContent.description}
                              onChange={(e) =>
                                setOptimizedContent({
                                  ...optimizedContent,
                                  description: e.target.value,
                                })
                              }
                              rows={10}
                            />
                          </div>
                          <div>
                            <Space
                              align="center"
                              style={{
                                width: "100%",
                                justifyContent: "space-between",
                              }}
                            >
                              <Space>
                                <Text strong>Tags:</Text>
                                <Button
                                  type="text"
                                  icon={
                                    copiedField === `tags-${record.id}` ? (
                                      <Check />
                                    ) : (
                                      <Copy />
                                    )
                                  }
                                  onClick={() =>
                                    copyToClipboard(
                                      editedTags,
                                      `tags-${record.id}`,
                                    )
                                  }
                                />
                                <Text type="secondary">
                                  ({getTagCount(editedTags)}/{MAX_TAGS} tags)
                                </Text>
                              </Space>
                              <Space>
                                <Button
                                  type="primary"
                                  onClick={() => setIsTagsModalVisible(true)}
                                >
                                  Tags Collection
                                </Button>
                                <Button
                                  type="link"
                                  danger
                                  onClick={handleClearAllTags}
                                  disabled={!editedTags}
                                >
                                  Clear All
                                </Button>
                              </Space>
                            </Space>
                            <div
                              style={{
                                marginTop: 8,
                                maxHeight: "200px",
                                overflowY: "auto",
                                border: "1px solid #f0f0f0",
                                padding: "8px",
                                borderRadius: "4px",
                              }}
                            >
                              {editedTags
                                .split(/,\s*/)
                                .map((tag) => tag.trim())
                                .filter((tag) => tag !== "")
                                .map((tag, index) => (
                                  <Tag
                                    key={`${tag}-${index}`} // Use both tag and index for unique key
                                    closable
                                    onClose={() => handleRemoveTag(tag)}
                                    style={{ margin: "0 8px 8px 0" }}
                                  >
                                    {tag}
                                  </Tag>
                                ))}
                            </div>
                            <Space style={{ marginTop: 8 }}>
                              <Input
                                placeholder="Add new tag(s)"
                                onPressEnter={(e) => {
                                  const newTags = e.currentTarget.value.trim();
                                  if (newTags) {
                                    handleAddTag(newTags);
                                    e.currentTarget.value = "";
                                  }
                                }}
                                disabled={
                                  editedTags
                                    .split(/,\s*/)
                                    .filter((tag) => tag.trim() !== "")
                                    .length >= MAX_TAGS
                                }
                              />
                              <Button
                                onClick={() => {
                                  const input = document.querySelector(
                                    'input[placeholder="Add new tag(s)"]',
                                  ) as HTMLInputElement;
                                  const newTags = input.value.trim();
                                  if (newTags) {
                                    handleAddTag(newTags);
                                    input.value = "";
                                  }
                                }}
                                disabled={
                                  editedTags
                                    .split(/,\s*/)
                                    .filter((tag) => tag.trim() !== "")
                                    .length >= MAX_TAGS
                                }
                              >
                                Add Tag(s)
                              </Button>
                            </Space>
                            {editedTags
                              .split(/,\s*/)
                              .filter((tag) => tag.trim() !== "").length >=
                              MAX_TAGS && (
                              <Text
                                type="danger"
                                style={{ marginTop: 8, display: "block" }}
                              >
                                Maximum number of tags (13) reached.
                              </Text>
                            )}
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                ) : (
                  // Regular view layout (when not optimizing)
                  <Row gutter={24}>
                    <Col span={12}>
                      <Card title="Original Listing" style={{ height: "100%" }}>
                        <Space direction="vertical">
                          <Text strong>Title:</Text>
                          <Text>{record.listingTitle}</Text>
                          <Text strong>Description:</Text>
                          <div
                            dangerouslySetInnerHTML={sanitizeHtml(
                              record.listingDescription,
                            )}
                          />
                          <Text strong>Tags:</Text>
                          <Space wrap>
                            {record.listingTags.split(",").map((tag, index) => (
                              <Tag key={index}>{tag.trim()}</Tag>
                            ))}
                          </Space>
                        </Space>
                      </Card>
                    </Col>

                    {record.optimizationStatus && (
                      <Col span={12}>
                        <Card
                          title="Optimized Listing"
                          style={{ height: "100%" }}
                        >
                          <Space direction="vertical">
                            <div>
                              <Space align="center">
                                <Text strong>Title:</Text>
                                <Button
                                  type="text"
                                  icon={
                                    copiedField === `title-${record.id}` ? (
                                      <Check />
                                    ) : (
                                      <Copy />
                                    )
                                  }
                                  onClick={() =>
                                    copyToClipboard(
                                      record.optimizedTitle || "",
                                      `title-${record.id}`,
                                    )
                                  }
                                />
                              </Space>
                              <Text>{record.optimizedTitle}</Text>
                            </div>
                            <div>
                              <Space align="center">
                                <Text strong>Description:</Text>
                                <Button
                                  type="text"
                                  icon={
                                    copiedField ===
                                    `description-${record.id}` ? (
                                      <Check />
                                    ) : (
                                      <Copy />
                                    )
                                  }
                                  onClick={() =>
                                    copyToClipboard(
                                      record.optimizedDescription || "",
                                      `description-${record.id}`,
                                    )
                                  }
                                />
                              </Space>
                              <div
                                dangerouslySetInnerHTML={sanitizeHtml(
                                  record.optimizedDescription || "",
                                )}
                              />
                            </div>
                            <div>
                              <Space align="center">
                                <Text strong>Tags:</Text>
                                <Button
                                  type="text"
                                  icon={
                                    copiedField === `tags-${record.id}` ? (
                                      <Check />
                                    ) : (
                                      <Copy />
                                    )
                                  }
                                  onClick={() =>
                                    copyToClipboard(
                                      record.optimizedTags || "",
                                      `tags-${record.id}`,
                                    )
                                  }
                                />
                              </Space>
                              <Space wrap>
                                {record.optimizedTags
                                  ?.split(",")
                                  .map((tag: string, index: number) => (
                                    <Tag key={index}>{tag.trim()}</Tag>
                                  ))}
                              </Space>
                            </div>
                          </Space>
                        </Card>
                      </Col>
                    )}
                  </Row>
                )}
              </Card>
            ),
            expandedRowKeys: expandedRows,
            onExpand: (expanded, record) => {
              if (expanded) {
                setExpandedRows([...expandedRows, record.id]);
              } else {
                setExpandedRows(expandedRows.filter((id) => id !== record.id));
              }
            },
          }}
        />
      </Space>

      {/* Add the Tags Collection Modal */}
      <Modal
        title="Tags Collection"
        open={isTagsModalVisible}
        onCancel={() => setIsTagsModalVisible(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input.TextArea
            value={tagCollections}
            onChange={(e) => setTagCollections(e.target.value)}
            placeholder="Add tags collection (comma-separated)"
            autoSize={{ minRows: 4, maxRows: 8 }}
          />
          <Button
            type="primary"
            onClick={async () => {
              if (tagCollections.trim()) {
                await saveTagCollection(tagCollections.trim());
              }
            }}
          >
            Save Collection
          </Button>
        </Space>
      </Modal>
    </div>
  );
};

export default AdminListings;
