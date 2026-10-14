/**
 * Middleware de autenticación JWT para Keycloak.
 *
 * Responsabilidad:
 * - Exigir el encabezado `Authorization: Bearer <token>`.
 * - Validar firma, issuer, audience, expiración y `sub` del access token
 *   usando el JWKS del realm configurado.
 * - Adjuntar una identidad mínima (`AuthenticatedUser`) a la request una vez
 *   validado el token.
 *
 * Fuera de alcance: roles, permisos, consultas a Oracle y autorización de
 * negocio (responsabilidad de PKG_SEGURIDAD).
 */

import { NextFunction, Request, RequestHandler, Response } from "express";
import { createRemoteJWKSet, jwtVerify, RemoteJWKSet } from "jose";
import { AppError } from "../errors/app-error";
import { KeycloakConfig, loadKeycloakConfig } from "../config/keycloak.config";

const AUTH_HEADER_SCHEME = "bearer";

/**
 * Algoritmos aceptados. Debe reflejar la configuración real de firma del realm
 * de Keycloak (por defecto `RS256`). Si el realm usa otro algoritmo de firma
 * (p. ej. `PS256` o `ES256`), actualizar esta lista.
 */
const ALLOWED_ALGORITHMS: string[] = ["RS256"];

export interface AuthenticatedUser {
  keycloakUserId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

let keycloakConfig: KeycloakConfig | undefined;
let remoteJwkSet: RemoteJWKSet | undefined;

function getKeycloakConfig(): KeycloakConfig {
  if (keycloakConfig === undefined) {
    keycloakConfig = loadKeycloakConfig();
  }
  return keycloakConfig;
}

function getRemoteJwkSet(): RemoteJWKSet {
  if (remoteJwkSet === undefined) {
    remoteJwkSet = createRemoteJWKSet(getKeycloakConfig().jwksUri);
  }
  return remoteJwkSet;
}

function extractBearerToken(header: string | undefined): string | null {
  if (header === undefined) {
    return null;
  }

  const [scheme, token, ...rest] = header.split(" ");
  if (
    rest.length > 0 ||
    scheme?.toLowerCase() !== AUTH_HEADER_SCHEME ||
    !token
  ) {
    return null;
  }

  return token;
}

function isTokenValidationError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const code = (error as { code?: unknown }).code;
  if (typeof code !== "string") {
    return false;
  }

  return (
    code.startsWith("ERR_JWT_") ||
    code.startsWith("ERR_JWS_") ||
    code === "ERR_JOSE_ALG_NOT_ALLOWED"
  );
}

function respondUnauthorized(res: Response, message: string): void {
  res.status(401).json({
    status: "ERROR",
    message,
  });
}

export const authenticateToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = extractBearerToken(req.headers.authorization);
  if (token === null) {
    respondUnauthorized(res, "Missing or invalid Authorization header");
    return;
  }

  let jwks: RemoteJWKSet;
  try {
    jwks = getRemoteJwkSet();
  } catch (error) {
    console.error("Keycloak configuration error", error);
    next(new AppError("Authentication service unavailable", 503));
    return;
  }

  const { issuer, audience } = getKeycloakConfig();

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience,
      algorithms: ALLOWED_ALGORITHMS,
    });

    if (typeof payload.sub !== "string" || payload.sub.trim() === "") {
      respondUnauthorized(res, "Invalid or expired token");
      return;
    }

    req.user = { keycloakUserId: payload.sub };
    next();
  } catch (error) {
    if (isTokenValidationError(error)) {
      respondUnauthorized(res, "Invalid or expired token");
      return;
    }

    console.error("Failed to retrieve or use the Keycloak JWKS", error);
    next(new AppError("Authentication service unavailable", 503));
  }
};
