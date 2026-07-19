import { clearSessionCookie } from '../../../lib/auth.js';

export const prerender = false;

export async function POST() {
  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': clearSessionCookie(),
      'Location': '/admin/login',
    },
  });
}
