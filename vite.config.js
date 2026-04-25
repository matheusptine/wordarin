import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CEDICT_SRC = path.resolve(__dirname, 'cedict_ts.u8');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-cedict',
      // Dev: serve the file from project root (it's too large for /public)
      configureServer(server) {
        server.middlewares.use('/cedict_ts.u8', (_req, res) => {
          if (!fs.existsSync(CEDICT_SRC)) {
            res.writeHead(404); res.end('cedict_ts.u8 not found');
            return;
          }
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          fs.createReadStream(CEDICT_SRC).pipe(res);
        });
      },
      // Production build: copy file into dist/
      closeBundle() {
        const dest = path.resolve(__dirname, 'dist', 'cedict_ts.u8');
        if (fs.existsSync(CEDICT_SRC)) {
          fs.copyFileSync(CEDICT_SRC, dest);
          console.log('[serve-cedict] copied cedict_ts.u8 → dist/');
        }
      },
    },
  ],
});
