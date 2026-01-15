const request = require('supertest');
const express = require('express');
const errorMiddleware = require('../src/middlewares/error.middleware');

describe('Error Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
  });

  it('should handle errors with custom status code and message', async () => {
    app.get('/test', (req, res, next) => {
      const error = new Error('Custom error message');
      error.statusCode = 400;
      next(error);
    });
    app.use(errorMiddleware);

    const response = await request(app).get('/test');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      statusCode: 400,
      message: 'Custom error message',
    });
  });

  it('should default to 500 status code when not provided', async () => {
    app.get('/test', (req, res, next) => {
      const error = new Error('Server error');
      next(error);
    });
    app.use(errorMiddleware);

    const response = await request(app).get('/test');

    expect(response.status).toBe(500);
    expect(response.body.statusCode).toBe(500);
    expect(response.body.message).toBe('Server error');
  });

  it('should default to "Internal Server Error" message when not provided', async () => {
    app.get('/test', (req, res, next) => {
      const error = new Error();
      error.message = '';
      next(error);
    });
    app.use(errorMiddleware);

    const response = await request(app).get('/test');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal Server Error');
  });

  it('should include stack trace in development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    app.get('/test', (req, res, next) => {
      const error = new Error('Dev error');
      next(error);
    });
    app.use(errorMiddleware);

    const response = await request(app).get('/test');

    expect(response.body).toHaveProperty('stack');
    expect(response.body.stack).toBeTruthy();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not include stack trace in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    app.get('/test', (req, res, next) => {
      const error = new Error('Prod error');
      next(error);
    });
    app.use(errorMiddleware);

    const response = await request(app).get('/test');

    expect(response.body).not.toHaveProperty('stack');

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle errors with different status codes', async () => {
    const testCases = [
      { statusCode: 404, message: 'Not Found' },
      { statusCode: 403, message: 'Forbidden' },
      { statusCode: 401, message: 'Unauthorized' },
    ];

    for (const testCase of testCases) {
      const testApp = express();
      testApp.get('/test', (req, res, next) => {
        const error = new Error(testCase.message);
        error.statusCode = testCase.statusCode;
        next(error);
      });
      testApp.use(errorMiddleware);

      const response = await request(testApp).get('/test');

      expect(response.status).toBe(testCase.statusCode);
      expect(response.body.message).toBe(testCase.message);
    }
  });
});
