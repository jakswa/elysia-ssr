import { Elysia } from 'elysia';
import { authMiddleware } from '../middleware/auth';
import { setup } from '../setup';

export const dashboardController = new Elysia()
  .use(setup)
  .use(authMiddleware)
  .get('/dashboard', ({ view, user, redirect }) => {
    // Check if user is authenticated
    if (!user) {
      return redirect('/login');
    }
    
    return view('dashboard', { user });
  });