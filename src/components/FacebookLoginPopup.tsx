import React from 'react';
import FacebookLogin, { SuccessResponse, FailResponse, ProfileSuccessResponse } from '@greatsumini/react-facebook-login';
import { db } from '../firebase/config';
import { serverTimestamp } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';

interface FacebookLoginPopupProps {
  onLoginSuccess: (accessToken: string) => void;
  customerId: string;
}

const FacebookLoginPopup: React.FC<FacebookLoginPopupProps> = ({ onLoginSuccess, customerId }) => {
  const handleResponse = async (response: SuccessResponse) => {
    if (response.accessToken) {
      onLoginSuccess(response.accessToken);

      // Get user profile data
      const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${response.accessToken}`);
      const userData = await userResponse.json();

      try {
        // Store in customers collection with a dedicated facebook section
        const customerRef = doc(db, 'customers', customerId);
        await setDoc(customerRef, {
          facebook_integration: {
            facebook_user_id: response.userID,
            facebook_page_name: userData.name,
            facebook_user_email: userData.email,
            profile_picture_url: userData.picture?.data?.url,
            access_token: response.accessToken,
            last_connected_at: serverTimestamp(),
            is_connected: true
          }
        }, { merge: true });
        console.log('Facebook integration data saved to customer profile');
      } catch (error) {
        console.error('Error saving Facebook integration data:', error);
      }
    } else {
      console.error('User did not authorize Facebook login');
    }
  };

  return (
    <FacebookLogin
      appId={process.env.REACT_APP_FACEBOOK_APP_ID || ''}
      onSuccess={handleResponse}
      onFail={(error: FailResponse) => {
        console.log('Login Failed!', error);
      }}
      onProfileSuccess={(response: ProfileSuccessResponse) => {
        console.log('Get Profile Success!', response);
      }}
      style={{
        backgroundColor: '#4267b2',
        color: '#fff',
        fontSize: '16px',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      Connect with Facebook
    </FacebookLogin>
  );
};

export default FacebookLoginPopup; 