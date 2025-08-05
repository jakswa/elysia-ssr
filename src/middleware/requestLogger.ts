import { Elysia } from 'elysia';
import { logger } from '../utils/logger';

export const requestLogger = new Elysia().onAfterResponse(
  { as: 'global' },
  ({ request, response, set }) => {
    const url = new URL(request.url);
    const status = response?.status || set.status || 200;

    logger.info(
      {
        method: request.method,
        path: url.pathname,
        status,
        userAgent: request.headers.get('user-agent')?.split(' ')[0], // Just browser name
        contentType: response?.headers?.get('content-type'),
      },
      `${request.method} ${url.pathname} ${status}`
    );
  }
);