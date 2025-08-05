import pino from 'pino';

// Create a no-op logger for test environments
const createNoOpLogger = () => ({
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  trace: () => {},
  fatal: () => {},
  child: () => createNoOpLogger(),
});

// Create a Pino logger instance with appropriate configuration
export const logger =
  process.env.NODE_ENV === 'test'
    ? createNoOpLogger()
    : pino({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'HH:MM:ss Z',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        serializers: {
          error: pino.stdSerializers.err,
          request: pino.stdSerializers.req,
          response: pino.stdSerializers.res,
        },
      });

// Create child loggers for different modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

// Helper function to log errors with context
export const logError = (error: Error, context?: Record<string, unknown>) => {
  if (process.env.NODE_ENV === 'test') return;
  logger.error(
    {
      error,
      ...context,
    },
    'Error occurred'
  );
};

// Helper function to log user actions
export const logUserAction = (
  userId: string,
  action: string,
  details?: Record<string, unknown>
) => {
  if (process.env.NODE_ENV === 'test') return;
  logger.info(
    {
      userId,
      action,
      ...details,
    },
    `User action: ${action}`
  );
};