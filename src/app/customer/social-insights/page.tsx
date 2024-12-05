"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Form,
  Layout,
  Menu,
  Space,
  message,
} from "antd";
import {
  PinterestOutlined,
  FacebookOutlined,
  InstagramOutlined,
} from "@ant-design/icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/contexts/AuthContext";

const { Title } = Typography;
const { Content, Sider } = Layout;

const convertLinksToClickable = (text: string) => {
  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)/g;

  // Split text by URLs and map through parts
  const parts = text.split(urlPattern);

  return parts.map((part, index) => {
    // Check if part matches URL pattern
    if (part.match(urlPattern)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#1890ff",
            textDecoration: "underline",
            wordBreak: "break-all",
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const SocialInsights: React.FC = () => {
  const { customerData } = useAuth();
  const [form] = Form.useForm();
  const [currentSection, setCurrentSection] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerData?.id) return;

      try {
        const customerDoc = await getDoc(doc(db, "customers", customerData.id));
        if (customerDoc.exists()) {
          const data = customerDoc.data();
          form.setFieldsValue({
            pinterestField: data.pinterest_shared_boards_goopss || "",
            facebookField: data.facebook_groups_goopss || "",
            instagramField: data.instagram_hashtags_goopss || "",
          });
          setIsDataLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        message.error("Failed to load customer data");
      }
    };

    fetchCustomerData();
  }, [customerData?.id, form]);

  const sections = [
    {
      title: "Pinterest Shared Boards",
      icon: <PinterestOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <div style={{ marginBottom: "12px", fontWeight: 500 }}>
              We&apos;ve found 10 relevant Pinterest group boards, increasing
              your exposure to thousands of potential customers. We&apos;ve
              selected these boards because they are relevant to your niche,
              have active members, and are easy to join. This combination
              maximizes your exposure and potential for engagement. We will join
              these boards.
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                padding: "16px",
                background: "#f5f5f5",
                borderRadius: "8px",
                minHeight: "300px",
                lineHeight: "1.8",
              }}
            >
              {isDataLoaded &&
                convertLinksToClickable(
                  form.getFieldValue("pinterestField") || "",
                )}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Facebook Groups",
      icon: <FacebookOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <div style={{ marginBottom: "12px", fontWeight: 500 }}>
              We&apos;ve found 5 relevant Facebook shared boards, increasing
              your exposure to thousands of potential customers.
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                padding: "16px",
                background: "#f5f5f5",
                borderRadius: "8px",
                minHeight: "200px",
                lineHeight: "1.8",
              }}
            >
              {isDataLoaded &&
                convertLinksToClickable(
                  form.getFieldValue("facebookField") || "",
                )}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Instagram Hashtags",
      icon: <InstagramOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <div style={{ marginBottom: "12px", fontWeight: 500 }}>
              We&apos;ve researched and compiled a list of popular hashtags
              relevant to your products. Using these hashtags will help people
              discover your content on Instagram and expand your reach. We will
              use these hashtags when creating new posts.
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                padding: "16px",
                background: "#f5f5f5",
                borderRadius: "8px",
                minHeight: "100px",
              }}
            >
              {isDataLoaded ? form.getFieldValue("instagramField") : ""}
            </div>
          </div>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Title level={2} style={{ marginBottom: "3rem" }}>
        Social Media Insights
      </Title>

      <Layout
        style={{
          background: "transparent",
          minHeight: "auto",
        }}
      >
        <Sider
          theme="light"
          width={250}
          style={{
            background: "transparent",
            overflow: "hidden",
            marginRight: "24px",
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[currentSection.toString()]}
            style={{
              border: "none",
              width: "100%",
              overflowX: "hidden",
              padding: "0 8px",
            }}
            className="social-insights-menu"
            items={sections.map((section, index) => ({
              key: index.toString(),
              icon: section.icon,
              label: section.title,
              onClick: () => setCurrentSection(index),
            }))}
          />
        </Sider>

        <Content style={{ padding: "0 24px" }}>
          <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
            {sections[currentSection].content}
          </Form>
        </Content>
      </Layout>
    </Card>
  );
};

export default SocialInsights;
