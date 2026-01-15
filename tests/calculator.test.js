const request = require('supertest');
const app = require('../src/app');

describe('Calculator API', () => {
  describe('POST /api/calculate', () => {
    it('should add two numbers', async () => {
      const response = await request(app).post('/api/calculate').send({
        num1: 5,
        num2: 3,
        operation: 'add',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        operation: 'add',
        num1: 5,
        num2: 3,
        result: 8,
      });
    });

    it('should subtract two numbers', async () => {
      const response = await request(app).post('/api/calculate').send({
        num1: 10,
        num2: 4,
        operation: 'subtract',
      });

      expect(response.status).toBe(200);
      expect(response.body.result).toBe(6);
    });

    it('should multiply two numbers', async () => {
      const response = await request(app).post('/api/calculate').send({
        num1: 6,
        num2: 7,
        operation: 'multiply',
      });

      expect(response.status).toBe(200);
      expect(response.body.result).toBe(42);
    });

    it('should divide two numbers', async () => {
      const response = await request(app).post('/api/calculate').send({
        num1: 20,
        num2: 4,
        operation: 'divide',
      });

      expect(response.status).toBe(200);
      expect(response.body.result).toBe(5);
    });

    it('should return error for division by zero', async () => {
      const response = await request(app).post('/api/calculate').send({
        num1: 10,
        num2: 0,
        operation: 'divide',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Cannot divide by zero');
    });

    it('should return error for invalid operation', async () => {
      const response = await request(app).post('/api/calculate').send({
        num1: 5,
        num2: 3,
        operation: 'power',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid operation');
    });

    it('should return error for missing parameters', async () => {
      const response = await request(app).post('/api/calculate').send({
        num1: 5,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Please provide');
    });

    it('should return error for invalid numbers', async () => {
      const response = await request(app).post('/api/calculate').send({
        num1: 'abc',
        num2: 5,
        operation: 'add',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('must be valid numbers');
    });

    it('should handle decimal numbers', async () => {
      const response = await request(app).post('/api/calculate').send({
        num1: 5.5,
        num2: 2.5,
        operation: 'add',
      });

      expect(response.status).toBe(200);
      expect(response.body.result).toBe(8);
    });

    it('should handle negative numbers', async () => {
      const response = await request(app).post('/api/calculate').send({
        num1: -5,
        num2: 3,
        operation: 'add',
      });

      expect(response.status).toBe(200);
      expect(response.body.result).toBe(-2);
    });
  });
});
