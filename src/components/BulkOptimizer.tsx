import React, { useState } from 'react';
import { optimizeBulk, BulkOptimizeItem, OptimizedBulkItem } from '../services/OptimizationService';
import { parseFile, generateCSV } from '../utils/fileHandling';

const styles = {
  container: {
    marginBottom: '40px',
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
  },
  instructionText: {
    fontWeight: 'normal',
    fontSize: '0.8em',
    color: '#666',
    marginLeft: '10px',
  },
  fileUpload: {
    marginBottom: '20px',
  },
  input: {
    display: 'inline-block',
    width: 'auto',
    marginBottom: '15px',
    padding: '5px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  bulkOptimizerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: '20px',
  },
  optimizeButtons: {
    display: 'flex',
    gap: '10px',
  },
  resultActions: {
    display: 'flex',
    gap: '10px',
  },
  button: {
    width: 'auto',
    minWidth: '120px',
    padding: '10px',
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  errorMessage: {
    color: '#d9534f',
    marginTop: '10px',
    fontWeight: 'bold',
  },
};

function BulkOptimizer() {
  const [file, setFile] = useState<File | null>(null);
  const [optimizedData, setOptimizedData] = useState<OptimizedBulkItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleOptimize = async (version: number) => {
    if (!file) {
      setError('Please upload a file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const parsedData = await parseFile(file);
      const bulkData: BulkOptimizeItem[] = parsedData.map((item: { [key: string]: string }) => ({
        listingId: item["Listing ID"]?.toString() || '',
        title: item["Title"] || '',
        description: item["Description"] || '',
        storeUrl: item["Store Name"] ? `https://${item["Store Name"]}.etsy.com` : '',
      }));
      const optimizedResults = await optimizeBulk(bulkData, version);
      setOptimizedData(optimizedResults);
    } catch (err) {
      console.error('Error optimizing bulk listings:', err);
      setError('An error occurred while optimizing the listings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (optimizedData) {
      const csv = generateCSV(optimizedData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimized_listings.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopy = () => {
    if (optimizedData) {
      const formattedData = optimizedData.map(item => 
        `${item.listingId}\t"${item.optimizedTitle}"\t"${item.optimizedDescription}"`
      ).join('\n');

      navigator.clipboard.writeText(formattedData)
        .then(() => {
          alert('Optimized listings copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          alert('Failed to copy. Please try again.');
        });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.heading}>
        <h2>Bulk Optimizer</h2>
        <span style={styles.instructionText}>Upload a CSV, TSV, or Excel file with columns: Listing ID, Title, Description, Store Name</span>
      </div>
      <div style={styles.fileUpload}>
        <input type="file" accept=".csv,.tsv,.xlsx" onChange={handleFileChange} style={styles.input} />
      </div>
      <div style={styles.bulkOptimizerActions}>
        <div style={styles.optimizeButtons}>
          <button 
            onClick={() => handleOptimize(1)} 
            style={{...styles.button, ...((!file || isLoading) ? styles.disabledButton : {})}}
            disabled={!file || isLoading}
          >
            {isLoading ? 'Optimizing...' : 'Optimize 1'}
          </button>
          <button 
            onClick={() => handleOptimize(2)} 
            style={{...styles.button, ...((!file || isLoading) ? styles.disabledButton : {})}}
            disabled={!file || isLoading}
          >
            {isLoading ? 'Optimizing...' : 'Optimize 2'}
          </button>
        </div>
        {optimizedData && (
          <div style={styles.resultActions}>
            <button onClick={handleDownload} style={styles.button}>
              Download CSV
            </button>
            <button onClick={handleCopy} style={styles.button}>
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
      {error && <p style={styles.errorMessage}>{error}</p>}
    </div>
  );
}

export default BulkOptimizer;