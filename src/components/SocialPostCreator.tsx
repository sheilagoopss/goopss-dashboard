import React from 'react';
import PostGenerator from './PostGenerator';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '40px',
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
};

function SocialPostCreator() {
  return (
    <div style={styles.container}>
      <h2>Facebook and Instagram Post Creator</h2>
      <PostGenerator />
    </div>
  );
}

export default SocialPostCreator;