import React, { useState } from 'react';
import { optimizeText } from '../services/OptimizationService';
import BulkOptimizer from './BulkOptimizer';
import OptimizedResult from './OptimizedResult';

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    lineHeight: 1.6,
    color: '#333',
  },
  singleOptimizer: {
    marginTop: '40px', // Changed from marginBottom to marginTop
  },
  optimizerContent: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '30px',
  },
  inputSection: {
    width: '50%',
    paddingRight: '15px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  resultSection: {
    width: '50%',
    paddingLeft: '15px',
  },
  input: {
    width: '100%',
    marginBottom: '15px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  textarea: {
    width: '100%',
    minHeight: '200px',
    maxHeight: '400px',
    resize: 'vertical' as const,
    marginBottom: '15px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto',
  },
  button: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  clearButton: {
    backgroundColor: 'white',
    color: 'black',
    border: '1px solid black',
  },
  errorMessage: {
    color: '#d9534f',
    marginTop: '10px',
    fontWeight: 'bold',
  },
};

function TitleDescriptionOptimizer() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [storeName, setStoreName] = useState('');
  const [optimizedResult, setOptimizedResult] = useState<{ title: string; description: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async (version: number) => {
    if (!title || !description) {
      setError('Please enter both title and description');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const storeUrl = storeName ? `https://${storeName}.etsy.com` : undefined;
      const result = await optimizeText(title, description, version, storeUrl);
      setOptimizedResult(result);
    } catch (err) {
      console.error('Error optimizing listing:', err);
      setError(`Optimization failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    setTitle('');
    setDescription('');
    setStoreName('');
    setOptimizedResult(null);
    setError(null);
  };

  return (
    <div style={styles.container}>
      <BulkOptimizer />
      <div style={styles.singleOptimizer}>
        <h2>Single Listing Optimizer</h2>
        <div style={styles.optimizerContent}>
          <div style={styles.inputSection}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter listing title"
              style={styles.input}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter listing description"
              style={styles.textarea}
            />
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Enter store name"
              style={styles.input}
            />
            <div style={styles.buttonGroup}>
              <button onClick={() => handleOptimize(1)} style={styles.button} disabled={isLoading}>
                {isLoading ? 'Optimizing...' : 'Optimize 1'}
              </button>
              <button onClick={() => handleOptimize(2)} style={styles.button} disabled={isLoading}>
                {isLoading ? 'Optimizing...' : 'Optimize 2'}
              </button>
              <button onClick={handleClearAll} style={{...styles.button, ...styles.clearButton}}>
                Clear All
              </button>
            </div>
          </div>
          <div style={styles.resultSection}>
            {optimizedResult && (
              <OptimizedResult
                optimizedTitle={optimizedResult.title}
                optimizedDescription={optimizedResult.description}
              />
            )}
          </div>
        </div>
        {error && <p style={styles.errorMessage}>{error}</p>}
      </div>
    </div>
  );
}

export default TitleDescriptionOptimizer;