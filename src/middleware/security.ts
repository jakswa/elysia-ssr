import { Elysia } from 'elysia';

// Security headers middleware
export const securityHeaders = new Elysia({
  name: 'securityHeaders',
}).onAfterHandle({ as: 'global' }, ({ response, set }) => {
  // Add security headers
  set.headers['X-Content-Type-Options'] = 'nosniff';
  set.headers['X-Frame-Options'] = 'DENY';
  set.headers['X-XSS-Protection'] = '1; mode=block';
  set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

  // Only add HSTS in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    set.headers['Strict-Transport-Security'] =
      'max-age=31536000; includeSubDomains';
  }

  return response;
});