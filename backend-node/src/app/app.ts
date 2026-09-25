import express from 'express';
import { createSecurityRouter } from '../modules/security/routes/security.routes';
import { errorHandler } from '../shared/middleware/error.middleware';
import { notFoundHandler } from '../shared/middleware/not-found.middleware';

export function createApp(): express.Express {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'UP',
      service: 'nutria-backend-node',
    });
  });

  app.use('/api/security', createSecurityRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}