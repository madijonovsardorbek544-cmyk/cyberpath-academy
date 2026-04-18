import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

app.listen(env.port, () => {
  logger.info('server.started', { port: env.port, clientUrl: env.clientUrl, nodeEnv: env.nodeEnv });
});
