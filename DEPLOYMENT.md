# PS Color — Production Deployment Guide

This guide covers deployment options, environment variables, SPA routing configuration, and launch verification for **PS Color**.

---

## 1. Environment Configuration

Copy `.env.example` to `.env` or set environment variables in your deployment dashboard:

```env
# Canonical Site URL (Used for sitemap.xml, canonical link tags, and Open Graph previews)
VITE_SITE_URL=https://your-domain.com

# Google Analytics 4 Measurement ID (Leave blank to disable tracking)
VITE_GA_ID=G-XXXXXXXXXX

# Ad Network Integration (Disabled by default until partner approval)
VITE_AD_NETWORK_ENABLED=false
VITE_AD_SCRIPT_URL=
```

---

## 2. Deployment Targets

### Option A: Vercel (Recommended)
1. Connect your repository to [Vercel](https://vercel.com/).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Environment Variables: Set `VITE_SITE_URL` and `VITE_GA_ID` (if applicable).
6. Vercel automatically detects [`vercel.json`](file:///D:/Docker/PS%20color/vercel.json) which handles SPA rewrites (`/(.*) -> /index.html`), caching headers for hashed assets, and security headers.

### Option B: Netlify
1. Connect your repository to [Netlify](https://www.netlify.com/).
2. Build Command: `npm run build`.
3. Publish Directory: `dist`.
4. Environment Variables: Set `VITE_SITE_URL` and `VITE_GA_ID`.
5. Netlify uses [`public/_redirects`](file:///D:/Docker/PS%20color/public/_redirects) (copied into `dist/`) to handle SPA route fallbacks.

### Option C: Cloudflare Pages
1. Create a project in [Cloudflare Pages](https://pages.cloudflare.com/).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Build Output Directory: `dist`.
5. Environment Variables: Add `VITE_SITE_URL`.
6. Handles prerendered routes directly and rewrites non-static paths to `index.html`.

### Option D: Docker & Nginx
1. Build the container image:
   ```bash
   docker build -t ps-color:latest .
   ```
2. Run the container:
   ```bash
   docker run -d -p 80:80 --name ps-color-web ps-color:latest
   ```
3. The included [`nginx.conf`](file:///D:/Docker/PS%20color/nginx.conf) provides:
   - Gzip compression for HTML, CSS, JS, JSON, and SVG.
   - Long-term caching headers (`1y`) for `/assets/`.
   - Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
   - SPA fallback (`try_files $uri $uri/ /index.html`).

---

## 3. SEO & Prerendering Architecture

During `npm run build`, `scripts/build-seo.mjs` executes automatically:
- **`sitemap.xml`**: Dynamically generates indexed URLs for all 654 palette detail pages, all category tags, and static routes.
- **`robots.txt`**: Declares crawler permissions and sitemap location.
- **Static Prerendering**: Pre-generates static HTML entry points for every palette in `dist/palette/<id>/index.html`. This guarantees that:
  - Social platform crawlers (Twitter/X, Facebook, Discord, Slack, LinkedIn, WhatsApp) receive rich cards with custom SVG color swatches and exact hex values without executing JavaScript.
  - Search engine spiders (Googlebot, Bing, DuckDuckGo) index full semantic titles, descriptions, and Schema.org `VisualArtwork` JSON-LD data immediately.

---

## 4. Verification & Testing

Before cutting DNS or announcing your launch, run the automated test suite against the local build or preview server:

```bash
# 1. Clean build
npm run build

# 2. Run automated test suites (browser e2e + monetization review)
npm test
```
