import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Search, ChevronLeft, ChevronRight, Facebook, Instagram, X } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<"facebook" | "instagram" | "both">("facebook");
  const [currentListing, setCurrentListing] = useState<EtsyListing | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarPosts, setCalendarPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedDatePosts, setSelectedDatePosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const LISTINGS_PER_PAGE = 5;

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

  const fetchListings = async (pageNumber = 1) => {
    if (selectedCustomer) {
      try {
        const listingsCollection = collection(db, `customers/${selectedCustomer.id}/listings`);
        let q = query(listingsCollection, orderBy('listingID'), limit(LISTINGS_PER_PAGE));

        if (pageNumber > 1 && lastVisible) {
          q = query(listingsCollection, orderBy('listingID'), startAfter(lastVisible), limit(LISTINGS_PER_PAGE));
        }

        const listingsSnapshot = await getDocs(q);
        const listingsList = listingsSnapshot.docs.map(doc => ({
          id: doc.id,
          listingID: doc.data().listingID,
          listingTitle: doc.data().listingTitle,
          scheduled_post_date: doc.data().scheduled_post_date
        } as EtsyListing));

        setListings(listingsList);
        setFilteredListings(listingsList);
        setLastVisible(listingsSnapshot.docs[listingsSnapshot.docs.length - 1]);
        setCurrentPage(pageNumber);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCustomer]);

  useEffect(() => {
    const filtered = listings.filter(listing => 
      listing.listingID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.listingTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredListings(filtered);
  }, [searchQuery, listings]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchPostsForMonth(currentMonth);
    }
  }, [selectedCustomer, currentMonth, posts]);

  const handleCustomerSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const customer = customers.find(c => c.id === event.target.value);
    setSelectedCustomer(customer || null);
  };

  const generateContentWithAI = async (listing: EtsyListing, platform: "facebook" | "instagram") => {
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listing, platform }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error("Error generating content with AI:", error);
      return platform === "facebook"
        ? `Check out our ${listing.listingTitle}! 🛍️ Perfect for your home or as a gift. Shop now on our Etsy store! #Handmade #EtsyFind`
        : `✨ New arrival! ${listing.listingTitle} 🛒 Tap the link in bio to shop. #Etsy #Handmade #ShopSmall`;
    }
  };

  const generatePost = async (listing: EtsyListing, platform: "facebook" | "instagram" | "both", date: Date) => {
    const createPost = async (plt: "facebook" | "instagram") => ({
      content: await generateContentWithAI(listing, plt),
      date: date,
      platform: plt,
      listingId: listing.listingID,
    });

    try {
      if (selectedCustomer) {
        const socialCollection = collection(db, `customers/${selectedCustomer.id}/social`);
        let newPosts: Post[] = [];

        if (platform === "both") {
          const fbPost = await createPost("facebook");
          const igPost = await createPost("instagram");
          const fbDoc = await addDoc(socialCollection, fbPost);
          const igDoc = await addDoc(socialCollection, igPost);
          newPosts = [
            { id: fbDoc.id, ...fbPost },
            { id: igDoc.id, ...igPost }
          ];
        } else {
          const post = await createPost(platform);
          const doc = await addDoc(socialCollection, post);
          newPosts = [{ id: doc.id, ...post }];
        }

        // Update the scheduled_post_date in the listing
        const listingRef = doc(db, `customers/${selectedCustomer.id}/listings`, listing.id);
        await updateDoc(listingRef, { scheduled_post_date: date.toISOString() });

        // Update local state
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
        setCalendarPosts(prevPosts => [...prevPosts, ...newPosts]);

        // Refresh listings
        fetchListings();
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

  const fetchPostsForMonth = async (month: Date) => {
    if (!selectedCustomer) return;

    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    try {
      const postsRef = collection(db, 'customers', selectedCustomer.id, 'social');
      const q = query(
        postsRef,
        where('date', '>=', startOfMonth),
        where('date', '<=', endOfMonth)
      );
      const querySnapshot = await getDocs(q);
      const fetchedPosts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate() // Convert Firestore Timestamp to JavaScript Date
        } as Post;
      });
      setCalendarPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts for calendar:", error);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const postsForDay = calendarPosts.filter(post => 
        post.date.toDateString() === date.toDateString()
      );

      calendarDays.push(
        <div 
          key={`day-${day}`} 
          className="calendar-day"
          onClick={() => handleDateClick(date, postsForDay)}
          style={{ cursor: 'pointer' }}
        >
          <div className="day-number">{day}</div>
          {postsForDay.map(post => (
            <div 
              key={post.id} 
              className={`post-indicator ${post.platform}`}
            >
              {post.platform === 'facebook' ? <Facebook size={12} /> : <Instagram size={12} />}
            </div>
          ))}
        </div>
      );
    }

    return calendarDays;
  };

  const handleDateClick = (date: Date, posts: Post[]) => {
    setSelectedDate(date);
    setSelectedDatePosts(posts);
  };

  const handleNextPage = () => {
    fetchListings(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchListings(currentPage - 1);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Customer selection and info */}
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
          {/* Customer info */}
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

          {/* Listings table */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Etsy Listings</h2>
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '200px' }}
              />
              <div>
                <button onClick={handlePrevPage} disabled={currentPage === 1} style={{ marginRight: '10px', padding: '5px 10px' }}>Previous</button>
                <span>Page {currentPage}</span>
                <button onClick={handleNextPage} disabled={filteredListings.length < LISTINGS_PER_PAGE} style={{ marginLeft: '10px', padding: '5px 10px' }}>Next</button>
              </div>
            </div>
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

          {/* Calendar and side panel container */}
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Calendar view */}
            <div style={{ flex: 1 }}>
              <div className="calendar-view">
                <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <button onClick={prevMonth} style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <h2>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                  <button onClick={nextMonth} style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="calendar-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: '8px',
                  gridAutoRows: 'minmax(100px, auto)'
                }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="calendar-day-header" style={{ textAlign: 'center', fontWeight: 'bold' }}>{day}</div>
                  ))}
                  {renderCalendar()}
                </div>
              </div>
            </div>

            {/* Side panel */}
            <div style={{
              width: '300px',
              backgroundColor: 'white',
              boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
              padding: '20px',
              overflowY: 'auto',
              height: 'calc(100vh - 40px)',
              position: 'sticky',
              top: '20px'
            }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                {selectedDate ? `Posts for ${selectedDate.toLocaleDateString()}` : 'Select a date to view posts'}
              </h3>
              {selectedDate ? (
                selectedDatePosts.length > 0 ? (
                  selectedDatePosts.map(post => (
                    <div key={post.id} style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                        {post.platform === 'facebook' ? <Facebook size={16} /> : <Instagram size={16} />}
                        <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>{post.platform}</span>
                      </div>
                      <p><strong>Content:</strong></p>
                      <p>{post.content}</p>
                    </div>
                  ))
                ) : (
                  <p>No posts scheduled for this date.</p>
                )
              ) : (
                <p>Click on a date in the calendar to view its posts.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Date dialog */}
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
              value={selectedDate?.toISOString().split('T')[0]}
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
                  generatePost(currentListing, selectedPlatform, selectedDate!);
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