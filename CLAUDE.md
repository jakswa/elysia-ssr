# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

This is a modern TypeScript server-side rendering starter template that provides:
- Fast performance with Bun and Elysia
- JWT-based authentication with HTTP-only cookies
- Traditional SSR with Eta templates (no client-side JS frameworks)
- Type-safe database access with Prisma ORM
- Tailwind CSS for styling
- Security best practices built-in

## Architecture: Server-Side Rendered (SSR)

**IMPORTANT**: This is a traditional server-side rendered application:
- **Eta templates** for HTML generation
- **HTML forms** for ALL user interactions (NO JSON APIs for UI)
- **Tailwind CSS** for styling (NO client-side JavaScript frameworks)

### SSR Patterns
```typescript
// GET routes render HTML views directly
.get('/path', ({ view }) => {
  return view('template-name', { 
    // data passed to template
  });
})

// POST routes process forms and redirect or re-render
.post('/path', async ({ body, redirect, view }) => {
  // Process form data
  if (success) return redirect('/success-path');
  
  // Re-render with errors and preserve form values
  return view('template-name', { 
    error: 'Error message',
    fieldValue: body.fieldValue  // Preserve user input
  });
})
```

### Template Structure
```eta
<!-- Templates use layout() function -->
<% layout('../layouts/main', { title: 'Page Title' }) %>

<!-- Error display pattern -->
<% if (it.error) { %>
  <div class="error"><%= it.error %></div>
<% } %>

<!-- Forms preserve values on error -->
<input name="field" value="<%= it.field || '' %>">
```

**No WebSockets by default - this is a traditional SSR application.**

## Technology Stack

- **Backend**: Bun + Elysia + TypeScript
- **Templates**: Eta for server-side HTML rendering
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS (server-rendered classes)
- **Auth**: JWT tokens in HTTP-only cookies
- **Security**: Built-in security headers and best practices
- **Logging**: Pino for structured logging

## Key Patterns

### Authentication Context
```typescript
// Scoped derive shares user context with child controllers
export const authMiddleware = new Elysia({ name: 'authMiddleware' })
  .derive({ as: 'scoped' }, async ({ jwt, cookie }) => {
    return { user };
  });
```

### Form Validation
- Use `t.Object()` for typed body validation
- Return rendered views with errors, don't throw

### Testing
- Write tests in `test/` directory
- Use `.env.test` for test database configuration
- Auth tests: Extract cookie from login response
- Use `hashPassword()` utility in tests for faster performance

## Database Schema

- `User`: Basic user accounts with authentication
  - `id`: UUID primary key
  - `name`: Display name
  - `email`: Unique email address
  - `password`: Hashed password
  - `createdAt`/`updatedAt`: Timestamps

Extend the schema in `prisma/schema.prisma` for your application needs.

## Commands

```bash
# Development
bun run dev              # Start dev server + tailwindcss watcher
bun run css:build        # Build Tailwind CSS

# Database
bun run db:migrate       # Run database migrations
bun run db:reset         # Reset database
bun run db:generate      # Generate Prisma client

# Production
bun run build            # Build for production
bun run start            # Start production server

# Code Quality
bun run typecheck        # Type check with TypeScript
bun run lint             # Lint with Biome
bun run format           # Format with Biome
```

## Authentication Flow

1. **Registration**: User submits form at `/register`
   - Name, email, and password required
   - Password hashed with bcrypt
   - User created in database
   - Automatic login after registration

2. **Login**: User submits credentials at `/login`
   - Email and password validated
   - JWT token created and stored in HTTP-only cookie
   - Redirects to dashboard

3. **Protected Routes**: Middleware checks JWT
   - Valid token: User context available in routes
   - Invalid/missing token: Redirect to login

4. **Logout**: Clears JWT cookie

## Important Notes

- Forms submit to same URL pattern (GET renders, POST processes)
- All user-facing responses are HTML (use redirects or view renders)
- No client-side JavaScript by default - pure SSR approach
- Hidden files: Use `ls` command to see dotfiles
- Environment-specific configs: Use appropriate `.env` files

## Common Gotchas

### Error Handling in SSR
- For 404s in POST routes: `set.status = 404` before returning view
- Variables in try/catch: Declare outside try block if needed in catch
- Form validation errors: Re-render view with error messages

### Performance
- bcrypt with 12 rounds = ~500ms per hash (production)
- Use `hashPassword()` utility in tests (1 round for speed)
- Tailwind CSS: Built during development, pre-built for production

### CSS Cache Busting
- Development: Uses timestamps for fresh CSS
- Production: Use BUILD_VERSION env var (e.g., git hash)
