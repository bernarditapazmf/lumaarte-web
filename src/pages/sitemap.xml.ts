import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { initDb } from '../lib/db.js';

export const prerender = false;

const SITE = 'https://www.lumaarte.com';

const STATIC = [
  { url: '/',                      priority: '1.0', changefreq: 'weekly'  },
  { url: '/sobremi',               priority: '0.7', changefreq: 'monthly' },
  { url: '/blog',                  priority: '0.8', changefreq: 'weekly'  },
  { url: '/regalos-de-boda',       priority: '0.8', changefreq: 'monthly' },
  { url: '/regalos-corporativos',  priority: '0.8', changefreq: 'monthly' },
];

export const GET: APIRoute = async () => {
  const urls: { url: string; priority: string; changefreq: string; lastmod?: string }[] = [...STATIC];

  // Posts MDX desde archivos
  try {
    const filePosts = await getCollection('blog');
    for (const p of filePosts) {
      urls.push({
        url: `/blog/${p.id}`,
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: p.data.pubDate ? new Date(p.data.pubDate).toISOString().split('T')[0] : undefined,
      });
    }
  } catch {}

  // Posts desde DB
  try {
    const db = await initDb();
    const { rows } = await db.execute(
      "SELECT slug, updated_at, created_at FROM blog_posts WHERE estado='publicado'"
    );
    for (const r of rows) {
      const date = (r.updated_at || r.created_at) as string | null;
      urls.push({
        url: `/blog/${r.slug}`,
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: date ? date.split('T')[0] : undefined,
      });
    }
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ url, priority, changefreq, lastmod }) => `  <url>
    <loc>${SITE}${url}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
