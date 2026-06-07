// Force test database URL before importing prisma.
// Kept as a guard against you wiping out your non-test DB.
if (!process.env.DATABASE_URL?.includes('test')) {
  console.log(
    ":: forcing DATABASE_URL to a 'test' value, include 'test' to set it yourself"
  );
  process.env.DATABASE_URL =
    'postgresql://postgres:postgres@localhost:5432/elysia_ssr_test?schema=public';
} else {
  console.log(`:: DATABASE_URL=${process.env.DATABASE_URL}`);
}

import { beforeAll, afterAll } from 'bun:test';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';

afterAll(async () => {
  // Clean up database connections
  const { prisma } = await import('../src/utils/prisma');
  await prisma.$disconnect();
});
