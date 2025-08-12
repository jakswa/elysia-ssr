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

beforeAll(async () => {
  console.log('🔄 Setting up test environment...');

  try {
    // Load test environment variables
    const testEnvFile = await Bun.file('.env.test').text();
    const envLines = testEnvFile.split('\n');
    
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    }

    // Reset the database and run migrations
    console.log('🔄 Resetting test database...');
    execSync('bun run prisma migrate reset --force --skip-seed', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
    
    console.log('✅ Test database ready');
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
});

afterAll(async () => {
  // Clean up database connections
  const { prisma } = await import('../src/utils/prisma');
  await prisma.$disconnect();
});