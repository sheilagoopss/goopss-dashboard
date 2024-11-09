import React from 'react';
import { Select, Space } from 'antd';
import { ICustomer } from '../types/Customer';

interface CustomersDropdownProps {
  customers: ICustomer[];
  selectedCustomer: ICustomer | null;
  setSelectedCustomer: (customer: ICustomer | null) => void;
  isAdmin: boolean;
}

const CustomersDropdown: React.FC<CustomersDropdownProps> = ({
  customers,
  selectedCustomer,
  setSelectedCustomer,
  isAdmin,
}) => {
  const filteredCustomers = isAdmin ? customers : customers.filter(c => c.customer_type === 'Paid');

  return (
    <Select
      style={{ width: '100%' }}
      placeholder="Select a customer"
      value={selectedCustomer?.id}
      onChange={(value) => {
        const customer = filteredCustomers.find((c) => c.id === value);
        setSelectedCustomer(customer || null);
      }}
      size="large"
      listHeight={400}
      showSearch
      optionFilterProp="children"
      filterOption={(input, option) =>
        (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
      }
    >
      {filteredCustomers.map((customer) => (
        <Select.Option 
          key={customer.id} 
          value={customer.id}
          label={`${customer.store_owner_name} - ${customer.store_name}`}
        >
          <Space>
            {customer.logo && (
              <img 
                src={customer.logo} 
                alt={customer.store_name} 
                style={{ width: 20, height: 20, borderRadius: '50%' }} 
              />
            )}
            {customer.store_owner_name} - {customer.store_name}
          </Space>
        </Select.Option>
      ))}
    </Select>
  );
};

export default CustomersDropdown;
