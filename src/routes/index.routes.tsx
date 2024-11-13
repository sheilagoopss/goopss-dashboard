import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import CustomerManagement from "../components/customers/CustomerManagement";
import { useAuth } from "../contexts/AuthContext";
import CustomersDropdown from "../components/CustomersDropdown";
import SEOListings from "../components/SEOListings";
import PinterestAutomation from "../components/PinterestAutomation";
import UserDesignHub from "../components/UserDesignHub";
import PlanComponent from '../components/Plan';
import Social from "../components/Social";
import AdsRecommendation from "../components/AdsRecommendation";
import LoginPage from "../components/auth/login";
import UpgradeNotice from "../components/common/UpgradeNotice";
import Tagify from "../components/tagify/Tagify";
import TaskManagement from "../components/taskList/TaskManagement";
import UserListingOptimization from "../components/UserListingOptimization";
import { useState, useEffect } from "react";
import { ICustomer, IAdmin } from "../types/Customer";
import StoreAnalysis from "../components/storeAnalysys/StoreAnalysis";
import Stats from "../components/stats/Stats";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import StoreInformation from "../components/storeInformation/StoreInformation";
import DesignHubV2 from "components/designHub/DesignHub";
import { DesignHub } from "components/DesignHub";
import { Spin } from 'antd';
import SocialInsights from "../components/social/SocialInsights";
import ListingDuplication from "../components/ListingDuplication";
import PlanTaskRules from "../components/PlanTaskRules";
import { CustomerPlan } from '../components/CustomerPlan';
import { PlanSimpleView } from "../components/plan-simple-view";
import UserHomepage from "../components/UserHomepage";
import MeetingBooking from "../components/MeetingBooking";
import ROASCalculator from "../components/ROASCalculator";


export default function AppRoutes() {
  const { isAdmin, user, loading } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [userType, setUserType] = useState<"Free" | "Paid" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add this function to fetch customers
  const fetchCustomers = async () => {
    try {
      const customersCollection = collection(db, "customers");
      const customersSnapshot = await getDocs(customersCollection);
      const customersList = customersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ICustomer[];
      setCustomers(customersList);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  // Add function to fetch current user's type
  const fetchUserType = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      console.log("Fetching user type for ID:", user.id);
      const userDoc = await getDocs(
        query(collection(db, "customers"), where("customer_id", "==", user.id)),
      );
      console.log(
        "Query result:",
        userDoc.docs.map((doc) => doc.data()),
      );
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data() as ICustomer;
        console.log("Found user data:", userData);
        setUserType(userData.customer_type);
      } else {
        console.log("No user document found");
        setUserType("Free");
      }
    } catch (error) {
      console.error("Error fetching user type:", error);
      setUserType("Free");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchCustomers();
      setIsLoading(false);
    } else if (user?.id) {
      fetchUserType();
    }
  }, [isAdmin, user]);

  console.log("Current state:", { isAdmin, userType, isLoading });

  // Loading component
  const LoadingScreen = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <Spin size="large" />
      <span style={{ color: "#666" }}>Loading...</span>
    </div>
  );

  // Only show loading screen if we're checking an existing auth state
  if (loading && user === undefined) {
    return <LoadingScreen />;
  }

  // Protected route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading && user === undefined) {
      return <LoadingScreen />;
    }

    if (!user) {
      console.log("No user found, redirecting to login");
      return <Navigate to="/login" replace />;
    }
    console.log("User found, rendering protected content");
    return <>{children}</>;
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          loading && user === undefined ? (
            <LoadingScreen />
          ) : user ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {isAdmin ? (
          <>
            <Route index element={<CustomerManagement />} />
            <Route
              path="customer-form"
              element={<StoreInformation customerId="" isAdmin={true} />}
            />
            <Route path="design-hub" element={<DesignHubV2 />} />
            {/* <Route 
              path="design-hub" 
              element={<DesignHub customerId={selectedCustomer?.id || ''} isAdmin={true} />} 
            />  */}
            <Route
              path="listings"
              element={
                <div style={{ paddingTop: "16px" }}>
                  <div
                    style={{
                      marginBottom: "24px",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div style={{ width: "300px" }}>
                      <CustomersDropdown
                        customers={customers}
                        selectedCustomer={selectedCustomer}
                        setSelectedCustomer={setSelectedCustomer}
                        isAdmin={true}
                      />
                    </div>
                  </div>
                  {selectedCustomer ? (
                    <SEOListings
                      customerId={selectedCustomer.id}
                      storeName={selectedCustomer.store_name}
                    />
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      Please select a customer to view their listings
                    </div>
                  )}
                </div>
              }
            />
            <Route
              path="listings/duplicate"
              element={
                <div style={{ paddingTop: "16px" }}>
                  <div
                    style={{
                      marginBottom: "24px",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div style={{ width: "300px" }}>
                      <CustomersDropdown
                        customers={customers}
                        selectedCustomer={selectedCustomer}
                        setSelectedCustomer={setSelectedCustomer}
                        isAdmin={true}
                      />
                    </div>
                  </div>
                  {selectedCustomer ? (
                    <ListingDuplication
                      customerId={selectedCustomer.id}
                      storeName={selectedCustomer.store_name}
                    />
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      Please select a customer to view their listings
                    </div>
                  )}
                </div>
              }
            />
            <Route path="social" element={<Social />} />
            <Route 
              path="social-insights" 
              element={<SocialInsights customerId="" isAdmin={true} />} 
            />
            <Route path="pinterest" element={<PinterestAutomation />} />
            <Route
              path="ads-recommendation"
              element={
                <AdsRecommendation
                  customerId={selectedCustomer?.id || ""}
                  isAdmin={true}
                />
              }
            />
            <Route path="store-analysis" element={<StoreAnalysis />} />
            <Route path="stats" element={<Stats />} />
            <Route path="tasks" element={<TaskManagement />} />
            <Route
              path="plan"
              element={
                <div style={{ paddingTop: "16px" }}>
                  <PlanComponent
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    setSelectedCustomer={setSelectedCustomer}
                  />
                </div>
              }
            />
            <Route path="plan-task-rules" element={<PlanTaskRules />} />
            <Route 
              path="plan-simple-view" 
              element={
                <div style={{ paddingTop: "16px" }}>
                  <PlanSimpleView 
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    setSelectedCustomer={setSelectedCustomer}
                  />
                </div>
              } 
            />
            <Route
              path="roas-calculator"
              element={
                userType === "Free" ? (
                  <UpgradeNotice />
                ) : (
                  <ROASCalculator />
                )
              }
            />
          </>
        ) : (
          <>
            <Route index element={<Navigate to="/home" replace />} />
            <Route
              path="home"
              element={
                userType === "Free" ? (
                  <UpgradeNotice />
                ) : (
                  <UserHomepage />
                )
              }
            />
            <Route
              path="my-info"
              element={
                <StoreInformation customerId={user?.id || ""} isAdmin={false} />
              }
            />
            <Route
              path="design-hub"
              element={
                userType === "Free" ? <UpgradeNotice /> : <DesignHubV2 />
              }
            />
            {/* <Route
              path="design-hub"
              element={userType === "Free" ? <UpgradeNotice /> : <UserDesignHub customerId={user?.id || ''} />}
            /> */}
            <Route
              path="listings"
              element={
                userType === "Free" ? (
                  <UpgradeNotice />
                ) : (
                  <UserListingOptimization />
                )
              }
            />
            <Route
              path="social"
              element={userType === "Free" ? <UpgradeNotice /> : <Social />}
            />
            <Route 
              path="social-insights" 
              element={
                userType === "Free" ? 
                <UpgradeNotice /> : 
                <SocialInsights customerId={user?.id || ''} isAdmin={false} />
              }
            />
            <Route path="tagify" element={<Tagify />} />
            <Route
              path="description-hero"
              element={
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    fontSize: "18px",
                    color: "#666",
                  }}
                >
                  Coming Soon
                </div>
              }
            />
            <Route
              path="ads-recommendation"
              element={
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    fontSize: "18px",
                    color: "#666",
                  }}
                >
                  Coming Soon
                </div>
              }
            />
            <Route
              path="plan"
              element={
                userType === "Free" ? 
                <UpgradeNotice /> : 
                <CustomerPlan />
              }
            />
            <Route
              path="meeting-booking"
              element={
                userType === "Free" ? (
                  <UpgradeNotice />
                ) : (
                  <MeetingBooking />
                )
              }
            />
            <Route
              path="roas-calculator"
              element={
                userType === "Free" ? (
                  <UpgradeNotice />
                ) : (
                  <ROASCalculator />
                )
              }
            />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
