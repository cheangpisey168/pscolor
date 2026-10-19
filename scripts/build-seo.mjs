import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { palettes, categories, tagsBank } from '../src/palettes.js';
import { GUIDES_DATA, renderGuidesIndexHtml, renderGuideArticleHtml } from '../src/guides.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const distDir = join(rootDir, 'dist');

const SITE_URL = (process.env.VITE_SITE_URL || 'https://www.pscolor.online').replace(/\/$/, '');
const TODAY = new Date().toISOString().split('T')[0];

console.log('Generating SEO assets (robots.txt, sitemap.xml, prerendered pages)...');

// Helper WCAG calculation functions for rich static prerendering
function getLuminance(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrast(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Math.round(((brightest + 0.05) / (darkest + 0.05)) * 10) / 10;
}

function getWcagRating(contrastRatio) {
  if (contrastRatio >= 7.0) return { label: 'WCAG AAA Pass', level: 'aaa' };
  if (contrastRatio >= 4.5) return { label: 'WCAG AA Pass', level: 'aa' };
  if (contrastRatio >= 3.0) return { label: 'WCAG AA Large Pass', level: 'aa-large' };
  return { label: 'Low Contrast (< 3:1)', level: 'fail' };
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

// 1. Generate robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
writeFileSync(join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');
console.log('✓ public/robots.txt generated');

// 2. Generate sitemap.xml with consistent trailing-slash directory URLs
const sitemapUrls = [
  { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
  { loc: `${SITE_URL}/popular/`, changefreq: 'daily', priority: '0.9' },
  { loc: `${SITE_URL}/random/`, changefreq: 'daily', priority: '0.8' },
  { loc: `${SITE_URL}/visualizer/`, changefreq: 'weekly', priority: '0.9' },
  { loc: `${SITE_URL}/gradient/`, changefreq: 'weekly', priority: '0.9' },
  { loc: `${SITE_URL}/guides/`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${SITE_URL}/guides/how-to-create-css-gradients/`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE_URL}/guides/how-to-choose-colors-for-a-website/`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE_URL}/guides/understanding-color-contrast-and-wcag/`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE_URL}/create/`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${SITE_URL}/about/`, changefreq: 'monthly', priority: '0.5' },
  { loc: `${SITE_URL}/contact/`, changefreq: 'monthly', priority: '0.5' },
  { loc: `${SITE_URL}/terms/`, changefreq: 'monthly', priority: '0.3' },
  { loc: `${SITE_URL}/privacy/`, changefreq: 'monthly', priority: '0.3' }
];

// Add category tags
const uniqueTags = new Set(tagsBank.map(t => t.tag.toLowerCase()));
for (const tag of uniqueTags) {
  sitemapUrls.push({
    loc: `${SITE_URL}/palettes/${encodeURIComponent(tag)}/`,
    changefreq: 'weekly',
    priority: '0.8'
  });
}

// Add all palettes
for (const p of palettes) {
  sitemapUrls.push({
    loc: `${SITE_URL}/palette/${p.id}/`,
    changefreq: 'monthly',
    priority: '0.7'
  });
}

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

writeFileSync(join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
console.log(`✓ public/sitemap.xml generated with ${sitemapUrls.length} indexed URLs`);

// 3. Prerender static HTML pages in dist/ if dist exists
if (existsSync(distDir) && existsSync(join(distDir, 'index.html'))) {
  console.log('Prerendering static HTML entry points into dist/ for crawler indexability...');
  const templateHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');

  // Also copy robots.txt, sitemap.xml, and ads.txt to dist
  writeFileSync(join(distDir, 'robots.txt'), robotsTxt, 'utf-8');
  writeFileSync(join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  if (existsSync(join(publicDir, 'ads.txt'))) {
    writeFileSync(join(distDir, 'ads.txt'), readFileSync(join(publicDir, 'ads.txt'), 'utf-8'), 'utf-8');
  }

  function renderPage({ path, title, description, ogImage, structuredData, bodyContent = '' }) {
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    const fullUrl = `${SITE_URL}${cleanPath}`;
    const targetDir = join(distDir, cleanPath.replace(/^\//, ''));
    mkdirSync(targetDir, { recursive: true });

    let html = templateHtml;

    // Title
    html = html.replace(/<title>.*?<\/title>/, `<title>${title} — PS color</title>`);

    // Description
    html = html.replace(
      /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
      `<meta name="description" content="${description}" />`
    );

    // Canonical
    html = html.replace(
      /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i,
      `<link rel="canonical" href="${fullUrl}" />`
    );

    // Open Graph
    html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${title} — PS color" />`);
    html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${description}" />`);
    html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i, `<meta property="og:url" content="${fullUrl}" />`);
    if (ogImage) {
      html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i, `<meta property="og:image" content="${ogImage}" />`);
    }

    // Twitter
    html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${title} — PS color" />`);
    html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${description}" />`);
    if (ogImage) {
      html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${ogImage}" />`);
    }

    // Schema.org
    if (structuredData) {
      const scriptRegex = /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i;
      html = html.replace(
        scriptRegex,
        `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n</script>`
      );
    }

    // Pre-rendered App Body
    if (bodyContent) {
      html = html.replace('<div id="app"></div>', `<div id="app">${bodyContent}</div>`);
    }

    writeFileSync(join(targetDir, 'index.html'), html, 'utf-8');
  }

  // Static core routes
  renderPage({
    path: '/about/',
    title: 'About PS color — Independent Color Discovery',
    description: 'Learn about PS color, an independent, copyright-safe, local-first palette discovery platform built for designers and developers.',
    bodyContent: `
      <article class="content-page" style="max-width:860px;margin:32px auto;padding:24px;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;line-height:1.6;">
        <h1 style="font-size:32px;color:#0f172a;margin-bottom:12px;">About PS color</h1>
        <p style="font-size:16px;color:#475569;margin-bottom:24px;">PS color is an independent, free-to-use color discovery workspace engineered for web designers, mobile developers, digital artists, and brand strategists. We curate harmonious four-color palettes, calculate linearized WCAG 2.1 accessibility contrast ratios, extract palettes from photos, and provide instant developer token exports.</p>
        
        <h2 style="font-size:22px;color:#0f172a;margin-top:28px;margin-bottom:10px;">The Four-Tier Visual Weight Architecture</h2>
        <p>Color theory requires intentional proportion. Every palette on PS color follows an ergonomic visual hierarchy: 41% Base Canvas (main ground surface), 26% Structural Surface (cards, panels, and sidebars), 18% Muted Element (borders and subtle dividers), and 15% Focal Accent (primary CTA buttons, badges, and interactive feedback).</p>
        
        <h2 style="font-size:22px;color:#0f172a;margin-top:28px;margin-bottom:10px;">Accessibility &amp; WCAG 2.1 Compliance</h2>
        <p>Accessible design is a core principle of modern software engineering. We compute relative luminance using the W3C linearized sRGB formula and evaluate contrast ratios against WCAG Level AA (4.5:1), AAA (7.0:1), and AA Large Text (3.0:1) thresholds to ensure optimal readability across all displays.</p>
        
        <h2 style="font-size:22px;color:#0f172a;margin-top:28px;margin-bottom:10px;">Developer Token Integration</h2>
        <p>Export palettes effortlessly into Tailwind CSS configurations, CSS Custom Properties (:root), and W3C/DTCG Figma JSON tokens. 100% free for commercial and personal usage without mandatory attribution.</p>
        
        <h2 style="font-size:22px;color:#0f172a;margin-top:28px;margin-bottom:10px;">Publisher Transparency</h2>
        <p>Operated by PS Color Studio. For support, partnerships, or feedback, visit our <a href="/contact/">Contact Page</a> or email support@pscolor.online.</p>
      </article>
    `
  });

  renderPage({
    path: '/contact/',
    title: 'Contact Us — PS color Support & Inquiries',
    description: 'Get in touch with the PS color team for support, feature feedback, partnership inquiries, and publisher assistance.',
    bodyContent: `
      <article class="content-page" style="max-width:860px;margin:32px auto;padding:24px;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;line-height:1.6;">
        <h1 style="font-size:32px;color:#0f172a;margin-bottom:12px;">Contact PS color</h1>
        <p style="font-size:16px;color:#475569;margin-bottom:24px;">Have questions about our color algorithms, developer tokens, accessibility ratings, or licensing? Get in touch with our team below.</p>
        
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
          <h2 style="font-size:20px;color:#0f172a;margin-bottom:14px;">Direct Support &amp; Publisher Inquiries</h2>
          <p><strong>General Support &amp; Inquiries:</strong> <a href="mailto:support@pscolor.online">support@pscolor.online</a></p>
          <p><strong>Partnerships &amp; Advertising:</strong> <a href="mailto:partners@pscolor.online">partners@pscolor.online</a></p>
          <p><strong>Legal &amp; Copyright (DMCA):</strong> <a href="mailto:legal@pscolor.online">legal@pscolor.online</a></p>
          <p style="margin-top:16px;font-size:13px;color:#64748b;">Operating Entity: PS Color Studio &bull; Response Time: Within 24–48 business hours.</p>
        </div>
      </article>
    `
  });

  renderPage({
    path: '/terms/',
    title: 'Terms of Service',
    description: 'Terms of service for PS color. All color palettes are free for personal and commercial usage without attribution.',
    bodyContent: `
      <article class="content-page" style="max-width:860px;margin:32px auto;padding:24px;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;line-height:1.6;">
        <h1 style="font-size:32px;color:#0f172a;margin-bottom:12px;">Terms of Service</h1>
        <p style="font-size:15px;color:#64748b;margin-bottom:20px;">Effective Date: October 17, 2026. Welcome to PS color (pscolor.online).</p>
        
        <h2 style="font-size:20px;color:#0f172a;margin-top:24px;margin-bottom:10px;">1. Free Personal &amp; Commercial License</h2>
        <p>All color palette combinations and hex values published on PS color are provided under an open, royalty-free license. You may use them in websites, software, brand guidelines, mobile apps, and printed media without attribution.</p>
        
        <h2 style="font-size:20px;color:#0f172a;margin-top:24px;margin-bottom:10px;">2. User Generated Palettes</h2>
        <p>Palettes generated via our Palette Creator or Image Extractor remain your own creation. All processing occurs locally within your browser client.</p>

        <h2 style="font-size:20px;color:#0f172a;margin-top:24px;margin-bottom:10px;">3. Intellectual Property</h2>
        <p>The PS color brand emblem, website architecture, and source code are protected intellectual property of PS Color Studio.</p>

        <h2 style="font-size:20px;color:#0f172a;margin-top:24px;margin-bottom:10px;">4. Disclaimers &amp; Limitation of Liability</h2>
        <p>The service is provided on an "as is" and "as available" basis without warranties of any kind. PS Color Studio shall not be liable for any indirect or consequential damages.</p>
      </article>
    `
  });

  renderPage({
    path: '/privacy/',
    title: 'Privacy Policy',
    description: 'Privacy policy for PS color. Detailed cookie disclosures, Google AdSense compliance, and browser-local collection storage.',
    bodyContent: `
      <article class="content-page" style="max-width:860px;margin:32px auto;padding:24px;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;line-height:1.6;">
        <h1 style="font-size:32px;color:#0f172a;margin-bottom:12px;">Privacy Policy</h1>
        <p style="font-size:15px;color:#64748b;margin-bottom:20px;">Effective Date: October 17, 2026. At PS color (pscolor.online), your privacy is of paramount importance.</p>

        <h2 style="font-size:20px;color:#0f172a;margin-top:24px;margin-bottom:10px;">1. Local-First Browser Storage</h2>
        <p>Your saved collections and custom-created color palettes persist exclusively in your browser local storage (localStorage). This data never leaves your device.</p>

        <h2 style="font-size:20px;color:#0f172a;margin-top:24px;margin-bottom:10px;">2. Google AdSense &amp; Advertising Disclosures</h2>
        <p>PS color works with third-party advertising partners, including Google AdSense. In compliance with Google Publisher Policies:</p>
        <ul style="margin:10px 0 16px 20px;line-height:1.8;">
          <li>Third-party vendors, including Google, use cookies to serve ads based on prior visits to this and other websites on the Internet.</li>
          <li>Google's use of advertising cookies enables it and its partners to serve ads based on your visit to this site and/or other sites on the Internet.</li>
          <li>Users may opt out of personalized advertising by visiting <a href="https://myadcenter.google.com/" target="_blank" rel="noopener">Google My Ad Center</a> or the <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener">Network Advertising Initiative Consumer Choice Page (aboutads.info)</a>.</li>
          <li>For detailed information on how Google uses information from sites or apps that use their services, review <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">How Google uses information from sites or apps that use our services</a>.</li>
        </ul>

        <h2 style="font-size:20px;color:#0f172a;margin-top:24px;margin-bottom:10px;">3. Cookies &amp; Consent Management (GDPR / UK GDPR)</h2>
        <p>For visitors in the EEA, UK, and Switzerland, non-essential advertising and analytics cookies are governed by an IAB Europe Transparency and Consent Framework (TCF v2.2 / v2.3) and Google Consent Mode v2 compliant implementation. You can adjust your consent or revoke permissions anytime using the Cookie Preferences link in the footer or via our interactive settings.</p>
      </article>
    `
  });

  renderPage({
    path: '/create/',
    title: 'Create & Extract Color Palettes',
    description: 'Design custom 4-color palettes or extract dominant color harmonies instantly from photos (PNG, JPG, WebP) in your browser.',
    bodyContent: '<div class="creator"><h1>Create & Extract Color Palettes</h1><p>Build custom four-color schemes or extract palettes directly from any photo.</p></div>'
  });

  renderPage({
    path: '/visualizer/',
    title: 'Live UI Color Visualizer — Preview Palettes on Websites',
    description: 'Preview color schemes interactively on realistic website templates including Landing Pages, SaaS Dashboards, and E-Commerce storefronts with WCAG accessibility checks and instant code export.',
    bodyContent: `
      <article class="content-page" style="max-width:960px;margin:32px auto;padding:24px;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;line-height:1.6;">
        <h1 style="font-size:32px;color:#0f172a;margin-bottom:12px;">Live UI Color Visualizer</h1>
        <p style="font-size:16px;color:#475569;margin-bottom:24px;">Test color palettes instantly in realistic website layouts. Preview full design systems across SaaS dashboard analytics, marketing landing pages, and modern e-commerce storefronts.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
          <h2 style="font-size:20px;color:#0f172a;margin-bottom:14px;">Key Capabilities</h2>
          <ul style="line-height:1.8;padding-left:20px;">
            <li><strong>Responsive Templates:</strong> Switch effortlessly between Landing Page, SaaS Analytics Dashboard, and E-Commerce Storefront.</li>
            <li><strong>Semantic Color Mapping:</strong> Assign Primary, Secondary, Accent, Background, Surface, and Text roles.</li>
            <li><strong>Device Simulation:</strong> Toggle between Desktop widescreen and Mobile Phone viewports.</li>
            <li><strong>WCAG 2.1 Contrast Scorecard:</strong> Real-time automated accessibility feedback ensuring legible typography and WCAG AA/AAA compliance.</li>
            <li><strong>Instant Developer Tokens:</strong> One-click export for CSS Custom Properties (:root) and Tailwind CSS configuration tokens.</li>
          </ul>
        </div>
      </article>
    `
  });

  renderPage({
    path: '/gradient/',
    title: 'CSS Gradient Generator — Linear, Radial & Conic Gradients',
    description: 'Create beautiful, customizable CSS linear, radial, and conic gradients. Customize color stops, copy production-ready CSS code, and download high-resolution PNGs.',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'PS Color CSS Gradient Generator',
      'url': `${SITE_URL}/gradient/`,
      'description': 'Professional CSS linear, radial, and conic gradient generator with live preview, color stops control, and high-resolution PNG export.',
      'applicationCategory': 'DesignApplication',
      'operatingSystem': 'All',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      }
    },
    bodyContent: `
      <article class="content-page" style="max-width:960px;margin:32px auto;padding:24px;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;line-height:1.6;">
        <h1 style="font-size:32px;color:#0f172a;margin-bottom:12px;">CSS Gradient Generator</h1>
        <p style="font-size:16px;color:#475569;margin-bottom:24px;">Create high-performance linear, radial, and conic gradients with live preview, customizable color stops, one-click CSS code export, and 4K/HD PNG image download.</p>
        
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
          <h2 style="font-size:20px;color:#0f172a;margin-bottom:14px;">Key Capabilities</h2>
          <ul style="line-height:1.8;padding-left:20px;">
            <li><strong>Linear Gradients:</strong> Full 0–360° directional angle control with rapid angle presets (0°, 45°, 90°, 135°, 180°, 270°).</li>
            <li><strong>Radial Gradients:</strong> Precise circular and elliptical geometries with 9 center positioning presets.</li>
            <li><strong>Conic Gradients:</strong> 360° circular angle sweeps and angular center controls for color wheels and iridescent UI elements.</li>
            <li><strong>2 to 8 Color Stops:</strong> Add, delete, reorder, and fine-tune stop positions with hex input and native color pickers.</li>
            <li><strong>Instant Export:</strong> Single-click copy for standards-compliant CSS code and high-resolution PNG downloads with custom dimensions (1080×1080, 1080×1350, 1920×1080).</li>
            <li><strong>Save &amp; Share:</strong> Save favorite gradient combinations locally in browser storage or share via unique config URLs.</li>
          </ul>
        </div>

        <section style="margin-top:32px;">
          <h2 style="font-size:22px;color:#0f172a;margin-bottom:10px;">CSS Gradient Types &amp; Syntax Guide</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
              <h3 style="font-size:16px;margin:0 0 8px 0;color:#0f172a;">Linear Gradients</h3>
              <p style="font-size:13px;color:#475569;margin:0 0 10px 0;">Blends colors smoothly along a directional line.</p>
              <pre style="background:#0f172a;color:#38bdf8;padding:10px;border-radius:6px;font-size:12px;overflow-x:auto;"><code>background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);</code></pre>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
              <h3 style="font-size:16px;margin:0 0 8px 0;color:#0f172a;">Radial Gradients</h3>
              <p style="font-size:13px;color:#475569;margin:0 0 10px 0;">Radiates colors outward from a focal point.</p>
              <pre style="background:#0f172a;color:#38bdf8;padding:10px;border-radius:6px;font-size:12px;overflow-x:auto;"><code>background: radial-gradient(circle at center, #f857a6 0%, #ff5858 50%, #111827 100%);</code></pre>
            </div>
          </div>
        </section>

        <section style="margin-top:32px;">
          <h2 style="font-size:22px;color:#0f172a;margin-bottom:10px;">WCAG 2.1 Accessibility Considerations</h2>
          <p style="font-size:14px;color:#475569;">When placing text over CSS gradients, always evaluate contrast against all color stops to ensure compliance with WCAG 2.1 AA (4.5:1 for body text, 3:1 for large text). Use semi-transparent backing surfaces or high-contrast drop shadows when text spans across contrasting color bands.</p>
        </section>
      </article>
    `
  });

  // Color Guides Index
  renderPage({
    path: '/guides/',
    title: 'Color & Web Design Guides — Tutorials, CSS & WCAG Accessibility',
    description: 'Learn color theory, CSS gradient syntax, WCAG 2.1 accessibility math, and design system tokens with comprehensive educational guides from PS Color.',
    bodyContent: renderGuidesIndexHtml()
  });

  // Individual Guide Articles
  for (const guide of GUIDES_DATA) {
    renderPage({
      path: `/guides/${guide.slug}/`,
      title: guide.title,
      description: guide.description,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        'headline': guide.title,
        'description': guide.description,
        'author': {
          '@type': 'Organization',
          'name': 'PS color',
          'url': SITE_URL
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'PS color',
          'url': SITE_URL,
          'logo': {
            '@type': 'ImageObject',
            'url': `${SITE_URL}/img/ps-color-logo.svg`
          }
        },
        'datePublished': guide.isoDate,
        'dateModified': guide.isoDate,
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/guides/${guide.slug}/`
        }
      },
      bodyContent: renderGuideArticleHtml(guide)
    });
  }

  renderPage({
    path: '/popular/',
    title: 'Popular Color Palettes',
    description: 'Explore the most saved and trending color palettes curated by the PS color design community.'
  });

  renderPage({
    path: '/random/',
    title: 'Random Color Palettes',
    description: 'Discover unexpected color harmonies and generate fresh color ideas with random palette shuffles.'
  });

  // Category tags
  for (const tag of uniqueTags) {
    const formatted = tag[0].toUpperCase() + tag.slice(1);
    renderPage({
      path: `/palettes/${tag}/`,
      title: `${formatted} Color Palettes`,
      description: `Discover curated ${tag} color palettes and combinations for design, art, and web themes.`
    });
  }

  // All 654 Palettes with Rich Editorial & Accessibility Content
  let paletteCount = 0;
  for (const p of palettes) {
    const c1 = p.colors[0].toUpperCase();
    const c2 = p.colors[1].toUpperCase();
    const c3 = p.colors[2].toUpperCase();
    const c4 = p.colors[3].toUpperCase();
    const colorsStr = p.colors.join(', ');
    const tagsStr = (p.tags || []).join(', ');

    const contrast1_4 = getContrast(p.colors[0], p.colors[3]);
    const rating1_4 = getWcagRating(contrast1_4);
    const contrast2_4 = getContrast(p.colors[1], p.colors[3]);
    const rating2_4 = getWcagRating(contrast2_4);

    const hasWarm = (p.tags || []).some(t => ['warm', 'summer', 'sunset', 'orange', 'red', 'yellow', 'gold'].includes(t.toLowerCase()));
    const hasCool = (p.tags || []).some(t => ['cold', 'winter', 'sky', 'sea', 'blue', 'teal', 'mint'].includes(t.toLowerCase()));
    const moodDesc = hasWarm && hasCool ? 'a balanced synergy of warm and cool tones' : hasWarm ? 'an inviting, energetic warmth' : hasCool ? 'a serene, clean, and tranquil ambiance' : 'a sophisticated, modern aesthetic';

    const svgPreview = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="315" viewBox="0 0 600 315"><rect width="600" height="129" fill="${p.colors[0]}"/><rect y="129" width="600" height="82" fill="${p.colors[1]}"/><rect y="211" width="600" height="57" fill="${p.colors[2]}"/><rect y="268" width="600" height="47" fill="${p.colors[3]}"/></svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgPreview)}`;

    const richHtml = `
      <article class="detail" style="max-width:860px;margin:32px auto;padding:24px;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;line-height:1.6;">
        <header>
          <h1 style="font-size:28px;margin-bottom:8px;color:#0f172a;">Palette ${c1} ${c2} ${c3} ${c4}</h1>
          <p style="font-size:15px;color:#64748b;margin-bottom:20px;">Curated four-color harmony tagged under <strong>${tagsStr}</strong>. Free for personal and commercial digital design projects.</p>
        </header>

        <div style="display:flex;height:240px;border-radius:12px;overflow:hidden;margin-bottom:28px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <div style="flex:41;background:${c1};display:flex;align-items:flex-end;padding:12px;color:rgba(0,0,0,0.7);font-weight:700;">${c1} (41%)</div>
          <div style="flex:26;background:${c2};display:flex;align-items:flex-end;padding:12px;color:rgba(0,0,0,0.7);font-weight:700;">${c2} (26%)</div>
          <div style="flex:18;background:${c3};display:flex;align-items:flex-end;padding:12px;color:rgba(0,0,0,0.7);font-weight:700;">${c3} (18%)</div>
          <div style="flex:15;background:${c4};display:flex;align-items:flex-end;padding:12px;color:rgba(0,0,0,0.7);font-weight:700;">${c4} (15%)</div>
        </div>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;color:#0f172a;margin-bottom:12px;">Palette Specifications &amp; Color Values</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;background:#f8fafc;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#e2e8f0;text-align:left;">
                <th style="padding:10px 14px;">Swatch</th>
                <th style="padding:10px 14px;">HEX</th>
                <th style="padding:10px 14px;">RGB</th>
                <th style="padding:10px 14px;">Luminance</th>
                <th style="padding:10px 14px;">Recommended Role</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 14px;"><span style="display:inline-block;width:20px;height:20px;background:${c1};border-radius:4px;border:1px solid #cbd5e1;vertical-align:middle;"></span></td>
                <td style="padding:10px 14px;font-family:monospace;font-weight:600;">${c1}</td>
                <td style="padding:10px 14px;font-family:monospace;">rgb(${hexToRgb(c1)})</td>
                <td style="padding:10px 14px;">${Math.round(getLuminance(c1) * 1000) / 1000}</td>
                <td style="padding:10px 14px;">41% Base Canvas / Background</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 14px;"><span style="display:inline-block;width:20px;height:20px;background:${c2};border-radius:4px;border:1px solid #cbd5e1;vertical-align:middle;"></span></td>
                <td style="padding:10px 14px;font-family:monospace;font-weight:600;">${c2}</td>
                <td style="padding:10px 14px;font-family:monospace;">rgb(${hexToRgb(c2)})</td>
                <td style="padding:10px 14px;">${Math.round(getLuminance(c2) * 1000) / 1000}</td>
                <td style="padding:10px 14px;">26% Surface / Card Container</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 14px;"><span style="display:inline-block;width:20px;height:20px;background:${c3};border-radius:4px;border:1px solid #cbd5e1;vertical-align:middle;"></span></td>
                <td style="padding:10px 14px;font-family:monospace;font-weight:600;">${c3}</td>
                <td style="padding:10px 14px;font-family:monospace;">rgb(${hexToRgb(c3)})</td>
                <td style="padding:10px 14px;">${Math.round(getLuminance(c3) * 1000) / 1000}</td>
                <td style="padding:10px 14px;">18% Muted Element / Borders</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;"><span style="display:inline-block;width:20px;height:20px;background:${c4};border-radius:4px;border:1px solid #cbd5e1;vertical-align:middle;"></span></td>
                <td style="padding:10px 14px;font-family:monospace;font-weight:600;">${c4}</td>
                <td style="padding:10px 14px;font-family:monospace;">rgb(${hexToRgb(c4)})</td>
                <td style="padding:10px 14px;">${Math.round(getLuminance(c4) * 1000) / 1000}</td>
                <td style="padding:10px 14px;">15% Focal Accent / Call to Action</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;color:#0f172a;margin-bottom:10px;">Color Theory &amp; Mood Analysis</h2>
          <p>This color collection radiates ${moodDesc}, making it ideal for digital product interfaces, modern SaaS web applications, mobile user interfaces, brand style guides, and graphic illustrations. Following classical four-tier visual weight balance, the dominant primary tone establishes an expansive ground surface, the secondary hue defines cards and panels, the structural third color bounds elements cleanly, and the high-contrast accent directs user attention to interactive elements.</p>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;color:#0f172a;margin-bottom:10px;">WCAG 2.1 Accessibility &amp; Contrast Validation</h2>
          <p>Ensuring accessible contrast is vital for inclusive design. The linearized contrast ratio between Base Canvas (<code>${c1}</code>) and Focal Accent (<code>${c4}</code>) is <strong>${contrast1_4}:1</strong>, scoring <strong>${rating1_4.label}</strong> under W3C WCAG 2.1 specifications. Additionally, the contrast between Surface (<code>${c2}</code>) and Accent (<code>${c4}</code>) measures <strong>${contrast2_4}:1</strong> (<strong>${rating2_4.label}</strong>). These metrics provide designers with mathematical certainty for legible typography and interactive accessibility.</p>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;color:#0f172a;margin-bottom:10px;">Developer Tokens &amp; Integration</h2>
          <p>Integrate this palette directly into your frontend build pipeline:</p>
          <pre style="background:#0f172a;color:#f8fafc;padding:14px;border-radius:8px;font-size:13px;overflow-x:auto;"><code>:root {
  --color-canvas: ${c1};
  --color-surface: ${c2};
  --color-border: ${c3};
  --color-accent: ${c4};
}</code></pre>
        </section>

        <footer style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;">
          <p>Palette ID: <code>${p.id}</code> &bull; Published by PS Color Studio &bull; Free for commercial &amp; personal use without attribution.</p>
        </footer>
      </article>
    `;

    renderPage({
      path: `/palette/${p.id}/`,
      title: `Palette ${c1} ${c2} ${c3} ${c4}`,
      description: `Explore and copy hex codes for palette ${colorsStr}. Includes Tailwind CSS snippet, CSS variables, Figma tokens, and WCAG contrast check.`,
      ogImage: dataUri,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'VisualArtwork',
        'name': `Color Palette ${p.id}`,
        'artMedium': 'Digital Color Scheme',
        'artworkSurface': 'Digital Screen',
        'description': `Harmonious 4-color palette composed of ${colorsStr}.`,
        'creator': {
          '@type': 'Organization',
          'name': 'PS color',
          'url': SITE_URL
        },
        'keywords': (p.tags || []).join(', ')
      },
      bodyContent: richHtml
    });
    paletteCount++;
  }

  console.log(`✓ Prerendered ${paletteCount} palette detail pages and static routes into dist/`);
}

console.log('SEO asset generation completed successfully.\n');
