import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Customer } from "../types/Customer";
import { Users, FileText, Calendar, Palette, BarChart2, PenTool, Layout, CheckSquare, BarChart, Tag } from 'lucide-react';

interface SidebarProps {
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
  const { user, logout } = useAuth();

  const adminMenuItems = [
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/plan", label: "Plan", icon: Layout },
    { path: "/seo", label: "SEO", icon: FileText },
    { path: "/social", label: "Social", icon: Calendar },
    { path: "/design-hub", label: "Design", icon: Palette },
    { path: "/ads-recommendation", label: "Ads Recommendation", icon: BarChart2 },
    { path: "/pinterest", label: "Pinterest", icon: PenTool },
    { path: "/taskSummary", label: "Task Summary", icon: CheckSquare },
    { path: "/store-analysis", label: "Store Analysis", icon: BarChart },
  ];

  const userMenuItems = [
    { path: "/plan", label: "Plan", icon: Layout },
    { path: "/seo", label: "SEO", icon: FileText },
    { path: "/social", label: "Social", icon: Calendar },
    { path: "/design-hub", label: "Design", icon: Palette },
    { path: "/ads-recommendation", label: "Ads Recommendation", icon: BarChart2 },
    { path: "/tagify", label: "Tagify", icon: Tag },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const styles = {
    sidebar: {
      width: "250px",
      height: "100%",
      backgroundColor: "#f8f9fa",
      padding: "20px",
      boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
      display: "flex",
      flexDirection: "column" as const,
    },
    userInfo: {
      display: "flex",
      alignItems: "center",
      marginBottom: "20px",
    },
    avatar: {
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      marginRight: "12px",
      backgroundColor: "#007bff",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "20px",
    },
    userDetails: {
      display: "flex",
      flexDirection: "column" as const,
    },
    userName: {
      fontWeight: "bold",
    },
    userEmail: {
      fontSize: "14px",
      color: "#6c757d",
    },
    link: {
      display: "block",
      padding: "10px 0",
      color: "#000",
      textDecoration: "none",
      fontSize: "18px",
    },
    footer: {
      marginTop: "auto",
      borderTop: "1px solid #e5e7eb",
      paddingTop: "20px",
    },
    button: {
      padding: "10px 20px",
      backgroundColor: "#007bff",
      color: "#ffffff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      marginBottom: "10px",
      width: "100%",
    },
  };

  return (
    <nav style={styles.sidebar}>
      {user && !isAdmin && (
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {(user as Customer).store_owner_name?.charAt(0)}
          </div>
          <div style={styles.userDetails}>
            <span style={styles.userName}>
              {(user as Customer).store_owner_name}
            </span>
            <span style={styles.userEmail}>{user.email}</span>
          </div>
        </div>
      )}
      <ul style={styles.link}>
        {menuItems.map((item) => (
          <li key={item.path} style={styles.link}>
            <Link to={item.path} style={styles.link}>
              <item.icon size={18} style={{ marginRight: '10px' }} />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div style={styles.footer}>
        <div>
          {user && (
            <button style={styles.button} onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
