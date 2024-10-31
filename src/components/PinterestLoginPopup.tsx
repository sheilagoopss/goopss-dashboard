"use client";

import { useState } from "react";
import { Button } from "antd";

interface PinterestLoginPopupProps {
  onLoginSuccess: (accessToken: string) => void;
  customerId: string;
}

const PinterestLoginPopup = ({ onLoginSuccess, customerId }: PinterestLoginPopupProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePinterestLogin = () => {
    try {
      setIsLoading(true);
      const clientId = process.env.REACT_APP_PINTEREST_APP_ID;
      
      if (!clientId) {
        throw new Error("Pinterest App ID is not configured");
      }

      const redirectUri = encodeURIComponent(
        `${process.env.REACT_APP_API_URL}/api/pinterest/callback`
      );
      const scope = encodeURIComponent("boards:read,pins:read,pins:write");
      
      const authUrl = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${customerId}`;
      
      window.location.href = authUrl;
    } catch (error) {
      console.error("Pinterest login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePinterestLogin}
      loading={isLoading}
      style={{
        backgroundColor: '#E60023',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '12px 24px',
      }}
    >
      Connect with Pinterest
    </Button>
  );
};

export default PinterestLoginPopup;     