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
    firstName: '',
    lastName: '',
    displayShopName: '',
    etsyStoreURL: '',
    email: '',
    website: '',
    industry: '',
    about: '',
    targetAudience: '',
    contentTone: '',
    facebookPageLink: '',
    instagramLink: '',
    pinterestLink: '',
    facebookGroups: '',
    pastFacebookPosts: '',
    pastInstagramPosts: '',
    instagramHashtags: '',
    productsToPost: '',
    competitorSocial: '',
    contentGuideline: ''
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
          const firstNameOnly = data.first_name || '';
          setFirstName(firstNameOnly);
          
          setFormData({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            email: data.email || '',
            displayShopName: data.display_shop_name || '',
            website: data.website || '',
            industry: data.industry || '',
            about: data.about || '',
            targetAudience: data.target_audience || '',
            facebookPageLink: data.facebook_link || '',
            instagramLink: data.instagram_link || '',
            pinterestLink: data.pinterest_link || '',
            etsyStoreURL: data.etsy_store_url || '',
            contentTone: data.content_tone || '',
            facebookGroups: data.facebook_groups || '',
            pastFacebookPosts: data.past_facebook_posts || '',
            pastInstagramPosts: data.past_instagram_posts || '',
            instagramHashtags: data.instagram_hashtags || '',
            productsToPost: data.products_to_post || '',
            competitorSocial: data.competitor_social || '',
            contentGuideline: data.content_guideline || '',
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
        ...(formData.firstName && { first_name: formData.firstName }),
        ...(formData.lastName && { last_name: formData.lastName }),
        ...(formData.email && { email: formData.email }),
        ...(formData.website && { website: formData.website }),
        ...(formData.industry && { industry: formData.industry }),
        ...(formData.about && { about: formData.about }),
        ...(formData.targetAudience && { target_audience: formData.targetAudience }),
        ...(formData.facebookPageLink && { facebook_link: formData.facebookPageLink }),
        ...(formData.instagramLink && { instagram_link: formData.instagramLink }),
        ...(formData.pinterestLink && { pinterest_link: formData.pinterestLink }),
        ...(formData.contentTone && { content_tone: formData.contentTone }),
        ...(formData.facebookGroups && { facebook_groups: formData.facebookGroups }),
        ...(formData.pastFacebookPosts && { past_facebook_posts: formData.pastFacebookPosts }),
        ...(formData.pastInstagramPosts && { past_instagram_posts: formData.pastInstagramPosts }),
        ...(formData.instagramHashtags && { instagram_hashtags: formData.instagramHashtags }),
        ...(formData.productsToPost && { products_to_post: formData.productsToPost }),
        ...(formData.competitorSocial && { competitor_social: formData.competitorSocial }),
        ...(formData.contentGuideline && { content_guideline: formData.contentGuideline }),
        ...(formData.displayShopName && { display_shop_name: formData.displayShopName }),
      };

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
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>First Name</label>
              <input
                style={{ ...formStyles.input, width: '100%' }}
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Last Name</label>
              <input
                style={{ ...formStyles.input, width: '100%' }}
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Store Name</label>
            <input
              style={formStyles.input}
              type="text"
              name="displayShopName"
              value={formData.displayShopName}
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
              placeholder="Add your share and save link. Ex: https://mystore.etsy.com"
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
            <label style={formStyles.label}>If you are familiar with top relevant Facebook groups for your business, please apply their links</label>
            <textarea
              style={formStyles.textarea}
              name="facebookGroups"
              value={formData.facebookGroups}
              onChange={handleInputChange}
              rows={4}
              placeholder="Enter Facebook group links, one per line"
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Please attach 2-5 Facebook posts that you've created in the past (English only) - ideally posts that got the highest amount of engagement</label>
            <textarea
              style={formStyles.textarea}
              name="pastFacebookPosts"
              value={formData.pastFacebookPosts}
              onChange={handleInputChange}
              rows={6}
              placeholder="Paste your Facebook post links or content here"
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
            <label style={formStyles.label}>Please attach 2-5 Instagram posts that you've created in the past (English only) - ideally posts that got the highest amount of engagement</label>
            <textarea
              style={formStyles.textarea}
              name="pastInstagramPosts"
              value={formData.pastInstagramPosts}
              onChange={handleInputChange}
              rows={6}
              placeholder="Paste your Instagram post links or content here"
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>In case you have any existing instagram hashtags you would like us to use, please include them here</label>
            <textarea
              style={formStyles.textarea}
              name="instagramHashtags"
              value={formData.instagramHashtags}
              onChange={handleInputChange}
              rows={4}
              placeholder="Enter your Instagram hashtags, separated by spaces"
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
    },
    {
      title: 'Content Preferences',
      icon: <FileTextOutlined />,
      content: (
        <div style={formStyles.formSection}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Describe the tone you want for your content</label>
            <textarea
              style={formStyles.textarea}
              name="contentTone"
              value={formData.contentTone}
              onChange={handleInputChange}
              rows={3}
              placeholder="e.g., friendly, professional, casual"
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Are there any specific products/categories you would like us to focus on? Please add links</label>
            <textarea
              style={formStyles.textarea}
              name="productsToPost"
              value={formData.productsToPost}
              onChange={handleInputChange}
              rows={4}
              placeholder="Add product or category links, one per line"
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Provide links to 2-5 competitors' social media profiles (on any social media platform)</label>
            <textarea
              style={formStyles.textarea}
              name="competitorSocial"
              value={formData.competitorSocial}
              onChange={handleInputChange}
              rows={4}
              placeholder="Add competitor social media links, one per line"
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Any content restrictions or guidelines?</label>
            <textarea
              style={formStyles.textarea}
              name="contentGuideline"
              value={formData.contentGuideline}
              onChange={handleInputChange}
              rows={4}
              placeholder="E.g., Avoid certain topics, adhere to specific brand guidelines, etc."
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
                  firstName: '',
                  lastName: '',
                  displayShopName: '',
                  etsyStoreURL: '',
                  email: '',
                  website: '',
                  industry: '',
                  about: '',
                  targetAudience: '',
                  contentTone: '',
                  facebookPageLink: '',
                  instagramLink: '',
                  pinterestLink: '',
                  facebookGroups: '',
                  pastFacebookPosts: '',
                  pastInstagramPosts: '',
                  instagramHashtags: '',
                  productsToPost: '',
                  competitorSocial: '',
                  contentGuideline: '',
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