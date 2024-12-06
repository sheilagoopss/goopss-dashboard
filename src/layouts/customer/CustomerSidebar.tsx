"use client";

import React, { useEffect } from "react";
import { Layout, Menu, Button, Card, Dropdown, MenuProps } from "antd";
import {
  FileText,
  Home,
  LayoutGrid,
  MessageSquare,
  Tag,
  FileEdit,
  Sparkles,
  MoreVertical,
  ClipboardList,
  Calculator,
  LogOut,
  ChartBar,
} from "lucide-react";
import Intercom from "@intercom/messenger-js-sdk";
import dayjs from "dayjs";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import Image from "next/image";

const { Sider } = Layout;

const CustomerSidebar: React.FC = () => {
  const { customerData, logout } = useAuth();
  const pathname = usePathname();
  const currentPath = pathname.split("/")[2] || "home";
  const router = useRouter();

  const menuItems: MenuProps["items"] = [
    {
      key: "home",
      icon: <Home className="h-6 w-6" />,
      label: "Home",
      children: [
        {
          key: "my-info",
          label: (
            <div
              onClick={(e) => {
                e.stopPropagation();
                router.push(ROUTES.CUSTOMER.MY_INFO);
              }}
              style={{ cursor: "pointer", paddingLeft: "32px" }}
            >
              My Info
            </div>
          ),
        },
      ],
      onTitleClick: () => {
        router.push(ROUTES.CUSTOMER.HOME);
      },
    },
    {
      key: "design-hub",
      icon: <LayoutGrid className="h-6 w-6" />,
      label: "Design Hub",
      onClick: () => {
        router.push(ROUTES.CUSTOMER.DESIGN_HUB);
      },
    },
    {
      key: "plan",
      icon: <ClipboardList className="h-6 w-6" />,
      label: "Plan",
      onClick: () => {
        router.push(ROUTES.CUSTOMER.PLAN);
      },
    },
    {
      key: "listings",
      icon: <FileText className="h-6 w-6" />,
      label: "Listings",
      onClick: () => {
        router.push(ROUTES.CUSTOMER.LISTINGS);
      },
    },
    {
      key: "social",
      icon: <MessageSquare className="h-6 w-6" />,
      label: "Social",
      children: [
        {
          key: "social",
          label: "Social Calendar",
          onClick: () => {
            router.push(ROUTES.CUSTOMER.SOCIAL);
          },
        },
        {
          key: "social-insights",
          label: "Social Media Insights",
          onClick: () => {
            router.push(ROUTES.CUSTOMER.SOCIAL_INSIGHTS);
          },
        },
      ],
    },
    {
      key: "store-analysis",
      icon: <ChartBar className="h-6 w-6" />,
      label: "Store Analysis",
      onClick: () => {
        router.push(ROUTES.CUSTOMER.STORE_ANALYSIS);
      },
    },
    {
      key: "ai-tools",
      type: "group" as const,
      label: "AI Tools",
      children: [
        {
          key: "tagify",
          icon: <Tag className="h-6 w-6" />,
          label: "Tagify",
          onClick: () => {
            router.push(ROUTES.CUSTOMER.TAGIFY);
          },
        },
        {
          key: "roas-calculator",
          icon: <Calculator className="h-6 w-6" />,
          label: "ROAS Calculator",
          onClick: () => {
            router.push(ROUTES.CUSTOMER.ROAS_CALCULATOR);
          },
        },
        {
          key: "description-hero",
          icon: <FileEdit className="h-6 w-6" />,
          label: "Description Hero",
          onClick: () => {
            router.push(ROUTES.CUSTOMER.DESCRIPTION_HERO);
          },
          extra: "Coming Soon",
        },
        {
          key: "ads-recommendation",
          icon: <Sparkles className="h-6 w-6" />,
          label: "Ads Analysis",
          onClick: () => {
            router.push(ROUTES.CUSTOMER.ADS_RECOMMENDATION);
          },
          extra: "Coming Soon",
        },
      ],
    },
  ];

  const dropdownItems = [
    { key: "help", label: "Help" },
    { key: "signout", label: "Sign out", onClick: logout },
  ];

  useEffect(() => {
    if (customerData && customerData.customer_type === "Paid") {
      Intercom({
        app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID || "",
        user_id: customerData.customer_id || "",
        name: customerData.store_owner_name || "",
        email: customerData.email || "",
        created_at: dayjs(customerData.date_joined).unix() || 0,
      });
    }
  }, [customerData]);

  return (
    <Sider width={280} theme="light">
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "visible",
          position: "fixed",
          width: "280px",
        }}
      >
        <div style={{ padding: "4px 24px 0" }}>
          <Image
            src={"/images/logo.png"}
            alt="goopss logo"
            style={{ height: 64, marginBottom: 0 }}
            width={100}
            height={64}
          />
        </div>

        <Menu
          mode="inline"
          style={{
            borderRight: "none",
            flex: 1,
            position: "relative",
            paddingTop: 0,
          }}
          selectedKeys={[currentPath]}
          items={menuItems}
        />

        <div style={{ padding: "8px 16px" }}>
          <Card
            style={{
              background: "#f5f5f5",
              borderRadius: 12,
              position: "relative",
              marginBottom: 8,
              marginTop: "32px",
              paddingTop: "8px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -40,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1,
              }}
            >
              <Image
                src={"/images/rocket.png"}
                alt="Rocket"
                style={{
                  display: "block",
                }}
                width={64}
                height={64}
              />
            </div>
            <div
              style={{
                textAlign: "center",
                marginTop: 32,
              }}
            >
              <p
                style={{
                  fontWeight: 500,
                  marginBottom: 16,
                  fontSize: "14px",
                }}
              >
                Want to accelerate your store?
              </p>
              <Button
                type="primary"
                block
                style={{
                  background: "#141414",
                  borderColor: "#141414",
                  borderRadius: "9999px",
                  height: "auto",
                  padding: "8px 0",
                }}
              >
                Join goopss
              </Button>
            </div>
          </Card>
        </div>

        {/* Conditional rendering of customer section or simple logout */}
        {customerData?.customer_type === "Paid" ? (
          // Paid users see the full customer section
          <div
            style={{
              borderTop: "1px solid #f0f0f0",
              padding: "8px",
              marginTop: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Image
                src={customerData.logo || "/images/logo.png"}
                alt="Store logo"
                style={{
                  borderRadius: "50%",
                  padding: "8px",
                }}
                width={48}
                height={48}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: 500,
                        color: "#000",
                      }}
                    >
                      {customerData?.store_name}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      {customerData?.store_owner_name}
                    </span>
                  </div>
                  {!customerData?.isViewing && (
                    <Dropdown
                      menu={{ items: dropdownItems }}
                      placement="topRight"
                      trigger={["click"]}
                    >
                      <Button
                        type="text"
                        icon={<MoreVertical size={20} />}
                        style={{
                          border: "none",
                          width: "36px",
                          height: "36px",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />
                    </Dropdown>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Free users and admins see simple logout button
          <div
            style={{
              borderTop: "1px solid #f0f0f0",
              padding: "8px",
              marginTop: "auto",
            }}
          >
            <Menu
              mode="inline"
              style={{ border: "none" }}
              items={[
                {
                  key: "logout",
                  icon: <LogOut className="h-6 w-6" />,
                  label: "Logout",
                  onClick: logout,
                },
              ]}
            />
          </div>
        )}
      </div>
    </Sider>
  );
};

export default CustomerSidebar;
