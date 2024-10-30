import {
  createBrowserRouter,
  RouteObject,
  RouterProvider,
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
import { useEffect, useState } from "react";
import { ICustomer } from "../types/Customer";
import Social from "../components/Social";
import AdsRecommendation from "../components/AdsRecommendation";
import { collection, DocumentData, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import LoginPage from "../components/auth/login";
import { Spin } from "antd";
import UpgradeNotice from "../components/common/UpgradeNotice";
import Tagify from "../components/tagify/Tagify";
import TaskManagement from "../components/taskList/TaskManagement";
import UserListingOptimization from "../components/UserListingOptimization";
import StoreAnalysis from "../components/storeAnalysys/StoreAnalysis";
import Stats from "../components/stats/Stats";
import PinterestCallback from "../components/PinterestCallback";
import StoreInformation from "../components/storeInformation/StoreInformation";
import ErrorBoundary from "../components/ErrorBoundary";

const FREE_ROUTES = ["/", "/tagify"];

const Routes = () => {
  const { user, isAdmin, loading, customerData } = useAuth();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );

  useEffect(() => {
    const fetchCustomers = async () => {
      if (isAdmin) {
        try {
          const customersCollection = collection(db, "customers");
          const customersSnapshot = await getDocs(customersCollection);
          const customersList = customersSnapshot.docs.map(
            (doc: DocumentData) => ({ id: doc.id, ...doc.data() } as ICustomer),
          );
          console.log("Fetched customers:", customersList);
          setCustomers(customersList);
        } catch (error) {
          console.error("Error fetching customers:", error);
        }
      } else if (customerData) {
        setCustomers([customerData]);
        setSelectedCustomer(customerData);
      }
    };

    fetchCustomers();
  }, [isAdmin, customerData]);

  console.log(
    "Routes rendering. Loading:",
    loading,
    "User:",
    user,
    "IsAdmin:",
    isAdmin,
    "CustomerData:",
    customerData,
  );

  const applyUpgradeNotice = (routes: RouteObject[]): any[] => {
    return routes.map((route) => {
      const hasChildren = route.children && route.children.length > 0;

      const updatedChildren = hasChildren
        ? applyUpgradeNotice(route.children || [])
        : [];

      const isRouteOpen =
        isAdmin ||
        FREE_ROUTES.includes(route.path || "") ||
        (user as ICustomer)?.customer_type === "Paid";

      return {
        ...route,
        children: updatedChildren,
        element: isRouteOpen ? route.element : <UpgradeNotice />,
      };
    });
  };

  const router = createBrowserRouter(
    [
      {
        path: "/pinterest-callback",
        element: <PinterestCallback />,
      },
      {
        path: "/",
        element: <DashboardLayout />,
        children: applyUpgradeNotice([
          {
            path: "/customers",
            element: isAdmin && <CustomerManagement />,
          },
          {
            path: "/plan",
            element: (
              <Plan
                customers={
                  isAdmin
                    ? customers
                    : ([selectedCustomer].filter(Boolean) as ICustomer[])
                }
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
              />
            ),
          },
          {
            path: "/seo",
            element: (
              <>
                {isAdmin ? (
                  <div style={{ width: '100%' }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        marginBottom: "20px",
                      }}
                    >
                      <CustomersDropdown
                        customers={customers}
                        selectedCustomer={selectedCustomer}
                        setSelectedCustomer={setSelectedCustomer}
                        isAdmin={isAdmin}
                      />
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
                            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>{selectedCustomer.store_name}</h2>
                            <p style={{ color: '#666', margin: '0 0 4px 0' }}>{selectedCustomer.store_owner_name}</p>
                            <p style={{ fontSize: '14px', color: '#888', margin: '0' }}>Customer ID: {selectedCustomer.customer_id}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedCustomer && (
                      <SEOListings
                        customerId={selectedCustomer.customer_id}
                        storeName={selectedCustomer.store_name}
                      />
                    )}
                  </div>
                ) : (
                  <div style={{ width: '100%' }}>
                    <UserListingOptimization />
                  </div>
                )}
              </>
            ),
          },
          { path: "/pinterest-automation", element: <PinterestAutomation /> },
          { path: "/pinterest", element: <PinterestAutomation /> },
          {
            path: "/design-hub",
            element: isAdmin ? (
              <DesignHub
                customerId={selectedCustomer?.customer_id || ""}
                isAdmin={true}
              />
            ) : (
              <UserDesignHub customerId={selectedCustomer?.customer_id || ""} />
            ),
          },
          {
            path: "/ads-recommendation",
            element: (
              <AdsRecommendation
                customerId={isAdmin ? "" : selectedCustomer?.customer_id || ""}
                isAdmin={isAdmin}
              />
            ),
          },
          { path: "/social", element: <Social /> },
          { path: "/tagify", element: !isAdmin && <Tagify /> },
          { path: "/taskSummary", element: isAdmin && <TaskManagement /> },
          { 
            path: "/store-analysis", 
            element: isAdmin && <StoreAnalysis /> 
          },
          { 
            path: "/stats", 
            element: isAdmin && <Stats /> 
          },
          {
            path: "/store-information",
            element: (
              <div style={{ width: '100%' }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h1>Store Information</h1>
                  {isAdmin && (
                    <CustomersDropdown
                      customers={customers}
                      selectedCustomer={selectedCustomer}
                      setSelectedCustomer={setSelectedCustomer}
                      isAdmin={isAdmin}
                    />
                  )}
                </div>
                <StoreInformation 
                  customerId={selectedCustomer?.customer_id || ""} 
                  isAdmin={isAdmin}
                />
              </div>
            ),
          },
        ]),
      },
    ]
  );

  return loading ? (
    <Spin fullscreen size="large" />
  ) : !user ? (
    <LoginPage />
  ) : (
    <RouterProvider router={router} />
  );
};

export default Routes;
