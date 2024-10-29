import React, { useEffect } from 'react';
import FacebookLogin, { SuccessResponse, FailResponse, ProfileSuccessResponse } from '@greatsumini/react-facebook-login';
import { db } from '../firebase/config';
import { serverTimestamp } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';

interface FacebookLoginPopupProps {
  onLoginSuccess: (accessToken: string) => void;
  customerId: string;
}

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

const FacebookLoginPopup: React.FC<FacebookLoginPopupProps> = ({ onLoginSuccess, customerId }) => {
  useEffect(() => {
    // Initialize Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: process.env.REACT_APP_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

    // Load Facebook SDK
    (function(d, s, id) {
      var js: any, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  console.log('Rendering FacebookLoginPopup with:', {
    customerId,
    appId: process.env.REACT_APP_FACEBOOK_APP_ID
  });

  const handleResponse = async (response: SuccessResponse) => {
    console.log('Facebook login response:', response);
    
    if (response.accessToken) {
      console.log('Got access token:', response.accessToken);
      onLoginSuccess(response.accessToken);

      try {
        // Get user profile data
        console.log('Fetching user profile...');
        const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${response.accessToken}`);
        const userData = await userResponse.json();
        console.log('User profile data:', userData);

        // Store in customers collection
        console.log('Saving to Firebase...');
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
        console.log('Successfully saved to Firebase');
      } catch (error) {
        console.error('Error in Facebook integration:', error);
      }
    } else {
      console.error('No access token in response:', response);
    }
  };

  return (
    <FacebookLogin
      appId={process.env.REACT_APP_FACEBOOK_APP_ID || ''}
      onSuccess={handleResponse}
      onFail={(error: FailResponse) => {
        console.error('Facebook Login Failed:', error);
      }}
      onProfileSuccess={(response: ProfileSuccessResponse) => {
        console.log('Profile Success:', response);
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