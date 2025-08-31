import { Request, Response, NextFunction } from 'express';

export class HTTPError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    // This is important for inheritance.
    Object.setPrototypeOf(this, HTTPError.prototype);
  }
}

export const errorHandler = (
  err: Error | HTTPError,
  _: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof HTTPError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  res.status(statusCode).json({ error: message });
};