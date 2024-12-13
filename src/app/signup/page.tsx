"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCustomerUpdate } from "@/hooks/useCustomer";
import { useSubscribeCustomer } from "@/hooks/useKlaviyo";
import { Form, Input, Button, Steps, Card, Layout, Typography } from "antd";
import { useEffect, useState } from "react";

const { Step } = Steps;

const SignupPage = () => {
  const { signup, loading: signupLoading, customerData } = useAuth();
  const { subscribeCustomer, isSubscribingCustomer } = useSubscribeCustomer();
  const { updateCustomer, isLoading: isUpdatingCustomer } = useCustomerUpdate();
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  const handleNext = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue();
      signup({ email: values.email, password: values.password });
    });
  };

  const handleSubmit = async (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    storeName: string;
    storeOwnerName: string;
  }) => {
    form.validateFields().then(async () => {
      const { storeName, storeOwnerName } = values;

      await updateCustomer(customerData?.id as string, {
        store_name: storeName,
        store_owner_name: storeOwnerName,
      });

      await subscribeCustomer(customerData?.email as string, storeOwnerName);
      setCurrentStep(2);
    });
  };

  useEffect(() => {
    if (customerData) {
      setCurrentStep(1);
      if (!customerData.store_owner_name || !customerData.store_name) {
        form.setFieldsValue({
          storeOwnerName: customerData.store_owner_name,
          storeName: customerData.store_name,
        });
      } else {
        setCurrentStep(2);
      }
    }
  }, [customerData, form]);

  return (
    <Layout className="flex justify-center items-center h-screen w-full">
      <Card title="Sign Up" className="w-1/3">
        <div className="mb-8">
          {currentStep !== 2 && (
            <Steps current={currentStep}>
              <Step title="Account Details" />
              <Step title="Store Information" />
            </Steps>
          )}
        </div>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          {currentStep === 0 && (
            <>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input size="large" placeholder="Enter your email" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please input your password!" },
                ]}
              >
                <Input.Password
                  size="large"
                  placeholder="Enter your password"
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm your password!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("The two passwords do not match!"),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  size="large"
                  placeholder="Confirm your password"
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  onClick={handleNext}
                  loading={signupLoading}
                  style={{ float: "right" }}
                >
                  Next
                </Button>
              </Form.Item>
            </>
          )}
          {currentStep === 1 && (
            <>
              <Form.Item
                name="storeOwnerName"
                label="Store Owner Name"
                rules={[{ required: true, message: "Please input your name!" }]}
              >
                <Input size="large" placeholder="Enter your name" />
              </Form.Item>
              <Form.Item
                name="storeName"
                label="Store Name"
                rules={[
                  { required: true, message: "Please input your store name!" },
                ]}
              >
                <Input size="large" placeholder="Enter your store name" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isUpdatingCustomer || isSubscribingCustomer}
                  style={{ float: "right" }}
                >
                  Finish
                </Button>
              </Form.Item>
            </>
          )}
          {currentStep === 2 && (
            <div className="flex flex-col items-center justify-center mb-8">
              <Typography.Title level={2}>Signup complete!</Typography.Title>
              <Typography.Title level={4}>
                You can now proceed to the dashboard.
              </Typography.Title>
              <Button type="primary" href="/">
                Go to Dashboard
              </Button>
            </div>
          )}
        </Form>
      </Card>
    </Layout>
  );
};

export default SignupPage;
