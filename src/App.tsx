import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { collection, getDocs, DocumentData, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import Modal from 'react-modal';
import { db } from './firebase/config';
import DashboardLayout from './components/DashboardLayout';
import TitleDescriptionOptimizer from './components/TitleDescriptionOptimizer';
import SocialPostCreator from './components/SocialPostCreator';
import { DesignHub } from './components/DesignHub';
import CustomersPage from './components/CustomersPage';
import LoginForm from './components/LoginForm';
import EtsyAdsRecommendation from './components/EtsyAdsRecommendation'; // You'll need to create this component
import PinterestAutomation from './components/PinterestAutomation';
import Plan from './components/Plan';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider

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

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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

  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsLoginModalOpen(false);
      setLoginError(null);
    } catch (error) {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSelectedCustomer(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: <DashboardLayout openLoginModal={openLoginModal} />,
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
        { path: "/plan", element: <Plan customers={isAdmin ? customers : [selectedCustomer].filter(Boolean) as Customer[]} 
            selectedCustomer={selectedCustomer} 
            setSelectedCustomer={setSelectedCustomer} /> },
        { path: "/social-posts", element: <SocialPostCreator /> },
        { path: "/listing-optimizer", element: <TitleDescriptionOptimizer /> },
        { path: "/pinterest-automation", element: <PinterestAutomation /> },
        { path: "/pinterest", element: <div>Pinterest</div> },
        { path: "/design-hub", element: <DesignHub customerId={selectedCustomer?.customer_id || ''} isAdmin={isAdmin} /> },
        { 
          path: "/etsy-ads-recommendation", 
          element: <EtsyAdsRecommendation 
            customerId={isAdmin ? '' : (selectedCustomer?.customer_id || '')} 
            isAdmin={isAdmin} 
          />
        },
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