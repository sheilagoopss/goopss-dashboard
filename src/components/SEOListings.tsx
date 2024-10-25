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
import { Button } from "antd";
import { useTaskCreate } from "../hooks/useTask";
import { useAuth } from "../contexts/AuthContext";
import { IAdmin } from "../types/Customer";

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
        // Removed the where clause for optimizationStatus
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
          } else if (data.optimizedAt._methodName === "serverTimestamp") {
            optimizedAt = new Date();
          }
        }

        return {
          id: doc.id,
          ...data,
          optimizedAt: optimizedAt,
        } as Listing;
      });
      setAllListings(listingsList);
      applyFiltersAndSort(listingsList);
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
        optimizedAt: currentDate, // Use a JavaScript Date object
      };

      console.log("Data being sent to updateListing:", updateData);
      console.log("Selected listing ID:", selectedListing.id);
      console.log("Customer ID:", customerId);

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

      setAllListings((prevListings) =>
        prevListings.map((l) =>
          l.id === selectedListing.id
            ? {
                ...l,
                ...updateData,
                optimizedAt: currentDate, // Ensure it's updated in local state as well
              }
            : l,
        ),
      );

      // Clear the optimized content and selected listing
      setOptimizedContent(null);
      setSelectedListing(null);
      setEditedTags("");
    } catch (error) {
      console.error("Error saving optimized listing:", error);
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
        "Listing Description": listing.listingDescription || "-",
        "Listing Tags": listing.listingTags || "-",
        "Optimized At": listing.optimizedAt || "-",
        "Optimized Title": listing.optimizedTitle || "-",
        "Optimized Description": listing.optimizedDescription || "-",
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

  useEffect(() => {
    let sorted = [...filteredListings];
    if (sortColumn) {
      sorted.sort((a, b) => {
        if (sortColumn === "optimizedAt") {
          const dateA = a.optimizedAt ? a.optimizedAt.getTime() : 0;
          const dateB = b.optimizedAt ? b.optimizedAt.getTime() : 0;
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        } else {
          return sortDirection === "asc"
            ? a[sortColumn] - b[sortColumn]
            : b[sortColumn] - a[sortColumn];
        }
      });
    }
    setDisplayedListings(sorted.slice(0, LISTINGS_PER_PAGE));
  }, [filteredListings, sortColumn, sortDirection]);

  return (
    <div>
      <h2>SEO Listings for {storeName}</h2>
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", width: "300px" }}>
          <input
            type="text"
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "10px", paddingLeft: "30px" }}
          />
          <Search
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
        </div>
        <div>
          <Button onClick={handleCSVExport}>Export CSV</Button>
          <label style={{ marginRight: "20px" }}>
            <input
              type="checkbox"
              checked={showNonBestsellers}
              onChange={(e) => setShowNonBestsellers(e.target.checked)}
            />
            Show Non-Bestsellers Only
          </label>
          <label>
            <input
              type="checkbox"
              checked={hideOptimized}
              onChange={(e) => setHideOptimized(e.target.checked)}
            />
            Hide Optimized Listings
          </label>
        </div>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "0 8px",
        }}
      >
        <thead>
          <tr>
            <th style={{ padding: "10px", textAlign: "left" }}></th>
            <th style={{ padding: "10px", textAlign: "left" }}>Image</th>
            <th style={{ padding: "10px", textAlign: "left" }}>Listing ID</th>
            <th
              style={{
                padding: "10px",
                textAlign: "left",
                maxWidth: "200px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Title
            </th>
            <th style={{ padding: "10px", textAlign: "left" }}>Status</th>
            <th style={{ padding: "10px", textAlign: "left" }}>Bestseller</th>
            <th
              onClick={() => handleSort("totalSales")}
              style={{ padding: "10px", textAlign: "left", cursor: "pointer" }}
            >
              Total Sales{" "}
              {sortColumn === "totalSales" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th
              onClick={() => handleSort("dailyViews")}
              style={{ padding: "10px", textAlign: "left", cursor: "pointer" }}
            >
              Daily Views{" "}
              {sortColumn === "dailyViews" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th
              onClick={() => handleSort("optimizedAt")}
              style={{ padding: "10px", textAlign: "left", cursor: "pointer" }}
            >
              Optimized Date{" "}
              {sortColumn === "optimizedAt" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th style={{ padding: "10px", textAlign: "left" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={10} style={{ textAlign: "center", padding: "20px" }}>
                <Loader2 style={{ animation: "spin 1s linear infinite" }} />{" "}
                Loading...
              </td>
            </tr>
          ) : (
            displayedListings.map((listing) => (
              <React.Fragment key={listing.id}>
                <tr style={{ backgroundColor: "#f9f9f9" }}>
                  <td style={{ padding: "10px" }}>
                    <button onClick={() => toggleRowExpansion(listing.id)}>
                      {expandedRows.includes(listing.id) ? (
                        <ChevronUp />
                      ) : (
                        <ChevronDown />
                      )}
                    </button>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <img
                      src={listing.primaryImage}
                      alt={listing.listingTitle}
                      style={{ width: "50px", height: "50px" }}
                    />
                  </td>
                  <td style={{ padding: "10px" }}>{listing.listingID}</td>
                  <td
                    style={{
                      padding: "10px",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <a
                      href={getEtsyUrl(listing.listingID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#0066c0",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onClick={(e) => e.stopPropagation()} // Prevent row expansion when clicking the link
                    >
                      {listing.listingTitle}
                      <ExternalLink size={14} style={{ marginLeft: "5px" }} />
                    </a>
                  </td>
                  <td style={{ padding: "10px" }}>
                    {listing.optimizationStatus ? "Optimized" : "Pending"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {listing.bestseller ? "Yes" : "No"}
                  </td>
                  <td style={{ padding: "10px" }}>{listing.totalSales}</td>
                  <td style={{ padding: "10px" }}>{listing.dailyViews}</td>
                  <td style={{ padding: "10px" }}>
                    {formatDate(listing.optimizedAt)}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <button
                      onClick={() => handleOptimize(listing)}
                      disabled={isOptimizing || listing.optimizationStatus}
                    >
                      {isOptimizing ? "Optimizing..." : "Optimize"}
                    </button>
                  </td>
                </tr>
                {expandedRows.includes(listing.id) && (
                  <tr>
                    <td colSpan={10}>
                      <div
                        style={{ padding: "20px", backgroundColor: "#f0f0f0" }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "24px",
                          }}
                        >
                          <div>
                            <h4
                              style={{
                                fontWeight: "bold",
                                marginBottom: "8px",
                              }}
                            >
                              Original Listing
                            </h4>
                            <p>
                              <strong>Title:</strong>
                            </p>
                            <p
                              style={{ marginLeft: "8px", marginBottom: "8px" }}
                            >
                              {listing.listingTitle}
                            </p>
                            <p>
                              <strong>Description:</strong>
                            </p>
                            <div style={{ marginLeft: "8px" }}>
                              <span
                                dangerouslySetInnerHTML={sanitizeHtml(
                                  listing.listingDescription,
                                )}
                              />
                            </div>
                            <div style={{ marginTop: "8px" }}>
                              <strong>Tags:</strong>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "4px",
                                  marginTop: "4px",
                                }}
                              >
                                {listing.listingTags
                                  .split(",")
                                  .map((tag, index) => (
                                    <span
                                      key={index}
                                      style={{
                                        backgroundColor: "#e2e8f0",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                      }}
                                    >
                                      {tag.trim()}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          </div>
                          {listing.optimizationStatus && (
                            <div>
                              <h4
                                style={{
                                  fontWeight: "bold",
                                  marginBottom: "8px",
                                }}
                              >
                                Optimized Listing
                              </h4>
                              <div style={{ marginBottom: "8px" }}>
                                <strong>Title:</strong>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      listing.optimizedTitle || "",
                                      `title-${listing.id}`,
                                    )
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    float: "right",
                                  }}
                                >
                                  {copiedField === `title-${listing.id}` ? (
                                    <Check size={16} color="green" />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                </button>
                                <p
                                  style={{
                                    marginLeft: "8px",
                                    marginTop: "4px",
                                  }}
                                >
                                  {listing.optimizedTitle}
                                </p>
                              </div>
                              <div style={{ marginBottom: "8px" }}>
                                <strong>Description:</strong>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      listing.optimizedDescription || "",
                                      `description-${listing.id}`,
                                    )
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    float: "right",
                                  }}
                                >
                                  {copiedField ===
                                  `description-${listing.id}` ? (
                                    <Check size={16} color="green" />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                </button>
                                <div
                                  style={{
                                    marginLeft: "8px",
                                    marginTop: "4px",
                                  }}
                                >
                                  <span
                                    dangerouslySetInnerHTML={sanitizeHtml(
                                      listing.optimizedDescription || "",
                                    )}
                                  />
                                </div>
                              </div>
                              <div style={{ marginTop: "8px" }}>
                                <strong>Tags:</strong>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      listing.optimizedTags || "",
                                      `tags-${listing.id}`,
                                    )
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    float: "right",
                                  }}
                                >
                                  {copiedField === `tags-${listing.id}` ? (
                                    <Check size={16} color="green" />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                </button>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "4px",
                                    marginTop: "4px",
                                  }}
                                >
                                  {listing.optimizedTags
                                    ?.split(",")
                                    .map((tag, index) => (
                                      <span
                                        key={index}
                                        style={{
                                          backgroundColor: "#e2e8f0",
                                          padding: "2px 6px",
                                          borderRadius: "4px",
                                          fontSize: "12px",
                                        }}
                                      >
                                        {tag.trim()}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>
          <ChevronLeft /> Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>
          Next <ChevronRight />
        </button>
      </div>

      {/* Optimized Content Area */}
      {selectedListing && optimizedContent && (
        <div
          style={{
            marginTop: "40px",
            padding: "20px",
            backgroundColor: "#f0f0f0",
            borderRadius: "8px",
          }}
        >
          <h2 className="text-xl font-semibold mb-4">
            Listing Optimization Results
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            <div>
              <h3 className="font-medium text-lg mb-2">Original Listing</h3>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "16px",
                  borderRadius: "4px",
                }}
              >
                <h4 className="font-medium">Title:</h4>
                <p className="mb-2">{selectedListing.listingTitle}</p>
                <h4 className="font-medium">Description:</h4>
                <p
                  dangerouslySetInnerHTML={sanitizeHtml(
                    selectedListing.listingDescription,
                  )}
                />
                <h4 className="font-medium mt-2">Tags:</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedListing.listingTags.split(",").map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: "#e2e8f0",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-2">Optimized Listing</h3>
              <div
                style={{
                  backgroundColor: "#f0fff4",
                  padding: "16px",
                  borderRadius: "4px",
                }}
              >
                <h4 className="font-medium">Title:</h4>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    value={optimizedContent.title}
                    onChange={(e) =>
                      setOptimizedContent({
                        ...optimizedContent,
                        title: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(optimizedContent.title, "title")
                    }
                    style={{
                      padding: "4px",
                      backgroundColor:
                        recentlyCopied === "title" ? "#4CAF50" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "background-color 0.3s ease",
                    }}
                  >
                    <Copy
                      size={16}
                      color={recentlyCopied === "title" ? "white" : "black"}
                    />
                  </button>
                  <button
                    style={{
                      padding: "4px",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Edit size={16} />
                  </button>
                </div>
                <h4 className="font-medium">Description:</h4>
                <div
                  style={{ display: "flex", alignItems: "start", gap: "8px" }}
                >
                  <textarea
                    value={optimizedContent.description}
                    onChange={(e) =>
                      setOptimizedContent({
                        ...optimizedContent,
                        description: e.target.value,
                      })
                    }
                    rows={20} // Increased from 10 to 20
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      minHeight: "400px", // Increased from 200px to 400px
                      resize: "vertical", // Allows vertical resizing
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() =>
                        copyToClipboard(
                          optimizedContent.description,
                          "description",
                        )
                      }
                      style={{
                        padding: "4px",
                        backgroundColor:
                          recentlyCopied === "description"
                            ? "#4CAF50"
                            : "transparent",
                        border: "none",
                        cursor: "pointer",
                        transition: "background-color 0.3s ease",
                      }}
                    >
                      <Copy
                        size={16}
                        color={
                          recentlyCopied === "description" ? "white" : "black"
                        }
                      />
                    </button>
                    <button
                      style={{
                        padding: "4px",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
                <h4 className="font-medium mt-2">Tags:</h4>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "8px",
                    alignItems: "center",
                  }}
                >
                  {editedTags.split(",").map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: "#e2e8f0",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {tag.trim()}
                      <button
                        onClick={() => handleRemoveTag(tag.trim())}
                        style={{
                          fontSize: "12px",
                          marginLeft: "4px",
                          cursor: "pointer",
                          border: "none",
                          background: "none",
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => copyToClipboard(editedTags, "tags")}
                    style={{
                      padding: "4px",
                      backgroundColor:
                        recentlyCopied === "tags" ? "#4CAF50" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      marginLeft: "8px",
                      transition: "background-color 0.3s ease",
                    }}
                    title="Copy all tags"
                  >
                    <Copy
                      size={16}
                      color={recentlyCopied === "tags" ? "white" : "black"}
                    />
                  </button>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    placeholder="Add new tag(s)"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const newTags = e.currentTarget.value.trim();
                        if (newTags) {
                          handleAddTag(newTags);
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                    disabled={
                      editedTags.split(",").filter((tag) => tag.trim() !== "")
                        .length >= MAX_TAGS
                    }
                  />
                  <button
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
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#e2e8f0",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    disabled={
                      editedTags.split(",").filter((tag) => tag.trim() !== "")
                        .length >= MAX_TAGS
                    }
                  >
                    Add Tag(s)
                  </button>
                </div>
                {editedTags.split(",").filter((tag) => tag.trim() !== "")
                  .length >= MAX_TAGS && (
                  <p style={{ color: "red", marginTop: "8px" }}>
                    Maximum number of tags (13) reached.
                  </p>
                )}
              </div>
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  onClick={handleCancel}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPublishing}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {isPublishing ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOListings;
