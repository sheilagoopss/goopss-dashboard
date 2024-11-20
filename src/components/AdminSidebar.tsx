import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Layout,
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
import { ChevronDown } from "lucide-react";
import logo from "../assets/images/logo.png";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { IAdmin, ICustomer } from "../types/Customer";

const { Sider } = Layout;

interface AdminSidebarProps {
  isAdmin: boolean;
}

type MenuItem = Required<MenuProps>["items"][number];

const isAdminUser = (
  user: ICustomer | IAdmin | null | undefined,
): user is IAdmin => {
  if (!user) return false;
  return "name" in user;
};

const styles = `
  .avatar-overlay {
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: opacity 0.2s;
  }
  
  .avatar-container:hover .avatar-overlay {
    opacity: 1;
  }
`;

const AdminSidebar: React.FC<AdminSidebarProps> = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form, setForm] = useState({
    name: user && isAdminUser(user) ? user.name : "",
    avatarUrl: user && isAdminUser(user) ? user.avatarUrl || "" : "",
  });
  const [fileList, setFileList] = useState<any[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);

  const [socialExpanded, setSocialExpanded] = useState(() => {
    const saved = localStorage.getItem("adminSocialExpanded");
    return saved
      ? JSON.parse(saved)
      : currentPath === "social" || currentPath === "social-insights";
  });

  useEffect(() => {
    if (currentPath === "social" || currentPath === "social-insights") {
      setSocialExpanded(true);
    }
  }, [currentPath]);

  React.useEffect(() => {
    localStorage.setItem("adminSocialExpanded", JSON.stringify(socialExpanded));
  }, [socialExpanded]);

  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("adminOpenKeys");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("adminOpenKeys", JSON.stringify(openKeys));
  }, [openKeys]);

  const adminMenuItems: MenuItem[] = [
    ...((user as IAdmin).role === "Admin" ||
    (user as IAdmin).role === "TeamMember" ||
    (user as IAdmin).role === "SuperAdmin"
      ? [
          {
            key: "plan",
            icon: <PieChartOutlined />,
            label: <span>Plan</span>,
            children: [
              {
                key: "/plan",
                icon: <PieChartOutlined />,
                label: <Link to="/plan">Default View</Link>,
              },
              {
                key: "/plan-simple-view",
                icon: <TableOutlined />,
                label: <Link to="/plan-simple-view">Simple View</Link>,
              },
              ...((user as IAdmin).role === "SuperAdmin"
                ? [
                    {
                      key: "/plan-task-rules",
                      icon: <FormOutlined />,
                      label: <Link to="/plan-task-rules">Plan Task Rules</Link>,
                    },
                  ]
                : []),
            ],
          },
          {
            key: "customers",
            icon: <UserOutlined />,
            label: <span>Customers</span>,
            children: [
              {
                key: "/",
                icon: <UserOutlined />,
                label: <Link to="/">Customers List</Link>,
              },
              {
                key: "/customer-form",
                icon: <FormOutlined />,
                label: <Link to="/customer-form">Customer Form</Link>,
              },
              ...((user as IAdmin).role === "SuperAdmin"
                ? [
                    {
                      key: "/activity-log",
                      icon: <BarChartOutlined />,
                      label: <Link to="/activity-log">Activity Log</Link>,
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),

    {
      key: "design-hub",
      icon: <AppstoreOutlined />,
      label: <Link to="/design-hub">Design Hub</Link>,
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
                key: "/listings",
                label: <Link to="/listings">Optimization</Link>,
              },
              {
                key: "/listings/duplicate",
                label: <Link to="/listings/duplicate">Duplication</Link>,
              },
            ],
          },
          {
            key: "social",
            icon: <MessageOutlined />,
            label: "Social",
            children: [
              {
                key: "/social",
                label: <Link to="/social">Social Calendar</Link>,
              },
              {
                key: "/social-insights",
                label: <Link to="/social-insights">Social Media Insights</Link>,
              },
            ],
          },
          {
            key: "pinterest",
            icon: <InstagramOutlined />,
            label: <Link to="/pinterest">Pinterest</Link>,
          },
          {
            key: "ads-recommendation",
            icon: <StarOutlined />,
            label: <Link to="/ads-recommendation">Ads Analysis</Link>,
          },
          {
            key: "store-analysis",
            icon: <BarChartOutlined />,
            label: <Link to="/store-analysis">Store Analysis</Link>,
          },
          {
            key: "stats",
            icon: <LineChartOutlined />,
            label: <Link to="/stats">Stats</Link>,
          },
          ...((user as IAdmin).role === "SuperAdmin"
            ? [
                {
                  key: "tasks",
                  icon: <ProjectOutlined />,
                  label: <Link to="/tasks">Tasks Summary</Link>,
                },
              ]
            : []),
        ]
      : []),
    ...((user as IAdmin).role === "SuperAdmin"
      ? [
          {
            key: "role-management",
            icon: <UserOutlined />,
            label: <Link to="/role-management">Role Management</Link>,
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

  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <Sider
      width={280}
      style={{
        background: "#fff",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        height: "100vh",
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px",
            textAlign: "center",
          }}
        >
          <img src={logo} alt="goopss logo" style={{ height: 40 }} />
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[currentPath]}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            style={{
              borderRight: 0,
              padding: "8px",
            }}
            items={adminMenuItems}
            className="admin-sidebar-menu"
          />
        </div>

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
