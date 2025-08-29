# Docusaurus Formatting Guide

**Version:** Docusaurus 3.8.1

This is a quick reference for all visual formatting options available in our Docusaurus documentation.

## Admonitions (Callouts)

Highlight important information with colored blocks:

```markdown
:::note
This is a note
:::

:::tip
This is a helpful tip
:::

:::info
This is informational content
:::

:::caution
This is a caution/warning
:::

:::danger
This is a danger/error warning
:::
```

**Custom titles:**
```markdown
:::tip Pro Tip
Use this for advanced users
:::
```

## Code Blocks

**Basic code block:**
```markdown
```javascript
function hello() {
  console.log('Hello world');
}
```
```

**With title:**
```markdown
```js title="example.js"
const greeting = 'Hello world';
```
```

**With line highlighting:**
```markdown
```js {2,4-6}
function example() {
  // This line is highlighted
  const a = 1;
  // These lines are highlighted
  const b = 2;
  const c = 3;
}
```
```

## Tabs

Perfect for showing multiple implementation options:

```jsx
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="option1" label="Option 1" default>
    Content for option 1
  </TabItem>
  <TabItem value="option2" label="Option 2">
    Content for option 2
  </TabItem>
</Tabs>
```

## Collapsible Sections

Hide/show content with details blocks:

```markdown
<details>
<summary>Click to expand</summary>

Hidden content here. Can include:
- Lists
- Code blocks
- Any markdown content

</details>
```

## Text Highlighting

**Inline code:** Use `backticks` for inline code

**Bold:** **Bold text** with `**text**`

**Italic:** *Italic text* with `*text*`

**Custom highlighting with MDX:**
```jsx
export const Highlight = ({children, color}) => (
  <span style={{
    backgroundColor: color,
    borderRadius: '2px',
    color: '#fff',
    padding: '0.2rem',
  }}>
    {children}
  </span>
);

This is <Highlight color="#25c2a0">highlighted text</Highlight>.
```

## Lists

**Unordered lists:**
```markdown
- Item 1
- Item 2
  - Nested item
  - Another nested item
```

**Ordered lists:**
```markdown
1. First item
2. Second item
   1. Nested numbered item
   2. Another nested item
```

**Task lists:**
```markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task
```

## Tables

```markdown
| Feature | Status | Notes |
|---------|--------|-------|
| Login | ✅ Complete | Working |
| Dashboard | 🚧 In Progress | Almost done |
| Reports | ❌ Pending | Not started |
```

## Links and References

**Internal links:**
```markdown
[Link to another page](./other-page.md)
[Link with anchor](./page.md#section)
```

**External links:**
```markdown
[External link](https://example.com)
```

## Images

```markdown
![Alt text](./images/screenshot.png)
```

**With custom sizing:**
```jsx
<img src="./images/screenshot.png" alt="Description" width="500" />
```

## Quotes

```markdown
> This is a blockquote
> 
> It can span multiple lines
```

## Math (if enabled)

**Inline math:** `$x = y + 2$`

**Block math:**
```markdown
$$
E = mc^2
$$
```

## Custom Components

You can create and use React components:

```jsx
export const CustomBox = ({children, color = 'blue'}) => (
  <div style={{
    border: `2px solid ${color}`,
    borderRadius: '8px',
    padding: '1rem',
    margin: '1rem 0'
  }}>
    {children}
  </div>
);

<CustomBox color="green">
This is content in a custom box
</CustomBox>
```

## Frontmatter

Add metadata to pages:

```markdown
---
title: Page Title
sidebar_position: 1
description: Page description for SEO
keywords: [keyword1, keyword2]
---

# Page Content
```

## Pro Tips

- Use admonitions for important information that needs to stand out
- Tabs are great for showing different implementation approaches
- Details blocks help keep pages clean while providing optional detail
- Custom components can be reused across multiple pages
- Always add alt text to images for accessibility
