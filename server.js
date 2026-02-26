import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;
const BLOB_PROXY_TARGET = process.env.BLOB_PROXY_TARGET || 'https://cererpblobdev.blob.core.windows.net';

// Proxy blob uploads to Azure Blob Storage (supports PUT for uploads)
app.use('/blob-proxy', createProxyMiddleware({
  target: BLOB_PROXY_TARGET,
  changeOrigin: true,
  secure: true,
  pathRewrite: (path) => path.replace(/^\/blob-proxy/, ''),
}));

// Serve static files from dist at root
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback — serve index.html for any route that doesn't match a file
app.get('{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
