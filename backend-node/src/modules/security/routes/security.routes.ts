import { Router } from 'express';
import { DefaultOracleClient } from '../../../infrastructure/database/oracle/oracle.client';
import { asyncHandler } from '../../../shared/middleware/async-handler.middleware';
import { AccessController } from '../controllers/access-create.controller';
import { AccessCreateRepository } from '../repositories/access/access-create.repository';
import { AccessCreateService } from '../services/access-create.service';

export function createSecurityRouter(): Router {
  const router = Router();

  const oracleClient = new DefaultOracleClient();
  const accessCreateRepository = new AccessCreateRepository(oracleClient);
  const accessCreateService = new AccessCreateService(accessCreateRepository);
  const accessController = new AccessController(accessCreateService);

  router.post(
    '/access',
    asyncHandler((req, res) => accessController.createAccess(req, res)),
  );

  return router;
}