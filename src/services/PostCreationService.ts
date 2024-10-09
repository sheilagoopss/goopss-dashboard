import axios from 'axios';
import Papa from 'papaparse';

interface PostData {
  rowIndex: number;
  url: string;
  image_path: string;
  title: string;
  description: string;
  store_name: string;
  about: string;
}

export async function generateBulkPosts(data: string[][]): Promise<string> {
  try {
    const serverUrl = '/gen_posts'; // Use the proxy endpoint

    const generatedData: string[][] = [['URL', 'Image Link', 'Title', 'Description', 'Image', 'Store Name', 'About', 'Facebook Post', 'Instagram Post']];
    const customerGroups: { [key: string]: PostData[] } = {};

    // Group rows by store_name
    for (let i = 1; i < data.length; i++) { // Start loop from row 2
      const row = data[i];
      if (row.length >= 7) { // Ensure there are at least 7 columns
        const [url, image_path, title, description, , store_name, about] = row;
        if (!customerGroups[store_name]) {
          customerGroups[store_name] = [];
        }
        customerGroups[store_name].push({ rowIndex: i, url, image_path, title, description, store_name, about });
      }
    }

    // Iterate over each customer group and generate posts
    for (const store_name in customerGroups) {
      if (customerGroups.hasOwnProperty(store_name)) {
        const payload = customerGroups[store_name];

        // Set the options for the request
        const options = {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: JSON.stringify(payload),
        };

        // Make the request to the Flask app
        console.log(`Sending request to ${serverUrl} with payload:`, payload);
        try {
          const response = await axios.post(serverUrl, payload, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          console.log('Received response:', response.data);

          // Parse the JSON response
          const results = response.data.result;

          // Place the results in the generatedData array
          results.forEach((result: any, index: number) => {
            const item: PostData = customerGroups[store_name][index];
            const { url, image_path, title, description, store_name: store, about } = item;
            generatedData.push([url, image_path, title, description, image_path, store, about, result.facebook_post, result.instagram_post]);
          });
        } catch (error) {
          console.error('Error during request:', error);
          throw error;
        }
      }
    }

    return Papa.unparse(generatedData, {
      delimiter: ',',
      newline: '\n',
      escapeFormulae: true,
    });
  } catch (error) {
    const err = error as any;
    if (err.response) {
      console.error('Error generating posts:', err.response.data);
    } else if (err.request) {
      console.error('Network error:', err.request);
    } else {
      console.error('Error:', err.message);
    }
    throw err;
  }
}