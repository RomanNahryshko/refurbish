import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * TODO: Update these configuration items:
 * 1. url: Update to your actual documentation URL when deployed
 * 2. ✅ organizationName: Updated to vladimirterehoff
 * 3. ✅ editUrl: Updated to correct GitHub repo
 * 4. ✅ GitHub href: Updated all GitHub links
 * 5. Footer links: Update placeholder (#) links with actual URLs
 * 6. Create img/remobile-social-card.jpg for social media previews
 * 7. Replace img/logo.svg with your actual logo
 */

const config: Config = {
  title: 'ReMobile Refurbish Documentation',
  tagline: 'Internal ERP System for Phone Refurbishment Operations',
  favicon: 'img/favicon.ico',
  
  // Prevent search engine indexing
  noIndex: true,

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://remobile-refurbish-docs.vercel.app', // Documentation-specific URL
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'vladimirterehoff', // Your GitHub username
  projectName: 'remobile-refurbish', // Your repo name

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // This enables "Edit this page" links on each doc page
          editUrl:
            'https://github.com/vladimirterehoff/remobile-refurbish/tree/main/documentation/',
        },
        blog: false, // Disable the blog plugin
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/remobile-social-card.jpg', // Create this image later
    navbar: {
      title: 'ReMobile Refurbish',
      logo: {
        alt: 'ReMobile Refurbish Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mvpSidebar',
          position: 'left',
          label: 'Tech Docs - MVP',
        },
        {
          type: 'docSidebar',
          sidebarId: 'futureSidebar',
          position: 'left',
          label: 'Tech Docs - Future Scopes',
        },
        {
          type: 'docSidebar',
          sidebarId: 'devSidebar',
          position: 'left',
          label: 'For Developers',
        },
        {
          type: 'docSidebar',
          sidebarId: 'userManualSidebar',
          position: 'left',
          label: 'User Manual',
        },
        // Your GitHub repo
        {
          href: 'https://github.com/vladimirterehoff/remobile-refurbish',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'MVP Scope',
              to: '/docs/tech-docs-mvp/intro',
            },
            {
              label: 'For Developers',
              to: '/docs/for-developers/intro',
            },
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: 'About ReMobile',
              href: '#', // Update with actual company URL
            },
            {
              label: 'Project Status',
              href: '#', // Update with project management tool URL
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/vladimirterehoff/remobile-refurbish',
            },
            {
              label: 'API Reference',
              href: '#', // Update when API docs are ready
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ReMobile Refurbish. Internal Use Only.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
