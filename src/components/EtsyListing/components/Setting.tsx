/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import { Form, Input, Button, message, Spin } from "antd";
import {
  useOptimizeEtsyPromptUpdate,
  useOptimizeEtsyPromptFetch,
} from "hooks/useOptimzeEtsy";

const Setting: React.FC = () => {
  const [form] = Form.useForm();
  const { updatePrompt, isUpdatingPrompt } = useOptimizeEtsyPromptUpdate();
  const { fetchPrompt, isFetchingPrompt } = useOptimizeEtsyPromptFetch();

  const handleSubmit = async (values: any) => {
    const res = await updatePrompt(values);
    if (res) {
      message.success("Prompt updated successfully!");
    }
  };

  useEffect(() => {
    fetchPrompt().then((data) => {
      if (data) {
        form.setFieldsValue(data);
      }
    });
  }, []);

  return isFetchingPrompt ? (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "40vh",
      }}
    >
      <Spin size="large" />
    </div>
  ) : (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label="Title"
        name="title"
        rules={[{ required: true, message: "Please enter title prompt!" }]}
      >
        <Input.TextArea rows={10} allowClear />
      </Form.Item>
      <Form.Item
        label="Description"
        name="description"
        rules={[
          { required: true, message: "Please enter description prompt!" },
        ]}
      >
        <Input.TextArea rows={10} allowClear />
      </Form.Item>
      <Form.Item
        label="Tags"
        name="tags"
        rules={[{ required: true, message: "Please enter tags prompt!" }]}
      >
        <Input.TextArea rows={10} allowClear />
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
