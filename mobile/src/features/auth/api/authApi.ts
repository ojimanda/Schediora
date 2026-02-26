import { apiRequest } from '../../../shared/services/api/client';

type AuthPayload = {
  email: string;
  password: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

type MeResponse = {
  id: string;
  email: string;
};

export function registerRequest(payload: AuthPayload) {
  return apiRequest<TokenResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export function loginRequest(payload: AuthPayload) {
  return apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export function refreshRequest(refreshToken: string) {
  return apiRequest<TokenResponse>('/auth/refresh', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
}

export function logoutRequest(refreshToken: string) {
  return apiRequest<{ message: string }>('/auth/logout', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
}

export function meRequest(accessToken: string) {
  return apiRequest<MeResponse>('/users/me', {
    method: 'GET',
    token: accessToken,
  });
}
