import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { Customer } from '../types/Customer';

interface CustomersPageProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: Dispatch<SetStateAction<Customer | null>>;
  isAdmin: boolean;
}

function CustomersDropdown ({ customers, selectedCustomer, setSelectedCustomer, isAdmin }: CustomersPageProps) {
  if (!isAdmin && selectedCustomer) {
    return (
      <div>
        <div>
          <h3>Store Information</h3>
          <p><strong>Store Name:</strong> {selectedCustomer.store_name}</p>
          <p><strong>Store Owner:</strong> {selectedCustomer.store_owner_name}</p>
          <p><strong>Email:</strong> {selectedCustomer.email}</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div>
        {customers.length === 0 ? (
          <p>No customers found. Please check your database connection.</p>
        ) : (
          <select 
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const customer = customers.find(c => c.id === e.target.value) || null;
              setSelectedCustomer(customer);
            }}
            style={{ padding: '10px', fontSize: '16px', minWidth: '200px' }}
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.store_name} - {customer.store_owner_name}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return (
    <div>
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

export default CustomersDropdown;