import React from 'react';

interface OptimizedResultProps {
  optimizedTitle: string;
  optimizedDescription: string;
}

const styles = {
  container: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#333',
  },
  resultItem: {
    marginBottom: '24px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#666',
  },
  content: {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    padding: '12px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333',
  },
  button: {
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginTop: '12px',
  },
  buttonHover: {
    backgroundColor: '#555',
  },
};

const OptimizedResult: React.FC<OptimizedResultProps> = ({ optimizedTitle, optimizedDescription }) => {
  const copyToClipboard = (text: string) => {
    const formattedText = `"${text.replace(/"/g, '""')}"`;
    navigator.clipboard.writeText(formattedText);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Optimized Result</h3>
      <div style={styles.resultItem}>
        <h4 style={styles.label}>Title</h4>
        <p style={styles.content}>{optimizedTitle}</p>
        <button 
          style={styles.button} 
          onClick={() => copyToClipboard(optimizedTitle)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
        >
          Copy Title
        </button>
      </div>
      <div style={styles.resultItem}>
        <h4 style={styles.label}>Description</h4>
        <pre style={{...styles.content, whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{optimizedDescription}</pre>
        <button 
          style={styles.button} 
          onClick={() => copyToClipboard(optimizedDescription)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
        >
          Copy Description
        </button>
      </div>
    </div>
  );
};

export default OptimizedResult;