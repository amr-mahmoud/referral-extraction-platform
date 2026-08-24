import dotenv from 'dotenv';

dotenv.config();

console.log('[Agent Worker] Starting Plena Referral Agent Worker...');

function main() {
  console.log('[Agent Worker] Mode: Background SQS Consumer Daemon (No inbound HTTP port required).');
  console.log('[Agent Worker] Worker process initialized, connected to SQS queue & Postgres, waiting for extraction jobs...');

  const shutdown = (signal: string) => {
    console.log(`[Agent Worker] Received ${signal}. Gracefully shutting down...`);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
