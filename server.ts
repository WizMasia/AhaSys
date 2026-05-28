/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './server/routes/api';

dotenv.config();

// Standard resolution helper
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

// Mount the API Router under /api
app.use('/api', apiRouter);

// Port configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Configure Vite middleware in development or static hosting in production
const setupServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log("Vite loaded in development middleware mode.");
  } else {
    const buildPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(buildPath)) {
      app.use(express.static(buildPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
      });
      console.log("Production assets served from built files.");
    } else {
      console.warn("Dist folder not found! Please compile the applet first using npm run build.");
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Compliance Application Server is listening live on port ${PORT}`);
  });
};

setupServer();
