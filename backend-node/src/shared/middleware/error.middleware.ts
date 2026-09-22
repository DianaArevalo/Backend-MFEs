import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'ERROR',
      message: err.message,
    });
    return;
  }

  console.error(err);

  res.status(500).json({
    status: 'ERROR',
    message: 'Internal Server Error',
  });
}