import { join } from 'node:path';
import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';
import { Eta } from 'eta';

const eta = new Eta({
  views: join(process.cwd(), 'src/views'),
  autoEscape: false,
  cache: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV !== 'production',
  tags: ['<%', '%>'],
  useWith: true,
});

export const setup = new Elysia({ name: 'setup' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'development-secret',
    })
  )
  .decorate('view', async (template: string, data: object = {}) => {
    const cacheBuster =
      process.env.NODE_ENV === 'production'
        ? process.env.BUILD_VERSION || Date.now()
        : Date.now();

    const html = await eta.renderAsync(template, { ...data, cacheBuster });

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  });
