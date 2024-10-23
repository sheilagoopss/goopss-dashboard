import React, { useState, useEffect, useRef, useCallback, useMemo, CSSProperties, DragEvent } from 'react';
import { collection, getDocs, addDoc, onSnapshot, query, where, updateDoc, doc, getDoc, writeBatch, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import Modal from 'react-modal';
import { Listing, ListingImage } from '../types/Listing'; // Import the Listing type
import { FirebaseError } from 'firebase/app';
import { useDesignHubCreate } from '../hooks/useDesignHub';
import { useTaskCreate } from '../hooks/useTask';
import { Admin } from '../types/Customer';
import { useAuth } from '../contexts/AuthContext';

// Remove these imports
// import { Card, CardContent, CardFooter } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";

// Add this near the top of your component, after the imports
console.log("Storage object:", storage);

const ITEMS_PER_LOAD = 4;

const styles: { [key: string]: CSSProperties } = {
  container: {
    padding: '20px',
  },
  uploadForm: {
    marginBottom: '20px',
  },
  input: {
    marginRight: '10px',
  },
  button: {
    padding: '5px 10px',
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  imageContainer: {
    position: 'relative' as const,
  },
  image: {
    width: '100%',
    height: 'auto',
    borderRadius: '5px',
  },
  actionButton: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '12px',
    backgroundColor: '#007bff',
    color: 'white',
  },
  statusLabel: {
    position: 'absolute' as const,
    top: '5px',
    left: '5px',
    padding: '2px 5px',
    borderRadius: '3px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  listingSelector: {
    marginBottom: '20px',
  },
  listingsTable: {
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
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
    display: 'flex',
    flexDirection: 'column',
    height: 'auto', // Change from fixed height to auto
    minHeight: '400px', // Set a minimum height
  },
  cardImage: {
    width: '100%',
    height: '200px', // Adjust this value as needed
    overflow: 'hidden',
  },
  primaryImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardContent: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  cardId: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  cardTitle: {
    fontSize: '14px',
    marginBottom: '8px',
    lineHeight: '1.2em',
    minHeight: '2.4em', // Ensure space for at least 2 lines
    overflow: 'hidden',
    color: '#666',
  },
  cardBestseller: {
    fontSize: '14px',
    color: '#28a745',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  uploadedImagesPreview: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginTop: '10px',
    marginBottom: '10px',
    maxHeight: '150px', // Limit the height of the image preview area
    overflowY: 'auto', // Add scroll if there are many images
  },
  uploadedImageThumbnail: {
    width: '50px',
    height: '50px',
    objectFit: 'cover',
    cursor: 'pointer',
  },
  previewModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  previewImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    objectFit: 'contain',
  },
  cardDragging: {
    border: '2px dashed #007bff',
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  dropZone: {
    backgroundColor: '#f0f0f0',
    border: '2px dashed #ccc',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    cursor: 'pointer',
    minHeight: '80px', // Reduced height
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px', // Added margin at the bottom
    transition: 'background-color 0.3s ease',
  },
  cardFooter: {
    padding: '16px',
    borderTop: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20px',
  },
  paginationButton: {
    padding: '5px 10px',
    margin: '0 5px',
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  pageInfo: {
    margin: '0 10px',
  },
  thumbnailContainer: {
    position: 'relative',
    display: 'inline-block',
    marginRight: '5px',
    marginBottom: '5px',
  },
  removeButton: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'red',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
};

interface DesignHubProps {
  customerId: string;
  isAdmin: boolean;
}

interface Image {
  id: string;
  url: string;
  status: 'pending' | 'approved' | 'revision' | 'superseded';
  title: string;
  date: string;
  revisionNote?: string;
  customer_id: string;
  originalImageId?: string;
  currentRevisionId?: string;
  listing_id?: string; // Add this line to include the listing_id
}

interface Customer {
  id: string;
  store_owner_name: string;
  customer_id: string;
  store_name: string; // Add this line
}

interface ListingWithImages extends Listing {
  uploadedImages: ListingImage[];
  createdAt: string;
}

const ImageModal = ({ isOpen, onClose, imageUrl, title }: { isOpen: boolean; onClose: () => void; imageUrl: string; title: string }) => (
  <div style={{ 
    display: isOpen ? 'flex' : 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      maxWidth: '90%',
      maxHeight: '90%',
      overflow: 'auto'
    }}>
      <h2 style={{ marginBottom: '10px' }}>{title}</h2>
      <img src={imageUrl} alt={title} style={{ maxWidth: '100%', maxHeight: '80vh' }} />
      <button onClick={onClose} style={{ marginTop: '10px', padding: '5px 10px' }}>Close</button>
    </div>
  </div>
);

const DesignCard = ({ image, onApprove, onRevise, onSelect, isSelected, showCheckbox, isAdmin, onUploadRevision }: { 
  image: Image; 
  onApprove: (id: string) => void; 
  onRevise: (id: string, note: string) => void; 
  onSelect: (id: string, checked: boolean) => void; 
  isSelected: boolean; 
  showCheckbox: boolean;
  isAdmin: boolean;
  onUploadRevision: (id: string) => void;
}) => {
  const [isRevising, setIsRevising] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isRevisionNoteModalOpen, setIsRevisionNoteModalOpen] = useState(false);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsImageModalOpen(true);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${image.title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <div style={styles.imageContainer}>
      {image.url ? (
        <img src={image.url} alt={`Uploaded ${image.id}`} style={styles.image} onClick={handleImageClick} />
      ) : (
        <div style={{...styles.image, backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          No Image Available
        </div>
      )}
      <div style={{
        ...styles.statusLabel,
        backgroundColor: image.status === 'approved' ? 'green' : image.status === 'revision' ? 'orange' : image.status === 'superseded' ? 'gray' : 'blue',
      }}>
        {image.status === 'superseded' ? 'replaced' : image.status}
      </div>
      {showCheckbox && !isAdmin && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(image.id, e.target.checked)}
          style={{ position: 'absolute', top: '5px', right: '5px' }}
        />
      )}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '5px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      }}>
        {!isAdmin && image.status !== 'approved' && (
          <>
            <button 
              onClick={() => onApprove(image.id)} 
              style={{...styles.actionButton, flex: 1, marginRight: '5px'}}
            >
              Approve
            </button>
            <button 
              onClick={() => setIsRevising(true)} 
              style={{...styles.actionButton, flex: 1, marginLeft: '5px'}}
            >
              Revise
            </button>
          </>
        )}
        {isAdmin && image.status === 'revision' && (
          <>
            <button 
              onClick={() => setIsRevisionNoteModalOpen(true)}
              style={{...styles.actionButton, flex: 1, marginRight: '5px'}}
            >
              View Note
            </button>
            <button 
              onClick={() => onUploadRevision(image.id)}
              style={{...styles.actionButton, flex: 1, marginLeft: '5px'}}
            >
              Upload Revision
            </button>
          </>
        )}
        <button 
          onClick={handleDownload}
          style={{...styles.actionButton, flex: 1, marginLeft: isAdmin || image.status === 'approved' ? '0' : '5px'}}
        >
          Download
        </button>
      </div>
      {isRevising && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          <h3>Request Revision</h3>
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            style={{ width: '100%', marginBottom: '10px' }}
          />
          <button onClick={() => {
            onRevise(image.id, revisionNote);
            setIsRevising(false);
            setRevisionNote('');
          }}>Submit Revision</button>
          <button onClick={() => setIsRevising(false)}>Cancel</button>
        </div>
      )}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={image.url}
        title={image.title}
      />
      <Modal
        isOpen={isRevisionNoteModalOpen}
        onRequestClose={() => setIsRevisionNoteModalOpen(false)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
          },
        }}
      >
        <h3>Revision Note</h3>
        <p>{image.revisionNote || 'No revision note provided.'}</p>
        <button onClick={() => setIsRevisionNoteModalOpen(false)}>Close</button>
      </Modal>
    </div>
  );
};

const DesignHub: React.FC<DesignHubProps> = ({ customerId, isAdmin }) => {
  const [images, setImages] = useState<Record<string, Image[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('revision');
  const [selectedDesigns, setSelectedDesigns] = useState(new Set<string>());
  const [sortOrder, setSortOrder] = useState('newest');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [currentRevisionImage, setCurrentRevisionImage] = useState<Image | null>(null);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionComment, setRevisionComment] = useState('');
  const [customerListings, setCustomerListings] = useState<Listing[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isIndexBuilding, setIsIndexBuilding] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const [customerListingsWithImages, setCustomerListingsWithImages] = useState<ListingWithImages[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [localImages, setLocalImages] = useState<Record<string, File[]>>({});
  const [isDragging, setIsDragging] = useState(false);
  const { createTask } = useTaskCreate()
  const { user } = useAuth();

  // Add this new state variable
  const [listingImages, setListingImages] = useState<Record<string, ListingImage[]>>({});

  console.log('DesignHub props:', { customerId, isAdmin });

  useEffect(() => {
    if (isAdmin) {
      const fetchCustomers = async () => {
        try {
          const customersCollection = collection(db, 'customers');
          const customersSnapshot = await getDocs(customersCollection);
          const customersList = customersSnapshot.docs.map(doc => ({
            id: doc.id,
            store_owner_name: doc.data().store_owner_name,
            customer_id: doc.data().customer_id,
            store_name: doc.data().store_name, // Add this line
          }));
          setCustomers(customersList);
        } catch (error) {
          console.error("Error fetching customers:", error);
        }
      };

      fetchCustomers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && selectedCustomerId) {
      fetchCustomerListings(selectedCustomerId);
    }
  }, [isAdmin, selectedCustomerId]);

  useEffect(() => {
    const fetchImages = async () => {
      const targetCustomerId = isAdmin ? selectedCustomerId : customerId;
      if (!targetCustomerId) return;

      console.log("Fetching images for customer_id:", targetCustomerId);

      const imagesCollection = collection(db, 'images');
      let q;
      
      if (isAdmin) {
        if (selectedCustomerId) {
          console.log("Admin view: fetching images for specific customer");
          q = query(imagesCollection, where("customer_id", "==", selectedCustomerId));
        } else {
          console.log("Admin view: fetching all images");
          q = query(imagesCollection);
        }
      } else if (customerId) {
        console.log("User view: fetching images for specific customer");
        q = query(imagesCollection, where("customer_id", "==", customerId));
      } else {
        console.error("No customerId provided for non-admin user");
        return;
      }

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedImages: Image[] = [];
        querySnapshot.forEach((doc) => {
          const imageData = doc.data() as Omit<Image, 'id'>;
          if (imageData.url && imageData.url !== "" && !imageData.url.includes('logo.png')) {
            fetchedImages.push({ id: doc.id, ...imageData });
          }
        });
        console.log("Fetched images:", fetchedImages);
        setImages(prevImages => ({
          ...prevImages,
          [isAdmin ? (selectedCustomerId || 'all') : customerId]: fetchedImages
        }));
      });

      return unsubscribe;
    };

    fetchImages();
  }, [customerId, isAdmin, selectedCustomerId]);

  useEffect(() => {
    if (customerListings.length > 0) {
      const listingsWithImages = customerListings.map(listing => ({
        ...listing,
        uploadedImages: listing.uploadedImages || [],
        createdAt: listing.createdAt || new Date().toISOString()
      }));
      setCustomerListingsWithImages(listingsWithImages);
    }
  }, [customerListings]);

  const fetchCustomerListings = async (customerId: string) => {
    try {
      console.log("Fetching listings for customer:", customerId);
      const listingsCollection = collection(db, 'listings');
      const q = query(
        listingsCollection,
        where("customer_id", "==", customerId),
        orderBy("listingTitle")
      );
      const listingsSnapshot = await getDocs(q);
      const listingsData = await Promise.all(listingsSnapshot.docs.map(async (doc) => {
        const listingData = doc.data() as Listing;
        const imagesQuery = query(collection(db, 'images'), where('listing_id', '==', doc.id));
        const imagesSnapshot = await getDocs(imagesQuery);
        const uploadedImages = imagesSnapshot.docs.map(imgDoc => ({
          id: imgDoc.id,
          url: imgDoc.data().url,
          status: imgDoc.data().status as 'pending' | 'approved' | 'revision'
        }));
        return {
          ...listingData,
          id: doc.id,
          uploadedImages,
          createdAt: listingData.createdAt || new Date().toISOString(),
        };
      }));
      console.log("Fetched listings with images:", listingsData);
      setCustomerListings(listingsData as Listing[]);
      setIsIndexBuilding(false);
    } catch (error) {
      console.error("Error fetching customer listings:", error);
      if (error instanceof FirebaseError && error.code === 'failed-precondition') {
        console.log("Index is building. Please wait.");
        setIsIndexBuilding(true);
      } else {
        // Handle other errors
        setIsIndexBuilding(false);
      }
    }
  };

  // Update this useEffect
  useEffect(() => {
    const newListingImages: Record<string, ListingImage[]> = {};
    customerListings.forEach(listing => {
      newListingImages[listing.id] = listing.uploadedImages || [];
    });
    setListingImages(newListingImages);
  }, [customerListings]);

  const handleApprove = async (id: string) => {
    try {
      const imageRef = doc(db, 'images', id);
      const imageDoc = await getDoc(imageRef);
      const imageData = imageDoc.data() as Image;

      if (imageData.originalImageId) {
        const originalImageRef = doc(db, 'images', imageData.originalImageId);
        await updateDoc(originalImageRef, { 
          status: 'superseded',
          currentRevisionId: id
        });
      }

      await updateDoc(imageRef, { 
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      setImages(prevImages => {
        const key = isAdmin ? (selectedCustomerId || 'all') : customerId;
        return {
          ...prevImages,
          [key]: prevImages[key].map(img => {
            if (img.id === id) {
              return { ...img, status: 'approved' };
            }
            if (img.id === imageData.originalImageId) {
              return { ...img, status: 'superseded', currentRevisionId: id };
            }
            return img;
          })
        };
      });

      alert("Image approved successfully");
    } catch (error) {
      console.error("Error approving image:", error);
      alert("Failed to approve image. Please try again.");
    }
  };

  const handleRevise = async (id: string, note: string) => {
    try {
      const imageRef = doc(db, 'images', id);
      await updateDoc(imageRef, { 
        status: 'revision',
        revisionNote: note
      });

      setImages(prevImages => {
        const key = isAdmin ? 'admin' : customerId;
        return {
          ...prevImages,
          [key]: prevImages[key].map(img => 
            img.id === id ? { ...img, status: 'revision', revisionNote: note } : img
          )
        };
      });
    } catch (error) {
      console.error("Error revising image:", error);
      alert("Failed to revise image. Please try again.");
    }
  };

  const handleSelect = (id: string, isSelected: boolean) => {
    setSelectedDesigns(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleBatchApprove = async () => {
    try {
      const batch = writeBatch(db);
      selectedDesigns.forEach(id => {
        const imageRef = doc(db, 'images', id);
        batch.update(imageRef, { 
          status: 'approved',
          approvedAt: new Date().toISOString(),
          revisionNote: null
        });
      });

      await batch.commit();

      setImages(prevImages => {
        const key = isAdmin ? 'admin' : customerId;
        return {
          ...prevImages,
          [key]: prevImages[key].map(img => 
            selectedDesigns.has(img.id) ? { ...img, status: 'approved', revisionNote: undefined } : img
          )
        };
      });

      setSelectedDesigns(new Set());
      alert("Selected images approved successfully");
    } catch (error) {
      console.error("Error batch approving images:", error);
      alert("Failed to approve selected images. Please try again.");
    }
  };

  const handleUploadRevision = (id: string) => {
    const image = images[isAdmin ? (selectedCustomerId || 'all') : customerId].find(img => img.id === id);
    if (image) {
      setCurrentRevisionImage(image);
      setIsRevisionModalOpen(true);
    }
  };

  const handleRevisionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setRevisionFile(event.target.files[0]);
    }
  };

  const handleRevisionUpload = async () => {
    if (!revisionFile || !currentRevisionImage) return;

    try {
      const fileExtension = revisionFile.name.split('.').pop();
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const storageRef = ref(storage, `designs/${uniqueFileName}`);
      
      const snapshot = await uploadBytes(storageRef, revisionFile);
      const downloadURL = await getDownloadURL(storageRef);

      const newImage: Omit<Image, 'id'> = {
        url: downloadURL,
        status: 'pending' as const,  // Explicitly type this as a const
        title: revisionFile.name,
        date: new Date().toISOString(),
        customer_id: currentRevisionImage.customer_id,
        originalImageId: currentRevisionImage.id,
        revisionNote: revisionComment,
      };

      const docRef = await addDoc(collection(db, 'images'), newImage);
      
      await updateDoc(doc(db, 'images', currentRevisionImage.id), {
        currentRevisionId: docRef.id,
        status: 'superseded' as const  // Explicitly type this as a const
      });

      setImages(prevImages => {
        const key = isAdmin ? (selectedCustomerId || 'all') : customerId;
        return {
          ...prevImages,
          [key]: [
            ...prevImages[key].map(img => 
              img.id === currentRevisionImage.id 
                ? { ...img, status: 'superseded' as const, currentRevisionId: docRef.id }
                : img
            ),
            { id: docRef.id, ...newImage }
          ]
        };
      });

      setIsRevisionModalOpen(false);
      setRevisionFile(null);
      setRevisionComment('');
      setCurrentRevisionImage(null);
      alert("Revision uploaded successfully!");
    } catch (error) {
      console.error("Error uploading revision:", error);
      alert("Failed to upload revision. Please try again.");
    }
  };

  const filteredAndSortedListings = useMemo(() => {
    return customerListingsWithImages
      .filter(listing => {
        const matchesSearch = listing.listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              listing.listingID.toLowerCase().includes(searchTerm.toLowerCase());
        const listingImagesArray = listingImages[listing.id] || [];
        const matchesStatus = statusFilter === 'all' || 
                              (statusFilter === 'pending' && listingImagesArray.some(img => img.status === 'pending')) ||
                              (statusFilter === 'revision' && listingImagesArray.some(img => img.status === 'revision')) ||
                              (statusFilter === 'approved' && listingImagesArray.some(img => img.status === 'approved'));
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
      });
  }, [customerListingsWithImages, searchTerm, statusFilter, sortOrder, listingImages]);

  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedListings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedListings, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedListings.length / ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const handleLocalUpload = (listing: Listing, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);
      setLocalImages(prev => ({
        ...prev,
        [listing.id]: [...(prev[listing.id] || []), ...newFiles]
      }));
    }
  };

  const handleSave = async (listing: Listing) => {
    if (!localImages[listing.id] || localImages[listing.id].length === 0)
      return;

    try {
      const batch = writeBatch(db);
      const newImages: ListingImage[] = [];

      for (const file of localImages[listing.id]) {
        const fileExtension = file.name.split(".").pop();
        const uniqueFileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}.${fileExtension}`;
        const storageRef = ref(storage, `designs/${uniqueFileName}`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const newImageDoc: ListingImage = {
          id: doc(collection(db, "images")).id, // Generate a new ID
          url: downloadURL,
          status: "pending",
        };

        newImages.push(newImageDoc);

        const fullImageDoc = {
          ...newImageDoc,
          title: file.name,
          date: new Date().toISOString(),
          customer_id: selectedCustomerId,
          listing_id: listing.id,
        };

        batch.set(doc(db, "images", newImageDoc.id), fullImageDoc);
      }
      await createTask({
        customerId: selectedCustomerId,
        taskName: `${(user as Admin)?.name} added ${
          localImages[listing.id].length
        } images`,
        teamMemberName: (user as Admin)?.name || user?.email || "",
        dateCompleted: serverTimestamp(),
        listingId: listing.id,
        isDone: true,
      });
      await batch.commit();

      // Update local state
      setListingImages((prev) => ({
        ...prev,
        [listing.id]: [...(prev[listing.id] || []), ...newImages],
      }));

      setLocalImages((prev) => ({
        ...prev,
        [listing.id]: [],
      }));

      alert("Images uploaded successfully!");
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>, listing: Listing) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, listing: Listing) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setLocalImages(prev => ({
        ...prev,
        [listing.id]: [...(prev[listing.id] || []), ...newFiles]
      }));
    }
  };

  const handleRemoveLocalImage = (listingId: string, index: number) => {
    setLocalImages(prev => {
      const newImages = [...(prev[listingId] || [])];
      newImages.splice(index, 1);
      return {
        ...prev,
        [listingId]: newImages
      };
    });
  };

  const handleDropZoneClick = (listingId: string) => {
    const fileInput = document.getElementById(`file-input-${listingId}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Design Hub - {isAdmin ? 'Admin View' : 'User View'}</h2>
        {isAdmin && (
          <select 
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            style={{ padding: '10px', fontSize: '16px', minWidth: '200px' }}
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.customer_id}>
                {customer.store_name} - {customer.store_owner_name}
              </option>
            ))}
          </select>
        )}
      </div>
      {(isAdmin && selectedCustomerId) || (!isAdmin && customerId) ? (
        <>
          <div style={{ marginBottom: '20px' }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.input}>
              <option value="all">All Images</option>
              <option value="pending">To Approve</option>
              <option value="revision">For Revision</option>
              <option value="approved">Approved</option>
            </select>
            <input
              type="text"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.input}
            />
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={styles.input}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
          {isAdmin && selectedCustomerId && (
            <div>
              <h3>Customer Listings</h3>
              {isIndexBuilding ? (
                <p>The database index is currently being built. This process usually takes a few minutes. Please wait...</p>
              ) : paginatedListings.length === 0 ? (
                <p>No listings found for this customer.</p>
              ) : (
                <>
                  <div style={styles.cardGrid}>
                    {paginatedListings.map((listing) => (
                      <div 
                        key={listing.id} 
                        style={{
                          ...styles.card,
                          ...(isDragging ? styles.cardDragging : {})
                        }}
                        onDragEnter={(e) => handleDragEnter(e, listing)}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, listing)}
                      >
                        <div style={styles.cardContent}>
                          <div 
                            style={styles.dropZone}
                            onClick={() => handleDropZoneClick(listing.id)}
                          >
                            Drag and drop images here or click to upload
                          </div>
                          <p style={styles.cardId}>ID: {listing.listingID}</p>
                          <h4 style={styles.cardTitle} title={listing.listingTitle}>
                            {listing.listingTitle}
                          </h4>
                          <p style={styles.cardBestseller}>
                            {listing.bestseller ? 'Bestseller' : ''}
                          </p>
                          <div style={styles.uploadedImagesPreview}>
                            {listingImages[listing.id]?.filter(image => 
                              statusFilter === 'all' || image.status === statusFilter
                            ).map((image, index) => (
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
                            {localImages[listing.id]?.map((file, index) => (
                              <div key={`local-${index}`} style={styles.thumbnailContainer}>
                                <img 
                                  src={URL.createObjectURL(file)} 
                                  alt={`Local ${index + 1}`}
                                  style={styles.uploadedImageThumbnail}
                                  onClick={() => handleImagePreview(URL.createObjectURL(file))}
                                />
                                <button 
                                  onClick={() => handleRemoveLocalImage(listing.id, index)}
                                  style={styles.removeButton}
                                >
                                  x
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={styles.cardFooter}>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleLocalUpload(listing, e)}
                            style={{ display: 'none' }}
                            id={`file-input-${listing.id}`}
                          />
                          <button 
                            onClick={() => handleSave(listing)}
                            style={styles.button}
                            disabled={!localImages[listing.id] || localImages[listing.id].length === 0}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={styles.pagination}>
                    <button 
                      onClick={handlePreviousPage} 
                      disabled={currentPage === 1}
                      style={styles.paginationButton}
                    >
                      Previous
                    </button>
                    <span style={styles.pageInfo}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button 
                      onClick={handleNextPage} 
                      disabled={currentPage === totalPages}
                      style={styles.paginationButton}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <p>{isAdmin ? "Please select a customer to view designs." : "No customer ID provided."}</p>
      )}
      {/* Image preview modal */}
      {previewImage && (
        <div style={styles.previewModal} onClick={closeImagePreview}>
          <img src={previewImage} alt="Preview" style={styles.previewImage} />
        </div>
      )}
    </div>
  );
};

// Change the export statement
export { DesignHub };