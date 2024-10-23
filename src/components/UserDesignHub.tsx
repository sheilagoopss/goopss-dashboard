import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Listing, ListingImage } from '../types/Listing';
import { Input, Select, Spin, Pagination, Modal } from 'antd';

const { Search } = Input;
const { Option } = Select;

interface UserDesignHubProps {
  customerId: string;
}

const ITEMS_PER_PAGE = 12;

export const UserDesignHub: React.FC<UserDesignHubProps> = ({ customerId }) => {
  const [customerListings, setCustomerListings] = useState<Listing[]>([]);
  const [listingImages, setListingImages] = useState<Record<string, ListingImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      fetchCustomerListings(customerId);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId && statusFilter !== 'pending') {
      fetchImagesForStatus(customerId, statusFilter);
    }
  }, [customerId, statusFilter]);

  const fetchCustomerListings = async (customerId: string) => {
    setLoading(true);
    try {
      const listingsRef = collection(db, 'listings');
      const q = query(
        listingsRef, 
        where('customer_id', '==', customerId),
        where('hasImage', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      const listings: Listing[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      setCustomerListings(listings);

      await fetchImagesForStatus(customerId, 'pending');
    } catch (error) {
      console.error("Error fetching customer listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImagesForStatus = async (customerId: string, status: string) => {
    setLoading(true);
    try {
      const imagesRef = collection(db, 'images');
      const imagesQuery = query(
        imagesRef, 
        where('customer_id', '==', customerId),
        where('status', '==', status)
      );
      const imagesSnapshot = await getDocs(imagesQuery);
      
      const newImages: Record<string, ListingImage[]> = {};
      imagesSnapshot.docs.forEach(doc => {
        const imageData = doc.data();
        const image: ListingImage = { 
          id: doc.id, 
          url: imageData.url,
          status: imageData.status,
          listing_id: imageData.listing_id
        };
        if (image.listing_id) {
          if (!newImages[image.listing_id]) {
            newImages[image.listing_id] = [];
          }
          newImages[image.listing_id].push(image);
        }
      });

      setListingImages(prev => ({
        ...prev,
        ...newImages
      }));
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = useMemo(() => {
    return customerListings
      .filter(listing => {
        const matchesSearch = 
          listing.listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          listing.listingID.toLowerCase().includes(searchTerm.toLowerCase());
        const listingImagesArray = listingImages[listing.id] || [];
        const matchesStatus = statusFilter === 'all' || 
                              listingImagesArray.some(img => img.status === statusFilter);
        return matchesSearch && matchesStatus;
      });
  }, [customerListings, listingImages, searchTerm, statusFilter]);

  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredListings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredListings, currentPage]);

  const handleImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const getFilteredImages = (listingId: string) => {
    const images = listingImages[listingId] || [];
    return statusFilter === 'all' ? images : images.filter(img => img.status === statusFilter);
  };

  return (
    <div style={styles.container}>
      <h2>Your Designs</h2>
      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="Search listings by title or ID"
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: 300, marginRight: 16 }}
        />
        <Select
          defaultValue="pending"
          style={{ width: 120, marginRight: 16 }}
          onChange={value => setStatusFilter(value)}
        >
          <Option value="all">All Status</Option>
          <Option value="pending">Pending</Option>
          <Option value="approved">Approved</Option>
          <Option value="revision">Revision</Option>
        </Select>
      </div>
      {loading ? (
        <Spin size="large" />
      ) : (
        <>
          <div style={styles.cardGrid}>
            {paginatedListings.map(listing => (
              <div key={listing.id} style={styles.card}>
                <div style={styles.cardContent}>
                  <p style={styles.cardId}>ID: {listing.listingID}</p>
                  <h4 style={styles.cardTitle} title={listing.listingTitle}>
                    {listing.listingTitle}
                  </h4>
                  <div style={styles.uploadedImagesPreview}>
                    {getFilteredImages(listing.id).map((image, index) => (
                      <div key={`uploaded-${index}`} style={styles.thumbnailContainer}>
                        <img 
                          src={image.url} 
                          alt={`Uploaded ${index + 1}`}
                          style={styles.uploadedImageThumbnail}
                          onClick={() => handleImagePreview(image.url)}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: '0',
                          right: '0',
                          background: image.status === 'approved' ? 'green' : image.status === 'revision' ? 'orange' : 'blue',
                          color: 'white',
                          padding: '2px 5px',
                          fontSize: '10px',
                          borderRadius: '3px'
                        }}>
                          {image.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            current={currentPage}
            total={filteredListings.length}
            pageSize={ITEMS_PER_PAGE}
            onChange={setCurrentPage}
            style={{ marginTop: 16, textAlign: 'center' }}
          />
        </>
      )}
      <Modal
        visible={!!previewImage}
        footer={null}
        onCancel={() => setPreviewImage(null)}
      >
        <img alt="Preview" style={{ width: '100%' }} src={previewImage || ''} />
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  cardContent: {
    padding: '16px',
  },
  cardId: {
    fontSize: '14px',
    color: '#666',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    marginBottom: '8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  uploadedImagesPreview: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '5px',
    marginTop: '10px',
  },
  thumbnailContainer: {
    position: 'relative' as const,
  },
  uploadedImageThumbnail: {
    width: '50px',
    height: '50px',
    objectFit: 'cover' as const,
    cursor: 'pointer',
  },
};

export default UserDesignHub;
