import { FacebookOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { endpoints } from "../constants/endpoints";

const FacebookButton = () => {
  async function handleFacebookLogin() {
    let queryParams = new URLSearchParams({
      callbackUrl: window.location.href,
    });
    window.open(
      `${endpoints.facebook.login}?${queryParams}`,
      "Facebook Login",
      "width=600,height=600",
    );
  }

  return (
    <Button
      style={{
        backgroundColor: "#4267b2",
        color: "#fff",
      }}
      size="large"
      icon={<FacebookOutlined />}
      onClick={handleFacebookLogin}
    >
      Connect with Facebook
    </Button>
  );
};

export default FacebookButton;
