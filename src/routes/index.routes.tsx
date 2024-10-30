import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import CustomerManagement from "../components/customers/CustomerManagement";
import { useAuth } from "../contexts/AuthContext";
import CustomersDropdown from "../components/CustomersDropdown";
import SEOListings from "../components/SEOListings";
import PinterestAutomation from "../components/PinterestAutomation";
import { DesignHub } from "../components/DesignHub";
import { UserDesignHub } from "../components/UserDesignHub";
import Plan from "../components/Plan";
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

export default function AppRoutes() {
  const { isAdmin, user } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [customers, setCustomers] = useState<ICustomer[]>([]);

  // Add this function to fetch customers
  const fetchCustomers = async () => {
    try {
      const customersCollection = collection(db, "customers");
      const customersSnapshot = await getDocs(customersCollection);
      const customersList = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ICustomer[];
      setCustomers(customersList);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  // Add useEffect to fetch customers when component mounts
  useEffect(() => {
    if (isAdmin) {
      fetchCustomers();
    }
  }, [isAdmin]);

  // Protected route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
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
          user ? <Navigate to="/" replace /> : <LoginPage />
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
              path="design-hub" 
              element={<DesignHub customerId={selectedCustomer?.id || ''} isAdmin={true} />} 
            />
            <Route 
              path="listings" 
              element={
                <div>
                  <div style={{ 
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <div style={{ width: '300px' }}>
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
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      Please select a customer to view their listings
                    </div>
                  )}
                </div>
              } 
            />
            <Route path="social" element={<Social />} />
            <Route 
              path="ads-recommendation" 
              element={<AdsRecommendation customerId={selectedCustomer?.id || ''} isAdmin={true} />} 
            />
            <Route path="store-analysis" element={<StoreAnalysis />} />
            <Route path="stats" element={<Stats />} />
            <Route path="tasks" element={<TaskManagement />} />
            <Route 
              path="plan" 
              element={
                <div>
                  <div style={{ 
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <div style={{ width: '300px' }}>
                      <CustomersDropdown 
                        customers={customers}
                        selectedCustomer={selectedCustomer}
                        setSelectedCustomer={setSelectedCustomer}
                        isAdmin={true}
                      />
                    </div>
                  </div>
                  <Plan 
                    customers={customers} 
                    selectedCustomer={selectedCustomer} 
                    setSelectedCustomer={setSelectedCustomer} 
                  />
                </div>
              } 
            />
          </>
        ) : (
          <>
            <Route index element={<Navigate to="/design-hub" replace />} />
            <Route
              path="design-hub"
              element={<UserDesignHub customerId={user?.id || ''} />}
            />
            <Route
              path="listings"
              element={<UserListingOptimization />}
            />
            <Route path="social" element={<Social />} />
            <Route path="tagify" element={<Tagify />} />
            <Route
              path="description-hero"
              element={<UpgradeNotice />}
            />
            <Route
              path="ads-recommendation"
              element={
                <AdsRecommendation 
                  customerId={user?.id || ''} 
                  isAdmin={false}
                />
              }
            />
            <Route
              path="my-info"
              element={
                <Plan
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  setSelectedCustomer={setSelectedCustomer}
                />
              }
            />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
