import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

interface Customer {
  id: string;
  customer_id: string;
  store_name: string;
  store_owner_name: string;
  isAdmin: boolean;
  email: string;
}

interface AuthContextType {
  user: Customer | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleAdminMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Customer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is logged in, so they are not an admin
        setIsAdmin(false);

        // Find the customer document that matches the current user's email
        const customersCollection = collection(db, 'customers');
        const customersSnapshot = await getDocs(customersCollection);
        const customerDoc = customersSnapshot.docs.find(doc => doc.data().email === currentUser.email);
        
        if (customerDoc) {
          const userData = { id: customerDoc.id, ...customerDoc.data() } as Customer;
          setUser(userData);
          console.log("Selected customer:", userData);
        } else {
          console.error('No matching customer found for the current user');
        }
      } else {
        // No user is logged in, so treat as admin
        setIsAdmin(true);
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The user state will be updated by the onAuthStateChanged listener
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const toggleAdminMode = () => {
    setIsAdmin(!isAdmin);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout, toggleAdminMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};