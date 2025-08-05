import { Elysia } from 'elysia';

export const homeController = new Elysia().get('/', ({ view, user }) => {
  return view('home', { user });
});