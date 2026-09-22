import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app/app';

const app = createApp();

describe('GET /health', () => {
  it('returns status UP for the service', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'UP',
      service: 'nutria-backend-node',
    });
  });
});