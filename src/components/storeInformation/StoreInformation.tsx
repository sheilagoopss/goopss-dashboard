import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, FileTextOutlined, GlobalOutlined } from '@ant-design/icons';

const etsyCategories = [
  "Art & Collectibles",
  "Clothing & Shoes",
  "Home & Living",
  "Jewelry & Accessories",
  "Toys & Entertainment",
  "Craft Supplies & Tools",
  "Vintage",
  "Weddings",
  "Other"
];

interface StoreInformationProps {
  customerId: string;
  isAdmin: boolean;
}

const StoreInformation: React.FC<StoreInformationProps> = ({ customerId, isAdmin }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    storeName: '',
    etsyStoreURL: '',
    email: '',
    website: '',
    industry: '',
    about: '',
    targetAudience: '',
    contentTone: '',
    facebookPageLink: '',
    instagramLink: '',
    pinterestLink: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');

  // Add styles for the error notification
  const notificationStyles = {
    error: {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      backgroundColor: '#ff4d4f',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out',
      transform: 'translateX(0)',
      opacity: 1,
      transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
    }
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 3000); // Hide after 3 seconds
  };

  // Fetch existing customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId) return;

      try {
        const customerDoc = await getDoc(doc(db, 'customers', customerId));
        if (customerDoc.exists()) {
          const data = customerDoc.data();
          const firstNameOnly = data.store_owner_name?.split(' ')[0] || '';
          setFirstName(firstNameOnly);
          
          setFormData({
            fullName: data.store_owner_name || '',
            email: data.email || '',
            storeName: data.store_name || '',
            website: data.website || '',
            industry: data.industry || '',
            about: data.about || '',
            targetAudience: data.target_audience || '',
            facebookPageLink: data.facebook_link || '',
            instagramLink: data.instagram_link || '',
            pinterestLink: data.pinterest_link || '',
            etsyStoreURL: data.etsy_store_url || '',
            contentTone: data.content_tone || '',
          });
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
        alert('Failed to load customer data');
      }
    };

    fetchCustomerData();
  }, [customerId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateCurrentSection = () => {
    // Remove all validations, always return true
    return true;
  };

  const handleNext = () => {
    if (validateCurrentSection()) {
      setCurrentSection(prev => prev + 1);
    }
  };

  const handleSave = async () => {
    // Validate all sections before saving
    for (let i = 0; i <= currentSection; i++) {
      setCurrentSection(i);
      if (!validateCurrentSection()) {
        return;
      }
    }

    try {
      setLoading(true);
      
      if (!customerId) {
        alert('No customer selected');
        return;
      }

      const customerRef = doc(db, 'customers', customerId);
      const customerDoc = await getDoc(customerRef);

      if (!customerDoc.exists()) {
        alert('Customer not found');
        return;
      }

      const currentData = customerDoc.data();
      const updateData: Record<string, any> = {
        ...(formData.email && { email: formData.email }),
        ...(formData.website && { website: formData.website }),
        ...(formData.industry && { industry: formData.industry }),
        ...(formData.about && { about: formData.about }),
        ...(formData.targetAudience && { target_audience: formData.targetAudience }),
        ...(formData.facebookPageLink && { facebook_link: formData.facebookPageLink }),
        ...(formData.instagramLink && { instagram_link: formData.instagramLink }),
        ...(formData.pinterestLink && { pinterest_link: formData.pinterestLink }),
        ...(formData.contentTone && { content_tone: formData.contentTone }),
      };

      if (!currentData.store_owner_name && formData.fullName) {
        updateData.store_owner_name = formData.fullName;
      }

      if (!currentData.store_name && formData.storeName) {
        updateData.store_name = formData.storeName;
      }

      await updateDoc(customerRef, updateData);
      alert('Store information updated successfully');
      setCurrentSection(0);

    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save store information');
    } finally {
      setLoading(false);
    }
  };

  const formStyles = {
    formSection: {
      maxWidth: '800px'
    },
    formGroup: {
      marginBottom: '1rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 500
    },
    input: {
      width: '100%',
      padding: '8px',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
      fontSize: '14px'
    },
    textarea: {
      width: '100%',
      padding: '8px',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
      fontSize: '14px',
      resize: 'vertical' as const
    },
    select: {
      width: '100%',
      padding: '8px',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
      fontSize: '14px'
    }
  };

  const sections = [
    {
      title: 'Seller Info',
      icon: <UserOutlined />,
      content: (
        <div style={formStyles.formSection}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Full Name</label>
            <input
              style={formStyles.input}
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Store Name</label>
            <input
              style={formStyles.input}
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleInputChange}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Etsy Store URL</label>
            <input
              style={formStyles.input}
              type="text"
              name="etsyStoreURL"
              value={formData.etsyStoreURL}
              onChange={handleInputChange}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Email</label>
            <input
              style={formStyles.input}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Website (if applicable)</label>
            <input
              style={formStyles.input}
              type="text"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Industry</label>
            <select
              style={formStyles.select}
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
            >
              <option value="">Select an industry</option>
              {etsyCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      )
    },
    {
      title: 'About',
      icon: <FileTextOutlined />,
      content: (
        <div style={formStyles.formSection}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>About</label>
            <textarea
              style={formStyles.textarea}
              name="about"
              value={formData.about}
              onChange={handleInputChange}
              rows={6}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Target Audience</label>
            <textarea
              style={formStyles.textarea}
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleInputChange}
              rows={4}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Content Tone</label>
            <textarea
              style={formStyles.textarea}
              name="contentTone"
              value={formData.contentTone}
              onChange={handleInputChange}
              rows={2}
              placeholder="e.g., friendly, professional, casual"
            />
          </div>
        </div>
      )
    },
    {
      title: 'Social Media',
      icon: <GlobalOutlined />,
      content: (
        <div style={formStyles.formSection}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Facebook Page Link</label>
            <input
              style={formStyles.input}
              type="text"
              name="facebookPageLink"
              value={formData.facebookPageLink}
              onChange={handleInputChange}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Instagram Link</label>
            <input
              style={formStyles.input}
              type="text"
              name="instagramLink"
              value={formData.instagramLink}
              onChange={handleInputChange}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Pinterest Link</label>
            <input
              style={formStyles.input}
              type="text"
              name="pinterestLink"
              value={formData.pinterestLink}
              onChange={handleInputChange}
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="store-information" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      {/* Add error notification */}
      {error && (
        <div 
          style={{
            ...notificationStyles.error,
            animation: 'none',
            transform: error ? 'translateX(0)' : 'translateX(100%)',
            opacity: error ? 1 : 0
          }}
        >
          {error}
        </div>
      )}

      <h2 style={{ marginBottom: '1rem' }}>Hello {firstName}! 👋 Let's get to know you better.</h2>
      <p style={{ marginBottom: '2rem' }}>
        We're excited to learn about your Etsy journey. Fill out the details below to help us tailor your experience.
      </p>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ width: '200px', borderRight: '1px solid #f0f0f0' }}>
          {sections.map((section, index) => (
            <div
              key={section.title}
              onClick={() => setCurrentSection(index)}
              style={{
                padding: '12px 16px',
                marginBottom: '8px',
                cursor: 'pointer',
                backgroundColor: currentSection === index ? '#e6f7ff' : 'transparent',
                borderLeft: `3px solid ${currentSection === index ? '#1890ff' : 'transparent'}`,
                color: currentSection === index ? '#1890ff' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s'
              }}
            >
              {section.icon}
              <span>{section.title}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          {sections[currentSection].content}
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={() => setCurrentSection(prev => prev - 1)}
          disabled={currentSection === 0}
          style={{
            padding: '8px 16px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: currentSection === 0 ? 'not-allowed' : 'pointer',
            opacity: currentSection === 0 ? 0.5 : 1
          }}
        >
          Previous
        </button>
        <div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset the form? All data will be lost.')) {
                setFormData({
                  fullName: '',
                  storeName: '',
                  etsyStoreURL: '',
                  email: '',
                  website: '',
                  industry: '',
                  about: '',
                  targetAudience: '',
                  contentTone: '',
                  facebookPageLink: '',
                  instagramLink: '',
                  pinterestLink: ''
                });
              }
            }}
            style={{
              padding: '8px 16px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              marginRight: '8px'
            }}
          >
            Reset
          </button>
          {currentSection === sections.length - 1 ? (
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#1890ff',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#1890ff',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreInformation;