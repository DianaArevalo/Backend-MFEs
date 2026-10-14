/**
 * Middleware de autorización reutilizable por permiso.
 *
 * Responsabilidad:
 * - Exigir que la request tenga una identidad autenticada (`req.user`).
 * - Resolver el ACCESO asociado al `keycloakUserId` en Oracle.
 * - Verificar que el ACCESO esté habilitado y posea el permiso requerido.
 *
 * Debe ejecutarse siempre después de `authenticateToken`. No valida el JWT:
 * la autenticación es responsabilidad de `auth.middleware.ts`.
 *
 * Códigos de respuesta:
 * - 401: no hay identidad autenticada en la request.
 * - 403: autenticado, pero sin acceso / acceso deshabilitado / sin permiso.
 * - 503: Oracle (dependencia de autorización) no está disponible.
 */

import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from '../../../shared/errors/app-error';
import {
  OraclePoolNotInitializedError,
  isOracleError,
} from '../../../infrastructure/database/oracle/oracle.errors';
import { AccessAuthorizationService } from '../services/access-authorization.service';

function respondUnauthorized(res: Response, message: string): void {
  res.status(401).json({ status: 'ERROR', message });
}

function respondForbidden(res: Response, message: string): void {
  res.status(403).json({ status: 'ERROR', message });
}

export function requirePermission(
  permission: string,
  authorizationService: AccessAuthorizationService,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const keycloakUserId = req.user?.keycloakUserId;

    if (keycloakUserId === undefined || keycloakUserId.trim() === '') {
      respondUnauthorized(res, 'Authentication required');
      return;
    }

    try {
      const resolution = await authorizationService.resolveAccess(keycloakUserId);

      if (resolution.status === 'NOT_LINKED') {
        respondForbidden(res, 'Authenticated user has no access in NUTRIA');
        return;
      }

      if (resolution.status === 'DISABLED') {
        respondForbidden(res, 'Access is disabled');
        return;
      }

      const authorized = await authorizationService.hasPermission(
        resolution.access,
        permission,
      );

      if (!authorized) {
        respondForbidden(res, 'Insufficient permissions');
        return;
      }

      next();
    } catch (error) {
      if (isOracleError(error) || error instanceof OraclePoolNotInitializedError) {
        console.error('Failed to resolve access authorization', error);
        next(new AppError('Authorization service unavailable', 503));
        return;
      }

      next(error);
    }
  };
}
