import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { collection, getDocs, addDoc, onSnapshot, query, where, updateDoc, doc, getDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import Modal from 'react-modal';

// Add this near the top of your component, after the imports
console.log("Storage object:", storage);

const ITEMS_PER_LOAD = 4;

const styles = {
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
}

interface Customer {
  id: string;
  store_name: string;
  store_owner_name: string;
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDesigns, setSelectedDesigns] = useState(new Set<string>());
  const [sortOrder, setSortOrder] = useState('newest');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [currentRevisionImage, setCurrentRevisionImage] = useState<Image | null>(null);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionComment, setRevisionComment] = useState('');

  console.log('DesignHub props:', { customerId, isAdmin });

  useEffect(() => {
    if (isAdmin) {
      const fetchCustomers = async () => {
        try {
          const customersCollection = collection(db, 'customers');
          const customersSnapshot = await getDocs(customersCollection);
          const customersList = customersSnapshot.docs.map(doc => ({
            id: doc.id,
            store_name: doc.data().store_name,
            store_owner_name: doc.data().store_owner_name,
          }));
          console.log("Fetched customers:", customersList);
          setCustomers(customersList);
        } catch (error) {
          console.error("Error fetching customers:", error);
        }
      };

      fetchCustomers();
    }
  }, [isAdmin]);

  useEffect(() => {
    const fetchImages = async () => {
      console.log("Fetching images for customer_id:", isAdmin ? selectedCustomerId : customerId);
      console.log("Is admin:", isAdmin);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    console.log("Upload started");
    console.log("Is admin:", isAdmin);
    console.log("Selected customer ID:", selectedCustomerId);
    console.log("Customer ID:", customerId);

    if (!selectedFile) {
      console.log("No file selected");
      alert("Please select a file first.");
      return;
    }

    if (!selectedCustomerId && isAdmin) {
      console.log("No customer selected for admin");
      alert("Please select a customer before uploading an image.");
      return;
    }

    const fileExtension = selectedFile.name.split('.').pop();
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const storageRef = ref(storage, `designs/${uniqueFileName}`);
    
    try {
      console.log("Uploading to Firebase Storage", storageRef.fullPath);
      const snapshot = await uploadBytes(storageRef, selectedFile);
      console.log("File uploaded to Storage", snapshot);
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Download URL obtained:", downloadURL);

      const newImage: Omit<Image, 'id'> = {
        url: downloadURL,
        status: 'pending',
        title: selectedFile.name,
        date: new Date().toISOString(),
        customer_id: isAdmin ? selectedCustomerId : customerId,
      };

      console.log("New image object:", newImage);

      const docRef = await addDoc(collection(db, 'images'), newImage);
      console.log("Document added to Firestore", docRef);

      const imageWithId: Image = { id: docRef.id, ...newImage };
      console.log("Image with ID:", imageWithId);

      // Update the local state
      setImages(prevImages => {
        const key = isAdmin ? (selectedCustomerId || 'admin') : customerId;
        // Check if the image already exists in the array
        const imageExists = prevImages[key]?.some(img => img.id === imageWithId.id);
        if (!imageExists) {
          return {
            ...prevImages,
            [key]: [...(prevImages[key] || []), imageWithId]
          };
        }
        return prevImages; // If the image already exists, don't update the state
      });

      setSelectedFile(null);
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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

  const filteredAndSortedImages = useMemo(() => {
    let imageArray: Image[] = [];
    if (isAdmin) {
      if (selectedCustomerId) {
        imageArray = images[selectedCustomerId] || [];
      } else {
        // When no customer is selected, use the 'all' key
        imageArray = images['all'] || [];
      }
    } else {
      imageArray = customerId ? (images[customerId] || []) : [];
    }

    if (!Array.isArray(imageArray)) {
      console.error('imageArray is not an array:', imageArray);
      return [];
    }
    return imageArray
      .filter(image => {
        const matchesSearch = (image.title || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || image.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
      });
  }, [images, isAdmin, customerId, selectedCustomerId, searchTerm, statusFilter, sortOrder]);

  useEffect(() => {
    if (!storage) {
      console.error("Firebase Storage is not initialized");
    }
  }, []);

  useEffect(() => {
    if (!customerId && !isAdmin) {
      console.error("No customerId provided for non-admin user");
    }
  }, [customerId, isAdmin]);

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Design Hub</h2>
        {isAdmin && (
          <select 
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
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

      {/* File upload form */}
      <div style={styles.uploadForm}>
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          style={styles.input}
        />
        <button onClick={handleUpload} style={styles.button}>Upload</button>
      </div>

      {/* Filters and controls */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.input}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.input}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="revision">Revision</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={styles.input}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        {statusFilter === 'pending' && (
          <button onClick={handleBatchApprove} disabled={selectedDesigns.size === 0} style={styles.button}>
            Approve Selected ({selectedDesigns.size})
          </button>
        )}
      </div>

      {/* Image grid */}
      <div style={styles.imageGrid}>
        {filteredAndSortedImages.map((image) => (
          <div key={image.id}>
            <DesignCard
              image={image}
              onApprove={handleApprove}
              onRevise={handleRevise}
              onSelect={handleSelect}
              isSelected={selectedDesigns.has(image.id)}
              showCheckbox={statusFilter === 'pending'}
              isAdmin={isAdmin}
              onUploadRevision={handleUploadRevision}
            />
          </div>
        ))}
      </div>

      {/* Revision Modal */}
      <Modal
        isOpen={isRevisionModalOpen}
        onRequestClose={() => setIsRevisionModalOpen(false)}
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
        <h3>Upload Revision</h3>
        {currentRevisionImage && (
          <div>
            <img src={currentRevisionImage.url} alt="Original" style={{ maxWidth: '100%', marginBottom: '10px' }} />
            <div style={{ 
              backgroundColor: '#f0f0f0', 
              padding: '10px', 
              borderRadius: '5px', 
              marginBottom: '10px' 
            }}>
              <strong>User's revision request:</strong> 
              <p>{currentRevisionImage.revisionNote || 'No notes provided'}</p>
            </div>
          </div>
        )}
        <input 
          type="file" 
          onChange={handleRevisionFileChange} 
          accept="image/*" 
          style={{ marginBottom: '10px' }}
        />
        <textarea
          value={revisionComment}
          onChange={(e) => setRevisionComment(e.target.value)}
          placeholder="Add a comment about this revision (optional)"
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <button onClick={handleRevisionUpload} disabled={!revisionFile}>Upload Revision</button>
        <button onClick={() => setIsRevisionModalOpen(false)}>Cancel</button>
      </Modal>
    </div>
  );
};

export default DesignHub;