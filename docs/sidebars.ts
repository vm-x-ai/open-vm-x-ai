import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 * - create an ordered group of docs
 * - render a sidebar for each doc of that group
 * - provide next/previous navigation
 *
 * The sidebars can be generated from the filesystem, or explicitly defined here.
 *
 * Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'core-components',
    'architecture',
    'getting-started',
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/minikube',
        'deployment/aws-eks',
        'deployment/aws-ecs',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/workspaces-environments',
        'features/users-roles',
        'features/ai-connections',
        'features/ai-resources',
        'features/prioritization',
        'features/usage',
        'features/langchain',
      ],
    },
  ],
};

export default sidebars;
