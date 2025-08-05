import { logger } from './logger';

interface RequiredEnvVars {
  JWT_SECRET: string;
  DATABASE_URL: string;
}

interface OptionalEnvVars {
  NODE_ENV?: string;
  PORT?: string;
}

type EnvVars = RequiredEnvVars & OptionalEnvVars;

export function validateEnv(): EnvVars {
  const required: (keyof RequiredEnvVars)[] = ['JWT_SECRET', 'DATABASE_URL'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error({ missing }, 'Missing required environment variables');
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  const env: EnvVars = {
    JWT_SECRET: process.env.JWT_SECRET!,
    DATABASE_URL: process.env.DATABASE_URL!,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
  };

  logger.info(
    {
      nodeEnv: env.NODE_ENV,
    },
    'Environment validation successful'
  );

  return env;
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}