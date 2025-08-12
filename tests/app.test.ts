import { describe, expect, it } from 'bun:test';
import { app } from '../src/app';

describe('Landing Page', () => {
  it('should return 200 and render the homepage', async () => {
    const response = await app.handle(
      new Request('http://localhost:3000/')
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    
    const html = await response.text();
    
    // Check for key elements that should be on the landing page
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    
    // Check for navigation/header elements
    expect(html).toContain('Login');
    expect(html).toContain('Register');
    
    // Check for some content from the home view
    expect(html).toContain('Welcome');
  });

  it('should have proper security headers', async () => {
    const response = await app.handle(
      new Request('http://localhost:3000/')
    );

    // Check security headers set by the security middleware
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-xss-protection')).toBe('1; mode=block');
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  });

  it('should handle 404 for non-existent routes', async () => {
    const response = await app.handle(
      new Request('http://localhost:3000/this-route-does-not-exist')
    );

    expect(response.status).toBe(404);
  });
});