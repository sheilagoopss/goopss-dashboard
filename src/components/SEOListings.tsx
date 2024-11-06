import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  limit,
  startAfter,
  orderBy,
  getCountFromServer,
  where,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Edit,
  Copy,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";
import DOMPurify from "dompurify";
import { optimizeText } from "../services/OptimizationService";
import { useListingUpdate } from "../hooks/useListing";
import { Listing } from "../types/Listing";
import Papa from "papaparse";
import dayjs from "dayjs";
import { Button, Input, Table, Tag, Space, Card, Tabs, Divider, Typography, Checkbox, message, Image, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTaskCreate } from "../hooks/useTask";
import { useAuth } from "../contexts/AuthContext";
import { IAdmin } from "../types/Customer";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface SEOListingsProps {
  customerId: string;
  storeName: string;
}

const formatDate = (date: Date | null): string => {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const SEOListings: React.FC<SEOListingsProps> = ({ customerId, storeName }) => {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [displayedListings, setDisplayedListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<
    "totalSales" | "dailyViews" | "optimizedAt" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showNonBestsellers, setShowNonBestsellers] = useState(false);
  const [hideOptimized, setHideOptimized] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [optimizedListings, setOptimizedListings] = useState<{
    [key: string]: Listing;
  }>({});
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [optimizedContent, setOptimizedContent] = useState<{
    title: string;
    description: string;
    tags: string;
  } | null>(null);
  const [editedTags, setEditedTags] = useState("");
  const [recentlyCopied, setRecentlyCopied] = useState<string | null>(null);
  const { createTask } = useTaskCreate();
  const { user } = useAuth();

  const LISTINGS_PER_PAGE = 10; // Changed from 5 to 10

  const MAX_TAGS = 13;

  const [copiedField, setCopiedField] = useState<string | null>(null);

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
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");
    const tagsToAdd = newTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const availableSlots = MAX_TAGS - currentTags.length;
    const tagsToAddLimited = tagsToAdd.slice(0, availableSlots);

    const updatedTags = [...new Set([...currentTags, ...tagsToAddLimited])];
    setEditedTags(updatedTags.join(", "));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = editedTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== tagToRemove);
    setEditedTags(updatedTags.join(", "));
  };

  useEffect(() => {
    if (customerId) {
      fetchAllListings();
    }
  }, [customerId]);

  const fetchAllListings = async () => {
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
          if (data.optimizedAt.toDate && typeof data.optimizedAt.toDate === "function") {
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
  };

  const applyFiltersAndSort = (listings: Listing[]) => {
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
    setTotalPages(Math.ceil(filtered.length / LISTINGS_PER_PAGE));
    setCurrentPage(1);
  };

  const updateDisplayedListings = (listings: Listing[], page: number) => {
    const startIndex = (page - 1) * LISTINGS_PER_PAGE;
    const endIndex = startIndex + LISTINGS_PER_PAGE;
    setDisplayedListings(listings.slice(startIndex, endIndex));
    setCurrentPage(page);
  };

  useEffect(() => {
    applyFiltersAndSort(allListings);
  }, [
    searchTerm,
    showNonBestsellers,
    hideOptimized,
    sortColumn,
    sortDirection,
  ]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      updateDisplayedListings(filteredListings, currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      updateDisplayedListings(filteredListings, currentPage - 1);
    }
  };

  const handleSort = (column: "totalSales" | "dailyViews" | "optimizedAt") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const toggleRowExpansion = (listingId: string) => {
    setExpandedRows((prev) =>
      prev.includes(listingId)
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId],
    );
  };

  const brToNewline = (text: string) => {
    return text.replace(/<br\s*\/?>/g, "\n");
  };

  const newlineToBr = (text: string) => {
    return text.replace(/\n/g, "<br>");
  };

  const handleOptimize = async (listing: Listing) => {
    setIsOptimizing(true);
    try {
      const storeUrl = `https://${storeName}.etsy.com`;
      const optimizedData = await optimizeText(
        listing.listingTitle,
        listing.listingDescription,
        1,
        storeUrl,
      );
      setSelectedListing(listing);
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
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedListing || !optimizedContent) return;

    setIsPublishing(true);
    try {
      const currentDate = new Date();
      const updateData = {
        optimizedTitle: optimizedContent.title,
        optimizedDescription: newlineToBr(optimizedContent.description),
        optimizedTags: editedTags,
        optimizationStatus: true,
        optimizedAt: currentDate,
      };

      const listingRef = doc(db, "listings", selectedListing.id);
      await updateDoc(listingRef, updateData);

      await createTask({
        customerId: customerId,
        taskName: `Optimized Listing`,
        teamMemberName: (user as IAdmin)?.name || user?.email || "",
        dateCompleted: serverTimestamp(),
        listingId: selectedListing.listingID,
        isDone: true,
        category: "Optimization",
      });

      // Update local states
      setAllListings(prevListings =>
        prevListings.map(l =>
          l.id === selectedListing.id
            ? { ...l, ...updateData, optimizedAt: currentDate }
            : l
        )
      );

      setDisplayedListings(prevListings =>
        prevListings.map(l =>
          l.id === selectedListing.id
            ? { ...l, ...updateData, optimizedAt: currentDate }
            : l
        )
      );

      setFilteredListings(prevListings =>
        prevListings.map(l =>
          l.id === selectedListing.id
            ? { ...l, ...updateData, optimizedAt: currentDate }
            : l
        )
      );

      // Clear the optimization form
      setOptimizedContent(null);
      setSelectedListing(null);
      setEditedTags("");

      message.success('Listing optimized successfully');
    } catch (error) {
      console.error("Error saving optimized listing:", error);
      message.error('Failed to optimize listing');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCancel = () => {
    setOptimizedContent(null);
    setSelectedListing(null);
    setEditedTags("");
  };

  // Replace the optimizeListing function with this simplified version
  const optimizeListing = async (listing: Listing) => {
    // Simple function to generate a mock optimized title
    const generateOptimizedTitle = (originalTitle: string) => {
      return `Improved ${originalTitle} - Best Seller!`;
    };

    // Simple function to generate a mock optimized description
    const generateOptimizedDescription = (originalDescription: string) => {
      return `${originalDescription}\n\nEnhanced product features for better customer satisfaction. Limited time offer!`;
    };

    // Simple function to generate mock optimized tags
    const generateOptimizedTags = (originalTags: string) => {
      const tagArray = originalTags.split(",").map((tag) => tag.trim());
      const newTags = ["bestseller", "top-rated", "premium"];
      return [...new Set([...tagArray, ...newTags])].join(", ");
    };

    const optimizedTitle = generateOptimizedTitle(listing.listingTitle);
    const optimizedDescription = generateOptimizedDescription(
      listing.listingDescription,
    );
    const optimizedTags = generateOptimizedTags(listing.listingTags);

    return {
      title: optimizedTitle,
      description: optimizedDescription,
      tags: optimizedTags,
    };
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
          .replace(/<br\s*\/?>/gi, '\n')  // Case insensitive match
          .replace(/&nbsp;/g, ' ')        // Replace &nbsp; with spaces
          .replace(/<[^>]*>/g, ''),       // Remove any other HTML tags
        "Listing Tags": listing.listingTags || "-",
        "Optimized At": listing.optimizedAt || "-",
        "Optimized Title": listing.optimizedTitle || "-",
        "Optimized Description": (listing.optimizedDescription || "-")
          .replace(/<br\s*\/?>/gi, '\n')  // Case insensitive match
          .replace(/&nbsp;/g, ' ')        // Replace &nbsp; with spaces
          .replace(/<[^>]*>/g, ''),       // Remove any other HTML tags
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

  // Add state for segment
  const [selectedSegment, setSelectedSegment] = useState<'optimization' | 'duplication'>('optimization');

  // Define table columns
  const columns = [
    {
      title: '',
      key: 'expand',
      width: 50,
      render: (_: unknown, record: Listing) => (
        <Button
          type="text"
          icon={expandedRows.includes(record.id) ? <ChevronUp /> : <ChevronDown />}
          onClick={() => toggleRowExpansion(record.id)}
        />
      ),
    },
    {
      title: 'Image',
      key: 'image',
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
      title: 'Listing ID',
      dataIndex: 'listingID',
      key: 'listingID',
    },
    {
      title: 'Title',
      dataIndex: 'listingTitle',
      key: 'title',
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
      title: 'Status',
      key: 'status',
      render: (record: Listing) => (
        <Tag color={record.optimizationStatus ? 'success' : 'warning'}>
          {record.optimizationStatus ? 'Optimized' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Bestseller',
      key: 'bestseller',
      render: (record: Listing) => (
        <Tag color={record.bestseller ? 'gold' : 'default'}>
          {record.bestseller ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Total Sales',
      dataIndex: 'totalSales',
      key: 'totalSales',
      sorter: (a: Listing, b: Listing) => (a.totalSales || 0) - (b.totalSales || 0),
    },
    {
      title: 'Daily Views',
      dataIndex: 'dailyViews',
      key: 'dailyViews',
      sorter: (a: Listing, b: Listing) => (a.dailyViews || 0) - (b.dailyViews || 0),
    },
    {
      title: 'Optimized Date',
      key: 'optimizedAt',
      dataIndex: 'optimizedAt',
      render: (_: any, record: Listing) => formatDate(record.optimizedAt),
      sorter: {
        compare: (a: Listing, b: Listing) => {
          if (!a.optimizedAt && !b.optimizedAt) return 0;
          if (!a.optimizedAt) return -1;
          if (!b.optimizedAt) return 1;
          return a.optimizedAt.getTime() - b.optimizedAt.getTime();
        },
        multiple: 1
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Listing) => (
        <Button
          onClick={() => handleOptimize(record)}
          disabled={isOptimizing || record.optimizationStatus}
          type="primary"
        >
          {isOptimizing ? 'Optimizing...' : 'Optimize'}
        </Button>
      ),
    },
  ];

  // Add this useEffect to handle search and filters
  useEffect(() => {
    let filtered = [...allListings];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.listingID.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply non-bestsellers filter
    if (showNonBestsellers) {
      filtered = filtered.filter(listing => !listing.bestseller);
    }

    // Apply hide optimized filter
    if (hideOptimized) {
      filtered = filtered.filter(listing => !listing.optimizationStatus);
    }

    setFilteredListings(filtered);
    setDisplayedListings(filtered.slice(0, LISTINGS_PER_PAGE));
    setCurrentPage(1);  // Reset to first page when filters change
  }, [searchTerm, showNonBestsellers, hideOptimized, allListings]);

  return (
    <div>
      <Title level={2}>SEO Listings for {storeName}</Title>
      
      <Tabs 
        activeKey={selectedSegment} 
        onChange={(key) => setSelectedSegment(key as 'optimization' | 'duplication')}
      >
        <TabPane tab="Optimization" key="optimization">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
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
                if (!Array.isArray(sorter) && 'field' in sorter && sorter.order) {
                  const field = sorter.field as "totalSales" | "dailyViews" | "optimizedAt";
                  const order = sorter.order === 'ascend' ? 'asc' : 'desc';
                  
                  // Sort all listings
                  const sortedListings = [...allListings].sort((a, b) => {
                    if (field === "optimizedAt") {
                      if (!a.optimizedAt && !b.optimizedAt) return 0;
                      if (!a.optimizedAt) return order === 'asc' ? -1 : 1;
                      if (!b.optimizedAt) return order === 'asc' ? 1 : -1;
                      return order === 'asc'
                        ? a.optimizedAt.getTime() - b.optimizedAt.getTime()
                        : b.optimizedAt.getTime() - a.optimizedAt.getTime();
                    }
                    
                    const valueA = a[field] || 0;
                    const valueB = b[field] || 0;
                    return order === 'asc' ? valueA - valueB : valueB - valueA;
                  });

                  // Apply filters
                  let filtered = sortedListings;
                  if (searchTerm) {
                    filtered = filtered.filter(listing =>
                      listing.listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      listing.listingID.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                  }
                  if (showNonBestsellers) {
                    filtered = filtered.filter(listing => !listing.bestseller);
                  }
                  if (hideOptimized) {
                    filtered = filtered.filter(listing => !listing.optimizationStatus);
                  }

                  setFilteredListings(filtered);
                  setDisplayedListings(filtered.slice(startIndex, endIndex));
                  setCurrentPage(page);
                  setSortColumn(field);
                  setSortDirection(order);
                } else {
                  // Just handle pagination without sorting
                  setDisplayedListings(filteredListings.slice(startIndex, endIndex));
                  setCurrentPage(page);
                }
              }}
              pagination={{
                current: currentPage,
                pageSize: LISTINGS_PER_PAGE,
                total: filteredListings.length,
                showSizeChanger: false  // Add this to fix page size
              }}
              expandable={{
                expandedRowRender: (record) => (
                  <Card>
                    {selectedListing?.id === record.id && optimizedContent ? (
                      // Optimization form layout
                      <Row gutter={24}>
                        {/* Original Listing - Left Side */}
                        <Col span={12}>
                          <Card title="Original Listing" style={{ height: '100%' }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <div>
                                <Text strong>Title:</Text>
                                <div style={{ marginLeft: 8 }}>{record.listingTitle}</div>
                              </div>
                              <div>
                                <Text strong>Description:</Text>
                                <div style={{ marginLeft: 8 }} dangerouslySetInnerHTML={sanitizeHtml(record.listingDescription)} />
                              </div>
                              <div>
                                <Text strong>Tags:</Text>
                                <div style={{ marginLeft: 8 }}>
                                  <Space wrap>
                                    {record.listingTags.split(',').map((tag, index) => (
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
                                <Button onClick={handleCancel}>
                                  Cancel
                                </Button>
                                <Button
                                  type="primary"
                                  onClick={handleSave}
                                  loading={isPublishing}
                                >
                                  Save
                                </Button>
                              </Space>
                            }
                            style={{ height: '100%' }}
                          >
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <div>
                                <Space align="center">
                                  <Text strong>Title:</Text>
                                  <Button 
                                    type="text" 
                                    icon={copiedField === `title-${record.id}` ? <Check /> : <Copy />}
                                    onClick={() => copyToClipboard(optimizedContent.title, `title-${record.id}`)}
                                  />
                                </Space>
                                <Input
                                  value={optimizedContent.title}
                                  onChange={(e) => setOptimizedContent({
                                    ...optimizedContent,
                                    title: e.target.value,
                                  })}
                                  style={{ width: '100%' }}
                                />
                              </div>
                              <div>
                                <Space align="center">
                                  <Text strong>Description:</Text>
                                  <Button 
                                    type="text" 
                                    icon={copiedField === `description-${record.id}` ? <Check /> : <Copy />}
                                    onClick={() => copyToClipboard(optimizedContent.description, `description-${record.id}`)}
                                  />
                                </Space>
                                <Input.TextArea
                                  value={optimizedContent.description}
                                  onChange={(e) => setOptimizedContent({
                                    ...optimizedContent,
                                    description: e.target.value,
                                  })}
                                  rows={10}
                                />
                              </div>
                              <div>
                                <Space align="center">
                                  <Text strong>Tags:</Text>
                                  <Button 
                                    type="text" 
                                    icon={copiedField === `tags-${record.id}` ? <Check /> : <Copy />}
                                    onClick={() => copyToClipboard(editedTags, `tags-${record.id}`)}
                                  />
                                </Space>
                                <div>
                                  <Space wrap style={{ marginBottom: 8 }}>
                                    {editedTags.split(',').map((tag, index) => (
                                      <Tag 
                                        key={index}
                                        closable
                                        onClose={() => handleRemoveTag(tag.trim())}
                                      >
                                        {tag.trim()}
                                      </Tag>
                                    ))}
                                  </Space>
                                </div>
                                <Space>
                                  <Input
                                    placeholder="Add new tag(s)"
                                    onPressEnter={(e) => {
                                      const newTags = e.currentTarget.value.trim();
                                      if (newTags) {
                                        handleAddTag(newTags);
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                    disabled={editedTags.split(',').filter(tag => tag.trim() !== '').length >= MAX_TAGS}
                                  />
                                  <Button
                                    onClick={() => {
                                      const input = document.querySelector('input[placeholder="Add new tag(s)"]') as HTMLInputElement;
                                      const newTags = input.value.trim();
                                      if (newTags) {
                                        handleAddTag(newTags);
                                        input.value = '';
                                      }
                                    }}
                                    disabled={editedTags.split(',').filter(tag => tag.trim() !== '').length >= MAX_TAGS}
                                  >
                                    Add Tag(s)
                                  </Button>
                                </Space>
                                {editedTags.split(',').filter(tag => tag.trim() !== '').length >= MAX_TAGS && (
                                  <Text type="danger" style={{ marginTop: 8, display: 'block' }}>
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
                          <Card title="Original Listing" style={{ height: '100%' }}>
                            <Space direction="vertical">
                              <Text strong>Title:</Text>
                              <Text>{record.listingTitle}</Text>
                              <Text strong>Description:</Text>
                              <div dangerouslySetInnerHTML={sanitizeHtml(record.listingDescription)} />
                              <Text strong>Tags:</Text>
                              <Space wrap>
                                {record.listingTags.split(',').map((tag, index) => (
                                  <Tag key={index}>{tag.trim()}</Tag>
                                ))}
                              </Space>
                            </Space>
                          </Card>
                        </Col>

                        {record.optimizationStatus && (
                          <Col span={12}>
                            <Card title="Optimized Listing" style={{ height: '100%' }}>
                              <Space direction="vertical">
                                <div>
                                  <Space align="center">
                                    <Text strong>Title:</Text>
                                    <Button 
                                      type="text" 
                                      icon={copiedField === `title-${record.id}` ? <Check /> : <Copy />}
                                      onClick={() => copyToClipboard(record.optimizedTitle || '', `title-${record.id}`)}
                                    />
                                  </Space>
                                  <Text>{record.optimizedTitle}</Text>
                                </div>
                                <div>
                                  <Space align="center">
                                    <Text strong>Description:</Text>
                                    <Button 
                                      type="text" 
                                      icon={copiedField === `description-${record.id}` ? <Check /> : <Copy />}
                                      onClick={() => copyToClipboard(record.optimizedDescription || '', `description-${record.id}`)}
                                    />
                                  </Space>
                                  <div dangerouslySetInnerHTML={sanitizeHtml(record.optimizedDescription || '')} />
                                </div>
                                <div>
                                  <Space align="center">
                                    <Text strong>Tags:</Text>
                                    <Button 
                                      type="text" 
                                      icon={copiedField === `tags-${record.id}` ? <Check /> : <Copy />}
                                      onClick={() => copyToClipboard(record.optimizedTags || '', `tags-${record.id}`)}
                                    />
                                  </Space>
                                  <Space wrap>
                                    {record.optimizedTags?.split(',').map((tag, index) => (
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
              }}
            />
          </Space>
        </TabPane>

        <TabPane tab="Duplication" key="duplication">
          <Card>
            <Title level={3}>Duplication Feature Coming Soon</Title>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default SEOListings;
