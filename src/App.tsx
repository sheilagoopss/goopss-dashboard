import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { collection, getDocs, DocumentData, doc, getDoc, query, where, limit, startAfter, orderBy } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import Modal from 'react-modal';
import { db } from './firebase/config';
import DashboardLayout from './components/DashboardLayout';
import TitleDescriptionOptimizer from './components/TitleDescriptionOptimizer';
import SocialPostCreator from './components/SocialPostCreator';
import { DesignHub } from './components/DesignHub'; // Updated import
import CustomersPage from './components/CustomersPage';
import LoginForm from './components/LoginForm';
import EtsyAdsRecommendation from './components/EtsyAdsRecommendation';
import PinterestAutomation from './components/PinterestAutomation';
import Plan from './components/Plan';
import { AuthProvider } from './contexts/AuthContext';
import Social from './components/Social';
import AdsRecommendation from './components/AdsRecommendation';

const styles = {
  app: {
    fontFamily: "'Inter', sans-serif",
    height: '100vh',
    margin: '0',
    padding: '0',
    backgroundColor: '#ffffff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#000000',
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    width: '50px',
    height: '50px',
  },
  title: {
    margin: '0',
    flex: 1,
    textAlign: 'center' as const,
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  dropdown: {
    padding: '5px 10px',
    marginRight: '10px',
    borderRadius: '5px',
  },
};

interface Customer {
  id: string;
  customer_id: string; // Make sure this is present
  store_name: string;
  store_owner_name: string;
  isAdmin: boolean;
  email: string; // Add this field
}

interface Listing {
  id: string;
  listingId: string;
  title: string;
  description: string;
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const LISTINGS_PER_PAGE = 5;
  const [searchQuery, setSearchQuery] = useState('');

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // User is logged in, so they are not an admin
        setIsAdmin(false);

        // Find the customer document that matches the current user's email
        const customersCollection = collection(db, 'customers');
        const customersSnapshot = await getDocs(customersCollection);
        const customerDoc = customersSnapshot.docs.find(doc => doc.data().email === currentUser.email);
        
        if (customerDoc) {
          const userData = { id: customerDoc.id, ...customerDoc.data() } as Customer;
          setSelectedCustomer(userData);
          console.log("Selected customer:", userData);
        } else {
          console.error('No matching customer found for the current user');
        }
      } else {
        // No user is logged in, so treat as admin
        setIsAdmin(true);
        setSelectedCustomer(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersCollection = collection(db, 'customers');
        const customersSnapshot = await getDocs(customersCollection);
        const customersList = customersSnapshot.docs.map((doc: DocumentData) => ({ id: doc.id, ...doc.data() } as Customer));
        console.log('Fetched customers:', customersList);
        setCustomers(customersList);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
  }, []);

  const openLoginModal = () => setIsLoginModalOpen(true);

  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsLoginModalOpen(false);
      setLoginError(null);
    } catch (error) {
      console.error("Error signing in: ", error);
      setLoginError("Invalid email or password");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const fetchListings = async (customerId: string, page: number = 1) => {
    if (!customerId) return;

    try {
      const listingsRef = collection(db, 'listings');
      let q = query(
        listingsRef,
        where('customer_id', '==', customerId),
        orderBy('listingId'),
        limit(LISTINGS_PER_PAGE)
      );

      if (page > 1 && lastVisible) {
        q = query(
          listingsRef,
          where('customer_id', '==', customerId),
          orderBy('listingId'),
          startAfter(lastVisible),
          limit(LISTINGS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(q);
      const fetchedListings: Listing[] = [];
      querySnapshot.forEach((doc) => {
        fetchedListings.push({ id: doc.id, ...doc.data() } as Listing);
      });

      setListings(fetchedListings);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setCurrentPage(page);

      // Calculate total pages
      const totalQuery = query(listingsRef, where('customer_id', '==', customerId));
      const totalSnapshot = await getDocs(totalQuery);
      setTotalPages(Math.ceil(totalSnapshot.size / LISTINGS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchListings(selectedCustomer?.customer_id || '', currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchListings(selectedCustomer?.customer_id || '', currentPage - 1);
    }
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: <DashboardLayout openLoginModal={openLoginModal} />, // Remove toggleAdminMode prop
      children: [
        { 
          path: "/", 
          element: <CustomersPage 
            customers={isAdmin ? customers : [selectedCustomer].filter(Boolean) as Customer[]} 
            selectedCustomer={selectedCustomer} 
            setSelectedCustomer={setSelectedCustomer}
            isAdmin={isAdmin}
          /> 
        },
        { 
          path: "/customers", 
          element: <CustomersPage 
            customers={isAdmin ? customers : [selectedCustomer].filter(Boolean) as Customer[]} 
            selectedCustomer={selectedCustomer} 
            setSelectedCustomer={setSelectedCustomer}
            isAdmin={isAdmin}
          /> 
        },
        { path: "/plan", element: <Plan customers={isAdmin ? customers : [selectedCustomer].filter(Boolean) as Customer[]} 
            selectedCustomer={selectedCustomer} 
            setSelectedCustomer={setSelectedCustomer} /> },
        { path: "/social-posts", element: <SocialPostCreator /> },
        { 
          path: "/seo",
          element: (
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Optimized Listings</h2>
                {isAdmin && (
                  <select 
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => {
                      const customer = customers.find(c => c.id === e.target.value) || null;
                      setSelectedCustomer(customer);
                      if (customer) {
                        fetchListings(customer.customer_id);
                      }
                    }}
                    style={{ padding: '10px', fontSize: '16px', minWidth: '200px' }}
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.store_name} - {customer.store_owner_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {isAdmin ? (
                <div>
                  <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Search listings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '200px' }}
                    />
                    <div>
                      <button onClick={handlePreviousPage} disabled={currentPage === 1} style={{ marginRight: '10px', padding: '5px 10px' }}>Previous</button>
                      <span>Page {currentPage} of {totalPages}</span>
                      <button onClick={handleNextPage} disabled={currentPage === totalPages} style={{ marginLeft: '10px', padding: '5px 10px' }}>Next</button>
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
                      {listings.map((listing) => (
                        <tr key={listing.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td style={{ padding: '12px' }}>{listing.listingId}</td>
                          <td style={{ padding: '12px' }}>{listing.title}</td>
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
              ) : (
                <div>This feature is coming soon!</div>
              )}
            </div>
          )
        },
        { path: "/pinterest-automation", element: <PinterestAutomation /> },
        { path: "/pinterest", element: <PinterestAutomation /> },
        { path: "/design-hub", element: <DesignHub customerId={selectedCustomer?.customer_id || ''} isAdmin={isAdmin} /> },
        { 
          path: "/etsy-ads-recommendation", 
          element: <EtsyAdsRecommendation 
            customerId={isAdmin ? '' : (selectedCustomer?.customer_id || '')} 
            isAdmin={isAdmin} 
          />
        },
        { path: "/social", element: <Social /> },
        { path: "/ads-recommendation", element: <AdsRecommendation /> },
      ],
    },
  ]);

  return (
    <AuthProvider> {/* Wrap the entire app with AuthProvider */}
      <div style={styles.app}>
        <header style={styles.header}>
          <div style={styles.logoContainer}>
            <img src="/logo.png" alt="Goopss Logo" style={styles.logo} />
          </div>
          <h1 style={styles.title}>Goopss Dashboard</h1>
        </header>
        <RouterProvider router={router} />
        <Modal
          isOpen={isLoginModalOpen}
          onRequestClose={() => setIsLoginModalOpen(false)}
          contentLabel="Login Modal"
        >
          <LoginForm onLogin={handleLogin} error={loginError} />
        </Modal>
      </div>
    </AuthProvider>
  );
}

export default App;