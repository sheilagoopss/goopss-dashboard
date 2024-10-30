import React from "react";
import { Form, Input, Button, Divider } from "antd";
import { UserOutlined, LockOutlined, GoogleOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const { googleLoggingIn, googleLogin, loggingIn, login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (values: any) => {
    try {
      await login(values);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      navigate('/');
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: "0 auto", paddingTop: 50 }}>
      <h1 style={{ textAlign: "center", marginBottom: 24 }}>Login</h1>
      <Form name="login" initialValues={{ remember: true }} onFinish={handleLogin}>
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
};

export default LoginPage;
