import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

interface Customer {
  id: string;
  customer_id: string;
  store_name: string;
  store_owner_name: string;
  logo: string;
}

export default function Social() {
  const { isAdmin, user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersCollection = collection(db, 'customers');
        let q;
        
        if (isAdmin) {
          q = query(customersCollection);
        } else {
          q = query(customersCollection, where("email", "==", user?.email));
        }

        const querySnapshot = await getDocs(q);
        const customersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        setCustomers(customersList);

        if (!isAdmin && customersList.length > 0) {
          setSelectedCustomer(customersList[0]);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, [isAdmin, user]);

  const handleCustomerSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const customer = customers.find(c => c.id === event.target.value);
    setSelectedCustomer(customer || null);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Social Calendar</h1>
        
        {isAdmin && (
          <select 
            onChange={handleCustomerSelect}
            style={{ 
              width: '200px', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ccc' 
            }}
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.store_owner_name}
              </option>
            ))}
          </select>
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
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>{selectedCustomer.store_name}</h2>
              <p style={{ color: '#666' }}>{selectedCustomer.store_owner_name}</p>
              <p style={{ fontSize: '14px', color: '#888' }}>Customer ID: {selectedCustomer.customer_id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the component */}
    </div>
  );
}