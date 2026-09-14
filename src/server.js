import app from './app.js';
import { NODE_ENV, PORT } from './config.js';
import { logger } from './logger.js';

app.listen(PORT, () => {
  logger.info({ port: PORT, nodeEnv: NODE_ENV }, 'Server started');
});
