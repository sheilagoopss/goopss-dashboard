import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Search } from 'lucide-react';

interface Customer {
  id: string;
  customer_id: string;
  store_name: string;
  store_owner_name: string;
  logo: string;
}

interface EtsyListing {
  id: string;
  listingID: string;
  listingTitle: string;
  scheduled_post_date?: string;
}

interface Post {
  id: string;
  content: string;
  date: Date;
  platform: "facebook" | "instagram" | "both";
  listingId: string;
}

export default function Social() {
  const { isAdmin, user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [listings, setListings] = useState<EtsyListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<EtsyListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState<"facebook" | "instagram" | "both">("facebook");
  const [currentListing, setCurrentListing] = useState<EtsyListing | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersCollection = collection(db, 'customers');
        let q;
        
        if (isAdmin) {
          q = query(customersCollection);
        } else {
          q = query(customersCollection, where("email", "==", user?.email));
        }

        const querySnapshot = await getDocs(q);
        const customersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        setCustomers(customersList);

        if (!isAdmin && customersList.length > 0) {
          setSelectedCustomer(customersList[0]);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, [isAdmin, user]);

  useEffect(() => {
    const fetchListings = async () => {
      if (selectedCustomer) {
        try {
          const listingsCollection = collection(db, `customers/${selectedCustomer.id}/listings`);
          const listingsSnapshot = await getDocs(listingsCollection);
          const listingsList = listingsSnapshot.docs.map(doc => ({
            id: doc.id,
            listingID: doc.data().listingID,
            listingTitle: doc.data().listingTitle,
            scheduled_post_date: doc.data().scheduled_post_date
          } as EtsyListing));
          setListings(listingsList);
          setFilteredListings(listingsList);
        } catch (error) {
          console.error("Error fetching listings:", error);
        }
      }
    };

    fetchListings();
  }, [selectedCustomer]);

  useEffect(() => {
    const filtered = listings.filter(listing => 
      listing.listingID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.listingTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredListings(filtered);
  }, [searchQuery, listings]);

  const handleCustomerSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const customer = customers.find(c => c.id === event.target.value);
    setSelectedCustomer(customer || null);
  };

  const generatePost = async (listing: EtsyListing, platform: "facebook" | "instagram" | "both", date: Date) => {
    const createPost = (plt: "facebook" | "instagram") => ({
      content: plt === "facebook"
        ? `Check out our ${listing.listingTitle}! 🛍️ Perfect for your home or as a gift. Shop now on our Etsy store! #Handmade #EtsyFind`
        : `✨ New arrival! ${listing.listingTitle} 🛒 Tap the link in bio to shop. #Etsy #Handmade #ShopSmall`,
      date: date,
      platform: plt,
      listingId: listing.listingID,
    });

    try {
      if (selectedCustomer) {
        const socialCollection = collection(db, `customers/${selectedCustomer.id}/social`);
        if (platform === "both") {
          await addDoc(socialCollection, createPost("facebook"));
          await addDoc(socialCollection, createPost("instagram"));
        } else {
          await addDoc(socialCollection, createPost(platform));
        }
        // Refresh posts after adding new ones
        fetchPosts();
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const fetchPosts = async () => {
    if (selectedCustomer) {
      try {
        const socialCollection = collection(db, `customers/${selectedCustomer.id}/social`);
        const socialSnapshot = await getDocs(socialCollection);
        const postsList = socialSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
        } as Post));
        setPosts(postsList);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCustomer]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Social Calendar</h1>
        
        {isAdmin && (
          <select 
            onChange={handleCustomerSelect}
            style={{ 
              width: '200px', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ccc' 
            }}
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.store_owner_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedCustomer && (
        <>
          <div style={{ 
            backgroundColor: 'white', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '20px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img 
                src={selectedCustomer.logo || '/placeholder-logo.png'} 
                alt={`${selectedCustomer.store_name} logo`}
                style={{ width: '64px', height: '64px', borderRadius: '50%' }}
              />
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600' }}>{selectedCustomer.store_name}</h2>
                <p style={{ color: '#666' }}>{selectedCustomer.store_owner_name}</p>
                <p style={{ fontSize: '14px', color: '#888' }}>Customer ID: {selectedCustomer.customer_id}</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Etsy Listings</h2>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <Search style={{ width: '20px', height: '20px', marginRight: '10px', color: '#666' }} />
              <input
                type="text"
                placeholder="Search by Listing ID or Title"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Listing ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Scheduled Post Date</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.slice(0, 5).map((listing) => (
                    <tr key={listing.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>{listing.listingID}</td>
                      <td style={{ padding: '12px' }}>{listing.listingTitle}</td>
                      <td style={{ padding: '12px' }}>{listing.scheduled_post_date || 'Not scheduled'}</td>
                      <td style={{ padding: '12px' }}>
                        <button 
                          onClick={() => {
                            setCurrentListing(listing);
                            setIsDateDialogOpen(true);
                          }}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#007bff',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Schedule Post
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredListings.length > 5 && (
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Load More
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {isDateDialogOpen && currentListing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Choose Publishing Date and Platform</h3>
            <input 
              type="date" 
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              style={{ marginBottom: '15px', width: '100%', padding: '8px' }}
            />
            <div style={{ marginBottom: '15px' }}>
              <label>
                <input 
                  type="radio" 
                  value="facebook" 
                  checked={selectedPlatform === "facebook"}
                  onChange={() => setSelectedPlatform("facebook")}
                /> Facebook
              </label>
              <label style={{ marginLeft: '10px' }}>
                <input 
                  type="radio" 
                  value="instagram" 
                  checked={selectedPlatform === "instagram"}
                  onChange={() => setSelectedPlatform("instagram")}
                /> Instagram
              </label>
              <label style={{ marginLeft: '10px' }}>
                <input 
                  type="radio" 
                  value="both" 
                  checked={selectedPlatform === "both"}
                  onChange={() => setSelectedPlatform("both")}
                /> Both
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsDateDialogOpen(false)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#6c757d',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  generatePost(currentListing, selectedPlatform, selectedDate);
                  setIsDateDialogOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#28a745',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}