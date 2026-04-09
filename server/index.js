// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Express Server
// ═══════════════════════════════════════════════════════════════
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDB } from './db.js';
import { registerRoutes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

async function start() {
  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Initialize database (async for sql.js)
  const db = await initDB();

  // Register API routes
  registerRoutes(app, db);

  // Serve static files in production (Vite build output)
  if (isProduction) {
    const distPath = join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🏋️  FitOptim AI Server`);
    console.log(`  ├─ Running on port ${PORT}`);
    console.log(`  ├─ Mode: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`  └─ Database: SQLite (sql.js)\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

