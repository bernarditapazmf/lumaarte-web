// @ts-check

import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://www.lumaarte.com',
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [mdx(), sitemap()],
	security: { checkOrigin: false },
});
