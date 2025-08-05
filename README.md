# Elysia SSR Starter

A modern TypeScript server-side rendering starter template with Elysia, Eta templates, JWT authentication, and Prisma ORM.

## Features

- 🚀 **Fast & Type-Safe** - Built with Bun and Elysia for blazing fast performance
- 🔐 **Secure Authentication** - JWT-based auth with HTTP-only cookies
- 📄 **Server-Side Rendering** - Traditional SSR with Eta templates
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🗄️ **Prisma ORM** - Type-safe database access
- 📝 **Form-Based** - Progressive enhancement friendly, no client-side JS required
- 🛡️ **Security Headers** - Built-in security best practices
- 📊 **Logging** - Structured logging with Pino

## Quick Start

```bash
# Create a new project
bun create github.com/jakswa/elysia-ssr test-app
cd test-app

# load the DB schema (edit DATABASE_URL in .env if needed)
bun run db:push

# Start the development server + tailwindcss watcher
bun run dev

# Or with a process manager (optional, pretty colors)
# Install: gem install foreman
# foreman start -f Procfile.dev
# Or: brew install overmind && overmind start -f Procfile.dev
# Or: cargo install ultraman && ultraman start -f Procfile.dev
```

## Project Structure

```
src/
├── controllers/     # Route handlers
├── middleware/      # Express-style middleware
├── utils/          # Utility functions
├── views/          # Eta templates
│   ├── layouts/    # Layout templates
│   └── partials/   # Reusable components
├── styles/         # CSS files
├── app.ts          # App configuration
└── index.ts        # Entry point
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/myapp"

# Authentication
JWT_SECRET="your-secret-key-here"

# Server
PORT=3000
NODE_ENV=development
```

## Available Scripts

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

1. User registers with name, email, and password
2. Password is hashed with bcrypt
3. JWT token is created and stored in HTTP-only cookie
4. Protected routes check for valid JWT token
5. User context is available in all routes via middleware

## Adding New Routes

1. Create a new controller in `src/controllers/`:

```typescript
import { Elysia } from 'elysia';
import { guard } from '../middleware/auth';

export const myController = new Elysia()
  .use(guard) // Add auth guard if needed
  .get('/my-route', ({ view, user }) => {
    return view('layouts/main', {
      title: 'My Page',
      user,
      body: view('my-template', { user }),
    });
  });
```

2. Add the controller to `app.ts`:

```typescript
import { myController } from './controllers/my-controller';

export const app = new Elysia()
  // ... other middleware
  .use(myController);
```

3. Create your template in `src/views/my-template.eta`

## Database Schema

Extend the Prisma schema in `prisma/schema.prisma`:

```prisma
model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Then run:
```bash
bun run db:migrate
```

## CSS Cache Busting

The template includes automatic cache busting for CSS:
- **Development**: Uses timestamps to ensure fresh CSS on every page load
- **Production**: Can use BUILD_VERSION env var (e.g., git hash) for versioned deployments

```bash
# Production build with version
docker build --build-arg BUILD_VERSION=$(git rev-parse --short HEAD) -t my-app .
```

## Deployment

### Docker

Build and run with Docker:

```bash
# Build the image
docker build -t my-app .

# Run the container
docker run -p 3000:3000 --env-file .env my-app
```

### Fly.io

Deploy to Fly.io:

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app (first time)
fly launch

# Deploy updates
fly deploy
```

### Traditional Deployment

1. Build the application:
```bash
bun run build
```

2. Set production environment variables

3. Run the production server:
```bash
bun run start
```

## Security Considerations

- Always use HTTPS in production
- Keep dependencies updated
- Use strong JWT secrets
- Enable CORS if needed
- Configure rate limiting for production
- Never commit `.env` files

## License

MIT
