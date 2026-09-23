import app from './app.js';
import { NODE_ENV, PORT } from './config.js';
import { closeDatabase, connectDatabase } from './db/database.js';
import { logger } from './logger.js';

let server;
let isShuttingDown = false;

async function startServer() {
  try {
    await connectDatabase();

    server = app.listen(PORT, () => {
      logger.info({ port: PORT, nodeEnv: NODE_ENV }, 'Server started');
    });
  } catch {
    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info({ signal }, 'Graceful shutdown started');

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      logger.info('HTTP server closed');
    }

    await closeDatabase();
    logger.info('Graceful shutdown completed');
  } catch (error) {
    logger.error(
      { errorName: error.name, errorMessage: error.message },
      'Graceful shutdown failed'
    );
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

await startServer();
