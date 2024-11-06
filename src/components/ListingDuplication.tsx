import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Space, Button, Tag, message, Typography, Row, Col, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Listing } from '../types/Listing';
import { useAuth } from '../contexts/AuthContext';
import { IAdmin } from '../types/Customer';
import { useTaskCreate } from '../hooks/useTask';
import DOMPurify from 'dompurify';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { optimizeText } from '../services/OptimizationService';
import Papa from 'papaparse';
import dayjs from 'dayjs';

const { Text } = Typography;
const LISTINGS_PER_PAGE = 10;
const MAX_TAGS = 13;

// Helper functions
const formatDate = (date: Date | Timestamp | null | undefined): string => {
  if (!date) return "";
  
  if ('toDate' in date && typeof date.toDate === "function") {
    return date.toDate().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  
  if (date instanceof Date) {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  if ('seconds' in date) {
    return new Date(date.seconds * 1000).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  return "";
};

const sanitizeHtml = (html: string) => {
  return {
    __html: DOMPurify.sanitize(html, { ALLOWED_TAGS: ["br"] }),
  };
};

const brToNewline = (text: string) => {
  return text.replace(/<br\s*\/?>/g, "\n");
};

const newlineToBr = (text: string) => {
  return text.replace(/\n/g, "<br>");
};

const getEtsyUrl = (listingID: string) => {
  return `https://www.etsy.com/listing/${listingID}`;
};

// Component interface
interface ListingDuplicationProps {
  customerId: string;
  storeName: string;
}

const ListingDuplication: React.FC<ListingDuplicationProps> = ({ customerId, storeName }) => {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [displayedListings, setDisplayedListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [optimizedContent, setOptimizedContent] = useState<{
    title: string;
    description: string;
    tags: string;
  } | null>(null);
  const [editedTags, setEditedTags] = useState('');
  const [section, setSection] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showBestsellers, setShowBestsellers] = useState(false);
  const [hideDuplicated, setHideDuplicated] = useState(false);
  const [newListingId, setNewListingId] = useState('');
  const { createTask } = useTaskCreate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchListings = async () => {
      if (!customerId) return;

      setIsLoading(true);
      try {
        const listingsRef = collection(db, 'listings');
        const q = query(listingsRef, where('customer_id', '==', customerId));
        const querySnapshot = await getDocs(q);
        const listingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Listing[];

        setAllListings(listingsData);
        setFilteredListings(listingsData);
        setDisplayedListings(listingsData.slice(0, LISTINGS_PER_PAGE));
      } catch (error) {
        console.error('Error fetching listings:', error);
        message.error('Failed to fetch listings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [customerId]);

  // Search and filter effect
  useEffect(() => {
    let filtered = [...allListings];
    
    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.listingID.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showBestsellers) {
      filtered = filtered.filter(listing => listing.bestseller);
    }

    if (hideDuplicated) {
      filtered = filtered.filter(listing => !listing.duplicationStatus);
    }

    setFilteredListings(filtered);
    setDisplayedListings(filtered.slice(0, LISTINGS_PER_PAGE));
    setCurrentPage(1);
  }, [searchTerm, showBestsellers, hideDuplicated, allListings]);

  const handleDuplicate = async (listing: Listing) => {
    setIsDuplicating(true);
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
      console.error("Error duplicating listing:", error);
      message.error('Failed to duplicate listing');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleSaveDuplication = async () => {
    if (!selectedListing || !optimizedContent || !newListingId.trim()) {
      message.error('Please enter a new listing ID');
      return;
    }
    
    setIsPublishing(true);
    try {
      const currentDate = new Date();
      const updateData: any = {
        listingTitle: optimizedContent.title,
        listingDescription: newlineToBr(optimizedContent.description),
        listingTags: editedTags,
        duplicationStatus: true,
        duplicatedAt: currentDate,
      };

      // Only add section if it has a value
      if (section.trim()) {
        updateData.section = section.trim();
      }

      const listingRef = doc(db, "listings", selectedListing.id);
      await updateDoc(listingRef, updateData);

      await createTask({
        customerId: customerId,
        taskName: `Duplicated Listing`,
        teamMemberName: (user as IAdmin)?.name || user?.email || "",
        dateCompleted: serverTimestamp(),
        listingId: selectedListing.listingID,
        isDone: true,
        category: "Duplication",
      });

      // Update local states
      setAllListings(prevListings =>
        prevListings.map(l =>
          l.id === selectedListing.id
            ? { ...l, ...updateData, duplicatedAt: currentDate }
            : l
        )
      );

      setDisplayedListings(prevListings =>
        prevListings.map(l =>
          l.id === selectedListing.id
            ? { ...l, ...updateData, duplicatedAt: currentDate }
            : l
        )
      );

      setFilteredListings(prevListings =>
        prevListings.map(l =>
          l.id === selectedListing.id
            ? { ...l, ...updateData, duplicatedAt: currentDate }
            : l
        )
      );

      // Clear the form
      setOptimizedContent(null);
      setSelectedListing(null);
      setEditedTags("");
      setSection("");

      message.success('Listing duplicated successfully');
    } catch (error) {
      console.error("Error saving duplicated listing:", error);
      message.error('Failed to duplicate listing');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCancel = () => {
    setOptimizedContent(null);
    setSelectedListing(null);
    setEditedTags("");
    setSection("");
    setNewListingId("");
  };

  const copyToClipboard = (text: string, field: string) => {
    let formattedText = text;
    if (field.includes("description")) {
      formattedText = text.replace(/<br\s*\/?>/g, "\n");
    }
    navigator.clipboard.writeText(formattedText);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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

  const handleCSVExport = () => {
    const csvData = allListings
      .filter((list) => list.duplicationStatus && list.duplicatedAt)
      .map((listing) => ({
        "Listing ID": listing.listingID || "-",
        "Listing Title": listing.listingTitle || "-",
        "Listing Description": (listing.listingDescription || "-")
          .replace(/<br\s*\/?>/gi, '\n')  // Case insensitive match
          .replace(/&nbsp;/g, ' ')        // Replace &nbsp; with spaces
          .replace(/<[^>]*>/g, ''),       // Remove any other HTML tags
        "Listing Tags": listing.listingTags || "-",
        "Duplicated At": listing.duplicatedAt || "-",
        "Section": listing.section || "-",
      }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `duplication_list_${dayjs().toISOString()}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const columns = [
    {
      title: 'Image',
      key: 'image',
      width: 80,
      render: (record: Listing) => (
        <img
          src={record.primaryImage}
          alt={record.listingTitle}
          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '4px' }}
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
        <a href={getEtsyUrl(record.listingID)} target="_blank" rel="noopener noreferrer">
          {text}
          <ExternalLink size={14} style={{ marginLeft: 4 }} />
        </a>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: Listing) => (
        <Tag color={record.duplicationStatus ? 'success' : 'warning'}>
          {record.duplicationStatus ? 'Duplicated' : 'Pending'}
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
      title: 'Duplicated Date',
      key: 'duplicatedAt',
      dataIndex: 'duplicatedAt',
      render: (_: any, record: Listing) => formatDate(record.duplicatedAt),
      sorter: {
        compare: (a: Listing, b: Listing) => {
          if (!a.duplicatedAt && !b.duplicatedAt) return 0;
          if (!a.duplicatedAt) return -1;
          if (!b.duplicatedAt) return 1;
          return a.duplicatedAt.getTime() - b.duplicatedAt.getTime();
        },
        multiple: 1
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Listing) => (
        <Button
          onClick={() => handleDuplicate(record)}
          loading={isDuplicating}
          type="primary"
        >
          {isDuplicating ? 'Duplicating...' : 'Duplicate'}
        </Button>
      ),
    },
  ];

  return (
    <Card title={`Listing Duplication - ${storeName}`}>
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
                checked={showBestsellers}
                onChange={(e) => setShowBestsellers(e.target.checked)}
              >
                Show Bestsellers Only
              </Checkbox>
              <Checkbox
                checked={hideDuplicated}
                onChange={(e) => setHideDuplicated(e.target.checked)}
              >
                Hide Duplicated Listings
              </Checkbox>
            </Space>
          </Space>
        </Card>

        <Table
          columns={columns}
          dataSource={displayedListings}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: LISTINGS_PER_PAGE,
            total: filteredListings.length,
            onChange: (page) => {
              const startIndex = (page - 1) * LISTINGS_PER_PAGE;
              setDisplayedListings(filteredListings.slice(startIndex, startIndex + LISTINGS_PER_PAGE));
              setCurrentPage(page);
            },
          }}
          expandable={{
            expandedRowRender: (record) => (
              <Card>
                {selectedListing?.id === record.id && optimizedContent ? (
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

                    {/* Duplicated Listing - Right Side */}
                    <Col span={12}>
                      <Card 
                        title="Duplicated Listing"
                        extra={
                          <Space>
                            <Button onClick={handleCancel}>
                              Cancel
                            </Button>
                            <Button
                              type="primary"
                              onClick={handleSaveDuplication}
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
                            <Text strong>New Listing ID: <span style={{ color: '#ff4d4f' }}>*</span></Text>
                            <Input
                              value={newListingId}
                              onChange={(e) => setNewListingId(e.target.value)}
                              placeholder="Enter new listing ID"
                              style={{ width: '100%', marginBottom: '16px' }}
                              required
                              status={isPublishing && !newListingId ? 'error' : undefined}
                            />
                            {isPublishing && !newListingId && (
                              <Text type="danger" style={{ display: 'block', marginTop: -12, marginBottom: 16 }}>
                                Please enter a new listing ID
                              </Text>
                            )}
                          </div>
                          <div>
                            <Text strong>Section:</Text>
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                              If you're adding this duplicate to another section, input the section name here
                            </Text>
                            <Input
                              value={section}
                              onChange={(e) => setSection(e.target.value)}
                              placeholder="Enter section name (optional)"
                              style={{ width: '100%' }}
                            />
                          </div>
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
                  // Regular view layout (when not duplicating)
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

                    {record.duplicationStatus && (
                      <Col span={12}>
                        <Card title="Duplicated Listing" style={{ height: '100%' }}>
                          <Space direction="vertical">
                            <div>
                              <Text strong>Title:</Text>
                              <Text>{record.listingTitle}</Text>
                            </div>
                            <div>
                              <Text strong>Description:</Text>
                              <div dangerouslySetInnerHTML={sanitizeHtml(record.listingDescription)} />
                            </div>
                            <div>
                              <Text strong>Tags:</Text>
                              <Space wrap>
                                {record.listingTags.split(',').map((tag, index) => (
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
                setExpandedRows(expandedRows.filter(id => id !== record.id));
              }
            },
          }}
        />
      </Space>
    </Card>
  );
};

export default ListingDuplication; 