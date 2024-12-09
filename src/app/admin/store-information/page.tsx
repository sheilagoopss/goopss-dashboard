"use client";

import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  UserOutlined,
  FileTextOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import {
  Form,
  Input,
  Select,
  Button,
  Layout,
  Menu,
  Typography,
  Space,
  Row,
  Col,
  Card,
  Alert,
  Divider,
  message,
} from "antd";
import CustomersDropdown from "@/components/common/CustomersDropdown";
import { ICustomer } from "@/types/Customer";
import { collection, getDocs } from "firebase/firestore";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Content, Sider } = Layout;

const etsyCategories = [
  "Art & Collectibles",
  "Clothing & Shoes",
  "Home & Living",
  "Jewelry & Accessories",
  "Toys & Entertainment",
  "Craft Supplies & Tools",
  "Vintage",
  "Weddings",
  "Other",
];

const StoreInformation: React.FC = () => {
  const [form] = Form.useForm();
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");

  // Add ref for the scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Add function to scroll to top
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // Move these states to the top with other state declarations
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [customers, setCustomers] = useState<ICustomer[]>([]);

  // Then the useEffects
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersCollection = collection(db, "customers");
        const customersSnapshot = await getDocs(customersCollection);
        const customersList = customersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ICustomer[];
        setCustomers(customersList);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!selectedCustomer?.id) return;

      try {
        const customerDoc = await getDoc(
          doc(db, "customers", selectedCustomer.id),
        );
        if (customerDoc.exists()) {
          const data = customerDoc.data();
          setFirstName(data.first_name || "");

          form.setFieldsValue({
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            contact_email: data.contact_email || data.email || "",
            displayShopName: data.display_shop_name || "",
            website: data.website || "",
            industry: data.industry || "",
            about: data.about || "",
            targetAudience: data.target_audience || "",
            facebookPageLink: data.facebook_link || "",
            instagramLink: data.instagram_link || "",
            pinterestLink: data.pinterest_link || "",
            etsyStoreURL: data.etsy_store_url || "",
            contentTone: data.content_tone || "",
            facebookGroups: data.facebook_groups || "",
            pastFacebookPosts: data.past_facebook_posts || "",
            pastInstagramPosts: data.past_instagram_posts || "",
            instagramHashtags: data.instagram_hashtags || "",
            productsToPost: data.products_to_post || "",
            competitorSocial: data.competitor_social || "",
            contentGuideline: data.content_guideline || "",
          });
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setError("Failed to load customer data");
      }
    };

    fetchCustomerData();
  }, [selectedCustomer?.id, form]);

  const handleNext = async () => {
    try {
      // Get current form values
      const values = await form.validateFields();

      setLoading(true);

      if (!selectedCustomer?.id) {
        setError("No customer selected");
        return;
      }

      const customerRef = doc(db, "customers", selectedCustomer.id);

      // Check if the document exists first
      const docSnap = await getDoc(customerRef);
      if (!docSnap.exists()) {
        setError("Customer document not found");
        return;
      }

      const updateData = {
        first_name: values.firstName,
        last_name: values.lastName,
        contact_email: values.contact_email,
        website: values.website,
        industry: values.industry,
        about: values.about,
        target_audience: values.targetAudience,
        facebook_link: values.facebookPageLink,
        instagram_link: values.instagramLink,
        pinterest_link: values.pinterestLink,
        content_tone: values.contentTone,
        facebook_groups: values.facebookGroups,
        past_facebook_posts: values.pastFacebookPosts,
        past_instagram_posts: values.pastInstagramPosts,
        instagram_hashtags: values.instagramHashtags,
        products_to_post: values.productsToPost,
        competitor_social: values.competitorSocial,
        content_guideline: values.contentGuideline,
        display_shop_name: values.displayShopName,
        etsy_store_url: values.etsyStoreURL,
      };

      // Only include fields that have values
      const cleanedUpdateData = Object.entries(updateData).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== "") {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      await updateDoc(customerRef, cleanedUpdateData);
      setError(null);

      // Show success message
      message.success("Information saved successfully");

      // After successful save, scroll to top before changing section
      scrollToTop();

      // If we're on the last section, go back to first section after saving
      if (currentSection === sections.length - 1) {
        setCurrentSection(0);
      } else {
        // Otherwise, move to next section
        setCurrentSection((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error("Error saving data:", error);
      if (error.name === "FirebaseError") {
        message.error(`Firebase Error: ${error.message}`);
      } else if (error.errorFields) {
        // Form validation error
        message.error("Please fill in all required fields");
      } else {
        message.error("Failed to save store information: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    scrollToTop();
    setCurrentSection((prev) => prev - 1);
  };

  const sections = [
    {
      title: "Seller Info",
      icon: <UserOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="displayShopName"
            label="Store Name"
            rules={[{ required: true, message: "Store Name is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="etsyStoreURL"
            label="Etsy Store URL"
            rules={[{ required: true }]}
            help="Add your share and save link. Ex: https://mystore.etsy.com"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="contact_email"
            label="Contact Email"
            rules={[{ required: true, type: "email" }]}
            help="This email is for contact purposes only and won't affect your login credentials"
          >
            <Input />
          </Form.Item>

          <Form.Item name="website" label="Website (if applicable)">
            <Input />
          </Form.Item>

          <Form.Item
            name="industry"
            label="Industry"
            rules={[{ required: true }]}
          >
            <Select>
              {etsyCategories.map((category) => (
                <Select.Option key={category} value={category}>
                  {category}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="about"
            label="About"
            help="Tell us about your store and what makes it unique"
          >
            <TextArea rows={6} />
          </Form.Item>

          <Form.Item
            name="targetAudience"
            label="Target Audience"
            help="Describe your ideal customer and their interests"
          >
            <TextArea rows={4} />
          </Form.Item>
        </Space>
      ),
    },
    {
      title: "Social Media",
      icon: <GlobalOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Form.Item
            name="facebookPageLink"
            label="Facebook Page Link"
            help="Enter the full URL of your Facebook business page"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="facebookGroups"
            label="If you are familiar with top relevant Facebook groups for your business, please apply their links"
            help="Enter Facebook group links, one per line"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="pastFacebookPosts"
            label="Please attach 2-5 Facebook posts that you've created in the past (English only) - ideally posts that got the highest amount of engagement"
            help="Paste your Facebook post links or content here"
          >
            <TextArea rows={6} />
          </Form.Item>

          <Form.Item
            name="instagramLink"
            label="Instagram Link"
            help="Enter the full URL of your Instagram profile"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="pastInstagramPosts"
            label="Please attach 2-5 Instagram posts that you've created in the past (English only) - ideally posts that got the highest amount of engagement"
            help="Paste your Instagram post links or content here"
          >
            <TextArea rows={6} />
          </Form.Item>

          <Form.Item
            name="instagramHashtags"
            label="In case you have any existing instagram hashtags you would like us to use, please include them here"
            help="Enter your Instagram hashtags, separated by spaces"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="pinterestLink"
            label="Pinterest Link"
            help="Enter the full URL of your Pinterest profile"
          >
            <Input />
          </Form.Item>
        </Space>
      ),
    },
    {
      title: "Content Preferences",
      icon: <FileTextOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Form.Item
            name="contentTone"
            label="Describe the tone you want for your content"
            help="E.g., friendly, professional, casual"
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="productsToPost"
            label="Are there any specific products/categories you would like us to focus on? Please add links"
            help="Add product or category links, one per line"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="competitorSocial"
            label="Competitor Social Media Profiles"
            help="Add competitor social media links, one per line (2-5 profiles)"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="contentGuideline"
            label="Content Restrictions or Guidelines"
            help="E.g., Avoid certain topics, adhere to specific brand guidelines, etc."
          >
            <TextArea rows={4} />
          </Form.Item>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div style={{ width: "300px" }}>
          <CustomersDropdown
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            isAdmin={true}
          />
        </div>
      </div>

      {!selectedCustomer ? (
        <Alert
          message="Please select a customer"
          description="Use the dropdown above to select a customer and view their form."
          type="info"
          showIcon
        />
      ) : (
        <>
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Title level={2}>
            Hello {firstName}! 👋 Let&apos;s get to know you better.
          </Title>
          <Paragraph style={{ marginBottom: "2rem" }}>
            We&apos;re excited to learn about your Etsy journey. Fill out the
            details below to help us tailor your experience.
          </Paragraph>

          <div
            ref={scrollContainerRef}
            style={{ height: "calc(100vh - 250px)", overflow: "auto" }}
          >
            <Layout style={{ background: "transparent", minHeight: "100%" }}>
              <Sider
                theme="light"
                width={250}
                style={{
                  background: "transparent",
                  overflow: "hidden",
                }}
              >
                <Menu
                  mode="inline"
                  selectedKeys={[currentSection.toString()]}
                  style={{
                    border: "none",
                    width: "100%",
                    overflowX: "hidden",
                  }}
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

                  <Divider />

                  <Row justify="space-between">
                    <Col>
                      <Button
                        onClick={handlePrevious}
                        disabled={currentSection === 0}
                      >
                        Previous
                      </Button>
                    </Col>
                    <Col>
                      <Space>
                        <Button onClick={() => form.resetFields()}>
                          Reset
                        </Button>
                        {currentSection === sections.length - 1 ? (
                          <Button
                            type="primary"
                            onClick={handleNext}
                            loading={loading}
                            style={{
                              backgroundColor: "#000000",
                              borderColor: "#000000",
                            }}
                          >
                            Save
                          </Button>
                        ) : (
                          <Button
                            type="primary"
                            onClick={handleNext}
                            loading={loading}
                            style={{
                              backgroundColor: "#000000",
                              borderColor: "#000000",
                            }}
                          >
                            Next
                          </Button>
                        )}
                      </Space>
                    </Col>
                  </Row>
                </Form>
              </Content>
            </Layout>
          </div>
        </>
      )}
    </Card>
  );
};

export default StoreInformation;
