import { createBrowserRouter, RouterProvider } from "react-router-dom";
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

const Routes = () => {
  const { user, isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  useEffect(() => {
    const fetchCustomers = async () => {
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
    };

    fetchCustomers();
  }, []);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <DashboardLayout />, // Remove toggleAdminMode prop
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
                <h1>SEO Optimizer</h1>
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
                <SEOListings
                  customerId={selectedCustomer?.customer_id || ""}
                  storeName={selectedCustomer?.store_name || ""}
                />
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
      ],
    },
  ]);
  return !user ? <LoginPage /> : <RouterProvider router={router} />;
};

export default Routes;
