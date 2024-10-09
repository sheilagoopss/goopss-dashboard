const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/gen_posts',
    createProxyMiddleware({
      target: 'https://goopss.onrender.com',
      changeOrigin: true,
    })
  );
};