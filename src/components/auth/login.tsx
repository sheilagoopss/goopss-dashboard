import React from "react";
import { Form, Input, Button, Divider } from "antd";
import { UserOutlined, LockOutlined, GoogleOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";

const LoginPage: React.FC = () => {
  const { googleLoggingIn, googleLogin, loggingIn, login } = useAuth();

  return (
    <div style={{ maxWidth: 300, margin: "0 auto", paddingTop: 50 }}>
      <h1 style={{ textAlign: "center", marginBottom: 24 }}>Login</h1>
      <Form name="login" initialValues={{ remember: true }} onFinish={login}>
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
        onClick={googleLogin}
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