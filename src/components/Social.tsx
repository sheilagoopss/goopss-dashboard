import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Search, ChevronLeft, ChevronRight, Facebook, Instagram, X } from 'lucide-react';
import CustomersDropdown from './CustomersDropdown';
import { ICustomer } from '../types/Customer'; // Import the Customer type from your types file

interface EtsyListing {
  id: string;
  listingID: string;
  listingTitle: string;
  scheduled_post_date?: string;
}

interface Post {
  id: string;
  content: string;
  scheduledDate: Date;
  dateCreated: Date;
  platform: "facebook" | "instagram";
  listingId: string;
  customerId: string;
}

const EditPostModal: React.FC<{
  post: Omit<Post, 'id'>;
  onSave: (post: Omit<Post, 'id'>) => void;
  onCancel: () => void;
}> = ({ post, onSave, onCancel }) => {
  const [editedContent, setEditedContent] = useState(post.content);

  const handleSave = () => {
    onSave({
      ...post,
      content: editedContent,
    });
  };

  return (
    <div className="modal-content" style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      maxWidth: '500px',
      width: '100%'
    }}>
      <h2 style={{ marginBottom: '20px' }}>Edit Post</h2>
      <textarea
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        placeholder="Post content"
        style={{ width: '100%', minHeight: '100px', marginBottom: '15px', padding: '8px' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ /* ... */ }}>Cancel</button>
        <button onClick={handleSave} style={{ /* ... */ }}>Save</button>
      </div>
    </div>
  );
};

const PostCreationModal: React.FC<{
  listing: EtsyListing;
  customerId: string;
  onSave: (posts: Omit<Post, 'id'>[]) => void;
  onCancel: () => void;
}> = ({ listing, customerId, onSave, onCancel }) => {
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [platform, setPlatform] = useState<"facebook" | "instagram" | "both">("facebook");
  const [facebookContent, setFacebookContent] = useState("");
  const [instagramContent, setInstagramContent] = useState("");

  const generateContentWithAI = async (platform: "facebook" | "instagram") => {
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

  const handleGenerateContent = async () => {
    if (platform === "both" || platform === "facebook") {
      const fbContent = await generateContentWithAI("facebook");
      setFacebookContent(fbContent);
    }
    if (platform === "both" || platform === "instagram") {
      const igContent = await generateContentWithAI("instagram");
      setInstagramContent(igContent);
    }
  };

  const handleSave = () => {
    if (!scheduledDate) {
      alert("Please select a date before saving the post.");
      return;
    }

    const basePost = {
      scheduledDate,
      dateCreated: new Date(),
      listingId: listing.listingID,
      customerId,
    };

    let postsToSave: Omit<Post, 'id'>[] = [];

    if (platform === "both") {
      if (facebookContent.trim()) {
        postsToSave.push({ ...basePost, platform: "facebook", content: facebookContent });
      }
      if (instagramContent.trim()) {
        postsToSave.push({ ...basePost, platform: "instagram", content: instagramContent });
      }
    } else if (platform === "facebook" && facebookContent.trim()) {
      postsToSave.push({ ...basePost, platform: "facebook", content: facebookContent });
    } else if (platform === "instagram" && instagramContent.trim()) {
      postsToSave.push({ ...basePost, platform: "instagram", content: instagramContent });
    }

    if (postsToSave.length === 0) {
      alert("Please enter content for at least one platform before saving.");
      return;
    }

    onSave(postsToSave);
  };

  return (
    <div className="modal-content" style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      maxWidth: '500px',
      width: '100%'
    }}>
      <h2 style={{ marginBottom: '20px' }}>Create Post for {listing.listingTitle}</h2>
      <input 
        type="date" 
        value={scheduledDate?.toISOString().split('T')[0] || ''}
        onChange={(e) => setScheduledDate(new Date(e.target.value))}
        style={{ width: '100%', marginBottom: '15px', padding: '8px' }}
      />
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          <input 
            type="radio" 
            value="facebook" 
            checked={platform === "facebook"}
            onChange={() => setPlatform("facebook")}
          /> Facebook
        </label>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          <input 
            type="radio" 
            value="instagram" 
            checked={platform === "instagram"}
            onChange={() => setPlatform("instagram")}
          /> Instagram
        </label>
        <label style={{ display: 'block' }}>
          <input 
            type="radio" 
            value="both" 
            checked={platform === "both"}
            onChange={() => setPlatform("both")}
          /> Both
        </label>
      </div>
      <button onClick={handleGenerateContent} style={{ /* ... */ }}>
        Generate Content
      </button>
      {(platform === "facebook" || platform === "both") && (
        <textarea
          value={facebookContent}
          onChange={(e) => setFacebookContent(e.target.value)}
          placeholder="Facebook content"
          style={{ width: '100%', minHeight: '100px', marginBottom: '15px', padding: '8px' }}
        />
      )}
      {(platform === "instagram" || platform === "both") && (
        <textarea
          value={instagramContent}
          onChange={(e) => setInstagramContent(e.target.value)}
          placeholder="Instagram content"
          style={{ width: '100%', minHeight: '100px', marginBottom: '15px', padding: '8px' }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ /* ... */ }}>Cancel</button>
        <button onClick={handleSave} style={{ /* ... */ }}>Save</button>
      </div>
    </div>
  );
};

export default function Social() {
  const { isAdmin, user } = useAuth();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
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
  const [editablePost, setEditablePost] = useState<Omit<Post, 'id'> | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPostCreationModalOpen, setIsPostCreationModalOpen] = useState(false);

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
        const customersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ICustomer));
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
        const listingsCollection = collection(db, 'listings');
        let q = query(
          listingsCollection, 
          where('customer_id', '==', selectedCustomer.customer_id),
          orderBy('listingID'),
          limit(LISTINGS_PER_PAGE)
        );

        if (pageNumber > 1 && lastVisible) {
          q = query(
            listingsCollection,
            where('customer_id', '==', selectedCustomer.customer_id),
            orderBy('listingID'),
            startAfter(lastVisible),
            limit(LISTINGS_PER_PAGE)
          );
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
    if (selectedCustomer) {
      fetchListings();
    }
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
  }, [selectedCustomer, currentMonth]);

  const handleCustomerSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const customer = customers.find(c => c.id === event.target.value);
    setSelectedCustomer(customer || null);
  };

  const handleSchedulePost = (listing: EtsyListing) => {
    setCurrentListing(listing);
    setIsPostCreationModalOpen(true);
  };

  const handleSavePost = async (newPosts: Omit<Post, 'id'>[]) => {
    if (!selectedCustomer) {
      console.error("No customer selected");
      return;
    }

    try {
      const socialCollection = collection(db, 'socials');
      let savedPosts: Post[] = [];

      for (const post of newPosts) {
        // Ensure the content is not empty before saving
        if (!post.content.trim()) {
          console.error(`Empty content for ${post.platform} post. Skipping.`);
          continue;
        }

        const docRef = await addDoc(socialCollection, {
          ...post,
          scheduledDate: post.scheduledDate,
          dateCreated: new Date(),
        });
        savedPosts.push({ id: docRef.id, ...post });
      }

      if (savedPosts.length === 0) {
        console.error("No posts were saved due to empty content");
        return;
      }

      // Update the scheduled_post_date in the listing
      if (currentListing) {
        const listingRef = doc(db, 'listings', currentListing.id);
        await updateDoc(listingRef, { scheduled_post_date: savedPosts[0].scheduledDate.toISOString() });
      }

      // Update local state
      setPosts(prevPosts => [...prevPosts, ...savedPosts]);
      setCalendarPosts(prevPosts => [...prevPosts, ...savedPosts]);

      console.log("Posts saved to Firestore:", savedPosts);

      // Refresh listings and posts
      fetchListings();
      fetchPostsForMonth(currentMonth);

      setIsPostCreationModalOpen(false);
      setCurrentListing(null);
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const fetchPosts = async () => {
    if (selectedCustomer) {
      try {
        console.log("Fetching posts for customer:", selectedCustomer.id);
        const socialCollection = collection(db, 'socials');
        const q = query(socialCollection, where('customerId', '==', selectedCustomer.id));
        const socialSnapshot = await getDocs(q);
        console.log("Number of posts fetched:", socialSnapshot.size);
        const postsList = socialSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          scheduledDate: doc.data().scheduledDate.toDate(),
          dateCreated: doc.data().dateCreated.toDate(),
        } as Post));
        console.log("Fetched posts:", postsList);
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
      console.log("Fetching posts for month:", month);
      const postsRef = collection(db, 'socials');
      const q = query(
        postsRef,
        where('customerId', '==', selectedCustomer.id),
        where('scheduledDate', '>=', startOfMonth),
        where('scheduledDate', '<=', endOfMonth)
      );
      const querySnapshot = await getDocs(q);
      const fetchedPosts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          scheduledDate: data.scheduledDate.toDate(),
          dateCreated: data.dateCreated.toDate(),
        } as Post;
      });
      console.log("Fetched posts for month:", fetchedPosts);
      setPosts(fetchedPosts);
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
        post.scheduledDate.toDateString() === date.toDateString()  // Changed from 'date' to 'scheduledDate'
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

  const handleSaveEditedPost = async (editedPost: Omit<Post, 'id'>) => {
    try {
      const socialCollection = collection(db, 'socials');
      const docRef = await addDoc(socialCollection, editedPost);
      const newPost = { id: docRef.id, ...editedPost };

      // Update local state
      setPosts(prevPosts => [...prevPosts, newPost]);
      setCalendarPosts(prevPosts => [...prevPosts, newPost]);

      // Update the scheduled_post_date in the listing
      if (currentListing) {
        const listingRef = doc(db, 'listings', currentListing.id);
        await updateDoc(listingRef, { scheduled_post_date: editedPost.scheduledDate.toISOString() });
      }

      // Refresh listings and posts
      fetchListings();
      fetchPostsForMonth(currentMonth);

      setIsEditModalOpen(false);
      setEditablePost(null);
    } catch (error) {
      console.error("Error saving edited post:", error);
    }
  };

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
          <CustomersDropdown
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {selectedCustomer && (
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
      )}

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
                    onClick={() => handleSchedulePost(listing)}
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

      {isPostCreationModalOpen && currentListing && selectedCustomer && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <PostCreationModal
            listing={currentListing}
            customerId={selectedCustomer.id}  // Pass the customerId
            onSave={handleSavePost}
            onCancel={() => setIsPostCreationModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
