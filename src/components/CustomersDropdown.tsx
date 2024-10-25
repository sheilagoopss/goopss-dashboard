import React, { useState, useRef, useEffect } from 'react';
import { ICustomer } from '../types/Customer';
import { ChevronDown, Users } from 'lucide-react';

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
  isAdmin
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isAdmin) return null;

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.store_name} ${customer.store_owner_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '300px' }}>
      <button
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <Users size={18} style={{ marginRight: '8px' }} />
          {selectedCustomer ? `${selectedCustomer.store_name} - ${selectedCustomer.store_owner_name}` : 'Select a customer'}
        </span>
        <ChevronDown size={18} />
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}
        >
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: 'none',
              borderBottom: '1px solid #ccc'
            }}
          />
          <ul
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}
          >
            {filteredCustomers.map((customer, index) => (
              <li
                key={customer.id}
                onClick={() => handleSelect(customer)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  borderBottom: index === filteredCustomers.length - 1 ? 'none' : '1px solid #eee',
                  backgroundColor: hoveredIndex === index ? '#f0f0f0' : 'white'
                }}
              >
                {customer.store_name} - {customer.store_owner_name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomersDropdown;
