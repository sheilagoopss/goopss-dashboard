import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
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
} from "firebase/auth";
import { auth } from "../firebase/config";
import { IAdmin, ICustomer } from "../types/Customer";
import { message, Spin } from "antd";
import {
  clientSetCookie,
  getClientCookie,
  clearCookie,
  SupportedKeys,
} from "../utils/cookies";
import FirebaseHelper from "../helpers/FirebaseHelper";
import dayjs from "dayjs";

interface AuthContextType {
  user: ICustomer | IAdmin | null | undefined;
  isAdmin: boolean;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<void>;
  toggleAdminMode: () => void;
  loggingIn: boolean;
  googleLoggingIn: boolean;
  loading: boolean;
  customerData: ICustomer | null;
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
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<ICustomer | IAdmin | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [googleLoggingIn, setGoogleLoggingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<ICustomer | null>(null);

  const AUTH_COOKIE_KEY: SupportedKeys = "Authorization";

  const handleLoginUser = async (user: UserCredential) => {
    const token = await user.user.getIdToken();
    clientSetCookie({ key: AUTH_COOKIE_KEY, data: token });

    const customers = await FirebaseHelper.find<ICustomer>("customers");
    const customerDoc = customers.find((doc) => doc.email === user.user.email);

    if (customerDoc) {
      setUser(customerDoc);
      setCustomerData(customerDoc);
      setIsAdmin(false);
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
          id: user.user.uid,
          customer_id: user.user.uid,
          email: user.user.email || '',
          contact_email: user.user.email || '',
          date_joined: dayjs().toISOString(),
          customer_type: "Free",
          store_owner_name: user.user.displayName || '',
          store_name: '',
          logo: user.user.photoURL,
        } as ICustomer);
        const customer = await FirebaseHelper.findOne<ICustomer>(
          "customers",
          created,
        );

        setUser(customer);
        setCustomerData(customer);
        setIsAdmin(false);
      }
    }
    setLoading(false);
  };

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
      message.error(
        "Failed to log in with Google: " + (error as Error).message,
      );
    } finally {
      setGoogleLoggingIn(false);
    }
  };

  const checkForTokenOnLoad = async () => {
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
  };

  useEffect(() => {
    checkForTokenOnLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        loading,
        customerData,
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
