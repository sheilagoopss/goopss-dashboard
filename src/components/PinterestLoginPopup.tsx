import React from 'react';
import { Button } from 'antd';
import { db } from '../firebase/config';
import { serverTimestamp } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';

interface PinterestLoginPopupProps {
  onLoginSuccess: (accessToken: string) => void;
  customerId: string;
}

const PinterestLoginPopup: React.FC<PinterestLoginPopupProps> = ({ onLoginSuccess, customerId }) => {
  const handlePinterestLogin = () => {
    const clientId = process.env.REACT_APP_PINTEREST_APP_ID;
    const redirectUri = encodeURIComponent(`https://app.goopss.com/pinterest-callback`);
    const scope = encodeURIComponent('boards:read,pins:read,pins:write');
    
    const authUrl = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    
    window.location.href = authUrl;
  };

  return (
    <Button 
      onClick={handlePinterestLogin}
      style={{
        backgroundColor: '#E60023',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '12px 24px',
        cursor: 'pointer',
      }}
    >
      Connect with Pinterest
    </Button>
  );
};

export default PinterestLoginPopup;     