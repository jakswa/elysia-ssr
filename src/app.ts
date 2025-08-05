import { join } from 'node:path';
import { cookie } from '@elysiajs/cookie';
import { jwt } from '@elysiajs/jwt';
import { staticPlugin } from '@elysiajs/static';
import { Elysia } from 'elysia';
import { Eta } from 'eta';
import { authController } from './controllers/auth';
import { homeController } from './controllers/home';
import { dashboardController } from './controllers/dashboard';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { securityHeaders } from './middleware/security';

const eta = new Eta({
  views: join(process.cwd(), 'src/views'),
  autoEscape: false,
  cache: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV !== 'production',
  tags: ['<%', '%>'],
  useWith: true,
});

export const app = new Elysia()
  .use(requestLogger)
  .use(errorHandler)
  .use(securityHeaders)
  .use(
    staticPlugin({
      assets: join(process.cwd(), 'public'),
      prefix: '/',
      headers: {
        'Cache-Control': process.env.NODE_ENV === 'production' 
          ? 'public, max-age=31536000, immutable' // 1 year in prod (we have cache busting)
          : 'no-cache, no-store, must-revalidate', // No cache in dev
      },
    })
  )
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'development-secret',
    })
  )
  .use(cookie())
  .use(authMiddleware)
  .decorate('view', async (template: string, data: object = {}) => {
    // Add cache buster for CSS - timestamp in dev, could be git hash in prod
    const cacheBuster = process.env.NODE_ENV === 'production' 
      ? process.env.BUILD_VERSION || Date.now()
      : Date.now();
    
    // Render the template
    const html = await eta.renderAsync(template, { ...data, cacheBuster });
    
    // Return Response object for Elysia
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  })
  .use(homeController)
  .use(authController)
  .use(dashboardController);