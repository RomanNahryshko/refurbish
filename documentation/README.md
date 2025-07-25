# ReMobile Refurbish Documentation Site

This is the documentation website for the ReMobile Refurbish ERP system, built using [Docusaurus](https://docusaurus.io/).

## 📚 Documentation Structure

```
documentation/
├── docs/                 # All documentation markdown files
│   ├── intro.md         # Example docs (to be replaced)
│   ├── tutorial-basics/ # Example tutorial (to be replaced)
│   └── tutorial-extras/ # Example tutorial (to be replaced)
├── src/                 # Custom React components and pages
├── static/              # Static assets (images, etc.)
└── docusaurus.config.ts # Site configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0 or above
- npm (comes with Node.js)

### Installation

From the project root:

```bash
cd documentation
npm install
```

### Local Development

From the project root:

```bash
npm run docs:dev
```

Or from the documentation directory:

```bash
npm start
```

This starts a local development server at `http://localhost:3001`. Most changes are reflected live without having to restart the server.

### Build

From the project root:

```bash
npm run docs:build
```

This generates static content into the `documentation/build` directory.

## 📝 Adding Documentation

1. Add your `.md` files to the `docs/` directory
2. Update `sidebars.ts` to include your new documents in the navigation
3. Optionally add front matter to control positioning:

```markdown
---
sidebar_position: 1
title: "Your Document Title"
---

# Your content here
```

## 🗂️ Current Documentation

Once migrated, the documentation will include:
- **PROJECT-DOCUMENTATION-MVP.md** - MVP scope and requirements
- **PROJECT-DOCUMENTATION-EXTENDED.md** - Future enhancements and considerations
- **DATABASE-DESIGN-PROCESS.md** - Database design methodology
- **PROJECT-IMPLEMENTATION-GUIDE.md** - Development guidelines

## 🎨 Customization

- **Theme**: Edit `src/css/custom.css` for styling
- **Config**: Modify `docusaurus.config.ts` for site settings
- **Navigation**: Update `sidebars.ts` for sidebar structure

## 🚀 Deployment

The documentation can be deployed to various static hosting services:
- Netlify
- Vercel
- GitHub Pages
- Any static file server

For deployment, use the built files in `documentation/build/` directory.
