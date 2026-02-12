import { join } from 'node:path';
import { staticPlugin } from '@elysiajs/static';
import { Elysia } from 'elysia';
import { authController } from './controllers/auth';
import { homeController } from './controllers/home';
import { dashboardController } from './controllers/dashboard';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { securityHeaders } from './middleware/security';
import { setup } from './setup';

export const app = new Elysia()
  .use(requestLogger)
  .use(errorHandler)
  .use(securityHeaders)
  .use(
    staticPlugin({
      assets: join(process.cwd(), 'public'),
      prefix: '/',
      headers: {
        'Cache-Control':
          process.env.NODE_ENV === 'production'
            ? 'public, max-age=31536000, immutable'
            : 'no-cache, no-store, must-revalidate',
      },
    })
  )
  .use(setup)
  .use(authMiddleware)
  .use(homeController)
  .use(authController)
  .use(dashboardController);