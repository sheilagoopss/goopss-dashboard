"use client";

import { Divider, Form, Button, Input, Card, Typography, Layout } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import {
  GoogleOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
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
    <Layout className="flex flex-col items-center justify-center h-screen">
      <Card className="w-1/3 mx-auto flex flex-col items-center justify-center">
        <Typography.Title level={2} className="text-center">
          Login
        </Typography.Title>
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
      <div className="w-full flex justify-center">
        <Link href="/forgot-password" type="secondary">
          Forgot Password
        </Link>
      </div>

      <Divider>Or</Divider>

      <Button
        icon={<GoogleOutlined />}
        onClick={handleGoogleLogin}
        className="w-full mb-4"
        loading={googleLoggingIn}
        disabled={loggingIn}
      >
        Log in with Google
      </Button>
      <Button
        icon={<MailOutlined />}
        onClick={() => router.push("/signup")}
        className="w-full mb-4"
        disabled={loggingIn}
      >
        Sign up with Email
        </Button>
      </Card>
    </Layout>
  );
}
