import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isAdmin: boolean;
  openLoginModal: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin, openLoginModal }) => {
  const { user, logout } = useAuth();

  const adminMenuItems = [
    { path: '/customers', label: 'Customers' },
    { path: '/plan', label: 'Plan' },
    { path: '/seo', label: 'SEO' },
    { path: '/social', label: 'Social' },
    { path: '/design-hub', label: 'Design' },
    { path: '/ads-recommendation', label: 'Ads Recommendation' },
    { path: '/pinterest', label: 'Pinterest' },
  ];

  const userMenuItems = [
    { path: '/plan', label: 'Plan' },
    { path: '/seo', label: 'SEO' },
    { path: '/social', label: 'Social' },
    { path: '/design-hub', label: 'Design' },
    { path: '/ads-recommendation', label: 'Ads Recommendation' },
    { path: '/pinterest', label: 'Pinterest' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const styles = {
    sidebar: {
      width: '250px',
      height: '100%',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px',
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      marginRight: '12px',
      backgroundColor: '#007bff',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
    },
    userDetails: {
      display: 'flex',
      flexDirection: 'column' as const,
    },
    userName: {
      fontWeight: 'bold',
    },
    userEmail: {
      fontSize: '14px',
      color: '#6c757d',
    },
    link: {
      display: 'block',
      padding: '10px 0',
      color: '#000',
      textDecoration: 'none',
      fontSize: '18px',
    },
    footer: {
      marginTop: 'auto',
      borderTop: '1px solid #e5e7eb',
      paddingTop: '20px',
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: '#ffffff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      marginBottom: '10px',
      width: '100%',
    },
  };

  return (
    <nav style={styles.sidebar}>
      {user && !isAdmin && (
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {user.store_owner_name?.charAt(0)}
          </div>
          <div style={styles.userDetails}>
            <span style={styles.userName}>{user.store_owner_name}</span>
            <span style={styles.userEmail}>{user.email}</span>
          </div>
        </div>
      )}
      <ul style={styles.link}>
        {menuItems.map((item) => (
          <li key={item.path} style={styles.link}>
            <Link to={item.path} style={styles.link}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div style={styles.footer}>
        <div>
          {user ? (
            <button style={styles.button} onClick={logout}>
              Logout
            </button>
          ) : (
            <button style={styles.button} onClick={openLoginModal}>
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;