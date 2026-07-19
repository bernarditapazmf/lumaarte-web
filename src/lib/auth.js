import crypto from 'crypto';

function sessionToken() {
  const pwd = import.meta.env.CMS_PASSWORD ?? 'luma';
  return crypto.createHmac('sha256', pwd).update('luma-admin').digest('hex');
}

export function isAuthenticated(request) {
  const cookies = request.headers.get('cookie') ?? '';
  const match = cookies.match(/luma_admin=([^;]+)/);
  return match?.[1] === sessionToken();
}

export function makeSessionCookie() {
  return `luma_admin=${sessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}

export function clearSessionCookie() {
  return `luma_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
