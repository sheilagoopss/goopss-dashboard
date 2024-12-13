"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  UserCredential,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/firebase/config";
import { IAdmin, ICustomer } from "@/types/Customer";
import { message } from "antd";
import {
  clientSetCookie,
  getClientCookie,
  clearCookie,
  SupportedKeys,
} from "@/utils/cookies";
import FirebaseHelper from "@/helpers/FirebaseHelper";
import dayjs from "dayjs";
import { serverTimestamp, Timestamp } from "firebase/firestore";
import { IUserActivity } from "@/types/UserActivityLog";
import { useSubscribeCustomer } from "@/hooks/useKlaviyo";
import { useSearchParams } from "next/navigation";

interface AuthContextType {
  user: IAdmin | null | undefined;
  isAdmin: boolean;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<void>;
  toggleAdminMode: () => void;
  loggingIn: boolean;
  googleLoggingIn: boolean;
  loading: boolean;
  customerData: ICustomer | null;
  setCustomer: (customer: ICustomer | null) => void;
  signup: (params: { email: string; password: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isAdmin: false,
  login: async () => {},
  logout: async () => {},
  googleLogin: async () => {},
  toggleAdminMode: () => {},
  loggingIn: false,
  googleLoggingIn: false,
  loading: true,
  customerData: null,
  setCustomer: () => {},
  signup: async () => {},
  forgotPassword: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<IAdmin | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [googleLoggingIn, setGoogleLoggingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<ICustomer | null>(null);
  const { subscribeCustomer } = useSubscribeCustomer();
  const params = useSearchParams();
  const viewAsCustomer = params.get("viewAsCustomer");
  const selectedCustomerId = params.get("selectedCustomerId");

  const AUTH_COOKIE_KEY: SupportedKeys = "Authorization";

  const userActivityLog = async (user: ICustomer) => {
    const userActivityData: IUserActivity = {
      customer_id: user.id,
      activity: "login",
      timestamp: serverTimestamp() as Timestamp,
    };
    await FirebaseHelper.create("userActivity", userActivityData);
  };

  const handleLoginUser = useCallback(
    async (user: UserCredential) => {
      const token = await user.user.getIdToken();
      clientSetCookie({ key: AUTH_COOKIE_KEY, data: token });

      const customers = await FirebaseHelper.findWithFilter<ICustomer>(
        "customers",
        "email",
        user.user.email || "",
      );
      const customerDoc = customers.find(
        (doc) => doc.email === user.user.email,
      );
      if (customerDoc) {
        setCustomerData(customerDoc);
        setIsAdmin(false);
        await userActivityLog(customerDoc);
      } else {
        const admins = await FirebaseHelper.find<IAdmin>("admin");
        const admin = admins.find(
          (admin) =>
            admin.email?.toLowerCase() === user.user.email?.toLowerCase(),
        );

        if (admin) {
          const userData = {
            ...admin,
            isAdmin: true,
          } as IAdmin;
          setUser(userData);
          setIsAdmin(true);
          setCustomerData(null);
        } else {
          const created = await FirebaseHelper.create("customers", {
            customer_id: user.user.uid,
            email: user.user.email || "",
            contact_email: user.user.email || "",
            date_joined: dayjs().toISOString(),
            customer_type: "Free",
            store_owner_name: user.user.displayName || "",
            store_name: "",
            logo: user.user.photoURL,
          } as ICustomer);
          const customer = await FirebaseHelper.findOne<ICustomer>(
            "customers",
            created.id,
          );
          if (customer) {
            await userActivityLog(customer);
            await subscribeCustomer(customer.email, customer.store_owner_name);
            setCustomerData(customer);
            setIsAdmin(false);
          }
        }
      }
      setLoading(false);
    },
    [subscribeCustomer],
  );

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      clearCookie(AUTH_COOKIE_KEY);
      window.open(window.location.href, "_self");
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

      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.includes("google.com")) {
        const provider = new GoogleAuthProvider();
        const googleResp = await signInWithPopup(auth, provider);
        const googleCredential =
          GoogleAuthProvider.credentialFromResult(googleResp);
        await linkWithCredential(resp.user, googleCredential!);
        message.success("Email/Password account linked with Google account!");
      }

      await handleLoginUser(resp);
      setLoggingIn(false);
    } catch (error) {
      console.error("Error signing in: ", error);
      setLoggingIn(false);
      message.error({ content: "Invalid email or password" });
    }
  };

  const signup = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      setLoading(true);
      const resp = await createUserWithEmailAndPassword(auth, email, password);
      await handleLoginUser(resp);
      setLoading(false);
    } catch (error) {
      console.error("Error signing up: ", error);
      setLoading(false);
      message.error({ content: "Invalid email or password" });
    }
  };

  const googleLogin = async () => {
    setGoogleLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const resp = await signInWithPopup(auth, provider);

      const email = resp.user.email;
      const methods = await fetchSignInMethodsForEmail(auth, email!);

      if (methods.includes("password")) {
        const password = prompt("Enter your password to link your accounts:");
        if (password) {
          const credential = EmailAuthProvider.credential(email!, password);
          await linkWithCredential(resp.user, credential);
          message.success(
            "Google account linked with your Email/Password account!",
          );
        }
      }

      await handleLoginUser(resp);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    } finally {
      setGoogleLoggingIn(false);
    }
  };

  const checkForTokenOnLoad = useCallback(async () => {
    const token = getClientCookie(AUTH_COOKIE_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await new Promise<UserCredential>(
        (resolve, reject) => {
          onAuthStateChanged(auth, (user) => {
            if (user) {
              resolve({ user } as UserCredential);
            } else {
              reject(new Error("User not found"));
            }
          });
        },
      );
      await handleLoginUser(userCredential);
    } catch (error) {
      setUser(null);
      setLoading(false);
      console.error("Failed to re-authenticate user: ", error);
      clearCookie(AUTH_COOKIE_KEY);
    }
  }, [handleLoginUser]);

  const handleViewAsCustomer = useCallback(async () => {
    if (viewAsCustomer && selectedCustomerId) {
      const customer = await FirebaseHelper.findOne<ICustomer>(
        "customers",
        selectedCustomerId,
      );
      if (customer) {
        setIsAdmin(false);
        setCustomerData({ ...customer, isViewing: Boolean(viewAsCustomer) });
      }
    }
  }, [selectedCustomerId, viewAsCustomer]);

  const forgotPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    checkForTokenOnLoad().then(() => {
      handleViewAsCustomer();
    });
  }, [checkForTokenOnLoad, handleViewAsCustomer]);

  const toggleAdminMode = () => {
    setIsAdmin(!isAdmin);
  };

  const setCustomer = (customer: ICustomer | null) => {
    setCustomerData(customer);
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
        loading,
        customerData,
        setCustomer,
        signup,
        forgotPassword,
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
