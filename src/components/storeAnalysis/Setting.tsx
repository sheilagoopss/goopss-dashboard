"use client";

import React, { useEffect } from "react";
import { Form, Input, Button, message, Spin } from "antd";
import { usePromptFetch, usePromptUpdate } from "@/hooks/useStoreAnalytics";

const Setting: React.FC = () => {
  const [form] = Form.useForm();
  const { updatePrompt, isUpdatingPrompt } = usePromptUpdate();
  const { fetchPrompt, isFetchingPrompt } = usePromptFetch();

  const handleSubmit = async (values: any) => {
    const res = await updatePrompt(values);
    if (res) {
      message.success("Prompt updated successfully!");
    }
  };

  useEffect(() => {
    fetchPrompt().then((data) => {
      if (data?.length) {
        form.setFieldsValue(data[0]);
      }
    });
  }, [fetchPrompt, form]);

  return isFetchingPrompt ? (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        minHeight: "40vh",
      }}
    >
      <Spin size="large" />
    </div>
  ) : (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label="Announcement"
        name="announcement"
        rules={[
          { required: true, message: "Please enter announcement prompt!" },
        ]}
      >
        <Input.TextArea rows={6} allowClear />
      </Form.Item>
      <Form.Item
        label="FAQ"
        name="faq"
        rules={[{ required: true, message: "Please enter FAQ prompt!" }]}
      >
        <Input.TextArea rows={6} allowClear />
      </Form.Item>
      <Form.Item
        label="About"
        name="about"
        rules={[{ required: true, message: "Please enter about prompt!" }]}
      >
        <Input.TextArea rows={6} allowClear />
      </Form.Item>
      <Form.Item style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="primary" htmlType="submit" loading={isUpdatingPrompt}>
          Save
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Setting;
