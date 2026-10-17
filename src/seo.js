/**
 * PS Color - Production Dynamic SEO & Structured Data Module
 */

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://pscolor.com').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/img/ps-color-logo.svg`;

function setMetaTag(name, content, attribute = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setJsonLd(data) {
  let script = document.querySelector('script[type="application/ld+json"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data, null, 2);
}

/**
 * Update all SEO meta tags, Open Graph, Twitter Cards, and Schema.org
 */
export function updateSeo({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  structuredData = null
}) {
  const fullUrl = `${SITE_URL}${path.startsWith('/') ? path : '/' + path}`;
  const fullTitle = title.includes('PS color') ? title : `${title} — PS color`;
  const shareImage = image || DEFAULT_IMAGE;

  // Title
  document.title = fullTitle;

  // Standard Meta
  setMetaTag('description', description);
  setCanonical(fullUrl);

  // Open Graph
  setMetaTag('og:title', fullTitle, 'property');
  setMetaTag('og:description', description, 'property');
  setMetaTag('og:url', fullUrl, 'property');
  setMetaTag('og:image', shareImage, 'property');
  setMetaTag('og:type', type, 'property');
  setMetaTag('og:site_name', 'PS color', 'property');

  // Twitter Card
  setMetaTag('twitter:card', 'summary_large_image');
  setMetaTag('twitter:title', fullTitle);
  setMetaTag('twitter:description', description);
  setMetaTag('twitter:image', shareImage);

  // Schema.org Structured Data
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'PS color',
    'url': SITE_URL,
    'description': 'Modern color discovery and palette generation tool for designers and developers.',
    'applicationCategory': 'DesignApplication',
    'operatingSystem': 'Any',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    }
  };

  setJsonLd(structuredData || defaultSchema);
}

/**
 * Generate SVG Data URL preview image for a 4-color palette
 */
export function generatePaletteSvgUrl(colors) {
  if (!colors || colors.length < 4) return DEFAULT_IMAGE;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="315" viewBox="0 0 600 315">
    <rect width="600" height="129" fill="${colors[0]}"/>
    <rect y="129" width="600" height="82" fill="${colors[1]}"/>
    <rect y="211" width="600" height="57" fill="${colors[2]}"/>
    <rect y="268" width="600" height="47" fill="${colors[3]}"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
