import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { palettes, categories, tagsBank } from '../src/palettes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const distDir = join(rootDir, 'dist');

const SITE_URL = (process.env.VITE_SITE_URL || 'https://pscolor.com').replace(/\/$/, '');
const TODAY = new Date().toISOString().split('T')[0];

console.log('Generating SEO assets (robots.txt, sitemap.xml, prerendered pages)...');

// 1. Generate robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
writeFileSync(join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');
console.log('✓ public/robots.txt generated');

// 2. Generate sitemap.xml
const sitemapUrls = [
  { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
  { loc: `${SITE_URL}/popular`, changefreq: 'daily', priority: '0.9' },
  { loc: `${SITE_URL}/random`, changefreq: 'daily', priority: '0.8' },
  { loc: `${SITE_URL}/create`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.5' },
  { loc: `${SITE_URL}/terms`, changefreq: 'monthly', priority: '0.3' },
  { loc: `${SITE_URL}/privacy`, changefreq: 'monthly', priority: '0.3' }
];

// Add category tags
const uniqueTags = new Set(tagsBank.map(t => t.tag.toLowerCase()));
for (const tag of uniqueTags) {
  sitemapUrls.push({
    loc: `${SITE_URL}/palettes/${encodeURIComponent(tag)}`,
    changefreq: 'weekly',
    priority: '0.8'
  });
}

// Add all palettes
for (const p of palettes) {
  sitemapUrls.push({
    loc: `${SITE_URL}/palette/${p.id}`,
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

  // Also copy robots.txt and sitemap.xml to dist
  writeFileSync(join(distDir, 'robots.txt'), robotsTxt, 'utf-8');
  writeFileSync(join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');

  function renderPage({ path, title, description, ogImage, structuredData, bodyContent = '' }) {
    const fullUrl = `${SITE_URL}${path}`;
    const targetDir = join(distDir, path.replace(/^\//, ''));
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
    path: '/about',
    title: 'About PS color — Independent Color Discovery',
    description: 'Learn about PS color, an independent, copyright-safe, local-first palette discovery platform built for designers and developers.',
    bodyContent: '<div class="content-page"><h1>About PS color</h1><p>PS color is an independent, free-to-use color discovery workspace engineered for web designers, mobile developers, and digital artists.</p></div>'
  });

  renderPage({
    path: '/terms',
    title: 'Terms of Service',
    description: 'Terms of service for PS color. All color palettes are free for personal and commercial usage without attribution.',
    bodyContent: '<div class="content-page"><h1>Terms of Service</h1><p>All color combinations on PS color are free for personal and commercial usage.</p></div>'
  });

  renderPage({
    path: '/privacy',
    title: 'Privacy Policy',
    description: 'Privacy policy for PS color. Zero-tracking foundation with browser-local collection storage.',
    bodyContent: '<div class="content-page"><h1>Privacy Policy</h1><p>PS color is built with a strict privacy-first foundation. Zero tracking, zero telemetry.</p></div>'
  });

  renderPage({
    path: '/create',
    title: 'Create & Extract Color Palettes',
    description: 'Design custom 4-color palettes or extract dominant color harmonies instantly from photos (PNG, JPG, WebP) in your browser.',
    bodyContent: '<div class="creator"><h1>Create & Extract Color Palettes</h1><p>Build custom four-color schemes or extract palettes directly from any photo.</p></div>'
  });

  renderPage({
    path: '/popular',
    title: 'Popular Color Palettes',
    description: 'Explore the most saved and trending color palettes curated by the PS color design community.'
  });

  renderPage({
    path: '/random',
    title: 'Random Color Palettes',
    description: 'Discover unexpected color harmonies and generate fresh color ideas with random palette shuffles.'
  });

  // Category tags
  for (const tag of uniqueTags) {
    const formatted = tag[0].toUpperCase() + tag.slice(1);
    renderPage({
      path: `/palettes/${tag}`,
      title: `${formatted} Color Palettes`,
      description: `Discover curated ${tag} color palettes and combinations for design, art, and web themes.`
    });
  }

  // All 654 Palettes
  let paletteCount = 0;
  for (const p of palettes) {
    const colorsStr = p.colors.join(', ');
    const svgPreview = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="315" viewBox="0 0 600 315"><rect width="600" height="129" fill="${p.colors[0]}"/><rect y="129" width="600" height="82" fill="${p.colors[1]}"/><rect y="211" width="600" height="57" fill="${p.colors[2]}"/><rect y="268" width="600" height="47" fill="${p.colors[3]}"/></svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgPreview)}`;

    const preHtml = `
      <div class="detail" style="max-width:800px;margin:20px auto;padding:20px;">
        <h1>Color Palette ${p.colors.join(' ')}</h1>
        <div style="display:flex;height:240px;border-radius:12px;overflow:hidden;margin-bottom:24px;">
          ${p.colors.map(c => `<div style="flex:1;background:${c};display:flex;align-items:flex-end;padding:12px;color:rgba(0,0,0,0.7);font-weight:600;">${c}</div>`).join('')}
        </div>
        <p>Harmonious 4-color palette composed of <code>${colorsStr}</code>. Free for personal and commercial usage with Tailwind CSS, CSS variables, and Figma design tokens.</p>
      </div>
    `;

    renderPage({
      path: `/palette/${p.id}`,
      title: `Palette ${p.colors.join(' ')}`,
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
      bodyContent: preHtml
    });
    paletteCount++;
  }

  console.log(`✓ Prerendered ${paletteCount} palette detail pages and static routes into dist/`);
}

console.log('SEO asset generation completed successfully.\n');
