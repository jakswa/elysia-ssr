import { Elysia } from 'elysia';
import { guard } from '../middleware/auth';

export const dashboardController = new Elysia()
  .use(guard)
  .get('/dashboard', ({ view, user }) => {
    return view('dashboard', { user });
  });