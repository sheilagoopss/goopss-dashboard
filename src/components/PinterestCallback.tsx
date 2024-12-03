import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { message } from "antd";
import { ICustomer } from "../types/Customer";

const PinterestCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerData } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!customerData || !customerData.customer_id) {
          console.error("No user or invalid user type:", customerData);
          throw new Error("No user or invalid user type");
        }

        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get("code");
        console.log("Got Pinterest code:", code);

        if (code) {
          console.log("Attempting to save to Firebase...");
          console.log("Customer ID:", customerData.customer_id);

          // Store Pinterest data in Firebase
          const customerRef = doc(db, "customers", customerData.customer_id);
          await setDoc(
            customerRef,
            {
              pinterest_integration: {
                auth_code: code,
                last_connected_at: new Date(),
                is_connected: true,
              },
            },
            { merge: true },
          );

          message.success("Successfully connected to Pinterest!");
        } else {
          message.error("No authorization code received from Pinterest");
        }

        navigate("/pinterest-automation");
      } catch (error) {
        message.error("Failed to connect to Pinterest");
        navigate("/pinterest-automation");
      }
    };

    handleCallback();
  }, [location, navigate, customerData]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Connecting to Pinterest...</h2>
      <p>Please wait while we complete the connection.</p>
    </div>
  );
};

export default PinterestCallback;
