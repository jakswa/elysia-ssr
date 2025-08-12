import { describe, expect, it, beforeEach } from 'bun:test';
import { app } from '../src/app';
import { prisma } from '../src/utils/prisma';
import { hashPassword } from '../src/utils/password';

describe('Authentication', () => {
  beforeEach(async () => {
    // Clean up users before each test
    await prisma.user.deleteMany();
  });

  describe('Registration', () => {
    it('should successfully register a new user', async () => {
      const formData = new FormData();
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      const response = await app.handle(
        new Request('http://localhost:3000/register', {
          method: 'POST',
          body: formData,
        })
      );

      // Should redirect to dashboard after successful registration
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/dashboard');

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      });
      expect(user).toBeTruthy();
      expect(user?.name).toBe('Test User');
      expect(user?.email).toBe('test@example.com');
    });

    it('should show error for duplicate email', async () => {
      // Create existing user
      await prisma.user.create({
        data: {
          name: 'Existing User',
          email: 'test@example.com',
          password: await hashPassword('password123'),
        }
      });

      const formData = new FormData();
      formData.append('name', 'New User');
      formData.append('email', 'test@example.com');
      formData.append('password', 'password456');

      const response = await app.handle(
        new Request('http://localhost:3000/register', {
          method: 'POST',
          body: formData,
        })
      );

      // Should return 200 with error message
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('An account with this email already exists');
    });
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      // Create a test user
      await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: await hashPassword('password123'),
        }
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      const response = await app.handle(
        new Request('http://localhost:3000/login', {
          method: 'POST',
          body: formData,
        })
      );

      // Should redirect to dashboard
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/dashboard');

      // Should set auth cookie
      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toContain('auth=');
      expect(setCookie).toContain('HttpOnly');
    });

    it('should show error for invalid credentials', async () => {
      const formData = new FormData();
      formData.append('email', 'nonexistent@example.com');
      formData.append('password', 'wrongpassword');

      const response = await app.handle(
        new Request('http://localhost:3000/login', {
          method: 'POST',
          body: formData,
        })
      );

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('Invalid email or password');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing dashboard without auth', async () => {
      const response = await app.handle(
        new Request('http://localhost:3000/dashboard')
      );

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/login');
    });

    it('should access dashboard with valid auth cookie', async () => {
      // Create a test user
      await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: await hashPassword('password123'),
        }
      });

      // Login to get auth cookie
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      const loginResponse = await app.handle(
        new Request('http://localhost:3000/login', {
          method: 'POST',
          body: formData,
        })
      );

      // Extract cookie from login response
      const setCookie = loginResponse.headers.get('set-cookie');
      const authCookie = setCookie?.split(';')[0] || '';

      // Access dashboard with auth cookie
      const dashboardResponse = await app.handle(
        new Request('http://localhost:3000/dashboard', {
          headers: {
            cookie: authCookie
          }
        })
      );

      expect(dashboardResponse.status).toBe(200);
      const html = await dashboardResponse.text();
      expect(html).toContain('Dashboard');
      expect(html).toContain('Test User');
    });
  });

  describe('Logout', () => {
    it('should clear auth cookie and redirect to home', async () => {
      const response = await app.handle(
        new Request('http://localhost:3000/logout', {
          method: 'POST'
        })
      );

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/');
      
      // Check that auth cookie is cleared
      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toContain('auth=;');
      expect(setCookie).toContain('Max-Age=0');
    });
  });
});