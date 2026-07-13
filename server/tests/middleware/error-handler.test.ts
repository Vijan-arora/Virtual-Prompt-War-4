import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../src/lib/app-error.js';
import { errorHandler, notFoundHandler } from '../../src/middleware/error-handler.js';

describe('error-handler middleware', () => {
  describe('notFoundHandler', () => {
    it('should forward a 404 AppError to next()', () => {
      const req = { method: 'GET', path: '/foo' } as Request;
      const res = {} as Response;
      const next = vi.fn();

      notFoundHandler(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0]![0];
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(404);
      expect((err as AppError).message).toContain('No route matches GET /foo');
    });
  });

  describe('errorHandler', () => {
    it('should format AppError correctly and return the status code', () => {
      const err = AppError.badRequest('Invalid body data');
      const req = { method: 'POST', path: '/ask' } as Request;

      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
      const res = { status: statusMock } as unknown as Response;

      const next = vi.fn() as NextFunction;

      errorHandler(err, req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: { code: 'BAD_REQUEST', message: 'Invalid body data' },
      });
    });

    it('should map generic Error to 500 INTERNAL error and sanitize message', () => {
      const err = new Error('Database connection failed');
      const req = { method: 'GET', path: '/ops' } as Request;

      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
      const res = { status: statusMock } as unknown as Response;

      const next = vi.fn() as NextFunction;

      errorHandler(err, req, res, next);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: { code: 'INTERNAL', message: 'Something went wrong on our side. Please try again.' },
      });
    });

    it('should handle non-Error objects and format them as 500 INTERNAL', () => {
      const err = 'a plain string thrown';
      const req = { method: 'GET', path: '/ops' } as Request;

      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
      const res = { status: statusMock } as unknown as Response;

      const next = vi.fn() as NextFunction;

      errorHandler(err, req, res, next);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: { code: 'INTERNAL', message: 'Something went wrong on our side. Please try again.' },
      });
    });
  });
});
