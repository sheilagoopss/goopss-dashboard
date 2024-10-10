import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarProps {
  isAdmin: boolean;
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
  link: {
    display: 'block',
    padding: '10px 0',
    color: '#000',
    textDecoration: 'none',
    fontSize: '18px',
  },
};

function Sidebar({ isAdmin }: SidebarProps) {
  return (
    <div style={styles.sidebar}>
      <Link to="/" style={styles.link}>{isAdmin ? 'Customers' : 'Dashboard'}</Link>
      <Link to="/plan" style={styles.link}>Plan</Link>
      {isAdmin && (
        <>
          <Link to="/social-posts" style={styles.link}>Social Posts</Link>
          <Link to="/listing-optimizer" style={styles.link}>Listing Optimizer</Link>
          <Link to="/pinterest-automation" style={styles.link}>Pinterest Automation</Link>
        </>
      )}
      <Link to="/design-hub" style={styles.link}>Design Hub</Link>
      <Link to="/etsy-ads-recommendation" style={styles.link}>Etsy Ads Recommendation</Link>
    </div>
  );
}

export default Sidebar;