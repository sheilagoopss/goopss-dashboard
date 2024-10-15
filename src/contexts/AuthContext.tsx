import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { Admin, Customer } from "../types/Customer";
import { message } from "antd";

interface AuthContextType {
  user: Customer | Admin | null;
  isAdmin: boolean;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<void>;
  toggleAdminMode: () => void;
  loggingIn: boolean;
  googleLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<Customer | Admin | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [googleLoggingIn, setGoogleLoggingIn] = useState(false);

  const handleLoginUser = async (user: UserCredential) => {
    const customersCollection = collection(db, "customers");
    const customersSnapshot = await getDocs(customersCollection);
    const customerDoc = customersSnapshot.docs.find(
      (doc) => doc.data().email === user.user.email,
    );

    if (customerDoc) {
      const userData = {
        id: customerDoc.id,
        ...customerDoc.data(),
      } as Customer;
      setUser(userData);
      setIsAdmin(false);
    } else {
      const q = query(collection(db, "admin"), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const userData = {
          ...adminDoc.data(),
          isAdmin: true,
        } as Admin;
        setUser(userData);
        setIsAdmin(true);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const login = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      setLoggingIn(true);
      const resp = await signInWithEmailAndPassword(auth, email, password);
      await handleLoginUser(resp);
      setLoggingIn(false);
    } catch (error) {
      console.error("Error signing in: ", error);
      setLoggingIn(false);
      message.error({ content: "Invalid email or password" });
    }
  };

  const googleLogin = async () => {
    setGoogleLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const resp = await signInWithPopup(auth, provider);
      message.success("Logged in with Google successfully");
      await handleLoginUser(resp);
    } catch (error) {
      message.error(
        "Failed to log in with Google: " + (error as Error).message,
      );
    } finally {
      setGoogleLoggingIn(false);
    }
  };

  const toggleAdminMode = () => {
    setIsAdmin(!isAdmin);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        login,
        logout,
        googleLogin,
        toggleAdminMode,
        loggingIn,
        googleLoggingIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
