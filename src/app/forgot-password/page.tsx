"use client";

import { Button, Card, Form, Input, Layout, message, Typography } from "antd";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const router = useRouter();

  const handleForgotPassword = async (values: any) => {
    await forgotPassword(values.email);
    message.success("Password reset email sent");
    router.push("/login");
  };

  return (
    <Layout className="flex flex-col items-center justify-center h-screen">
      <Card className="w-1/3 mx-auto flex flex-col items-center justify-center">
        <Typography.Title level={3} className="text-center p-4">
          Forgot Password
        </Typography.Title>

        <Form
          name="forgot-password"
          onFinish={handleForgotPassword}
          className="w-full flex flex-col items-center justify-center"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input size="large" placeholder="Email" style={{ width: "40ch" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Reset Password
            </Button>
          </Form.Item>
          <Link href="/login" className="text-center" type="secondary">
            Back to login
          </Link>
        </Form>
      </Card>
    </Layout>
  );
};

export default ForgotPassword;
