import { createApp } from './app.js';
import { env } from './config/env.js';
import { testConnection } from './db/pool.js';

async function start() {
  try {
    await testConnection();
    console.log('[db] connexion OK');
  } catch (err) {
    console.error('[db] connexion impossible :', err.message);
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`[api] écoute sur 0.0.0.0:${env.port}`);
  });
}

start();
