import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  base: '/docs',
  integrations: [
    starlight({
      title: 'Agent Cloud',
      social: {
        github: 'https://github.com/intojhanurag/agent-cloud',
      },
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Introduction', slug: 'guides/introduction' },
            { label: 'Installation', slug: 'guides/installation' },
            { label: 'Quick Start', slug: 'guides/quickstart' },
            { label: 'Configuration', slug: 'guides/configuration' },
          ],
        },
        {
          label: 'Cloud Providers',
          items: [
            { label: 'AWS', slug: 'providers/aws' },
            { label: 'Google Cloud (GCP)', slug: 'providers/gcp' },
            { label: 'Azure', slug: 'providers/azure' },
          ],
        },
        {
          label: 'Command Reference',
          items: [
            { label: 'init', slug: 'reference/init' },
            { label: 'analyze', slug: 'reference/analyze' },
            { label: 'deploy', slug: 'reference/deploy' },
            { label: 'status', slug: 'reference/status' },
            { label: 'history', slug: 'reference/history' },
            { label: 'cleanup', slug: 'reference/cleanup' },
            { label: 'logs', slug: 'reference/logs' },
          ],
        },
        {
          label: 'Advanced',
          items: [
            { label: 'Architecture', slug: 'advanced/architecture' },
            { label: 'How Agents Work', slug: 'advanced/how-agents-work' },
            { label: 'Security', slug: 'advanced/security' },
            { label: 'Troubleshooting', slug: 'advanced/troubleshooting' },
          ],
        },
        {
          label: 'Contributing',
          slug: 'contributing',
        },
      ],
    }),
  ],
});
