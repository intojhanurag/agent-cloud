import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Agent Cloud',
      customCss: ['./src/styles/custom.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/intojhanurag/agent-cloud' },
      ],
      sidebar: [
        { label: 'Guides', autogenerate: { directory: 'guides' } },
        { label: 'Cloud Providers', autogenerate: { directory: 'providers' } },
        { label: 'Command Reference', autogenerate: { directory: 'reference' } },
        { label: 'Advanced', autogenerate: { directory: 'advanced' } },
        { label: 'Contributing', link: '/contributing/' },
      ],
    }),
  ],
});
