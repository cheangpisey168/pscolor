---
name: ps_color
description: >-
  Use this skill whenever working with color palettes, generating color schemes,
  calculating WCAG 2.1 accessibility contrast ratios, extracting dominant colors from images,
  exporting color tokens for Tailwind CSS, CSS variables, or Figma, and developing
  or maintaining the PS Color platform.
---

# PS Color — Color Harmony, Accessibility & Token System

PS Color provides an end-to-end framework and toolset for discovering, generating, testing, and exporting accessible four-color schemes for web designers, mobile developers, and digital artists.

---

## Capabilities & Workflows

1. **Color Scheme Creation & Harmonies**:
   - Curate and structure 4-color palettes ordered by visual weight ratios (41%, 26%, 18%, 15%).
   - Classify palettes into styles, moods, seasons, and semantic color categories.
   - Reference: [Color Harmonies Guide](./references/color_harmonies.md)

2. **WCAG 2.1 Accessibility Contrast Calculation**:
   - Calculate relative luminance using the linearized sRGB formula:
     $$L = 0.2126R + 0.7152G + 0.0722B$$
   - Compute contrast ratios: $(L_1 + 0.05) / (L_2 + 0.05)$ where $L_1 \ge L_2$.
   - Evaluate against AA ($\ge 4.5:1$), AAA ($\ge 7.0:1$), and AA Large ($\ge 3.0:1$) thresholds.
   - Reference: [WCAG Accessibility Guide](./references/accessibility_wcag.md)
   - Executable CLI: [contrast_checker.mjs](./scripts/contrast_checker.mjs)

3. **Multi-Format Developer Token Exports**:
   - **Tailwind CSS**: Generate `theme.extend.colors.palette` module configs.
   - **CSS Variables**: Generate `:root` custom properties (`--color-1` to `--color-4`).
   - **Figma Design Tokens**: Generate parseable W3C/DTCG JSON token structures.
   - Reference: [Code Exporters Guide](./references/code_exporters.md)
   - Executable CLI: [export_tokens.mjs](./scripts/export_tokens.mjs)

4. **Image-to-Palette Extraction**:
   - Extract 4 dominant, harmonious colors from PNG, JPG, and WebP images.
   - Downsample via 64×64 HTML5 Canvas, filter transparent pixels, and sort by luminance.
   - Reference: [Image Extraction Guide](./references/image_extraction.md)

5. **Production Deployment & SEO**:
   - Static prerendering pipeline for 100% crawlability on search engines and social platforms.
   - Automated `sitemap.xml` and `robots.txt` generation.
   - Multi-platform hosting rules for Vercel, Netlify, Cloudflare Pages, and Docker/Nginx.
   - Reference: [Deployment & SEO Guide](./references/deployment_seo.md)

---

## Quick Reference CLI Scripts

### Check Contrast Ratio
Calculate mathematical contrast and WCAG rating between any two hex colors:

```bash
node .agents/skills/ps_color/scripts/contrast_checker.mjs "#FFFFFF" "#52796F"
# Output:
# Contrast: 4.3:1
# Status: WCAG AA Large Pass (aa-large)
```

### Export Developer Tokens
Export 4 hex colors into Tailwind, CSS custom properties, or Figma JSON:

```bash
node .agents/skills/ps_color/scripts/export_tokens.mjs tailwind "#F7F0DC" "#D9E4C8" "#A2B89B" "#52796F"
node .agents/skills/ps_color/scripts/export_tokens.mjs css "#F7F0DC" "#D9E4C8" "#A2B89B" "#52796F"
node .agents/skills/ps_color/scripts/export_tokens.mjs figma "#F7F0DC" "#D9E4C8" "#A2B89B" "#52796F"
```

---

## Core Algorithms in JavaScript

### 1. Relative Luminance & Contrast
```javascript
export function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrast(hex1, hex2) {
  const num1 = parseInt(hex1.replace('#', ''), 16);
  const r1 = (num1 >> 16) & 255, g1 = (num1 >> 8) & 255, b1 = num1 & 255;
  const num2 = parseInt(hex2.replace('#', ''), 16);
  const r2 = (num2 >> 16) & 255, g2 = (num2 >> 8) & 255, b2 = num2 & 255;
  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Math.round(((brightest + 0.05) / (darkest + 0.05)) * 10) / 10;
}
```

### 2. Rating Thresholds
```javascript
export function getWcagRating(contrastRatio) {
  if (contrastRatio >= 7.0) return { label: 'WCAG AAA Pass', level: 'aaa', pass: true };
  if (contrastRatio >= 4.5) return { label: 'WCAG AA Pass', level: 'aa', pass: true };
  if (contrastRatio >= 3.0) return { label: 'WCAG AA Large Pass', level: 'aa-large', pass: true };
  return { label: 'Low Contrast (< 3:1)', level: 'fail', pass: false };
}
```

---

## Architecture of the PS Color Web Application

- **Core Engine**: Vite SPA with Vanilla ES Modules (`src/main.js`, `src/utils.js`).
- **Data Layer**: 654 curated palettes in `src/palettes.js` split into a separate bundle chunk.
- **Privacy-First Analytics**: GA4 integration via `src/analytics.js` respecting Do Not Track and local consent toggles.
- **Dynamic SEO & Structured Data**: `src/seo.js` updating `<title>`, `<meta name="description">`, Open Graph SVG previews, and Schema.org `VisualArtwork` JSON-LD.
- **Prerender Automation**: `scripts/build-seo.mjs` generates `sitemap.xml`, `robots.txt`, and static HTML pages for all palettes.
