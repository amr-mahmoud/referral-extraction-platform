import dotenv from 'dotenv';

dotenv.config();

console.log('[Agent Worker] Starting Plena Referral Agent Worker...');

function main() {
  console.log('[Agent Worker] Worker process initialized and waiting for jobs...');

  const shutdown = (signal: string) => {
    console.log(`[Agent Worker] Received ${signal}. Gracefully shutting down...`);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
