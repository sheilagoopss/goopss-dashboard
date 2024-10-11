import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  isAdmin: boolean;
  openLoginModal: () => void;
}

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

function Sidebar({ isOpen, isAdmin, openLoginModal }: SidebarProps) {
  const { user, logout, toggleAdminMode } = useAuth();

  return (
    <div style={styles.sidebar}>
      {user && !isAdmin && (
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {user.store_owner_name.charAt(0)}
          </div>
          <div style={styles.userDetails}>
            <span style={styles.userName}>{user.store_owner_name}</span>
            <span style={styles.userEmail}>{user.email}</span>
          </div>
        </div>
      )}
      <Link to="/" style={styles.link}>{isAdmin ? 'Customers' : 'Home'}</Link>
      <Link to="/plan" style={styles.link}>Plan</Link>
      {isAdmin && (
        <>
          <Link to="/listing-optimizer" style={styles.link}>SEO</Link>
          <Link to="/social" style={styles.link}>Social</Link>
        </>
      )}
      <Link to="/design-hub" style={styles.link}>Design Hub</Link>
      <Link to="/etsy-ads-recommendation" style={styles.link}>Etsy Ads Recommendation</Link>
      {isAdmin ? (
        <Link to="/pinterest-automation" style={styles.link}>Pinterest</Link>
      ) : <Link to="/pinterest" style={styles.link}>Pinterest</Link>}
      <div style={styles.footer}>
        <div>
            {user ? (
              <>
                <button style={styles.button} onClick={logout}>
                  Logout
                </button>
                {(!user || user.isAdmin) && (
                  <button 
                    style={styles.button} 
                    onClick={toggleAdminMode}
                  >
                    Switch to {isAdmin ? 'User' : 'Admin'} Mode
                  </button>
                )}
              </>
            ) : (
              <>
                <button style={styles.button} onClick={openLoginModal}>
                  Login
                </button>
                <button 
                  style={styles.button} 
                  onClick={toggleAdminMode}
                >
                  Switch to {isAdmin ? 'User' : 'Admin'} Mode
                </button>
              </>
            )}
          </div>
      </div>
    </div>
  );
}

export default Sidebar;