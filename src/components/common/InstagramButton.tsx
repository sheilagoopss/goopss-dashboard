"use client";
import { InstagramOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui/button";
import { endpoints } from "@/constants/endpoints";

interface InstagramButtonProps {
  email: string;
}

const InstagramButton: React.FC<InstagramButtonProps> = ({ email }) => {
  async function handleInstagramLogin() {
    const queryParams = new URLSearchParams({
      callbackUrl: window.location.href,
      email: email,
    });
    window.open(`${endpoints.instagram.login}?${queryParams}`, "_blank");
  }

  return (
    <Button
      className="bg-gradient-to-r from-[#405DE6] via-[#5851DB] via-[#833AB4] via-[#C13584] via-[#E1306C] via-[#FD1D1D] to-[#F56040] text-white font-semibold py-2 px-4 rounded-md hover:opacity-90 transition-opacity duration-300 flex items-center justify-center gap-2"
      onClick={handleInstagramLogin}
    >
      <InstagramOutlined className="text-xl" />
      <span>Connect with Instagram</span>
    </Button>
  );
};

export default InstagramButton;
