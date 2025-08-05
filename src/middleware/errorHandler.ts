import { Elysia } from 'elysia';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code?: string,
    public isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export const errorHandler = new Elysia().onError(
  ({ code, error, set, request }) => {
    const requestId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const errorContext = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      timestamp,
    };

    let statusCode = 500;
    let message = 'Internal Server Error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (error instanceof AppError) {
      statusCode = error.statusCode;
      message = error.message;
      errorCode = error.code || 'APP_ERROR';

      if (error.isOperational) {
        logger.warn(
          {
            ...errorContext,
            error: {
              name: error.name,
              message: error.message,
              code: error.code,
              statusCode: error.statusCode,
            },
          },
          `Operational error: ${error.message}`
        );
      } else {
        logger.error(
          {
            ...errorContext,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          },
          `Unexpected error: ${error.message}`
        );
      }
    } else if (code === 'NOT_FOUND') {
      statusCode = 404;
      message = 'Page not found';
      errorCode = 'NOT_FOUND';

      logger.info(
        {
          ...errorContext,
          statusCode,
        },
        'Page not found'
      );
    } else if (code === 'VALIDATION') {
      statusCode = 400;
      message = 'Invalid request data';
      errorCode = 'VALIDATION_ERROR';

      logger.warn(
        {
          ...errorContext,
          error: {
            name: error.name,
            message: error.message,
          },
          statusCode,
        },
        'Validation error'
      );
    } else {
      logger.error(
        {
          ...errorContext,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        },
        `Unexpected error: ${error.message}`
      );
    }

    set.status = statusCode;

    const acceptHeader = request.headers.get('accept') || '';

    if (acceptHeader.includes('application/json')) {
      return {
        error: {
          code: errorCode,
          message,
          requestId,
          timestamp,
          ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error,
          }),
        },
      };
    }

    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error ${statusCode}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
          <h1 class="text-4xl font-bold text-red-600 mb-4">${statusCode}</h1>
          <h2 class="text-2xl font-semibold mb-4">${statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong'}</h2>
          <p class="text-gray-600 mb-6">${message}</p>
          <div class="space-y-2">
            <a href="/" class="inline-block bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition-colors">
              Go Home
            </a>
            <button onclick="history.back()" class="inline-block bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 transition-colors ml-2">
              Go Back
            </button>
          </div>
          ${
            process.env.NODE_ENV === 'development'
              ? `
            <details class="mt-6 text-left">
              <summary class="cursor-pointer text-sm text-gray-500">Technical Details</summary>
              <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">${error.stack || error.message}</pre>
            </details>
          `
              : ''
          }
        </div>
      </body>
      </html>
    `;

    return new Response(errorHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }
);