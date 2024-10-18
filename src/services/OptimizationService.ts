import axios from 'axios';

export interface BulkOptimizeItem {
  listingId: string;
  title: string;
  description: string;
  storeUrl?: string;
}

export interface OptimizedBulkItem {
  listingId: string;
  optimizedTitle: string;
  optimizedDescription: string;
}

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000; // Increased from 1000
const MAX_CHUNK_SIZE = 4000; // This might not be necessary now

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const API_URL = 'https://goopss-dashboard-backend.onrender.com';

export async function optimizeText(
  title: string,
  description: string,
  version: number,
  storeUrl?: string
): Promise<{ title: string; description: string }> {
  try {
    console.log('Sending optimization request:', { title, description: description.substring(0, 100) + '...', storeUrl, version });
    console.log('API URL:', `${API_URL}/api/optimize-listing`);
    const response = await axios.post(`${API_URL}/api/optimize-listing`, {
      title,
      description,
      storeUrl,
      version,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Received optimization response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error optimizing text:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Request URL:', error.config?.url);
    }
    throw new Error('Failed to optimize text: ' + (error instanceof Error ? error.message : String(error)));
  }
}

function splitIntoChunks(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxChunkSize) {
    chunks.push(text.slice(i, i + maxChunkSize));
  }
  return chunks;
}

export async function optimizeBulk(
  items: BulkOptimizeItem[],
  version: number
): Promise<OptimizedBulkItem[]> {
  const optimizedItems: OptimizedBulkItem[] = [];

  for (const item of items) {
    try {
      const optimized = await optimizeText(item.title, item.description, version, item.storeUrl);
      optimizedItems.push({
        listingId: item.listingId,
        optimizedTitle: optimized.title,
        optimizedDescription: optimized.description,
      });
    } catch (error) {
      console.error(`Error optimizing item ${item.listingId}:`, error);
      // You might want to handle this error differently, e.g., by adding a failed item to the list
    }
  }

  return optimizedItems;
}
