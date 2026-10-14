import { Router } from 'express';
import { DefaultOracleClient } from '../../../infrastructure/database/oracle/oracle.client';
import { asyncHandler } from '../../../shared/middleware/async-handler.middleware';
import { authenticateToken } from '../../../shared/middleware/auth.middleware';
import { AccessController } from '../controllers/access-create.controller';
import { requirePermission } from '../middleware/authorization.middleware';
import { DefaultAccessAuthorizationRepository } from '../repositories/access/access-authorization.repository';
import { AccessCreateRepository } from '../repositories/access/access-create.repository';
import { AccessAuthorizationService } from '../services/access-authorization.service';
import { AccessCreateService } from '../services/access-create.service';

export function createSecurityRouter(): Router {
  const router = Router();

  const oracleClient = new DefaultOracleClient();
  const accessCreateRepository = new AccessCreateRepository(oracleClient);
  const accessCreateService = new AccessCreateService(accessCreateRepository);
  const accessController = new AccessController(accessCreateService);

  const accessAuthorizationRepository = new DefaultAccessAuthorizationRepository(oracleClient);
  const accessAuthorizationService = new AccessAuthorizationService(accessAuthorizationRepository);

  router.post(
    '/access',
    authenticateToken,
    requirePermission('ACCESO_CREAR', accessAuthorizationService),
    asyncHandler((req, res) => accessController.createAccess(req, res)),
  );

  return router;
}
