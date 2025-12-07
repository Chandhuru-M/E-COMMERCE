import type { Request, Response } from 'express';

export class HttpError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export const errorHandler = (err: Error | HttpError, _req: Request, res: Response) => {
  const status = err instanceof HttpError ? err.status : 500;
  res.status(status).json({
    error: {
      message: err.message || 'Unexpected error occurred'
    }
  });
};
