import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, startAfter, orderBy, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface SEOListingsProps {
  customerId: string;
  storeName: string;
}

interface Listing {
  id: string;
  listingID: string;
  listingTitle: string;
}

const SEOListings: React.FC<SEOListingsProps> = ({ customerId, storeName }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const LISTINGS_PER_PAGE = 5;

  useEffect(() => {
    if (customerId) {
      fetchListings();
      fetchTotalPages();
    }
  }, [customerId]);

  const fetchListings = async (pageNumber = 1) => {
    try {
      const listingsCollection = collection(db, `customers/${customerId}/listings`);
      let q = query(listingsCollection, orderBy('listingID'), limit(LISTINGS_PER_PAGE));

      if (pageNumber > 1 && lastVisible) {
        q = query(listingsCollection, orderBy('listingID'), startAfter(lastVisible), limit(LISTINGS_PER_PAGE));
      }

      const listingsSnapshot = await getDocs(q);
      const listingsList = listingsSnapshot.docs.map(doc => ({
        id: doc.id,
        listingID: doc.data().listingID,
        listingTitle: doc.data().listingTitle,
      }));

      setListings(listingsList);
      setLastVisible(listingsSnapshot.docs[listingsSnapshot.docs.length - 1]);
      setCurrentPage(pageNumber);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  const fetchTotalPages = async () => {
    try {
      const listingsCollection = collection(db, `customers/${customerId}/listings`);
      const snapshot = await getCountFromServer(listingsCollection);
      const totalListings = snapshot.data().count;
      setTotalPages(Math.ceil(totalListings / LISTINGS_PER_PAGE));
    } catch (error) {
      console.error("Error fetching total pages:", error);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchListings(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchListings(currentPage - 1);
    }
  };

  const filteredListings = listings.filter(listing =>
    listing.listingID.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.listingTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Listings for {storeName}</h2>
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '200px' }}>
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              padding: '8px 8px 8px 40px', 
              borderRadius: '4px', 
              border: '1px solid #ccc', 
              width: '100%' 
            }}
          />
          <Search style={{ 
            position: 'absolute', 
            left: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#888' 
          }} />
        </div>
        <div>
          <button onClick={handlePreviousPage} disabled={currentPage === 1} style={{ marginRight: '10px', padding: '5px 10px' }}>
            <ChevronLeft />
          </button>
          <span>Page {currentPage}</span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages} style={{ marginLeft: '10px', padding: '5px 10px' }}>
            <ChevronRight />
          </button>
        </div>
      </div>
      <div style={{ backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Listing ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredListings.map((listing) => (
              <tr key={listing.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px' }}>{listing.listingID}</td>
                <td style={{ padding: '12px' }}>{listing.listingTitle}</td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => console.log('Optimize', listing.id)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#007bff',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Optimize
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SEOListings;