const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const WebSocket = require('ws');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure this environment variable is set
});

// Middleware to parse JSON bodies
app.use(express.json());

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
  console.log(`Server is running on http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});