import { PinterestOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { endpoints } from "../../constants/endpoints";

interface PinterestButtonProps {
  email: string;
}

const PinterestButton: React.FC<PinterestButtonProps> = ({ email }) => {
  async function handlePinterestLogin() {
    let queryParams = new URLSearchParams({
      callbackUrl: window.location.href,
      email: email,
    });
    window.open(`${endpoints.pinterest.login}?${queryParams}`, "_blank");
  }

  return (
    <Button
      size="large"
      icon={<PinterestOutlined />}
      onClick={handlePinterestLogin}
      style={{ backgroundColor: "#e60023", color: "#fff" }}
    >
      Connect with Pinterest
    </Button>
  );
};

export default PinterestButton;
