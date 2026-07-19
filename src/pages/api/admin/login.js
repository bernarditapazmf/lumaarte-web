import { makeSessionCookie } from '../../../lib/auth.js';

export const prerender = false;

export async function POST({ request, redirect }) {
  const form = await request.formData();
  const password = form.get('password');
  const expected = import.meta.env.CMS_PASSWORD ?? 'luma';

  if (password !== expected) {
    return redirect('/admin/login?error=1');
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': makeSessionCookie(),
      'Location': '/admin',
    },
  });
}
