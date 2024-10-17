require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const WebSocket = require('ws');
const path = require('path');
const OpenAI = require('openai');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;  // Changed from 3000 to 3001

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY, // Use the existing environment variable
});

// Middleware to parse JSON bodies with increased limit
app.use(express.json({ limit: '10mb' }));

// Use CORS middleware
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// New endpoint for generating content
app.post('/api/generate-content', async (req, res) => {
  try {
    const { listing, platform } = req.body;
    const prompt = `
      Create a social media post for an Etsy listing with the following details:
      - Product: ${listing.listingTitle}
      - Platform: ${platform}
      - Store Type: Handmade crafts and gifts

      Guidelines:
      - Keep the tone friendly and engaging
      - Highlight the unique, handmade aspect of the product
      - Include relevant hashtags
      - For Facebook, aim for about 2-3 sentences
      - For Instagram, keep it shorter and more visual-oriented, with emojis

      The post should encourage users to check out the product and visit the Etsy store.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });

    res.json({ content: response.choices[0].message.content });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// New endpoint for optimizing listings
app.post('/api/optimize-listing', async (req, res) => {
  console.log('Received request to /api/optimize-listing');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  try {
    const { title, description, storeUrl, version } = req.body;
    console.log('Received optimization request:', { title, description, storeUrl, version });

    const prompt = `
      You are an Etsy listing optimizer. Your task is to optimize the following product title and description for better visibility and sales on Etsy. It is CRUCIAL that you maintain the exact same product type and core details. Do NOT change the product being described or invent new features. Only optimize the way the existing product is presented.

      Original Title: ${title}
      Original Description: ${description}

      Guidelines for optimization:

      1. Title:
         - Start with primary materials
         - Optimize for approximately 100 characters and less than 120 characters
         - Use relevant keywords for searchability
         - Include long-tail keywords
         - Remove repetitive words
         - Use commas to separate phrases and no hyphens or other symbols
         - Include use case or gift idea

      2. Description:
         - Start with a concise introduction (around 300 characters) but do not put an "Introduction" marker and just start with the actual introduction.
         - Use ALL CAPS for main section headers (e.g., MATERIALS, SIZING, PACKAGING AND SHIPPING, etc)
         - Do NOT use bullet points for section headers
         - Under each section header, use bullet points "•" for listing specific features, details, or options
         - Ensure all list items use "•" instead of "-" or any other symbol
         - Include important notes clearly
         - When including links in the description, show the full URL (e.g., https://etsy.com) instead of [link] and do not put the URLs in square brackets.

         Example format:
      MATERIALS
      • Material 1
      • Material 2

      SIZING
      • Size detail 1
      • Size detail 2

      IMPORTANT: The optimized title and description MUST refer to the exact same product as the original. Do not change the product type or add features that weren't in the original listing.

      Please provide the optimized title and description based on these guidelines.
    `;

    console.log('Sending request to OpenAI');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    console.log('Received response from OpenAI');
    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error('No content received from OpenAI');
    }

    console.log('OpenAI response:', result);
    const [optimizedTitle, ...descriptionParts] = result.split('\n\n');
    const responseData = {
      title: optimizedTitle.replace(/^(Optimized Title:?\s*)/i, '').trim(),
      description: descriptionParts.join('\n\n').replace(/^(Optimized Description:?\s*)/i, '').trim(),
    };
    console.log('Sending response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error optimizing listing:', error);
    if (error.response) {
      console.error('OpenAI API error:', error.response.status, error.response.data);
    } else {
      console.error('Error details:', error.message);
    }
    res.status(500).json({ error: 'Failed to optimize listing', details: error.message });
  }
});

// Proxy API requests
app.use(
  '/gen_posts',
  createProxyMiddleware({
    target: 'https://goopss.onrender.com',
    changeOrigin: true,
  })
);

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received:', message);
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const server = app.listen(port, () => {
  console.log(`Server is running on ${process.env.REACT_APP_API_URL || `http://localhost:${port}`}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

app.use((req, res, next) => {
  console.log(`Unhandled request: ${req.method} ${req.url}`);
  next();
});

app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Server is running' });
});
