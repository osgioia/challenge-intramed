import request from 'supertest';

import { ADMIN_EMAIL, ADMIN_PASSWORD, APP_URL } from '../utils/constants';

export interface AuthSession {
  token: string;
  userId: number | string;
}

/**
 * Logs in the seeded administrator account.
 */
export async function loginAsAdmin(): Promise<AuthSession> {
  const response = await request(APP_URL)
    .post('/api/v1/auth/email/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  if (response.status !== 200) {
    throw new Error(
      `Admin login failed: HTTP ${response.status} ${JSON.stringify(response.body)}`,
    );
  }

  return {
    token: response.body.token,
    userId: response.body.user.id,
  };
}

/**
 * Registers a brand new regular user (unique email) and returns its session.
 */
export async function registerAndLoginAsUser(
  label: string,
): Promise<AuthSession> {
  const email = `${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
  const password = 'secret';

  const registerResponse = await request(APP_URL)
    .post('/api/v1/auth/email/register')
    .send({
      email,
      password,
      firstName: 'Movies',
      lastName: 'E2E',
    });

  if (registerResponse.status < 200 || registerResponse.status >= 300) {
    throw new Error(
      `User registration failed: HTTP ${registerResponse.status} ${JSON.stringify(registerResponse.body)}`,
    );
  }

  const loginResponse = await request(APP_URL)
    .post('/api/v1/auth/email/login')
    .send({ email, password });

  if (loginResponse.status !== 200) {
    throw new Error(
      `User login failed: HTTP ${loginResponse.status} ${JSON.stringify(loginResponse.body)}`,
    );
  }

  return {
    token: loginResponse.body.token,
    userId: loginResponse.body.user.id,
  };
}
