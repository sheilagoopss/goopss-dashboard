import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { Customer } from '../types/Customer';

interface CustomersPageProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: Dispatch<SetStateAction<Customer | null>>;
  isAdmin: boolean;
}

function CustomersPage({ customers, selectedCustomer, setSelectedCustomer, isAdmin }: CustomersPageProps) {
  useEffect(() => {
    console.log('Customers:', customers);
  }, [customers]);

  if (!isAdmin && selectedCustomer) {
    return (
      <div>
        <h2>Welcome to Your Dashboard</h2>
        <div>
          <h3>Store Information</h3>
          <p><strong>Store Name:</strong> {selectedCustomer.store_name}</p>
          <p><strong>Store Owner:</strong> {selectedCustomer.store_owner_name}</p>
          <p><strong>Email:</strong> {selectedCustomer.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Customers</h2>
      {isAdmin ? (
        <ul>
          {customers.map((customer) => (
            <li key={customer.id} onClick={() => setSelectedCustomer(customer)}>
              {customer.store_name} - {customer.store_owner_name}
            </li>
          ))}
        </ul>
      ) : (
        selectedCustomer && (
          <div>
            <h3>{selectedCustomer.store_name}</h3>
            <p>Owner: {selectedCustomer.store_owner_name}</p>
            <p>Customer ID: {selectedCustomer.customer_id}</p>
          </div>
        )
      )}
    </div>
  );
}

export default CustomersPage;
