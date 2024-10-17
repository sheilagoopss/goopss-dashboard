import {
  createBrowserRouter,
  RouteObject,
  RouterProvider,
} from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import CustomerManagement from "../components/customers/CustomerManagement";
import SocialPostCreator from "../components/SocialPostCreator";
import { useAuth } from "../contexts/AuthContext";
import CustomersDropdown from "../components/CustomersDropdown";
import SEOListings from "../components/SEOListings";
import PinterestAutomation from "../components/PinterestAutomation";
import { DesignHub } from "../components/DesignHub";
import EtsyAdsRecommendation from "../components/EtsyAdsRecommendation";
import Plan from "../components/Plan";
import { useEffect, useState } from "react";
import { Customer } from "../types/Customer";
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

const FREE_ROUTES = ["/", "/tagify"];

const Routes = () => {
  const { user, isAdmin, loading, customerData } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  useEffect(() => {
    const fetchCustomers = async () => {
      if (isAdmin) {
        try {
          const customersCollection = collection(db, "customers");
          const customersSnapshot = await getDocs(customersCollection);
          const customersList = customersSnapshot.docs.map(
            (doc: DocumentData) => ({ id: doc.id, ...doc.data() } as Customer),
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

  console.log("Routes rendering. Loading:", loading, "User:", user, "IsAdmin:", isAdmin, "CustomerData:", customerData);

  const applyUpgradeNotice = (routes: RouteObject[]): any[] => {
    return routes.map((route) => {
      const hasChildren = route.children && route.children.length > 0;

      const updatedChildren = hasChildren
        ? applyUpgradeNotice(route.children || [])
        : [];

      const isRouteOpen =
        isAdmin ||
        FREE_ROUTES.includes(route.path || "") ||
        (user as Customer)?.customer_type === "Paid";

      return {
        ...route,
        children: updatedChildren,
        element: isRouteOpen ? route.element : <UpgradeNotice />,
      };
    });
  };

  const router = createBrowserRouter(
    applyUpgradeNotice([
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          {
            path: "/customers",
            element: <CustomerManagement />,
          },
          {
            path: "/plan",
            element: (
              <Plan
                customers={
                  isAdmin
                    ? customers
                    : ([selectedCustomer].filter(Boolean) as Customer[])
                }
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
              />
            ),
          },
          { path: "/social-posts", element: <SocialPostCreator /> },
          {
            path: "/seo",
            element: (
              <div style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h1>SEO</h1>
                  {isAdmin && (
                    <CustomersDropdown
                      customers={customers}
                      selectedCustomer={selectedCustomer}
                      setSelectedCustomer={setSelectedCustomer}
                      isAdmin={isAdmin}
                    />
                  )}
                </div>
                {isAdmin ? (
                  <>
                    {selectedCustomer && (
                      <SEOListings
                        customerId={selectedCustomer.customer_id}
                        storeName={selectedCustomer.store_name}
                      />
                    )}
                  </>
                ) : (
                  <UserListingOptimization />
                )}
              </div>
            ),
          },
          { path: "/pinterest-automation", element: <PinterestAutomation /> },
          { path: "/pinterest", element: <PinterestAutomation /> },
          {
            path: "/design-hub",
            element: (
              <DesignHub
                customerId={selectedCustomer?.customer_id || ""}
                isAdmin={isAdmin}
              />
            ),
          },
          {
            path: "/etsy-ads-recommendation",
            element: (
              <EtsyAdsRecommendation
                customerId={isAdmin ? "" : selectedCustomer?.customer_id || ""}
                isAdmin={isAdmin}
              />
            ),
          },
          { path: "/social", element: <Social /> },
          { path: "/ads-recommendation", element: <AdsRecommendation /> },
          { path: "/tagify", element: <Tagify /> },
          { path: "/taskSummary", element: <TaskManagement /> },
        ],
      },
    ]),
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
