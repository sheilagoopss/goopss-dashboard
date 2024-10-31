import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ExternalLink, ArrowUpDown, ArrowRight } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import DOMPurify from 'dompurify';

interface Listing {
  id: string;
  listingID: string;
  primaryImage: string;
  listingTitle: string;
  listingDescription: string;
  listingTags: string;
  optimizedTitle: string;
  optimizedDescription: string;
  optimizedTags: string;
  optimizedAt: Date | null;
  optimizationStatus: boolean;
  uploadedImages?: { id: string; url: string; statusChangeDate: Date | null }[];
}

const LISTINGS_PER_PAGE = 10; // Changed from 5 to 10

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Define type for pastelColors
type OptimizationType = 'Title' | 'Description' | 'Tags' | 'Images' | 'Attributes' | 'Alt text';

const pastelColors: Record<OptimizationType, { bg: string; text: string }> = {
  'Title': { bg: '#fce7f3', text: '#9d174d' },     // pink pastel
  'Description': { bg: '#dbeafe', text: '#1e40af' }, // blue pastel
  'Tags': { bg: '#dcfce7', text: '#166534' },       // green pastel
  'Images': { bg: '#fef3c7', text: '#92400e' },     // yellow pastel
  'Attributes': { bg: '#f3e8ff', text: '#6b21a8' }, // purple pastel
  'Alt text': { bg: '#ffedd5', text: '#9a3412' }    // orange pastel
};

// Add type for images array
interface ListingImage {
  id: string;
  url: string;
  statusChangeDate: Date | null;
}

// Add the getLastImageDate function
const getLastImageDate = (listing: Listing): string => {
  if (!listing.uploadedImages || listing.uploadedImages.length === 0) {
    return 'No additional images';
  }
  const lastImage = listing.uploadedImages[listing.uploadedImages.length - 1];
  return formatDate(lastImage?.statusChangeDate || null);
};

// Update the fetchImagesForListing function
const fetchImagesForListing = async (listingId: string): Promise<ListingImage[]> => {
  try {
    const imagesRef = collection(db, 'images');
    const q = query(
      imagesRef,
      where('listing_id', '==', listingId),
      where('status', '!=', 'superseded')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      url: doc.data().url,
      statusChangeDate: doc.data().statusChangeDate ? doc.data().statusChangeDate.toDate() : null
    }));
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
};

// New component for individual listing card
const OptimizationCard = ({ listing }: { listing: Listing }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getOptimizationTypes = (listing: Listing): OptimizationType[] => {
    const types: OptimizationType[] = [];
    if (listing.optimizedTitle) types.push('Title');
    if (listing.optimizedDescription) types.push('Description');
    if (listing.optimizedTags) types.push('Tags');
    if (listing.optimizationStatus) types.push('Images');
    types.push('Attributes');
    types.push('Alt text');
    return types;
  };

  const sanitizeHtml = (html: string) => {
    // First sanitize the HTML
    const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['br'] });
    // Then split by <br> or <br /> and join with newlines
    return sanitized.split(/<br\s*\/?>/i).map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index !== sanitized.split(/<br\s*\/?>/i).length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      marginBottom: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease'
    }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <img 
          src={listing.primaryImage} 
          alt={listing.optimizedTitle || listing.listingTitle}
          style={{
            width: '64px',
            height: '64px',
            objectFit: 'cover',
            borderRadius: '4px'
          }}
        />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
            {listing.optimizedTitle || listing.listingTitle}
          </h3>
          <div style={{ fontSize: '14px', color: '#666' }}>ID: {listing.id}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {getOptimizationTypes(listing).map((type) => (
            <span
              key={type}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: pastelColors[type].bg,
                color: pastelColors[type].text
              }}
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '20px', borderTop: '1px solid #eee' }}>
          {/* Title Changes */}
          <section style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '4px', height: '24px', backgroundColor: '#f9a8d4', marginRight: '8px', borderRadius: '2px' }}></span>
              Title Changes
            </h4>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flex: 1, padding: '12px', border: '1px solid #eee', borderRadius: '4px' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>Original Title:</div>
                <div>{listing.listingTitle}</div>
              </div>
              <ArrowRight style={{ marginTop: '24px', color: '#666' }} />
              <div style={{ flex: 1, padding: '12px', border: '1px solid #eee', borderRadius: '4px' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>Optimized Title:</div>
                <div>{listing.optimizedTitle}</div>
              </div>
            </div>
          </section>

          {/* Description Changes */}
          <section style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '4px', height: '24px', backgroundColor: '#93c5fd', marginRight: '8px', borderRadius: '2px' }}></span>
              Description Changes
            </h4>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flex: 1, padding: '12px', border: '1px solid #eee', borderRadius: '4px' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>Original Description:</div>
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {sanitizeHtml(listing.listingDescription)}
                </div>
              </div>
              <ArrowRight style={{ marginTop: '24px', color: '#666' }} />
              <div style={{ flex: 1, padding: '12px', border: '1px solid #eee', borderRadius: '4px' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>Optimized Description:</div>
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {sanitizeHtml(listing.optimizedDescription)}
                </div>
              </div>
            </div>
          </section>

          {/* Tags Changes */}
          <section style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '4px', height: '24px', backgroundColor: '#86efac', marginRight: '8px', borderRadius: '2px' }}></span>
              Tag Changes
            </h4>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flex: 1, padding: '12px', border: '1px solid #eee', borderRadius: '4px' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>Original Tags:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {listing.listingTags.split(',').map((tag, index) => (
                    <span key={index} style={{ 
                      backgroundColor: '#f3f4f6', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight style={{ marginTop: '24px', color: '#666' }} />
              <div style={{ flex: 1, padding: '12px', border: '1px solid #eee', borderRadius: '4px' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>Optimized Tags:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {listing.optimizedTags.split(',').map((tag, index) => (
                    <span key={index} style={{ 
                      backgroundColor: '#f3f4f6', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Images Changes */}
          <section style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '4px', height: '24px', backgroundColor: '#fcd34d', marginRight: '8px', borderRadius: '2px' }}></span>
              Images Added
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {listing.uploadedImages && listing.uploadedImages.length > 0 ? (
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {listing.uploadedImages.map((image, index) => (
                      <img 
                        key={image.id}
                        src={image.url} 
                        alt={`Additional ${index + 1}`}
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid #eee'
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#666' }}>No additional images have been added.</div>
              )}
            </div>
            {/* Date information */}
            <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
              Last image added: {getLastImageDate(listing)}
            </div>
          </section>

          {/* Date information */}
          <div style={{ fontSize: '14px', color: '#666', marginTop: '16px' }}>
            Optimized on: {formatDate(listing.optimizedAt)}
          </div>
        </div>
      )}
    </div>
  );
};

export default function UserListingOptimization() {
  const { customerData } = useAuth();
  const [activeTab, setActiveTab] = useState('optimized');
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<"optimizedAt" | null>("optimizedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const tabs = [
    { 
      id: 'optimized', 
      label: 'Listings we\'ve optimized',
      subtitle: 'We\'ve enhanced these listings to improve their performance and visibility.'
    },
    { 
      id: 'duplicated', 
      label: 'Listings we\'ve duplicated',
      subtitle: 'These listings have been replicated to expand your reach across multiple platforms.'
    }
  ];

  // Get first name from store_owner_name
  const firstName = customerData?.store_owner_name?.split(' ')[0] || '';

  useEffect(() => {
    const fetchListings = async () => {
      if (!customerData) return;

      setIsLoading(true);
      try {
        const listingsRef = collection(db, 'listings');
        const q = query(
          listingsRef,
          where('customer_id', '==', customerData.id),
          where('optimizationStatus', '==', true)
        );
        const querySnapshot = await getDocs(q);
        const fetchedListings = await Promise.all(querySnapshot.docs.map(async doc => {
          const data = doc.data();
          let images: ListingImage[] = [];
          
          // Check hasImage flag first
          if (data.hasImage === true) {  // Explicitly check for true
            // Then fetch images using the listing's ID
            images = await fetchImagesForListing(doc.id);
          }

          return {
            id: doc.id,
            ...data,
            optimizedAt: data.optimizedAt ? data.optimizedAt.toDate() : null,
            uploadedImages: images
          } as Listing;
        }));

        const filteredListings = fetchedListings.filter(listing => 
          listing.optimizedTitle || listing.optimizedDescription || listing.optimizedTags
        );

        // Sort listings by optimizedAt date before setting state
        const sortedListings = [...filteredListings].sort((a, b) => {
          const dateA = a.optimizedAt ? a.optimizedAt.getTime() : 0;
          const dateB = b.optimizedAt ? b.optimizedAt.getTime() : 0;
          return dateB - dateA;  // Sort in descending order (newest first)
        });
        
        setAllListings(sortedListings);
        setFilteredListings(sortedListings);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [customerData]);

  useEffect(() => {
    const filtered = allListings.filter(listing => 
      listing.listingID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.optimizedTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredListings(filtered);
    setCurrentPage(1);
  }, [searchTerm, allListings]);

  const pageCount = Math.ceil(filteredListings.length / LISTINGS_PER_PAGE);
  const currentListings = filteredListings.slice(
    (currentPage - 1) * LISTINGS_PER_PAGE,
    currentPage * LISTINGS_PER_PAGE
  );

  const toggleRowExpansion = (listingId: string) => {
    setExpandedRows(prev =>
      prev.includes(listingId) ? prev.filter(id => id !== listingId) : [...prev, listingId]
    );
  };

  const getEtsyUrl = (listingID: string) => {
    return `https://www.etsy.com/listing/${listingID}`;
  };

  const handleSort = () => {
    if (sortColumn === "optimizedAt") {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn("optimizedAt");
      setSortDirection("desc");
    }
  };

  useEffect(() => {
    let sorted = [...filteredListings];
    if (sortColumn === "optimizedAt") {
      sorted.sort((a, b) => {
        const dateA = a.optimizedAt ? a.optimizedAt.getTime() : 0;
        const dateB = b.optimizedAt ? b.optimizedAt.getTime() : 0;
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      });
    }
    setFilteredListings(sorted);
  }, [sortColumn, sortDirection]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Add this right before the return statement in the component
  if (filteredListings.length === 0) {
    return <div>No optimized listings found.</div>;
  }

  // Then in the return statement, add this before the table
  return (
    <div>
      {/* Header Section */}
      <div style={{ width: '100%', padding: '32px 16px', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            marginBottom: '2rem', 
            textAlign: 'center',
            fontFamily: 'Poppins, sans-serif'
          }}>
            Hi {firstName} 👋! Here's everything we've done with your listings
          </h1>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.5rem', 
            padding: '0.5rem',
            display: 'flex',
            justifyContent: 'between',
            alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  position: 'relative',
                  flex: 1,
                  textAlign: 'center',
                  padding: '0.75rem',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  color: activeTab === tab.id ? 'white' : '#4B5563',
                  backgroundColor: activeTab === tab.id ? '#7C3AED' : 'transparent',
                  borderRadius: '0.375rem',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div style={{ 
            marginTop: '2rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem'
          }}>
            <div>
              <h2 style={{ 
                fontSize: '2rem',
                fontWeight: '600',
                marginBottom: '1rem',
                fontFamily: 'Poppins, sans-serif'
              }}>
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h2>
              <p style={{ 
                fontSize: '1.25rem',
                color: '#4B5563',
                fontFamily: 'Poppins, sans-serif'
              }}>
                {tabs.find(tab => tab.id === activeTab)?.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div style={{ padding: '2rem 4rem' }}>
        {/* Search Bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '1rem'
              }}
            />
            <Search style={{ 
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }} />
          </div>
        </div>

        {/* Conditional rendering based on active tab */}
        {activeTab === 'optimized' ? (
          <>
            {/* Existing optimized listings content */}
            <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
              {currentListings.map(listing => (
                <OptimizationCard key={listing.id} listing={listing} />
              ))}
            </div>
            
            {/* Pagination */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span>Page {currentPage} of {pageCount}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
                disabled={currentPage === pageCount}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: currentPage === pageCount ? '#f3f4f6' : 'white',
                  cursor: currentPage === pageCount ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          // Duplicated listings tab content (empty state)
          <div style={{ 
            maxWidth: '1600px', 
            margin: '0 auto',
            textAlign: 'center',
            padding: '4rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: '1.25rem',
              color: '#6B7280',
              marginBottom: '1rem'
            }}>
              No duplicated listings available yet.
            </div>
            <p style={{ 
              color: '#9CA3AF',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              We'll show your duplicated listings here once they're available. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
