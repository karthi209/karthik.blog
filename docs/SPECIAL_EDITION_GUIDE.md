# Special Edition Guide

## Overview

Special Edition posts allow you to create fully custom HTML/CSS experiences for exceptional content. This is perfect for interactive visualizations, unique typography themes, book-style layouts, or any custom experience that breaks the standard blog format.

**Quick Summary for LLMs:**
- Special editions use raw HTML/CSS stored in the database
- Content is rendered via `dangerouslySetInnerHTML` with DOMPurify sanitization
- `<style>` tags are automatically extracted and injected into document `<head>`
- Full-page mode hides all default UI (sidebar, footer, title, comments)
- No width restrictions in full-page mode - full viewport control
- Responsive design must be handled in custom CSS via media queries
- All HTML/CSS rules and examples are provided below

## How to Use

### 1. Enable Special Edition

1. Go to Admin Panel
2. Create or edit a Blog Post, Note, or Library Review
3. Check the **"Special Edition"** checkbox
4. The rich text editor will automatically switch to an HTML/CSS code editor

### 2. Write Your HTML/CSS

Write complete HTML with embedded CSS. The content is stored as-is in the database and rendered directly.

### 3. Upload Images

- Click the **"📷 Upload Image"** button in the code editor
- Images are uploaded to your server
- An `<img src="...">` tag is automatically inserted at your cursor position

## HTML/CSS Rules

### ✅ What to Include

- **`<style>` tags** - Place all CSS inside `<style>...</style>` at the top
- **Content structure** - Use semantic HTML: `<article>`, `<section>`, `<p>`, `<h1>`, `<h2>`, etc.
- **Inline styles** - `style="..."` attributes are allowed
- **Images** - Use `<img src="...">` tags (upload via the button)
- **JavaScript** - `<script>` tags work for interactive features

### ❌ What NOT to Include

- **`<!DOCTYPE html>`** - Not needed
- **`<html>`, `<head>`, `<body>` tags** - Content is rendered inside a container
- **`<meta>` tags** - Not needed
- **External font links in `<head>`** - Use `@import` inside `<style>` instead

## Format Structure

```html
<style>
  /* Your CSS here */
  @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English&display=swap');
  
  /* Target your article container */
  article.special-edition {
    background: #f4f1ea;
    color: #1f1d1a;
    font-family: "IM Fell English", serif;
    max-width: 720px;
    margin: 0 auto;
    padding: 3rem 2.5rem;
  }
  
  /* Style elements within your article */
  article.special-edition h1 {
    font-size: 2.4rem;
  }
  
  article.special-edition p {
    margin: 1.6rem 0;
  }
</style>

<article class="special-edition">
  <header>
    <h1>Your Title</h1>
  </header>
  
  <p>Your content here...</p>
  
  <img src="/uploads/your-image.jpg" alt="Description" />
</article>
```

### CSS Writing (No More Fighting!)

**Good News:** The system CSS is now completely isolated from your special edition styles. You can write clean, normal CSS without `!important` flags.

**How It Works:**
- System CSS uses `all: revert` for `article.special-edition` and its children
- This means your CSS has full control - no interference
- Write CSS as if you're building a standalone page

**Example - Clean CSS (No !important needed):**
```css
article.special-edition {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  font-family: "Your Font", serif;
}

article.special-edition .book {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem;
  background: #fff;
}

article.special-edition h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

article.special-edition p {
  margin: 1.6rem 0;
  line-height: 1.75;
}
```

**What You Get:**
- ✅ Full viewport control (100vw, 100vh)
- ✅ No parent container constraints
- ✅ Complete style isolation
- ✅ Normal CSS specificity rules apply
- ✅ No need for `!important` flags

## Best Practices

### CSS Targeting

- Target `body` in your CSS - it will apply to the special edition container
- Use CSS variables for colors:
  ```css
  :root {
    --paper: #f4f1ea;
    --ink: #1f1d1a;
  }
  ```

### Fonts

- Use `@import` for Google Fonts inside `<style>`:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=YourFont&display=swap');
  ```

### Layout Considerations

**In Full-Page Mode (Special Edition):**
- **Full viewport width is available** - No width restrictions! You can use `width: 100vw` or any custom width
- The entire viewport is yours - sidebar, footer, and all default UI elements are hidden
- You have complete control over layout - use full-width designs, edge-to-edge content, or centered containers
- Fixed positioning works perfectly - you can position elements anywhere on the viewport

**Layout Options:**
- **Full-width designs**: `width: 100vw; margin: 0;` for edge-to-edge content
- **Centered containers**: `max-width: 1200px; margin: 0 auto;` for traditional layouts
- **Custom widths**: Any width you specify will work without restrictions

### Responsive Design

**Important:** Responsive design is **your responsibility** in special editions. The system doesn't apply automatic responsive styles, so you need to handle different screen sizes in your custom CSS.

**Best Practices:**

1. **Use CSS Media Queries:**
   ```css
   /* Desktop */
   article.special-edition {
     max-width: 1200px;
     padding: 4rem 3rem;
   }
   
   /* Tablet */
   @media (max-width: 768px) {
     article.special-edition {
       padding: 3rem 2rem;
       font-size: 1rem;
     }
   }
   
   /* Mobile */
   @media (max-width: 480px) {
     article.special-edition {
       padding: 2rem 1rem;
       font-size: 0.9rem;
     }
   }
   ```

2. **Use Relative Units:**
   - `rem` or `em` for fonts and spacing (scales with user preferences)
   - `%` or `vw/vh` for widths and heights (responsive to viewport)
   - Avoid fixed `px` values for layout-critical elements

3. **Common Breakpoints:**
   - `@media (max-width: 1024px)` - Tablet landscape
   - `@media (max-width: 768px)` - Tablet portrait / Mobile landscape
   - `@media (max-width: 480px)` - Mobile portrait
   - `@media (max-width: 320px)` - Small mobile

4. **Test on Multiple Devices:**
   - Use browser DevTools to test different screen sizes
   - Test on actual mobile devices when possible
   - Check both portrait and landscape orientations

**Example Responsive Special Edition:**
```css
<style>
  article.special-edition {
    max-width: 1200px;
    margin: 0 auto;
    padding: 4rem 3rem;
    font-size: 1.1rem;
  }
  
  article.special-edition h1 {
    font-size: 3rem;
  }
  
  /* Tablet */
  @media (max-width: 768px) {
    article.special-edition {
      padding: 3rem 2rem;
      font-size: 1rem;
    }
    
    article.special-edition h1 {
      font-size: 2.5rem;
    }
  }
  
  /* Mobile */
  @media (max-width: 480px) {
    article.special-edition {
      padding: 2rem 1rem;
      font-size: 0.95rem;
    }
    
    article.special-edition h1 {
      font-size: 2rem;
    }
  }
</style>
```

### Interactive Features

- JavaScript is fully supported
- You can create interactive visualizations, animations, or games
- Use event listeners and DOM manipulation as needed
- Be mindful of performance on mobile devices

## Example: Victorian Book Theme

```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Libre+Baskerville:ital@0;1&display=swap');
  
  :root {
    --paper: #f4f1ea;
    --ink: #1f1d1a;
    --muted: #6f6a63;
    --rule: #c9c2b8;
  }
  
  body {
    background: var(--paper);
    color: var(--ink);
    font-family: "Libre Baskerville", "Georgia", serif;
    line-height: 1.75;
    padding: 4rem 1rem;
  }
  
  article {
    max-width: 720px;
    margin: 0 auto;
    padding: 3rem 2.5rem;
    background: var(--paper);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08);
  }
  
  header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  h1 {
    font-family: "IM Fell English", "Georgia", serif;
    font-size: 2.4rem;
    font-weight: normal;
    margin-bottom: 0.5rem;
  }
  
  p:first-of-type::first-letter {
    font-family: "IM Fell English", serif;
    float: left;
    font-size: 3.8rem;
    line-height: 1;
    padding-right: 0.4rem;
    padding-top: 0.1rem;
  }
</style>

<article>
  <header>
    <h1>On Old Books, Fog, and Unfinished Maps</h1>
    <div style="font-style: italic; color: var(--muted); font-size: 0.95rem;">
      Being a short reflection on forgotten worlds
    </div>
  </header>
  
  <p>
    There are books that announce themselves loudly, demanding attention with bright covers and urgent language...
  </p>
</article>
```

## Special Edition Tag

When a post has a special edition enabled:
- It shows a **"SPECIAL EDITION"** tag in the blog/note/library listing
- Clicking it opens a modal warning about the immersive experience
- Users can choose to enter full-page reading mode or go back

## Full-Page Mode

When users proceed to a special edition post:
- **Sidebar and footer are hidden** - The entire site navigation is removed
- **Title and metadata are hidden** - The blog post title, date, views, and like button are not shown
- **Share section is hidden** - Social sharing buttons are removed
- **Comments section is hidden** - The comments area is not displayed
- **The post takes the full viewport** - Your content is the only thing visible
- **A close button appears in the top-right corner** - Users can exit full-page mode
- **The entire page uses your custom styling** - Your CSS applies to the full viewport

This creates a completely immersive reading experience where only your custom content is visible.

## Technical Details

### Content Storage
- HTML/CSS is stored as-is in the database
- No preprocessing or sanitization of style tags (for special editions)
- Regular posts still use DOMPurify sanitization

### Rendering
- Content is rendered using `dangerouslySetInnerHTML`
- `<style>` tags are automatically extracted and injected into the document `<head>` for proper CSS scope
- Inline styles are preserved
- JavaScript in `<script>` tags works
- Default blog post styles are reset for special editions to allow your custom CSS to take full control

### Performance
- Large CSS/HTML files are fine
- Consider lazy-loading for heavy interactive features
- Test on mobile devices for performance

## Use Cases

- **Book-style layouts** - Victorian novels, field journals, manuscripts
- **Interactive visualizations** - Data stories, interactive maps, timelines
- **Unique typography** - Period-specific fonts, experimental layouts
- **Interactive stories** - Choose-your-own-adventure, branching narratives
- **Custom experiences** - Anything that needs to break the standard format

## Limitations

- Content is rendered inside a container (not a full HTML document)
- Avoid assuming full viewport control
- External resources (fonts, images) should use absolute URLs or relative paths from your server
- Mobile responsiveness is your responsibility

## Tips

1. **Start simple** - Test basic HTML/CSS first, then add complexity
2. **Use CSS variables** - Makes it easy to adjust colors/themes
3. **Test on mobile** - Always check how it looks on smaller screens
4. **Keep it readable** - Even with custom styling, readability matters
5. **Use sparingly** - Special editions should be exceptional, not default

## Local Testing

To quickly iterate and test your special edition HTML/CSS without uploading:

1. Open `docs/test-special-edition.html` in your browser
2. Edit the content between the comment markers
3. Save and refresh the browser to see changes
4. Once satisfied, copy the content (between the comment markers) and paste into the admin panel

The test file simulates the blog post container environment, so what you see locally will match what appears on the site.

**Quick workflow:**
- Edit `docs/test-special-edition.html` → Refresh browser → Iterate
- When ready → Copy content → Paste into admin panel → Save

## Quick Reference for LLMs

### Required Elements Checklist
- [ ] `<style>` tag at the top with all CSS
- [ ] `article.special-edition` (or custom class) as main container
- [ ] `!important` flags on critical properties (background, color, font-family, max-width, margin, padding)
- [ ] Class-specific selectors (e.g., `article.special-edition h1`, not just `h1`)
- [ ] Responsive media queries for mobile/tablet
- [ ] Semantic HTML structure (`<header>`, `<article>`, `<footer>`, etc.)

### Common Patterns

**Full-Width Layout:**
```css
article.special-edition {
  width: 100vw !important;
  max-width: 100vw !important;
  margin: 0 !important;
  padding: 2rem !important;
}
```

**Centered Container:**
```css
article.special-edition {
  max-width: 1200px !important;
  margin: 0 auto !important;
  padding: 4rem 3rem !important;
}
```

**Responsive Typography:**
```css
article.special-edition h1 {
  font-size: 3rem !important;
}

@media (max-width: 768px) {
  article.special-edition h1 {
    font-size: 2.5rem !important;
  }
}

@media (max-width: 480px) {
  article.special-edition h1 {
    font-size: 2rem !important;
  }
}
```

**Font Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=FontName:wght@400;700&display=swap');
```

**Image Styling:**
```css
article.special-edition img {
  max-width: 100% !important;
  height: auto !important;
  display: block !important;
  margin: 2rem auto !important;
}
```

### Technical Constraints
- Content is rendered inside `.blog-post-body--special-edition`
- Default styles are reset but may still conflict - use `!important`
- Full-page mode removes all width restrictions
- Sidebar, footer, title, and comments are hidden in full-page mode
- Styles are injected into `<head>` automatically
- JavaScript in `<script>` tags is supported
- Images must use absolute URLs or relative paths from server

## Support

For questions or issues with special editions, check:
- Browser console for JavaScript errors
- Network tab for failed resource loads
- CSS specificity conflicts with site styles
- Verify `<style>` tag is in document `<head>` (check DevTools)
- Ensure `!important` flags are on critical properties

