/**
 * Configuración de Keycloak para la validación de access tokens.
 *
 * Responsabilidad:
 * - Leer la configuración desde variables de entorno (reutilizando la
 *   estrategia centralizada de shared/config/config.ts).
 * - Validar que las variables obligatorias existan.
 * - Construir el endpoint JWKS a partir de la URL y el realm, sin duplicar
 *   valores.
 *
 * No crea resolutores ni valida tokens.
 */

import { config } from './config';

export interface KeycloakConfig {
  issuer: string;
  audience: string;
  jwksUri: URL;
}

export class KeycloakConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeycloakConfigError';
  }
}

function requireEnv(value: string | undefined, name: string): string {
  if (value === undefined || value.trim() === '') {
    throw new KeycloakConfigError(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function loadKeycloakConfig(): KeycloakConfig {
  const url = withoutTrailingSlash(requireEnv(config.keycloak.url, 'KEYCLOAK_URL'));
  const realm = requireEnv(config.keycloak.realm, 'KEYCLOAK_REALM');
  const issuer = withoutTrailingSlash(requireEnv(config.keycloak.issuer, 'KEYCLOAK_ISSUER'));
  const audience = requireEnv(config.keycloak.audience, 'KEYCLOAK_AUDIENCE');

  const jwksUri = new URL(`${url}/realms/${realm}/protocol/openid-connect/certs`);

  return {
    issuer,
    audience,
    jwksUri,
  };
}
