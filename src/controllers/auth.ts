import { Elysia, t } from 'elysia';
import { getCookieConfig, getExpiredCookieConfig } from '../utils/cookies';
import { hashPassword, verifyPassword } from '../utils/password';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export const authController = new Elysia()
  .get('/register', ({ view }) => {
    return view('auth/register', {});
  })
  .post(
    '/register',
    async ({ body, jwt, view, redirect, cookie }) => {
      const { name, email, password } = body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return view('auth/register', {
          error: 'An account with this email already exists',
          name,
          email,
        });
      }

      try {
        // Create user
        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
          },
        });

        // Create JWT token
        const token = await jwt.sign({ id: user.id });
        cookie.auth.value = token;
        Object.assign(cookie.auth, getCookieConfig());

        logger.info({ userId: user.id }, 'User registered');

        return redirect('/dashboard');
      } catch (error) {
        logger.error({ error }, 'Registration error');
        return view('auth/register', {
          error: 'Registration failed. Please try again.',
          name,
          email,
        });
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2 }),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
      }),
    }
  )
  .get('/login', ({ view }) => {
    return view('auth/login', {});
  })
  .post(
    '/login',
    async ({ body, jwt, view, redirect, cookie }) => {
      const { email, password } = body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !(await verifyPassword(password, user.password))) {
        return view('auth/login', {
          error: 'Invalid email or password',
          email,
        });
      }

      // Create JWT token
      const token = await jwt.sign({ id: user.id });
      cookie.auth.value = token;
      Object.assign(cookie.auth, getCookieConfig());

      logger.info({ userId: user.id }, 'User logged in');

      return redirect('/dashboard');
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
    }
  )
  .post('/logout', ({ cookie, redirect }) => {
    const expiredConfig = getExpiredCookieConfig();
    cookie.auth.value = '';
    Object.assign(cookie.auth, expiredConfig);
    return redirect('/');
  });