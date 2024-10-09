import React, { useState } from 'react';
import { generateBulkPosts } from '../services/PostCreationService';
import * as XLSX from 'xlsx';

const styles = {
  container: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '40px',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap' as const,
  },
  instruction: {
    color: '#000000',
    fontSize: '14px',
    margin: '0 0 15px 0',
    flexBasis: '100%',
  },
  input: {
    flex: '1',
    minWidth: '200px',
  },
  button: {
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
  downloadButton: {
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
  error: {
    color: '#000000',
    marginTop: '15px',
  },
};

function PostGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [generatedData, setGeneratedData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (file) {
      setIsLoading(true);
      setError(null);
      try {
        let data: string[][];
        if (file.name.endsWith('.xlsx')) {
          const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } else {
          // For CSV and TSV files
          const text = await file.text();
          const delimiter = file.name.endsWith('.tsv') ? '\t' : ',';
          data = text.split('\n').map(line => line.split(delimiter));
        }
        const result = await generateBulkPosts(data);
        setGeneratedData(result);
      } catch (err) {
        const error = err as any;
        if (error.response) {
          setError(`An error occurred while generating the posts: ${error.response.data}`);
        } else if (error.request) {
          setError('A network error occurred. Please check your connection and try again.');
        } else {
          setError(`An error occurred: ${error.message}`);
        }
        console.error('Error details:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDownload = () => {
    if (generatedData) {
      const blob = new Blob([generatedData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated_posts.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopy = () => {
    if (generatedData) {
      const formattedData = generatedData.split('\n').map(line => 
        `${line.split(',')[0]}\t${line.split(',')[1]}\t${line.split(',')[2]}`
      ).join('\n');

      navigator.clipboard.writeText(formattedData)
        .then(() => {
          alert('Generated posts copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          alert('Failed to copy. Please try again.');
        });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <p style={styles.instruction}>Upload a CSV, TSV, or Excel file with columns: URL, Image Link, Title, Description, Image, Store Name, About</p>
        <button 
          onClick={handleGenerate} 
          style={{...styles.button, opacity: (!file || isLoading) ? 0.5 : 1}}
          disabled={!file || isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Posts'}
        </button>
        <input type="file" accept=".csv,.tsv,.xlsx" onChange={handleFileChange} style={styles.input} />
        {generatedData && (
          <div className="mt-4 flex space-x-4">
            <button onClick={handleDownload} style={styles.downloadButton}>
              Download CSV
            </button>
            <button onClick={handleCopy} style={styles.downloadButton}>
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

export default PostGenerator;