import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, startAfter, orderBy, getCountFromServer, where, updateDoc, doc } from 'firebase/firestore';
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
  isOptimized: boolean;
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
      filtered = filtered.filter(listing => !listing.isOptimized);
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

  const handleOptimize = async (listing: Listing) => {
    setIsOptimizing(true);
    try {
      const optimizedData = await optimizeListing(listing);
      
      const updatedListing = {
        ...listing,
        optimizedTitle: optimizedData.title,
        optimizedDescription: optimizedData.description,
        optimizedTags: optimizedData.tags,
      };

      setOptimizedListings(prev => ({...prev, [listing.id]: updatedListing}));
    } catch (error) {
      console.error("Error optimizing listing:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = async (listingId: string) => {
    const optimizedListing = optimizedListings[listingId];
    if (!optimizedListing) return;

    setIsPublishing(true);
    try {
      const listingRef = doc(db, 'listings', listingId);
      await updateDoc(listingRef, {
        listingTitle: optimizedListing.optimizedTitle,
        listingDescription: optimizedListing.optimizedDescription,
        listingTags: optimizedListing.optimizedTags,
        isOptimized: true,
      });

      setAllListings(prevListings =>
        prevListings.map(l => l.id === listingId ? {
          ...l,
          listingTitle: optimizedListing.optimizedTitle!,
          listingDescription: optimizedListing.optimizedDescription!,
          listingTags: optimizedListing.optimizedTags!,
          isOptimized: true,
        } : l)
      );

      // Remove the optimized listing from local state
      setOptimizedListings(prev => {
        const newState = {...prev};
        delete newState[listingId];
        return newState;
      });
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
            <th style={{ padding: '10px', textAlign: 'left' }}>Optimized?</th>
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
                  {listing.isOptimized ? 'Yes' : 'No'}
                </td>
                <td style={{ padding: '10px' }}>{listing.bestseller ? 'Yes' : 'No'}</td>
                <td style={{ padding: '10px' }}>{listing.totalSales}</td>
                <td style={{ padding: '10px' }}>{listing.dailyViews}</td>
                <td style={{ padding: '10px' }}>
                  <button 
                    onClick={() => handleOptimize(listing)} 
                    disabled={isOptimizing || listing.isOptimized}
                  >
                    {isOptimizing ? 'Optimizing...' : 'Optimize'}
                  </button>
                </td>
              </tr>
              {expandedRows.includes(listing.id) && (
                <tr>
                  <td colSpan={9}>
                    <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
                      <h4>Original Listing</h4>
                      <p><strong>Title:</strong> {listing.listingTitle}</p>
                      <p><strong>Description:</strong> <span dangerouslySetInnerHTML={sanitizeHtml(listing.listingDescription)} /></p>
                      <p><strong>Tags:</strong> {listing.listingTags}</p>
                      {optimizedListings[listing.id] && (
                        <>
                          <h4>Optimized Listing</h4>
                          <p>
                            <strong>Title:</strong> {optimizedListings[listing.id].optimizedTitle}
                            <button onClick={() => copyToClipboard(optimizedListings[listing.id].optimizedTitle!)}>
                              <Copy />
                            </button>
                          </p>
                          <p>
                            <strong>Description:</strong> <span dangerouslySetInnerHTML={sanitizeHtml(optimizedListings[listing.id].optimizedDescription!)} />
                            <button onClick={() => copyToClipboard(optimizedListings[listing.id].optimizedDescription!)}>
                              <Copy />
                            </button>
                          </p>
                          <p><strong>Tags:</strong> {optimizedListings[listing.id].optimizedTags}</p>
                          <button 
                            onClick={() => handleSave(listing.id)} 
                            disabled={isPublishing}
                          >
                            {isPublishing ? 'Saving...' : 'Save Optimized Version'}
                          </button>
                        </>
                      )}
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
    </div>
  );
};

export default SEOListings;