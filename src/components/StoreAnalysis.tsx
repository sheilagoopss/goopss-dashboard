import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import CustomersDropdown from "./CustomersDropdown";
import { Customer } from "../types/Customer";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

const StoreAnalysis: React.FC = () => {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (isAdmin) {
        try {
          const customersCollection = collection(db, "customers");
          const customersSnapshot = await getDocs(customersCollection);
          const customersList = customersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Customer));
          setCustomers(customersList);
        } catch (err) {
          console.error("Error fetching customers:", err);
          setError("Failed to fetch customers");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [isAdmin]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: "20px", maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Store Analysis</h1>
        {isAdmin && (
          <CustomersDropdown
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            isAdmin={isAdmin}
          />
        )}
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

      {/* Add your store analysis content here */}
      <div>
        {selectedCustomer ? (
          <p>Store analysis for {selectedCustomer.store_name}</p>
        ) : (
          <p>Please select a customer first to view store analysis.</p>
        )}
      </div>
    </div>
  );
};

export default StoreAnalysis;
