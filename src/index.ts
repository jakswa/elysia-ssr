import { app } from './app';
import { validateEnv } from './utils/env';
import { logger } from './utils/logger';

// Validate environment variables before starting
try {
  validateEnv();
} catch (error) {
  logger.error({ error }, 'Environment validation failed');
  process.exit(1);
}

const port = process.env.PORT || 3000;

app.listen(port);

logger.info(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);