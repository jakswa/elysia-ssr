import { Elysia } from 'elysia';
import { getExpiredCookieConfig } from '../utils/cookies';
import { prisma } from '../utils/prisma';
import { setup } from '../setup';

export const authMiddleware = new Elysia({ name: 'authMiddleware' })
  .use(setup)
  .derive({ as: 'scoped' }, async ({ jwt, cookie }) => {
    const token = cookie.auth?.value;
    if (!token || typeof token !== 'string') {
      return { user: null };
    }

    try {
      const payload = await jwt.verify(token);
      if (!payload || typeof payload.id !== 'string') return { user: null };

      const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      return { user };
    } catch (_error) {
      const expiredConfig = getExpiredCookieConfig();
      cookie.auth.value = '';
      Object.assign(cookie.auth, expiredConfig);
      return { user: null };
    }
  }
);

export const isSignedIn = ({ user }: { user: unknown }) => {
  if (!user) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  }
};

export const guard = new Elysia()
  .use(authMiddleware)
  .onBeforeHandle((context) => {
    // The context should include the user from authMiddleware
    return isSignedIn(context as { user: unknown });
  });