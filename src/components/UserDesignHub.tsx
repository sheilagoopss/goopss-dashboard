import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Listing, ListingImage } from '../types/Listing';
import { Input, Select, Spin, Pagination, Modal, Button, message, Form } from 'antd';

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
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [revisionModalVisible, setRevisionModalVisible] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const imageCache = useRef<{
    [customerId: string]: {
      [status: string]: Record<string, ListingImage[]>
    }
  }>({});

  useEffect(() => {
    if (customerId) {
      fetchCustomerListings(customerId);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
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
      console.log("Fetched listings with hasImage=true:", listings);
      setCustomerListings(listings);

      await fetchImagesForStatus(customerId, statusFilter);
    } catch (error) {
      console.error("Error fetching customer listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImagesForStatus = async (customerId: string, status: string) => {
    setLoading(true);
    try {
      // Check if images for this status are already in the cache
      if (imageCache.current[customerId]?.[status]) {
        setListingImages(imageCache.current[customerId][status]);
        setLoading(false);
        return;
      }

      const imagesRef = collection(db, 'images');
      const imagesQuery = query(
        imagesRef, 
        where('customer_id', '==', customerId),
        status === 'all' ? where('status', 'in', ['pending', 'approved', 'revision']) : where('status', '==', status)
      );
      const imagesSnapshot = await getDocs(imagesQuery);
      
      const newImages: Record<string, ListingImage[]> = {};
      imagesSnapshot.docs.forEach(doc => {
        const image = { id: doc.id, ...doc.data() } as ListingImage;
        if (image.listing_id) {
          if (!newImages[image.listing_id]) {
            newImages[image.listing_id] = [];
          }
          newImages[image.listing_id].push(image);
        }
      });

      console.log("Fetched images for customer:", customerId, "Status:", status, "Images:", newImages);

      // Update the cache
      if (!imageCache.current[customerId]) {
        imageCache.current[customerId] = {};
      }
      imageCache.current[customerId][status] = newImages;

      setListingImages(newImages);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = useMemo(() => {
    console.log("Filtering listings. Status filter:", statusFilter); // Add this log
    return customerListings
      .filter(listing => {
        const matchesSearch = 
          listing.listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          listing.listingID.toLowerCase().includes(searchTerm.toLowerCase());
        
        const listingImagesArray = listingImages[listing.id] || [];
        console.log(`Listing ${listing.id} images:`, listingImagesArray); // Add this log
        
        let matchesStatus = true;
        if (statusFilter !== 'all') {
          matchesStatus = listingImagesArray.some(img => img.status === statusFilter);
        }
        
        const shouldInclude = matchesSearch && matchesStatus;
        console.log(`Listing ${listing.id} included:`, shouldInclude); // Add this log
        return shouldInclude;
      });
  }, [customerListings, listingImages, searchTerm, statusFilter]);

  // Move this useEffect after filteredListings declaration
  useEffect(() => {
    console.log('customerListings:', customerListings);
    console.log('listingImages:', listingImages);
    console.log('filteredListings:', filteredListings);
  }, [customerListings, listingImages, filteredListings]);

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

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when changing filter
    fetchImagesForStatus(customerId, value); // Fetch images for the new status
  };

  const handleApprove = async (listingId: string) => {
    try {
      const images = listingImages[listingId] || [];
      const pendingImages = images.filter(img => img.status === 'pending');

      if (pendingImages.length === 0) {
        message.info('No pending images to approve.');
        return;
      }

      const batch = writeBatch(db);
      pendingImages.forEach(image => {
        const imageRef = doc(db, 'images', image.id);
        batch.update(imageRef, { status: 'approved' });
      });

      await batch.commit();

      // Update local state
      setListingImages(prev => ({
        ...prev,
        [listingId]: images.map(img => 
          img.status === 'pending' ? { ...img, status: 'approved' } : img
        )
      }));

      message.success('Images approved successfully.');
    } catch (error) {
      console.error('Error approving images:', error);
      message.error('Failed to approve images. Please try again.');
    }
  };

  const handleRevise = (imageId: string) => {
    setSelectedImageId(imageId);
    setRevisionModalVisible(true);
  };

  const handleRevisionSubmit = async (values: { revisionNote: string }) => {
    if (!selectedImageId) return;

    try {
      const imageRef = doc(db, 'images', selectedImageId);
      await updateDoc(imageRef, { 
        status: 'revision',
        statusChangeDate: serverTimestamp(),
        revisionNote: values.revisionNote
      });

      // Update local state
      setListingImages(prev => {
        const updatedImages = { ...prev };
        for (const listingId in updatedImages) {
          updatedImages[listingId] = updatedImages[listingId].map(img => 
            img.id === selectedImageId 
              ? { ...img, status: 'revision', revisionNote: values.revisionNote }
              : img
          );
        }
        return updatedImages;
      });

      message.success('Revision request submitted successfully.');
      setRevisionModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error submitting revision request:', error);
      message.error('Failed to submit revision request. Please try again.');
    }
  };

  const handleOpenModal = (listingId: string) => {
    setSelectedListing(listingId);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setSelectedListing(null);
    setIsModalVisible(false);
  };

  const handleApproveImage = async (imageId: string) => {
    if (!selectedListing) return;

    try {
      const imageRef = doc(db, 'images', imageId);
      await updateDoc(imageRef, { 
        status: 'approved',
        statusChangeDate: serverTimestamp()
      });

      // Update local state
      setListingImages(prev => ({
        ...prev,
        [selectedListing]: prev[selectedListing].map(img => 
          img.id === imageId ? { ...img, status: 'approved', statusChangeDate: new Date() } : img
        )
      }));

      message.success('Image approved successfully.');
    } catch (error) {
      console.error('Error approving image:', error);
      message.error('Failed to approve image. Please try again.');
    }
  };

  const handleReviseImage = (imageId: string) => {
    setSelectedImageId(imageId);
    setRevisionModalVisible(true);
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
          onChange={handleStatusChange}
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
                  <div style={styles.cardActions}>
                    <Button 
                      onClick={() => handleOpenModal(listing.id)}
                      style={styles.actionButton}
                    >
                      Approve/Revise
                    </Button>
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
        title="Manage Images"
        visible={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
      >
        {selectedListing && (
          <div style={styles.modalContent}>
            {getFilteredImages(selectedListing).map((image, index) => (
              <div key={image.id} style={styles.modalImageContainer}>
                <img 
                  src={image.url} 
                  alt={`Image ${index + 1}`}
                  style={styles.modalImage}
                />
                <div style={styles.modalImageActions}>
                  <Button 
                    onClick={() => handleApproveImage(image.id)}
                    disabled={image.status === 'approved'}
                    style={styles.approveButton}
                  >
                    Approve
                  </Button>
                  <Button 
                    onClick={() => handleReviseImage(image.id)}
                    disabled={image.status === 'revision'}
                    style={styles.reviseButton}
                  >
                    Request Revision
                  </Button>
                </div>
                <span style={{
                  ...styles.statusLabel,
                  background: image.status === 'approved' ? 'green' : image.status === 'revision' ? 'orange' : 'blue',
                }}>
                  {image.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>
      <Modal
        visible={!!previewImage}
        footer={null}
        onCancel={() => setPreviewImage(null)}
      >
        <img alt="Preview" style={{ width: '100%' }} src={previewImage || ''} />
      </Modal>
      <Modal
        title="Request Revision"
        visible={revisionModalVisible}
        onCancel={() => {
          setRevisionModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleRevisionSubmit}>
          <Form.Item
            name="revisionNote"
            rules={[{ required: true, message: 'Please enter revision notes' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter revision notes" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit Revision Request
            </Button>
          </Form.Item>
        </Form>
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
  cardActions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
  },
  approveButton: {
    backgroundColor: '#52c41a',
    color: 'white',
  },
  reviseButton: {
    backgroundColor: '#faad14',
    color: 'white',
  },
  modalContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
  },
  modalImageContainer: {
    position: 'relative' as const,
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '8px',
  },
  modalImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover' as const,
    marginBottom: '8px',
  },
  modalImageActions: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '100%',
  },
  statusLabel: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    padding: '2px 5px',
    borderRadius: '3px',
    color: 'white',
    fontSize: '12px',
  },
};

export default UserDesignHub;
