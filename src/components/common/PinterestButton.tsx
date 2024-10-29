import { PinterestOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { endpoints } from "../../constants/endpoints";

const PinterestButton = () => {
  async function handlePinterestLogin() {
    let queryParams = new URLSearchParams({
      callbackUrl: window.location.href,
    });
    window.open(
      `${endpoints.pinterest.login}?${queryParams}`,
      "Pinterest Login",
      "width=600,height=600",
    );
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
