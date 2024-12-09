"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Menu,
  Avatar,
  Upload,
  Input,
  Space,
  Button,
  message,
  Popover,
  Modal,
} from "antd";
import type { MenuProps } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  MessageOutlined,
  StarOutlined,
  ProjectOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  InstagramOutlined,
  FormOutlined,
  TableOutlined,
  EditOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { IAdmin, ICustomer } from "@/types/Customer";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import Sider from "antd/es/layout/Sider";

type MenuItem = Required<MenuProps>["items"][number];

const isAdminUser = (
  user: ICustomer | IAdmin | null | undefined,
): user is IAdmin => {
  if (!user) return false;
  return "name" in user;
};

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const currentPath = usePathname();
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form, setForm] = useState({
    name: user && isAdminUser(user) ? user.name : "",
    avatarUrl: user && isAdminUser(user) ? user.avatarUrl || "" : "",
  });

  const adminMenuItems: MenuItem[] = [
    // Plan menu for all roles including Designer
    ...((user as IAdmin).role === "Designer" ||
    (user as IAdmin).role === "Admin" ||
    (user as IAdmin).role === "TeamMember" ||
    (user as IAdmin).role === "SuperAdmin"
      ? [
          {
            key: "plan",
            icon: <PieChartOutlined />,
            label: "Plan",
            children: [
              {
                key: ROUTES.ADMIN.PLAN,
                icon: <PieChartOutlined />,
                label: "Default View",
                onClick: () => {
                  router.push(ROUTES.ADMIN.PLAN);
                },
              },
              {
                key: ROUTES.ADMIN.PLAN_SIMPLE_VIEW,
                icon: <TableOutlined />,
                label: "Simple View",
                onClick: () => {
                  router.push(ROUTES.ADMIN.PLAN_SIMPLE_VIEW);
                },
              },
              {
                key: ROUTES.ADMIN.PLAN_NEW,
                icon: <AppstoreOutlined />,
                label: "New Plan",
                onClick: () => {
                  router.push(ROUTES.ADMIN.PLAN_NEW);
                },
              },
              ...((user as IAdmin).role === "SuperAdmin"
                ? [
                    {
                      key: ROUTES.ADMIN.PLAN_TASK_RULES,
                      icon: <FormOutlined />,
                      label: "Plan Task Rules",
                      onClick: () => {
                        router.push(ROUTES.ADMIN.PLAN_TASK_RULES);
                      },
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),

    // Customers menu only for Admin, TeamMember, and SuperAdmin
    ...((user as IAdmin).role === "Admin" ||
    (user as IAdmin).role === "TeamMember" ||
    (user as IAdmin).role === "SuperAdmin"
      ? [
          {
            key: "customers",
            icon: <UserOutlined />,
            label: "Customers",
            children: [
              {
                key: ROUTES.ADMIN.CUSTOMER_MANAGEMENT,
                icon: <UserOutlined />,
                label: "Customers List",
                onClick: () => {
                  router.push(ROUTES.ADMIN.CUSTOMER_MANAGEMENT);
                },
              },
              {
                key: ROUTES.ADMIN.CUSTOMER_FORM,
                icon: <FormOutlined />,
                label: "Customer Form",
                onClick: () => {
                  router.push(ROUTES.ADMIN.CUSTOMER_FORM);
                },
              },
            ],
          },
        ]
      : []),

    {
      key: ROUTES.ADMIN.DESIGN_HUB,
      icon: <AppstoreOutlined />,
      label: "Design Hub",
      onClick: () => {
        router.push(ROUTES.ADMIN.DESIGN_HUB);
      },
    },

    ...((user as IAdmin).role === "SuperAdmin" ||
    (user as IAdmin).role === "Admin" ||
    (user as IAdmin).role === "TeamMember"
      ? [
          {
            key: "listings",
            icon: <FileTextOutlined />,
            label: "Listings",
            children: [
              {
                key: ROUTES.ADMIN.LISTINGS,
                label: "Optimization",
                onClick: () => {
                  router.push(ROUTES.ADMIN.LISTINGS);
                },
              },
              {
                key: ROUTES.ADMIN.LISTINGS_DUPLICATE,
                label: "Duplication",
                onClick: () => {
                  router.push(ROUTES.ADMIN.LISTINGS_DUPLICATE);
                },
              },
            ],
          },
          {
            key: "social",
            icon: <MessageOutlined />,
            label: "Social",
            children: [
              {
                key: ROUTES.ADMIN.SOCIAL,
                label: "Social Calendar",
                onClick: () => {
                  router.push(ROUTES.ADMIN.SOCIAL);
                },
              },
              {
                key: ROUTES.ADMIN.SOCIAL_INSIGHTS,
                label: "Social Media Insights",
                onClick: () => {
                  router.push(ROUTES.ADMIN.SOCIAL_INSIGHTS);
                },
              },
            ],
          },
          {
            key: ROUTES.ADMIN.PINTEREST,
            icon: <InstagramOutlined />,
            label: "Pinterest",
            onClick: () => {
              router.push(ROUTES.ADMIN.PINTEREST);
            },
          },
          {
            key: ROUTES.ADMIN.ADS_RECOMMENDATION,
            icon: <StarOutlined />,
            label: "Ads Analysis",
            onClick: () => {
              router.push(ROUTES.ADMIN.ADS_RECOMMENDATION);
            },
          },
          {
            key: ROUTES.ADMIN.STORE_ANALYSIS,
            icon: <BarChartOutlined />,
            label: "Store Analysis",
            onClick: () => {
              router.push(ROUTES.ADMIN.STORE_ANALYSIS);
            },
          },
          {
            key: ROUTES.ADMIN.STATS,
            icon: <LineChartOutlined />,
            label: "Stats",
            onClick: () => {
              router.push(ROUTES.ADMIN.STATS);
            },
          },
          ...((user as IAdmin).role === "SuperAdmin"
            ? [
                {
                  key: ROUTES.ADMIN.TASKS,
                  icon: <ProjectOutlined />,
                  label: "Tasks Summary",
                  onClick: () => {
                    router.push(ROUTES.ADMIN.TASKS);
                  },
                },
              ]
            : []),
        ]
      : []),
    ...((user as IAdmin).role === "SuperAdmin"
      ? [
          {
            key: ROUTES.ADMIN.ROLE_MANAGEMENT,
            icon: <UserOutlined />,
            label: "Role Management",
            onClick: () => {
              router.push(ROUTES.ADMIN.ROLE_MANAGEMENT);
            },
          },
        ]
      : []),
  ];

  const handleAvatarUpload = async (file: File) => {
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `admin/${user?.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((prev) => ({ ...prev, avatarUrl: url }));
      return url;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      message.error("Failed to upload avatar");
      return null;
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.id || !isAdminUser(user)) return;

      const adminRef = doc(db, "admin", user.id);
      await updateDoc(adminRef, {
        name: form.name,
        avatarUrl: form.avatarUrl,
      });

      // Refresh the page to get updated user data
      window.location.reload();
      message.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("Failed to update profile");
    }
  };

  const profileContent = (
    <Space direction="vertical" style={{ width: "100%" }} size="small">
      <Button
        type="text"
        block
        icon={<EditOutlined />}
        style={{
          textAlign: "left",
          justifyContent: "flex-start",
        }}
        onClick={() => {
          setIsEditModalVisible(true);
          setIsPopoverVisible(false);
        }}
      >
        Edit Profile
      </Button>
      <Button
        type="text"
        danger
        block
        icon={<LogoutOutlined />}
        style={{
          textAlign: "left",
          justifyContent: "flex-start",
        }}
        onClick={logout}
      >
        Logout
      </Button>
    </Space>
  );

  const editProfileModal = (
    <Modal
      title="Edit Profile"
      open={isEditModalVisible}
      onCancel={() => setIsEditModalVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setIsEditModalVisible(false)}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={async () => {
            await handleSave();
            setIsEditModalVisible(false);
          }}
        >
          Save
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div style={{ textAlign: "center" }}>
          <Upload
            showUploadList={false}
            beforeUpload={async (file) => {
              const url = await handleAvatarUpload(file);
              if (url) {
                setForm((prev) => ({ ...prev, avatarUrl: url }));
              }
              return false; // Prevent auto-upload
            }}
          >
            <div
              className="avatar-container"
              style={{
                position: "relative",
                display: "inline-block",
                cursor: "pointer",
              }}
            >
              <Avatar
                size={80}
                src={form.avatarUrl}
                icon={!form.avatarUrl && <UserOutlined />}
                style={{
                  backgroundColor: !form.avatarUrl ? "#1890ff" : undefined,
                }}
              />
              <div className="avatar-overlay">
                <CameraOutlined style={{ color: "white", fontSize: "24px" }} />
              </div>
            </div>
          </Upload>
        </div>

        <div>
          <div style={{ marginBottom: 8, color: "#666" }}>Name</div>
          <Input
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter your name"
          />
        </div>

        <div style={{ color: "#666" }}>
          Email
          <div style={{ color: "#000" }}>{user?.email}</div>
        </div>
      </Space>
    </Modal>
  );

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
          selectedKeys={[currentPath]}
          style={{
            borderRight: "none",
            flex: 1,
            position: "relative",
            paddingTop: 0,
          }}
          items={adminMenuItems}
        />

        <Popover
          content={profileContent}
          trigger="click"
          open={isPopoverVisible}
          onOpenChange={setIsPopoverVisible}
          placement="topRight"
          arrow={false}
          overlayStyle={{
            width: "280px",
            position: "fixed",
            left: "0 !important",
            boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1)",
            borderRadius: 0,
            marginBottom: 0,
            bottom: "72px",
          }}
          overlayInnerStyle={{
            padding: "8px",
            margin: 0,
            boxShadow: "none",
            borderRadius: 0,
          }}
        >
          <div
            style={{
              padding: "16px",
              borderTop: "1px solid #f0f0f0",
              backgroundColor: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              position: "fixed",
              bottom: "0",
            }}
          >
            <Avatar
              size={40}
              src={user && isAdminUser(user) ? user.avatarUrl : undefined}
              icon={
                !(user && isAdminUser(user) && user.avatarUrl) && (
                  <UserOutlined />
                )
              }
              style={{
                backgroundColor: !(user && isAdminUser(user) && user.avatarUrl)
                  ? "#1890ff"
                  : undefined,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>
                {user && isAdminUser(user) ? user.name : "Admin"}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {user?.email}
              </div>
            </div>
            <ChevronDown size={16} />
          </div>
        </Popover>
        {editProfileModal}
      </div>
    </Sider>
  );
};

export default AdminSidebar;
