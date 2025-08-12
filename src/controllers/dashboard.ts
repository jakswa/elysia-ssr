import { Elysia } from 'elysia';
import { authMiddleware } from '../middleware/auth';

export const dashboardController = new Elysia()
  .use(authMiddleware)
  .get('/dashboard', ({ view, user, redirect }) => {
    // Check if user is authenticated
    if (!user) {
      return redirect('/login');
    }
    
    return view('dashboard', { user });
  });