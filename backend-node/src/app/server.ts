import { createApp } from './app';
import { config } from '../shared/config/config';
import { closePool, initializePool } from '../infrastructure/database/oracle/oracle.pool';

async function start(): Promise<void> {
  await initializePool();

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}. Closing Oracle pool...`);
  try {
    await closePool();
  } catch (error) {
    console.error('Error while closing Oracle pool', error);
  }
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

start().catch((error) => {
  console.error('Failed to start the server', error);
  process.exit(1);
});