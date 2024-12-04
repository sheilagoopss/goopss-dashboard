/* eslint-disable react-hooks/exhaustive-deps */
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import CustomerManagement from "../components/customers/CustomerManagement";
import { useAuth } from "../contexts/AuthContext";
import CustomersDropdown from "../components/CustomersDropdown";
import SEOListings from "../components/SEOListings";
import PinterestAutomation from "../components/PinterestAutomation";
import PlanComponent from "../components/plan/Plan";
import PlanSimpleView from "../components/plan/PlanSimpleView";
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
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import StoreInformation from "../components/storeInformation/StoreInformation";
import DesignHubV2 from "components/designHub/DesignHub";
import { Spin } from "antd";
import SocialInsights from "../components/social/SocialInsights";
import ListingDuplication from "../components/ListingDuplication";
import PlanTaskRules from "../components/PlanTaskRules";
import { CustomerPlan } from "../components/plan/CustomerPlan";
import UserHomepage from "../components/UserHomepage";
import MeetingBooking from "../components/MeetingBooking";
import ROASCalculator from "../components/ROASCalculator";
import ActivityLog from "components/customers/ActivityLog";
import ReactGA from "react-ga4";
import DescriptionHero from "components/descriptionHero/DescriptionHero";
import RoleManagement from "components/roleManagement/RoleManagement";
import { ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

export default function AppRoutes() {
  const {
    isAdmin,
    user,
    loading,
    customerData,
    setCustomer,
    toggleAdminMode,
  } = useAuth();
  const location = useLocation();
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [userType, setUserType] = useState<"Free" | "Paid" | null>(null);
  const [searchParams] = useSearchParams();
  const viewAsCustomer = searchParams.get("viewAsCustomer") === "true";
  const selectedCustomerId = searchParams.get("selectedCustomerId");

  // Move trackUserEvent inside the component
  const trackUserEvent = (eventName: string, eventData: any) => {
    if (!isAdmin && customerData) {
      ReactGA.event({
        category: "User Activity",
        action: eventName,
        label: customerData?.store_name || "unknown store",
        ...eventData,
      });
    }
  };

  // Make it available to child components
  useEffect(() => {
    // @ts-ignore
    window.trackUserEvent = trackUserEvent;
  }, [isAdmin, customerData, customers]);

  // Initialize GA once when component mounts
  useEffect(() => {
    if (customerData && !isAdmin && process.env.REACT_APP_GA_MEASUREMENT_ID) {
      ReactGA.initialize(process.env.REACT_APP_GA_MEASUREMENT_ID);
    }
  }, [isAdmin, customerData, userType]);

  // Track page views when route changes
  useEffect(() => {
    if (customerData && !isAdmin) {
      ReactGA.send({
        hitType: "pageview",
        page: location.pathname,
        store_name: customerData?.store_name || "unknown store",
        userType: userType,
      });
    }
  }, [location, isAdmin, customerData, userType, customers]);

  useEffect(() => {
    if (viewAsCustomer && selectedCustomerId) {
      setCustomer(
        customers.find((c) => c.id === selectedCustomerId) || null,
      );
      setSelectedCustomer(
        customers.find((c) => c.id === selectedCustomerId) || null,
      );
      toggleAdminMode();
    }
  }, [viewAsCustomer, selectedCustomerId, customers]);

  // Add this function to fetch customers
  const fetchCustomers = async () => {
    try {
      const customersCollection = collection(db, "customers");
      const customersSnapshot = await getDocs(customersCollection);
      const customersList = customersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isViewing: viewAsCustomer
      })) as ICustomer[];

      setCustomers(customersList);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchCustomers();
    } else if (customerData?.id) {
      setUserType(customerData.customer_type);
    }
  }, [isAdmin, customerData]);

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

  if (loading) {
    return <LoadingScreen />;
  }

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) {
      return <LoadingScreen />;
    }

    if (!customerData && !user) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  const designerRoutes = [
    <Route path="design-hub" element={<DesignHubV2 />} />,
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
    />,
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
    />,
  ];

  const teamMemberRoutes = [
    ...designerRoutes,
    <Route index element={<CustomerManagement />} />,
    <Route
      path="customer-form"
      element={<StoreInformation customerId="" isAdmin={true} />}
    />,
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
    />,
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
    />,
    <Route path="social" element={<Social />} />,
    <Route
      path="social-insights"
      element={<SocialInsights customerId="" isAdmin={true} />}
    />,
    <Route path="pinterest" element={<PinterestAutomation />} />,
    <Route
      path="ads-recommendation"
      element={
        <AdsRecommendation
          customerId={selectedCustomer?.id || ""}
          isAdmin={true}
        />
      }
    />,
    <Route path="store-analysis" element={<StoreAnalysis />} />,
    <Route path="stats" element={<Stats />} />,
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
    />,
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
    />,
    <Route path="roas-calculator" element={<ROASCalculator />} />,
  ];

  const superAdminRoutes = [
    ...teamMemberRoutes,
    <Route path="activity-log" element={<ActivityLog />} />,
    <Route path="plan-task-rules" element={<PlanTaskRules />} />,
    <Route path="tasks" element={<TaskManagement />} />,
    <Route path="role-management" element={<RoleManagement />} />,
  ];

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
          (user as IAdmin)?.role === "SuperAdmin" ? (
            superAdminRoutes
          ) : ["TeamMember", "Admin"].includes((user as IAdmin)?.role) ? (
            teamMemberRoutes
          ) : (
            designerRoutes
          )
        ) : (
          <>
            <Route index element={<Navigate to="/home" replace />} />
            <Route
              path="home"
              element={userType === "Free" ? <UpgradeNotice /> : <UserHomepage />}
            />
            <Route
              path="plan"
              element={userType === "Free" ? <UpgradeNotice /> : <CustomerPlan />}
            />
            <Route
              path="my-info"
              element={<StoreInformation customerId={customerData?.id || ""} isAdmin={false} />}
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
            <Route path="description-hero" element={<DescriptionHero />} />
            <Route
              path="social"
              element={userType === "Free" ? <UpgradeNotice /> : <Social />}
            />
            <Route
              path="social-insights"
              element={
                userType === "Free" ? (
                  <UpgradeNotice />
                ) : (
                  <SocialInsights customerId={customerData?.id || ""} isAdmin={false} />
                )
              }
            />
            <Route path="tagify" element={<Tagify />} />
            <Route path="store-analysis" element={<StoreAnalysis />} />
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
                userType === "Free" ? <UpgradeNotice /> : <CustomerPlan />
              }
            />
            <Route
              path="meeting-booking"
              element={
                userType === "Free" ? <UpgradeNotice /> : <MeetingBooking />
              }
            />
            <Route path="roas-calculator" element={<ROASCalculator />} />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
