// @ts-check

import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://www.lumaarte.com',
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [mdx()],
	security: { checkOrigin: false },
});
