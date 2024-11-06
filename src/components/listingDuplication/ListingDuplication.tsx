import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Space, Button, Tag, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Listing } from '../../types/Listing';
import { useAuth } from '../../contexts/AuthContext';
import { IAdmin } from '../../types/Customer';

interface ListingDuplicationProps {
  customerId: string;
  storeName: string;
}

const ListingDuplication: React.FC<ListingDuplicationProps> = ({ customerId, storeName }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchListings = async () => {
      if (!customerId) return;

      setIsLoading(true);
      try {
        const listingsRef = collection(db, 'listings');
        const q = query(listingsRef, where('customer_id', '==', customerId));
        const querySnapshot = await getDocs(q);
        const listingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Listing[];

        setListings(listingsData);
      } catch (error) {
        console.error('Error fetching listings:', error);
        message.error('Failed to fetch listings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [customerId]);

  return (
    <Card title={`Listing Duplication - ${storeName}`}>
      {/* We'll add the duplication UI here */}
      <div>Coming soon...</div>
    </Card>
  );
};

export default ListingDuplication; 