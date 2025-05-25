# NeuraLabs Documentation

This documentation is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Prerequisites

- Node.js 18.0 or above
- npm or yarn package manager

## Quick Start

### 1. Install Docusaurus

```bash
cd documentation
npx create-docusaurus@latest . classic --typescript
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Local Development

Start a local development server:

```bash
npm run start
# or
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### 4. Build

Build the documentation for production:

```bash
npm run build
# or
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### 5. Deployment

#### Deploy to GitHub Pages

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

#### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

#### Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `build` folder to Netlify via their UI or CLI.

## Documentation Structure

```
documentation/
├── docs/                     # Documentation pages
│   ├── intro.mdx            # Getting started guide
│   ├── theoretical/         # Theoretical concepts
│   │   ├── _category_.json  # Category configuration
│   │   ├── overview.mdx     # Platform overview
│   │   ├── architecture.mdx # System architecture
│   │   └── ...
│   └── implementation/      # Implementation guides
│       ├── _category_.json
│       ├── 01-database/
│       ├── 02-frontend/
│       ├── 03-backend/
│       ├── 04-hpc-execution/
│       ├── 05-smart-contracts/
│       └── 06-prover-service/
├── blog/                    # Blog posts (optional)
├── src/                     # Custom React components/pages
│   ├── components/
│   ├── pages/
│   └── css/
├── static/                  # Static assets (images, etc.)
├── docusaurus.config.js     # Docusaurus configuration
├── sidebars.js             # Sidebar configuration
└── package.json
```

## Writing Documentation

### Creating a New Doc

1. Create a new MDX file in the appropriate directory under `docs/`
2. Add front matter at the top:

```mdx
---
id: unique-doc-id
title: Document Title
sidebar_label: Sidebar Label
sidebar_position: 1
---

import ComponentName from '@site/src/components/ComponentName';

# Document Title

Your content here...

<ComponentName />
```

### Adding Images

Place images in `static/img/` and reference them:

```markdown
![Alt text](/img/your-image.png)
```

### Creating Categories

Create a `_category_.json` file in any folder to configure the category:

```json
{
  "label": "Category Name",
  "position": 1,
  "link": {
    "type": "generated-index",
    "description": "Category description"
  }
}
```

## Configuration

### docusaurus.config.js

Key configurations to update:

```javascript
module.exports = {
  title: 'NeuraLabs Documentation',
  tagline: 'Decentralized AI Workflow Platform',
  url: 'https://your-documentation-url.com',
  baseUrl: '/',
  projectName: 'neuralabs-docs',
  organizationName: 'neuralabs',
  
  themeConfig: {
    navbar: {
      title: 'NeuraLabs',
      logo: {
        alt: 'NeuraLabs Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/your-repo',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
  },
};
```

### sidebars.js

Configure the sidebar structure:

```javascript
module.exports = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Theoretical Concepts',
      items: ['theoretical/overview', 'theoretical/architecture'],
    },
    {
      type: 'category',
      label: 'Implementation',
      items: [
        'implementation/database/setup',
        'implementation/frontend/getting-started',
        // ... more items
      ],
    },
  ],
};
```

## MDX Features

### Using React Components

```mdx
import { Highlight, CodeBlock } from '@site/src/components';

<Highlight color="#25c2a0">This is highlighted text</Highlight>

<CodeBlock language="typescript">
{`const example = "Hello World";`}
</CodeBlock>
```

### Interactive Examples

```mdx
import LiveCodeBlock from '@site/src/components/LiveCodeBlock';

<LiveCodeBlock>
{`function Example() {
  return <div>Interactive code example</div>;
}`}
</LiveCodeBlock>
```

## Best Practices

1. **Consistent Structure**: Follow the established folder structure
2. **Clear Titles**: Use descriptive titles and sidebar labels
3. **Code Examples**: Include practical code examples
4. **Diagrams**: Use Mermaid for diagrams when possible
5. **Cross-linking**: Link between related documentation pages
6. **Versioning**: Use Docusaurus versioning for API documentation
7. **MDX Components**: Leverage React components for interactive documentation

## Troubleshooting

### Common Issues

1. **Build Errors**: Clear cache and rebuild
```bash
npm run clear
npm run build
```

2. **Missing Dependencies**: Reinstall node_modules
```bash
rm -rf node_modules
npm install
```

3. **Port Already in Use**: Change the port
```bash
npm run start -- --port 3001
```

## Additional Resources

- [Docusaurus Documentation](https://docusaurus.io/docs)
- [Markdown Guide](https://www.markdownguide.org/)
- [MDX Documentation](https://mdxjs.com/)