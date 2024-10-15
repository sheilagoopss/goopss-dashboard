import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, startAfter, orderBy, getCountFromServer, where, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ChevronDown, ChevronUp, Edit, Copy, Check, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify'; // You'll need to install this package: npm install dompurify @types/dompurify

interface SEOListingsProps {
  customerId: string;
  storeName: string;
}

interface Listing {
  id: string;
  listingID: string;
  listingTitle: string;
  listingDescription: string;
  primaryImage: string;
  listingTags: string;
  optimizationStatus: boolean;
  optimizedAt?: Date;  // New field
  bestseller: boolean;
  totalSales: number;
  dailyViews: number;
  optimizedTitle?: string;
  optimizedDescription?: string;
  optimizedTags?: string;
}

const SEOListings: React.FC<SEOListingsProps> = ({ customerId, storeName }) => {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [displayedListings, setDisplayedListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<"totalSales" | "dailyViews" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showNonBestsellers, setShowNonBestsellers] = useState(false);
  const [hideOptimized, setHideOptimized] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [optimizedListings, setOptimizedListings] = useState<{[key: string]: Listing}>({});
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [optimizedContent, setOptimizedContent] = useState<{ title: string; description: string; tags: string } | null>(null);
  const [editedTags, setEditedTags] = useState('');
  const LISTINGS_PER_PAGE = 5;

  useEffect(() => {
    if (customerId) {
      fetchAllListings();
    }
  }, [customerId]);

  const fetchAllListings = async () => {
    setIsLoading(true);
    try {
      const listingsCollection = collection(db, 'listings');
      const q = query(listingsCollection, where('customer_id', '==', customerId));
      const listingsSnapshot = await getDocs(q);
      const listingsList = listingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Listing));
      setAllListings(listingsList);
      applyFiltersAndSort(listingsList);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = (listings: Listing[]) => {
    let filtered = [...listings];
    
    if (showNonBestsellers) {
      filtered = filtered.filter(listing => !listing.bestseller);
    }
    if (hideOptimized) {
      filtered = filtered.filter(listing => !listing.optimizationStatus);
    }
    filtered = filtered.filter(listing => 
      listing.listingID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.listingTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortColumn) {
      filtered.sort((a, b) => {
        if (sortDirection === "asc") {
          return a[sortColumn] - b[sortColumn];
        } else {
          return b[sortColumn] - a[sortColumn];
        }
      });
    }

    setFilteredListings(filtered);
    setTotalPages(Math.ceil(filtered.length / LISTINGS_PER_PAGE));
    updateDisplayedListings(filtered, 1);
  };

  const updateDisplayedListings = (listings: Listing[], page: number) => {
    const startIndex = (page - 1) * LISTINGS_PER_PAGE;
    const endIndex = startIndex + LISTINGS_PER_PAGE;
    setDisplayedListings(listings.slice(startIndex, endIndex));
    setCurrentPage(page);
  };

  useEffect(() => {
    applyFiltersAndSort(allListings);
  }, [searchTerm, showNonBestsellers, hideOptimized, sortColumn, sortDirection]);

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

  const handleSort = (column: "totalSales" | "dailyViews") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const toggleRowExpansion = (listingId: string) => {
    setExpandedRows(prev =>
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const brToNewline = (text: string) => {
    return text.replace(/<br\s*\/?>/g, '\n');
  };

  const newlineToBr = (text: string) => {
    return text.replace(/\n/g, '<br>');
  };

  const handleOptimize = async (listing: Listing) => {
    setIsOptimizing(true);
    try {
      const optimizedData = await optimizeListing(listing);
      setSelectedListing(listing);
      setOptimizedContent({
        ...optimizedData,
        description: brToNewline(optimizedData.description)
      });
      setEditedTags(optimizedData.tags);
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
      const listingRef = doc(db, 'listings', selectedListing.id);
      await updateDoc(listingRef, {
        optimizedTitle: optimizedContent.title,
        optimizedDescription: newlineToBr(optimizedContent.description),
        optimizedTags: editedTags,
        optimizationStatus: true,
        optimizedAt: serverTimestamp(),  // Add this line
      });

      setAllListings(prevListings =>
        prevListings.map(l => l.id === selectedListing.id ? {
          ...l,
          optimizedTitle: optimizedContent.title,
          optimizedDescription: newlineToBr(optimizedContent.description),
          optimizedTags: editedTags,
          optimizationStatus: true,
          optimizedAt: new Date(),  // Add this line
        } : l)
      );

      // Clear the optimized content and selected listing
      setOptimizedContent(null);
      setSelectedListing(null);
      setEditedTags('');
    } catch (error) {
      console.error("Error saving optimized listing:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to show a toast or some feedback here
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
      const tagArray = originalTags.split(',').map(tag => tag.trim());
      const newTags = ['bestseller', 'top-rated', 'premium'];
      return [...new Set([...tagArray, ...newTags])].join(', ');
    };

    const optimizedTitle = generateOptimizedTitle(listing.listingTitle);
    const optimizedDescription = generateOptimizedDescription(listing.listingDescription);
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
      __html: DOMPurify.sanitize(html, { ALLOWED_TAGS: ['br'] })
    };
  };

  return (
    <div>
      <h2>Listings for {storeName}</h2>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <input
            type="text"
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px', paddingLeft: '30px' }}
          />
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
        <div>
          <label style={{ marginRight: '20px' }}>
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
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
        <thead>
          <tr>
            <th style={{ padding: '10px', textAlign: 'left' }}></th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Image</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Listing ID</th>
            <th style={{ padding: '10px', textAlign: 'left', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Title</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Bestseller</th>
            <th onClick={() => handleSort("totalSales")} style={{ padding: '10px', textAlign: 'left', cursor: 'pointer' }}>
              Total Sales {sortColumn === "totalSales" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => handleSort("dailyViews")} style={{ padding: '10px', textAlign: 'left', cursor: 'pointer' }}>
              Daily Views {sortColumn === "dailyViews" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
                <Loader2 style={{ animation: 'spin 1s linear infinite' }} /> Loading...
              </td>
            </tr>
          ) : displayedListings.map((listing) => (
            <React.Fragment key={listing.id}>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => toggleRowExpansion(listing.id)}>
                    {expandedRows.includes(listing.id) ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </td>
                <td style={{ padding: '10px' }}><img src={listing.primaryImage} alt={listing.listingTitle} style={{ width: '50px', height: '50px' }} /></td>
                <td style={{ padding: '10px' }}>{listing.listingID}</td>
                <td style={{ padding: '10px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.listingTitle}</td>
                <td style={{ padding: '10px' }}>
                  {listing.optimizationStatus ? 'Optimized' : 'Pending'}
                </td>
                <td style={{ padding: '10px' }}>{listing.bestseller ? 'Yes' : 'No'}</td>
                <td style={{ padding: '10px' }}>{listing.totalSales}</td>
                <td style={{ padding: '10px' }}>{listing.dailyViews}</td>
                <td style={{ padding: '10px' }}>
                  <button 
                    onClick={() => handleOptimize(listing)} 
                    disabled={isOptimizing || listing.optimizationStatus}
                  >
                    {isOptimizing ? 'Optimizing...' : 'Optimize'}
                  </button>
                </td>
              </tr>
              {expandedRows.includes(listing.id) && (
                <tr>
                  <td colSpan={9}>
                    <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                          <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Original Listing</h4>
                          <p><strong>Title:</strong> {listing.listingTitle}</p>
                          <p><strong>Description:</strong> <span dangerouslySetInnerHTML={sanitizeHtml(listing.listingDescription)} /></p>
                          <div style={{ marginTop: '8px' }}>
                            <strong>Tags:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                              {listing.listingTags.split(',').map((tag, index) => (
                                <span key={index} style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {listing.optimizationStatus && (
                          <div>
                            <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Optimized Listing</h4>
                            <p><strong>Title:</strong> {listing.optimizedTitle}</p>
                            <p><strong>Description:</strong> <span dangerouslySetInnerHTML={sanitizeHtml(listing.optimizedDescription!)} /></p>
                            <div style={{ marginTop: '8px' }}>
                              <strong>Tags:</strong>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                {listing.optimizedTags?.split(',').map((tag, index) => (
                                  <span key={index} style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                    {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {listing.optimizedAt && (
                              <p style={{ marginTop: '8px' }}>
                                <strong>Optimized on:</strong> {listing.optimizedAt.toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>
          <ChevronLeft /> Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>
          Next <ChevronRight />
        </button>
      </div>

      {/* Optimized Content Area */}
      {selectedListing && optimizedContent && (
        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <h2 className="text-xl font-semibold mb-4">Listing Optimization Results</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h3 className="font-medium text-lg mb-2">Original Listing</h3>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '4px' }}>
                <h4 className="font-medium">Title:</h4>
                <p className="mb-2">{selectedListing.listingTitle}</p>
                <h4 className="font-medium">Description:</h4>
                <p dangerouslySetInnerHTML={sanitizeHtml(selectedListing.listingDescription)} />
                <h4 className="font-medium mt-2">Tags:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedListing.listingTags.split(',').map((tag, index) => (
                    <span key={index} style={{ backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontSize: '14px' }}>
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-2">Optimized Listing</h3>
              <div style={{ backgroundColor: '#f0fff4', padding: '16px', borderRadius: '4px' }}>
                <h4 className="font-medium">Title:</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    value={optimizedContent.title}
                    onChange={(e) => setOptimizedContent({...optimizedContent, title: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                  <button onClick={() => copyToClipboard(optimizedContent.title)} style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <Copy size={16} />
                  </button>
                  <button style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <Edit size={16} />
                  </button>
                </div>
                <h4 className="font-medium">Description:</h4>
                <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <textarea
                    value={optimizedContent.description}
                    onChange={(e) => setOptimizedContent({...optimizedContent, description: e.target.value})}
                    rows={4}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => copyToClipboard(optimizedContent.description)} style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Copy size={16} />
                    </button>
                    <button style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
                <h4 className="font-medium mt-2">Tags:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  {editedTags.split(',').map((tag, index) => (
                    <span key={index} style={{ 
                      backgroundColor: '#e2e8f0', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {tag.trim()}
                      <button 
                        onClick={() => setEditedTags(editedTags.split(',').filter((_, i) => i !== index).join(','))}
                        style={{ fontSize: '12px', marginLeft: '4px', cursor: 'pointer', border: 'none', background: 'none' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    placeholder="Add new tags (comma-separated)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const newTags = e.currentTarget.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
                        if (newTags.length > 0) {
                          setEditedTags(prevTags => [...new Set([...prevTags.split(','), ...newTags])].join(','));
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add new tags (comma-separated)"]') as HTMLInputElement;
                      const newTags = input.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
                      if (newTags.length > 0) {
                        setEditedTags(prevTags => [...new Set([...prevTags.split(','), ...newTags])].join(','));
                        input.value = '';
                      }
                    }}
                    style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Add Tags
                  </button>
                </div>
              </div>
              <button 
                onClick={handleSave} 
                disabled={isPublishing}
                style={{ 
                  marginTop: '16px',
                  padding: '10px 20px', 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isPublishing ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
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
      )}
    </div>
  );
};

export default SEOListings;