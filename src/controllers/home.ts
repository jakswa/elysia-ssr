import { Elysia } from 'elysia';
import { authMiddleware } from '../middleware/auth';
import { setup } from '../setup';

export const homeController = new Elysia()
  .use(setup)
  .use(authMiddleware)
  .get('/', ({ view, user }) => {
    return view('home', { user });
  });