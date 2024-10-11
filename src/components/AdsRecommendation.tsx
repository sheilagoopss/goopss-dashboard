import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

interface Listing {
  listingId: string;
  title: string;
  image: string;
  link: string;
  views: string;
}

const AdsRecommendation: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [stores, setStores] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchStores();
    } else if (user?.store_name) {
      console.log("User store name:", user.store_name);
      fetchListings(user.store_name);
    } else {
      console.error("User or store name is undefined");
      setError("User information is missing. Please try logging out and back in.");
    }
  }, [isAdmin, user]);

  const fetchStores = async () => {
    try {
      const storesSnapshot = await getDocs(collection(db, 'customers'));
      const storeNames = storesSnapshot.docs.map(doc => doc.data().store_name);
      setStores(storeNames);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Failed to fetch stores');
    }
  };

  const fetchListings = async (storeName: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching listings for store:", storeName);
      const trafficAnalysisCollection = collection(db, 'trafficAnalysis');
      const q = query(trafficAnalysisCollection, where('shop', '==', storeName));
      const querySnapshot = await getDocs(q);

      console.log("Query snapshot size:", querySnapshot.size);

      const recommendedListings: Listing[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Document data:", data);
        if (data.listingsData && Array.isArray(data.listingsData)) {
          data.listingsData.forEach((listing: any) => {
            if (parseInt(listing.views) > 0) {
              recommendedListings.push({
                listingId: listing.listingId,
                title: listing.title,
                image: listing.image,
                link: listing.link,
                views: listing.views
              });
            }
          });
        }
      });

      console.log("Recommended listings:", recommendedListings);
      setListings(recommendedListings);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to fetch listings: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const storeName = event.target.value;
    setSelectedStore(storeName);
    fetchListings(storeName);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Ads Recommendation</h1>
      
      {isAdmin && (
        <select value={selectedStore} onChange={handleStoreSelect}>
          <option value="">Select a store</option>
          {stores.map((store) => (
            <option key={store} value={store}>{store}</option>
          ))}
        </select>
      )}

      {!isAdmin && user && (
        <p>Store: {user.store_name}</p>
      )}

      {listings.length === 0 ? (
        <p>No recommended listings found.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
          {listings.map((listing) => (
            <div key={listing.listingId} style={{ width: '200px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <img src={listing.image} alt={listing.title} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
              <div style={{ padding: '10px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>{listing.title}</h3>
                <p>ID: {listing.listingId}</p>
                <p>Views: {listing.views}</p>
                <a href={listing.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '10px', textDecoration: 'none', color: '#007bff' }}>
                  View on Etsy
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdsRecommendation;