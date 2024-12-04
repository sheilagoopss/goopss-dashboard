import { Divider, Form, Button, Input } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import router from "next/router";

export default function Login() {
  const { googleLoggingIn, googleLogin, loggingIn, login } = useAuth();

  const handleLogin = async (values: any) => {
    try {
      await login(values);
      router.push("/");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      router.push("/");
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  return (
    <div className="w-1/4 mx-auto pt-10">
      <h1 className="text-center text-2xl font-bold mb-4">Login</h1>
      <Form
        name="login"
        initialValues={{ remember: true }}
        onFinish={handleLogin}
      >
        <Form.Item
          name="email"
          rules={[
            {
              required: true,
              message: "Please input your Email!",
              type: "email",
            },
          ]}
        >
          <Input size="large" prefix={<UserOutlined />} placeholder="Email" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please input your Password!" }]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined />}
            placeholder="Password"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: "100%" }}
            loading={loggingIn}
            disabled={googleLoggingIn}
          >
            Log in
          </Button>
        </Form.Item>
      </Form>

      <Divider>Or</Divider>

      <Button
        icon={<GoogleOutlined />}
        onClick={handleGoogleLogin}
        style={{ width: "100%" }}
        loading={googleLoggingIn}
        disabled={loggingIn}
      >
        Log in with Google
      </Button>
    </div>
  );
}
