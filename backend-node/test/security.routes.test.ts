import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app/app';

vi.mock('dotenv', () => ({
  default: {
    config: () => undefined,
  },
}));

const app = createApp();

describe('security routes authentication', () => {
  it('keeps /health public', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'UP',
      service: 'nutria-backend-node',
    });
  });

  it('responds 401 on POST /api/security/access without a token', async () => {
    const response = await request(app).post('/api/security/access').send({});

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Missing or invalid Authorization header');
  });

  it('responds 401 on POST /api/security/access with a non-Bearer header', async () => {
    const response = await request(app)
      .post('/api/security/access')
      .set('Authorization', 'Basic dXNlcjpwYXNz')
      .send({});

    expect(response.status).toBe(401);
  });
});
