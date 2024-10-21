import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
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
}

const LISTINGS_PER_PAGE = 10; // Changed from 5 to 10

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function UserListingOptimization() {
  const { customerData } = useAuth();
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

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
        const fetchedListings = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              optimizedAt: data.optimizedAt ? data.optimizedAt.toDate() : null
            } as Listing;
          })
          .filter(listing => 
            listing.optimizedTitle || listing.optimizedDescription || listing.optimizedTags
          );
        console.log('Fetched listings:', fetchedListings);
        setAllListings(fetchedListings);
        setFilteredListings(fetchedListings);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching listings:', error);
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

  const sanitizeHtml = (html: string) => {
    return {
      __html: DOMPurify.sanitize(html, { ALLOWED_TAGS: ['br'] })
    };
  };

  const getEtsyUrl = (listingID: string) => {
    return `https://www.etsy.com/listing/${listingID}`;
  };

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
      <h2>Optimized Listings for {customerData?.store_name}</h2>
      <p>Total optimized listings: {filteredListings.length}</p>
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
      </div>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
        <thead>
          <tr>
            <th style={{ padding: '10px', textAlign: 'left' }}>Details</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Image</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Listing ID</th>
            <th style={{ padding: '10px', textAlign: 'left', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Optimized Title</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Optimized On</th>
          </tr>
        </thead>
        <tbody>
          {currentListings.map((listing) => (
            <React.Fragment key={listing.id}>
              <tr style={{ backgroundColor: '#f9f9f9', cursor: 'pointer' }} onClick={() => toggleRowExpansion(listing.id)}>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {expandedRows.includes(listing.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span style={{ marginLeft: '5px', fontSize: '14px', color: '#666' }}>
                      {expandedRows.includes(listing.id) ? 'Hide Details' : 'Show Details'}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '10px' }}><img src={listing.primaryImage} alt={listing.optimizedTitle} style={{ width: '50px', height: '50px', objectFit: 'cover' }} /></td>
                <td style={{ padding: '10px' }}>{listing.listingID}</td>
                <td style={{ padding: '10px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <a 
                    href={getEtsyUrl(listing.listingID)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#0066c0', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                  >
                    {listing.optimizedTitle}
                    <ExternalLink size={14} style={{ marginLeft: '5px' }} />
                  </a>
                </td>
                <td style={{ padding: '10px' }}>{formatDate(listing.optimizedAt)}</td>
              </tr>
              {expandedRows.includes(listing.id) && (
                <tr>
                  <td colSpan={5}>
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
                        <div>
                          <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Optimized Listing</h4>
                          <p><strong>Title:</strong> {listing.optimizedTitle}</p>
                          <p><strong>Description:</strong> <span dangerouslySetInnerHTML={sanitizeHtml(listing.optimizedDescription)} /></p>
                          <div style={{ marginTop: '8px' }}>
                            <strong>Tags:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                              {listing.optimizedTags.split(',').map((tag, index) => (
                                <span key={index} style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
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
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          <ChevronLeft /> Previous
        </button>
        <span>Page {currentPage} of {pageCount}</span>
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))} disabled={currentPage === pageCount}>
          Next <ChevronRight />
        </button>
      </div>
    </div>
  );
}
