import './style.css';
import { palettes, categories, colorNames, tagsBank } from './palettes.js';

import {
  monetizationConfig,
  getLuminance,
  getContrast,
  getWcagRating,
  getTailwindSnippet,
  getCssSnippet,
  getFigmaTokens
} from './utils.js';

import {
  initAnalytics,
  trackPageView,
  trackPaletteView,
  trackColorCopy,
  trackPaletteCreate,
  trackImageExtract,
  trackCodeExport,
  trackAffiliateClick,
  trackEvent,
  hasUserConsent,
  setAnalyticsConsent
} from './analytics.js';

import { updateSeo, generatePaletteSvgUrl } from './seo.js';

initAnalytics();

export {
  monetizationConfig,
  getLuminance,
  getContrast,
  getWcagRating,
  getTailwindSnippet,
  getCssSnippet,
  getFigmaTokens
};

const icons = {
  new: '<path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3Z"/><path d="m19 3 .6 2.4L22 6l-2.4.6L19 9l-.6-2.4L16 6l2.4-.6L19 3Z"/>',
  popular: '<path d="M12 2c1.5 3.5 0 6-2 8-2 2-3 4-3 6a7 7 0 0 0 14 0c0-5-4-8-4-10-1.5 2-2 3-2 3s-1-4-3-7Z"/>',
  random: '<path d="m16 3 4 4-4 4M4 7h3c5 0 5 10 10 10h3M16 13l4 4-4 4M4 17h3c2 0 3-2 4-4m2-4c1-2 2-2 4-2h3"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  link: '<path d="m10 14 4-4m-5 7-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2-2 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  bookmark: '<path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  sparkle: '<path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/>'
};

const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.new}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function getSavedSet() {
  const psSaved = readStorage('ps-color-saved', []);
  const chSaved = (localStorage.getItem('myCollection') || '').split(',').filter(id => /^[a-f0-9]{24}$/i.test(id));
  const merged = [...new Set([...psSaved, ...chSaved])].map(s => s.toLowerCase());
  return new Set(merged.filter(id => /^[a-f0-9]{24}$/.test(id)));
}

let saved = getSavedSet();
let custom = readStorage('ps-color-custom', []).filter(p => /^[a-f0-9]{24}$/.test(p.id) && p.colors?.length === 4 && p.colors.every(c => /^#[a-f0-9]{6}$/i.test(c)));
let mode = 'new', tags = [], query = '', timeframe = 'Month', limit = 36, randomOrder = [], toastTimer, isLoadingMore = false;
let creatorMode = 'manual';

const all = () => [...custom, ...palettes.filter(p => !custom.some(c => c.id === p.id))];

const getPalette = id => {
  const found = all().find(p => p.id === id.toLowerCase());
  if (found) return found;
  if (/^[a-f0-9]{24}$/i.test(id)) {
    const hexParts = id.match(/.{6}/g);
    return {
      id: id.toLowerCase(),
      colors: hexParts.map(c => '#' + c.toUpperCase()),
      tags: ['custom'],
      likes: 1,
      days: 0
    };
  }
  return null;
};

function persist() {
  try {
    const list = [...saved];
    localStorage.setItem('ps-color-saved', JSON.stringify(list));
    localStorage.setItem('myCollection', list.join(','));
    localStorage.setItem('ps-color-custom', JSON.stringify(custom));
  } catch {
    toast('Browser storage is full. Your changes will last for this visit.');
  }
}

function toast(message) {
  const el = document.querySelector('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 2400);
}

async function copy(text, targetEl) {
  try {
    await navigator.clipboard.writeText(text);
    if (targetEl) {
      const existing = targetEl.querySelector('.copied');
      if (existing) existing.remove();
      const badge = document.createElement('div');
      badge.className = 'copied';
      badge.textContent = 'Copied';
      targetEl.appendChild(badge);
      setTimeout(() => badge.remove(), 1000);
    }
    toast('Copied to clipboard');
  } catch {
    toast('Could not copy. Please select and copy manually.');
  }
}

const compact = n => {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return String(n);
};

const age = days => {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} week${w > 1 ? 's' : ''}`;
  }
  if (days < 365) {
    const m = Math.floor(days / 30);
    return `${m} month${m > 1 ? 's' : ''}`;
  }
  const y = Math.floor(days / 365);
  return `${y} year${y > 1 ? 's' : ''}`;
};

const chip = (tag, active = false) => {
  const lower = tag.toLowerCase();
  const hex = colorNames[tag] || colorNames[tag[0].toUpperCase() + tag.slice(1).toLowerCase()];
  return `<button class="chip ${active ? 'selected' : ''}" data-tag="${escape(lower)}">${hex ? `<i style="background:${hex}"></i>` : ''}${escape(tag)}</button>`;
};

function hexToRgbStr(hex) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}


// APP STRUCTURE WITH NEW PS COLOR BRAND LOGO
document.querySelector('#app').innerHTML = `
  <header>
    <div class="header-inner wrap">
      <a class="brand left logo" href="/" data-route="/" aria-label="PS color home">
        <img class="logo-icon" src="/img/ps-color-logo.svg" alt="PS color icon" width="36" height="36">
        <span>PS color</span>
      </a>
      <div class="search-area">
        <div class="search-box">
          ${icon('search')}
          <div id="selected-tags"></div>
          <input id="search" placeholder="Search palettes by color, mood, or hex code" autocomplete="off" aria-label="Search palettes" aria-expanded="false" aria-controls="search-panel">
          <button id="clear-search" class="icon-button" aria-label="Clear search" hidden>${icon('close')}</button>
        </div>
        <div id="search-panel" class="dropdown" hidden></div>
      </div>
      <div class="header-right right">
        <button id="bookmark" class="button bookmark" aria-label="Bookmark PS color">
          ${icon('bookmark')}
          <span>Bookmark</span>
        </button>
        <button id="menu-toggle" class="icon-button kebab" aria-label="Open navigation menu" aria-expanded="false">
          <i></i><i></i><i></i>
        </button>
        <nav id="menu" class="dropdown" hidden>
          <a href="/" data-route="/">Palettes</a>
          <a href="/create" data-route="/create">Create & Extract</a>
          <a href="/collection" data-route="/collection">My Collection</a>
          <div class="line"></div>
          <a href="/about" data-route="/about">About PS color</a>
          <a href="/contact" data-route="/contact">Contact Us</a>
          <a href="/terms" data-route="/terms">Terms of Service</a>
          <a href="/privacy" data-route="/privacy">Privacy Policy</a>
          <div class="line"></div>
          <button data-about>Quick About</button>
          <button data-cookie-settings>Cookie Preferences</button>
          <button data-export>Export Collection (JSON)</button>
        </nav>
      </div>
    </div>
  </header>
  <div class="main wrap">
    <aside class="sidebar left">
      <nav id="navigation"></nav>
      <div class="line"></div>
      <nav id="categories" aria-label="Palette categories"></nav>
    </aside>
    <main id="content"></main>
    <aside class="info right">
      <div id="meta"></div>
      <div class="line"></div>
      <div id="collection-preview"></div>
      <div class="sidebar-sponsor">
        <div class="sponsor-badge">${escape(monetizationConfig.partners.framer.label || 'Sponsored')}</div>
        <h4>${escape(monetizationConfig.partners.framer.headline)}</h4>
        <p>${escape(monetizationConfig.partners.framer.description)}</p>
        <a href="${escape(monetizationConfig.partners.framer.url)}" target="_blank" rel="noopener sponsored">${escape(monetizationConfig.partners.framer.cta)}</a>
      </div>
    </aside>
  </div>
  <footer class="site-footer">
    <div class="footer-inner wrap">
      <div class="footer-grid">
        <div class="footer-col">
          <div class="footer-brand">
            <img src="/img/ps-color-logo.svg" alt="PS color emblem" width="28" height="28">
            <span>PS color</span>
          </div>
          <p>An independent, modern color discovery and accessibility platform engineered for web designers, mobile developers, and digital artists. 100% free for commercial use.</p>
          <p style="font-size: 12px; color: var(--text-muted);">Calculates WCAG 2.1 relative luminance and contrast, extracts dominant palettes from photos, and exports ready-to-use tokens for Tailwind CSS, CSS Custom Properties, and Figma.</p>
        </div>
        <div class="footer-col">
          <h4>Explore</h4>
          <ul class="footer-links">
            <li><a href="/" data-route="/">Newest Palettes</a></li>
            <li><a href="/popular" data-route="/popular">Popular Trends</a></li>
            <li><a href="/random" data-route="/random">Random Inspiration</a></li>
            <li><a href="/create" data-route="/create">Create & Extract</a></li>
            <li><a href="/collection" data-route="/collection">Saved Collection</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Popular Themes</h4>
          <ul class="footer-links">
            <li><a href="/palettes/pastel" data-route="/palettes/pastel">Pastel Palettes</a></li>
            <li><a href="/palettes/vintage" data-route="/palettes/vintage">Vintage Palettes</a></li>
            <li><a href="/palettes/retro" data-route="/palettes/retro">Retro Palettes</a></li>
            <li><a href="/palettes/neon" data-route="/palettes/neon">Neon Palettes</a></li>
            <li><a href="/palettes/warm" data-route="/palettes/warm">Warm & Summer</a></li>
            <li><a href="/palettes/dark" data-route="/palettes/dark">Dark & Night</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Company & Trust</h4>
          <ul class="footer-links">
            <li><a href="/about" data-route="/about">About PS color</a></li>
            <li><a href="/contact" data-route="/contact">Contact Support</a></li>
            <li><a href="/terms" data-route="/terms">Terms of Service</a></li>
            <li><a href="/privacy" data-route="/privacy">Privacy Policy</a></li>
            <li><button data-cookie-settings>Cookie Preferences</button></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <div>&copy; 2026 PS Color. All color combinations are free for commercial and personal use without attribution.</div>
        <div class="footer-bottom-links">
          <a href="/privacy" data-route="/privacy">Privacy</a>
          <a href="/terms" data-route="/terms">Terms</a>
          <a href="/contact" data-route="/contact">Contact</a>
        </div>
      </div>
    </div>
  </footer>
`;

const search = document.querySelector('#search');
const panel = document.querySelector('#search-panel');
const dialog = document.querySelector('#dialog');

function renderNavigation() {
  const navItems = [
    ['new', 'New', 'new', '/'],
    ['popular', 'Popular', 'popular', '/popular'],
    ['random', 'Random', 'random', '/random'],
    ['collection', 'Collection', 'heart', '/collection']
  ];

  document.querySelector('#navigation').innerHTML = navItems.map(([key, title, glyph, path]) => `
    <a href="${path}" data-route="${path}" class="nav-item ${mode === key ? 'active' : ''}" ${mode === key ? 'aria-current="page"' : ''}>
      ${icon(glyph)}
      <span>${title}</span>
    </a>
    ${key === 'popular' && mode === 'popular' ? `
      <div class="timeframe">
        ${['Month', 'Year', 'All time'].map(t => `<button data-time="${t}" class="${t === timeframe ? 'active' : ''}">${t}</button>`).join('')}
      </div>
    ` : ''}
  `).join('');

  document.querySelector('#categories').innerHTML = categories.map((tag, i) => `
    <a href="/palettes/${tag.toLowerCase()}" data-route="/palettes/${tag.toLowerCase()}" class="category ${tags.includes(tag.toLowerCase()) ? 'active' : ''}" style="--fade:${Math.max(0.25, 1 - Math.max(0, i - 4) * 0.06)}">${tag}</a>
  `).join('');
}

function paletteMarkup(p, mini = false) {
  return `
    <div class="palette ${mini ? 'mini' : ''}">
      ${p.colors.map((color, i) => `
        <div class="swatch swatch-${i} c${i}" style="background:${color}">
          <a href="/palette/${p.id}" data-route="/palette/${p.id}" aria-label="Open palette ${p.colors.join(', ')}"></a>
          ${mini ? '' : `<button class="hex" data-copy="${color}" aria-label="Copy ${color}">${color.slice(1).toUpperCase()}</button>`}
        </div>
      `).reverse().join('')}
    </div>
  `;
}

function card(p) {
  const liked = saved.has(p.id);
  return `
    <article class="palette-card" data-id="${p.id}">
      ${paletteMarkup(p)}
      <div class="card-bottom">
        <button class="button like ${liked ? 'liked' : ''}" data-like="${p.id}" aria-label="${liked ? 'Remove palette from' : 'Save palette to'} collection" aria-pressed="${liked}">
          ${icon('heart')}
          <span>${compact(p.likes + (liked ? 1 : 0))}</span>
        </button>
        <span class="date">${age(p.days)}</span>
      </div>
    </article>
  `;
}

function renderSponsorCard() {
  const partner = monetizationConfig.partners.figma;
  return `
    <article class="palette-sponsor sponsor-card">
      <div class="sponsor-inner">
        <div class="sponsor-badge">${escape(partner.label)}</div>
        <div class="sponsor-visual">
          <div class="sponsor-swatches">
            <span style="background:#5046E5"></span>
            <span style="background:#38D39F"></span>
            <span style="background:#FFA726"></span>
            <span style="background:#FF5376"></span>
          </div>
        </div>
        <h3>${escape(partner.headline)}</h3>
        <p>${escape(partner.description)}</p>
        <a href="${escape(partner.url)}" target="_blank" rel="noopener sponsored" class="button sponsor-btn">${escape(partner.cta)}</a>
      </div>
    </article>
  `;
}

function filtered() {
  let list = mode === 'collection' ? [...saved].reverse().map(getPalette).filter(Boolean) : all();
  const searchWords = query.toLowerCase().trim().split(/[\s,]+/).filter(Boolean);
  const words = [...tags, ...searchWords];

  if (words.length) {
    list = list.filter(p => {
      return words.every(word => {
        const cleanWord = word.replace('#', '');
        return p.tags.some(t => t.includes(cleanWord)) ||
          p.colors.some(c => c.toLowerCase().includes(cleanWord));
      });
    });
  }

  if (mode === 'popular') {
    const daysLimit = timeframe === 'Month' ? 30 : timeframe === 'Year' ? 365 : 99999;
    list = list.filter(p => p.days <= daysLimit).sort((a, b) => b.likes - a.likes);
  }

  if (mode === 'random') {
    list.sort((a, b) => randomOrder.indexOf(a.id) - randomOrder.indexOf(b.id));
  }

  return list;
}

function renderMeta() {
  if (['about', 'contact', 'terms', 'privacy', 'create'].includes(mode)) {
    document.querySelector('#meta').innerHTML = '';
    return;
  }

  const heading = tags.length ?
    `${tags.map(t => t[0].toUpperCase() + t.slice(1)).join(' & ')} Color Palettes` :
    mode === 'collection' ? 'Your Color Collection' :
    mode === 'popular' ? 'Popular Color Palettes' :
    mode === 'random' ? 'Random Color Palettes' :
    'Color Palettes for Designers and Artists';

  const sub = mode === 'collection' ?
    'Your favorite palettes, collected in one place.' :
    `Discover ${mode === 'popular' ? 'the most popular' : mode === 'random' ? 'curated, unexpected' : 'the newest hand-crafted'} palettes on PS color`;

  document.querySelector('#meta').innerHTML = `
    <h1>${escape(heading)}</h1>
    <p>${escape(sub)}</p>
  `;

  const list = [...saved].reverse().map(getPalette).filter(Boolean);
  document.querySelector('#collection-preview').innerHTML = list.length ? `
    <a class="collection-title" href="/collection" data-route="/collection">
      <span>Collection</span>
      <span>${list.length}</span>
    </a>
    <div class="mini-grid">
      ${list.slice(0, 20).map(p => `
        <div class="mini-palette-wrap">
          ${paletteMarkup(p, true)}
          <button class="mini-remove" data-unlike="${p.id}" aria-label="Remove from collection">✕</button>
        </div>
      `).join('')}
    </div>
  ` : '';
}

function renderFeed(resetScroll = true) {
  const list = filtered();
  const visible = list.slice(0, limit);

  // Insert sponsor cards after every 12 palettes cleanly
  const cardsHtml = visible.map((p, index) => {
    const cardHtml = card(p);
    if ((index + 1) % 12 === 0 && index < visible.length - 1 && ['new', 'popular', 'random'].includes(mode)) {
      return cardHtml + renderSponsorCard();
    }
    return cardHtml;
  }).join('');

  document.querySelector('#content').innerHTML = list.length ? `
    <div class="feed">${cardsHtml}</div>
    ${list.length > limit ? `
      <div class="load-more">
        <button class="button" id="load-more">Load more palettes</button>
      </div>
    ` : ''}
  ` : `
    <div class="empty">
      ${icon(mode === 'collection' ? 'heart' : 'search')}
      <h2>${mode === 'collection' && !tags.length && !query ? 'Your collection starts here' : 'No palettes found'}</h2>
      <p>${mode === 'collection' && !tags.length && !query ? 'Tap the heart on any palette to save it here.' : 'Try another color, collection, or hex code.'}</p>
      <button class="button" data-route="/">Explore palettes</button>
    </div>
  `;

  renderMeta();
}

function updateSearch() {
  document.querySelector('#selected-tags').innerHTML = tags.map(tag => `
    <button class="selected-tag" data-remove="${escape(tag)}">
      ${escape(tag)}
      <span>×</span>
    </button>
  `).join('');
  search.value = query;
  search.placeholder = tags.length ? 'Add tag' : 'Search palettes by color, mood, or hex code';
  document.querySelector('#clear-search').hidden = !tags.length && !query;
}

function renderPanel() {
  const q = search.value.trim().toLowerCase();
  const colorMatches = [];
  const collectionMatches = [];
  const relatedMatches = [];

  tagsBank.forEach(item => {
    const nameMatch = item.tag.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
    const altMatch = !nameMatch && q && item.alt.toLowerCase().split(' ').some(w => w.startsWith(q) || q.includes(w));

    if (nameMatch) {
      if (item.type === 'color') colorMatches.push(item);
      else collectionMatches.push(item);
    } else if (altMatch) {
      relatedMatches.push(item);
    }
  });

  const sections = [];
  if (colorMatches.length) {
    sections.push(`
      <section>
        <h3>Colors</h3>
        <div class="chips">
          ${colorMatches.map(t => chip(t.name, tags.includes(t.tag))).join('')}
        </div>
      </section>
    `);
  }
  if (collectionMatches.length) {
    sections.push(`
      <section>
        <h3>Collections</h3>
        <div class="chips">
          ${collectionMatches.map(t => chip(t.name, tags.includes(t.tag))).join('')}
        </div>
      </section>
    `);
  }
  if (relatedMatches.length) {
    sections.push(`
      <section>
        <h3>Related</h3>
        <div class="chips">
          ${relatedMatches.map(t => chip(t.name, tags.includes(t.tag))).join('')}
        </div>
      </section>
    `);
  }
  if (!sections.length) {
    sections.push(`
      <section>
        <p style="color:#777; margin:0;">Search by color name, style, or hex code (e.g. #FF5733).</p>
      </section>
    `);
  }

  panel.innerHTML = sections.join('');
}

function closeSearch() {
  panel.hidden = true;
  search.setAttribute('aria-expanded', 'false');
}

function closeMenu() {
  document.querySelector('#menu').hidden = true;
  document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'false');
}

function shuffle() {
  randomOrder = all().map(p => p.id);
  for (let i = randomOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomOrder[i], randomOrder[j]] = [randomOrder[j], randomOrder[i]];
  }
}

function triggerLogoPulse() {
  const logoIcon = document.querySelector('.logo-icon');
  if (logoIcon) {
    logoIcon.classList.remove('shimmer');
    void logoIcon.offsetWidth;
    logoIcon.classList.add('shimmer');
    setTimeout(() => logoIcon.classList.remove('shimmer'), 600);
  }
}

function navigate(path) {
  history.pushState({}, '', path);
  route();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function route() {
  closeSearch();
  closeMenu();
  if (dialog.open) dialog.close();

  const path = location.pathname.split('/').filter(Boolean);
  const root = path[0] || '';

  tags = root === 'palettes' ?
    (path[1] || '').split('-').filter(t => tagsBank.some(item => item.tag === t.toLowerCase())) :
    [];

  mode = ['popular', 'random', 'collection', 'palette', 'create', 'about', 'contact', 'terms', 'privacy'].includes(root) ? root : 'new';
  query = '';
  limit = 36;

  if (mode === 'random') shuffle();

  updateSearch();
  renderNavigation();

  if (root === 'palette') {
    renderDetail(path[1]);
  } else if (root === 'create') {
    renderCreator();
  } else if (root === 'about') {
    renderAboutPage();
  } else if (root === 'contact') {
    renderContactPage();
  } else if (root === 'terms') {
    renderTermsPage();
  } else if (root === 'privacy') {
    renderPrivacyPage();
  } else {
    renderFeed();
  }

  if (root === 'palette') {
    const p = getPalette(path[1]);
    if (p) {
      updateSeo({
        title: `Palette ${p.colors.join(' ')}`,
        description: `Explore and copy hex codes for palette ${p.colors.join(', ')}. Includes Tailwind CSS snippet, CSS variables, Figma tokens, and WCAG contrast check.`,
        path: `/palette/${p.id}`,
        image: generatePaletteSvgUrl(p.colors),
        type: 'article',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'VisualArtwork',
          'name': `Color Palette ${p.id}`,
          'artMedium': 'Digital Color Scheme',
          'artworkSurface': 'Digital Screen',
          'description': `Harmonious 4-color palette composed of ${p.colors.join(', ')}.`,
          'creator': {
            '@type': 'Organization',
            'name': 'PS color',
            'url': 'https://www.pscolor.online'
          },
          'keywords': (p.tags || []).join(', ')
        }
      });
      trackPaletteView(p.id, p.colors);
    } else {
      updateSeo({
        title: 'Palette Not Found',
        description: 'The requested color palette could not be found on PS color.',
        path: location.pathname
      });
    }
  } else if (root === 'create') {
    updateSeo({
      title: 'Create & Extract Color Palettes',
      description: 'Design custom 4-color palettes or extract dominant color harmonies instantly from photos (PNG, JPG, WebP) in your browser.',
      path: '/create'
    });
  } else if (root === 'about') {
    updateSeo({
      title: 'About PS color — Independent Color Discovery',
      description: 'Learn about PS color, an independent, copyright-safe, local-first palette discovery platform built for designers and developers.',
      path: '/about'
    });
  } else if (root === 'contact') {
    updateSeo({
      title: 'Contact Us — PS color Support & Inquiries',
      description: 'Contact the PS color team for support, feature requests, commercial inquiries, partnership questions, and publisher feedback.',
      path: '/contact'
    });
  } else if (root === 'terms') {
    updateSeo({
      title: 'Terms of Service',
      description: 'Terms of service for PS color. All color palettes are free for personal and commercial usage without attribution.',
      path: '/terms'
    });
  } else if (root === 'privacy') {
    updateSeo({
      title: 'Privacy Policy',
      description: 'Privacy policy for PS color. Zero-tracking foundation with browser-local collection storage.',
      path: '/privacy'
    });
  } else if (root === 'collection') {
    updateSeo({
      title: 'My Collection',
      description: 'View, organize, and export your personal color palette collection saved locally in your browser.',
      path: '/collection'
    });
  } else if (tags.length) {
    const tagTitle = tags.map(t => t[0].toUpperCase() + t.slice(1)).join(' & ');
    updateSeo({
      title: `${tagTitle} Color Palettes`,
      description: `Discover the best ${tags.join(' and ')} color combinations and palettes for web design, graphic projects, and UI themes.`,
      path: `/palettes/${tags.join('-')}`
    });
  } else if (mode === 'popular') {
    updateSeo({
      title: 'Popular Color Palettes',
      description: 'Explore the most saved and trending color palettes curated by the PS color design community.',
      path: '/popular'
    });
  } else if (mode === 'random') {
    updateSeo({
      title: 'Random Color Palettes',
      description: 'Discover unexpected color harmonies and generate fresh color ideas with random palette shuffles.',
      path: '/random'
    });
  } else {
    updateSeo({
      title: 'Color Palettes for Designers and Artists',
      description: 'Browse hundreds of curated 4-color palettes with hex codes, RGB values, CSS variables, and Figma design tokens. 100% free for commercial use.',
      path: '/'
    });
  }

  trackPageView(location.pathname, document.title);
}

function toggleLike(id) {
  if (saved.has(id)) {
    saved.delete(id);
  } else {
    saved.add(id);
    triggerLogoPulse();
  }
  persist();

  if (location.pathname.startsWith('/palette/')) {
    renderDetail(id);
  } else {
    renderFeed(false);
  }
}


function openExportModal(id) {
  const p = getPalette(id);
  if (!p) return;
  const tailwind = getTailwindSnippet(p.colors);
  const css = getCssSnippet(p.colors);
  const tokens = getFigmaTokens(p.colors);

  showDialog('Export Palette Code', `
    <div class="code-modal-header">
      <button class="code-modal-tab active" data-tab="tailwind">Tailwind CSS</button>
      <button class="code-modal-tab" data-tab="css">CSS Variables</button>
      <button class="code-modal-tab" data-tab="tokens">Figma Tokens</button>
    </div>
    <div id="code-tab-tailwind">
      <pre class="code-pre"><code>${escape(tailwind)}</code></pre>
      <button class="button primary" data-copy-text="${escape(tailwind)}">Copy Tailwind Config</button>
    </div>
    <div id="code-tab-css" hidden>
      <pre class="code-pre"><code>${escape(css)}</code></pre>
      <button class="button primary" data-copy-text="${escape(css)}">Copy CSS Variables</button>
    </div>
    <div id="code-tab-tokens" hidden>
      <pre class="code-pre"><code>${escape(tokens)}</code></pre>
      <button class="button primary" data-copy-text="${escape(tokens)}">Copy Figma Tokens (JSON)</button>
    </div>
  `);
}

function getPaletteEditorial(p) {
  const tagList = p.tags && p.tags.length ? p.tags.join(', ') : 'modern, digital';
  const c1 = p.colors[0].toUpperCase();
  const c2 = p.colors[1].toUpperCase();
  const c3 = p.colors[2].toUpperCase();
  const c4 = p.colors[3].toUpperCase();
  
  const hasWarm = p.tags.some(t => ['warm', 'summer', 'sunset', 'orange', 'red', 'yellow', 'gold'].includes(t.toLowerCase()));
  const hasCool = p.tags.some(t => ['cold', 'winter', 'sky', 'sea', 'blue', 'teal', 'mint'].includes(t.toLowerCase()));
  const tempDesc = hasWarm && hasCool ? 'balanced warm and cool tones' : hasWarm ? 'radiant, energetic warm tones' : hasCool ? 'refreshing, tranquil cool hues' : 'harmonious complementary tones';

  const narrative = `This four-color scheme pairs ${c1}, ${c2}, ${c3}, and ${c4} to create ${tempDesc} tailored for ${tagList} aesthetics. In digital product interfaces, utilize the 41% base canvas (${c1}) to anchor background surfaces, map the 26% secondary tone (${c2}) to cards and containers, employ the 18% tier (${c3}) for clean structural borders, and leverage the 15% focal accent (${c4}) for interactive CTA buttons, badges, and high-impact micro-interactions.`;

  return { narrative };
}

function renderDetail(id) {
  const p = getPalette(id);
  if (!p) {
    document.querySelector('#content').innerHTML = `
      <div class="empty">
        <h2>Palette not found</h2>
        <button class="button" data-route="/">Explore palettes</button>
      </div>
    `;
    return;
  }

  const liked = saved.has(p.id);
  const cssVars = getCssSnippet(p.colors);
  const contrast = getContrast(p.colors[0], p.colors[3]);
  const rating = getWcagRating(contrast);
  const contrast2 = getContrast(p.colors[1], p.colors[3]);
  const rating2 = getWcagRating(contrast2);
  const editorial = getPaletteEditorial(p);

  document.querySelector('#content').innerHTML = `
    <div class="detail">
      <a class="back" href="/" data-route="/">← Back to palettes</a>
      ${paletteMarkup(p)}
      <div class="detail-actions">
        <button class="button like ${liked ? 'liked' : ''}" data-like="${p.id}" aria-pressed="${liked}">
          ${icon('heart')}
          <span>${liked ? 'Saved' : 'Save'}</span>
        </button>
        <button class="button" data-download="${p.id}">
          ${icon('download')}
          <span>Download PNG</span>
        </button>
        <button class="button" data-open-export="${p.id}">
          ${icon('code')}
          <span>Export Code</span>
        </button>
        <button class="button" data-copy-css="${escape(cssVars)}" style="display:none">
          ${icon('code')}
          <span>Copy CSS</span>
        </button>
        <button class="button" data-link="${p.id}">
          ${icon('link')}
          <span>Share Link</span>
        </button>
      </div>
      <div class="color-table">
        ${p.colors.map(c => `
          <button data-copy="${c}" class="color-row">
            <i class="ball" style="background:${c}"></i>
            <span class="hex-val">${c.toUpperCase()}</span>
            <span class="rgb">RGB (${hexToRgbStr(c)})</span>
          </button>
        `).join('')}
      </div>

      <div class="contrast-section">
        <div class="contrast-header">
          <span>Accessibility Contrast (${p.colors[0]} & ${p.colors[3]})</span>
          <span class="contrast-badge ${rating.pass ? 'pass' : 'fail'}">${escape(rating.label)}</span>
        </div>
        <div class="contrast-score">Ratio: ${contrast}:1</div>
      </div>

      <div class="palette-guide-section" style="max-width: 580px; margin: 24px auto 0; padding: 22px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-card); text-align: left;">
        <h3 style="font-size: 16px; margin: 0 0 10px 0; color: var(--text-main);">Palette Design Guide &amp; UI Applications</h3>
        <p style="font-size: 13.5px; line-height: 1.6; color: var(--text-muted); margin: 0 0 16px 0;">${editorial.narrative}</p>
        
        <h4 style="font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-main); margin: 0 0 8px 0;">Recommended UI Weight Distribution</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12.5px; margin-bottom: 16px;">
          <div style="padding: 8px 10px; background: var(--bg-base); border-radius: 6px;"><strong style="color:var(--text-main)">● 41% Base:</strong> Canvas background (${p.colors[0]})</div>
          <div style="padding: 8px 10px; background: var(--bg-base); border-radius: 6px;"><strong style="color:var(--text-main)">● 26% Surface:</strong> Card &amp; panel fills (${p.colors[1]})</div>
          <div style="padding: 8px 10px; background: var(--bg-base); border-radius: 6px;"><strong style="color:var(--text-main)">● 18% Structure:</strong> Borders &amp; dividers (${p.colors[2]})</div>
          <div style="padding: 8px 10px; background: var(--bg-base); border-radius: 6px;"><strong style="color:var(--text-main)">● 15% Accent:</strong> Primary CTA &amp; focus (${p.colors[3]})</div>
        </div>

        <h4 style="font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-main); margin: 0 0 8px 0;">WCAG 2.1 Accessibility Matrix</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; background:var(--bg-base); border-radius:6px;">
            <span>Canvas (${p.colors[0]}) &amp; Accent</span>
            <span class="contrast-badge ${rating.pass ? 'pass' : 'fail'}" style="font-size:10px; padding:2px 6px;">${contrast}:1 (${rating.level.toUpperCase()})</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; background:var(--bg-base); border-radius:6px;">
            <span>Surface (${p.colors[1]}) &amp; Accent</span>
            <span class="contrast-badge ${rating2.pass ? 'pass' : 'fail'}" style="font-size:10px; padding:2px 6px;">${contrast2}:1 (${rating2.level.toUpperCase()})</span>
          </div>
        </div>
      </div>

      <div class="chips detail-tags">
        ${p.tags.map(t => chip(t)).join('')}
      </div>
      <h2 class="related-title">Related Color Inspiration</h2>
      <div class="related-feed">
        ${all().filter(x => x.id !== p.id && x.tags.some(t => p.tags.includes(t))).slice(0, 6).map(card).join('')}
      </div>
    </div>
  `;
  renderMeta();
}

function downloadPalette(id) {
  const p = getPalette(id);
  if (!p) return;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');

  let y = 0;
  const ratios = [0.41, 0.26, 0.18, 0.15];
  ratios.forEach((ratio, i) => {
    const h = ratio * 1080;
    ctx.fillStyle = p.colors[i];
    ctx.fillRect(0, y, 1200, h);

    // Color text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.font = '600 24px Plus Jakarta Sans, sans-serif';
    ctx.fillText(p.colors[i].toUpperCase(), 36, y + h - 26);
    y += h;
  });

  // Footer bar
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 1080, 1200, 120);

  ctx.fillStyle = '#111116';
  ctx.font = '700 32px Plus Jakarta Sans, sans-serif';
  ctx.fillText('PS color', 40, 1152);

  ctx.fillStyle = '#777788';
  ctx.font = '500 20px JetBrains Mono, monospace';
  ctx.fillText('ps-color.palette/' + id, 220, 1150);

  canvas.toBlob(blob => {
    if (blob) downloadBlob(blob, `ps-color-${id}.png`);
  }, 'image/png');
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showDialog(title, body) {
  dialog.innerHTML = `
    <button class="icon-button dialog-close" data-close aria-label="Close dialog">${icon('close')}</button>
    <h2>${title}</h2>
    ${body}
  `;
  dialog.showModal();
}

// IMAGE EXTRACTOR HELPER
export function extractPaletteFromImage(imgElement) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;
    ctx.drawImage(imgElement, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;
    const pixels = [];
    for (let i = 0; i < data.length; i += 16) {
      if (data[i + 3] > 128) {
        pixels.push([data[i], data[i + 1], data[i + 2]]);
      }
    }

    if (!pixels.length) {
      toast('No visible colors detected in image. Please choose another image.');
      return false;
    }

    pixels.sort((a, b) => (0.299*a[0] + 0.587*a[1] + 0.114*a[2]) - (0.299*b[0] + 0.587*b[1] + 0.114*b[2]));
    const step = Math.floor(pixels.length / 4);
    const selected = [];
    for (let i = 0; i < 4; i++) {
      const idx = Math.min(pixels.length - 1, i * step + Math.floor(step / 2));
      const p = pixels[idx] || [128, 128, 128];
      const hex = '#' + [p[0], p[1], p[2]].map(x => {
        const h = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return h.length === 1 ? '0' + h : h;
      }).join('').toUpperCase();
      selected.push(hex);
    }
    // Order from lightest to darkest for natural card look
    selected.reverse();
    selected.forEach((c, i) => {
      const colorEl = document.querySelector(`input[name="color${i}"]`);
      const hexEl = document.querySelector(`[data-color-index="${i}"]`);
      if (colorEl) colorEl.value = c;
      if (hexEl) hexEl.value = c;
    });
    updateCreator();
    toast('Extracted 4 colors from image!');
    trackImageExtract('image');
    return true;
  } catch (err) {
    toast('Could not extract colors from image.');
    return false;
  }
}

function processImageFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    toast('Please select a valid image file (PNG, JPG, or WebP).');
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => toast('Error reading the selected image file.');
  reader.onload = evt => {
    const img = new Image();
    img.onerror = () => toast('Invalid or corrupted image file.');
    img.onload = () => extractPaletteFromImage(img);
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

function renderCreator() {
  document.querySelector('#content').innerHTML = `
    <div class="creator">
      <h1>Create & Extract Color Palettes</h1>
      <p>Build custom four-color schemes or extract palettes directly from any photo.</p>

      <div class="creator-mode-tabs">
        <button type="button" class="${creatorMode === 'manual' ? 'active' : ''}" data-creator-mode="manual">Manual Studio</button>
        <button type="button" class="${creatorMode === 'extract' ? 'active' : ''}" data-creator-mode="extract">${icon('upload')}Extract from Photo</button>
      </div>

      <div id="dropzone-area" class="dropzone" ${creatorMode === 'extract' ? '' : 'hidden'}>
        ${icon('upload')}
        <strong>Upload or Drop an Image</strong>
        <p>Supports PNG, JPG, WebP. We sample dominant color harmonies instantly in your browser.</p>
        <input type="file" id="image-upload-input" accept="image/*" style="display:none">
      </div>

      <div id="create-preview" class="create-preview"></div>
      <form id="create-form">
        <div class="color-inputs">
          ${['#F7F0DC', '#D9E4C8', '#A2B89B', '#52796F'].map((c, i) => `
            <label>
              Color ${i + 1}
              <input type="color" name="color${i}" value="${c}" aria-label="Choose color ${i + 1}">
              <input type="text" class="hex-input" data-color-index="${i}" value="${c}" pattern="#[a-fA-F0-9]{6}" maxlength="7" aria-label="Color ${i + 1} hex code" required>
            </label>
          `).join('')}
        </div>
        <div class="creator-actions">
          <button type="button" id="randomize" class="button">${icon('random')}Randomize</button>
          <button type="submit" class="button primary">${icon('plus')}Save Palette</button>
        </div>
        <p class="storage-note">Your palette is stored locally in your browser collection.</p>
      </form>
    </div>
  `;
  updateCreator();
}

function updateCreator() {
  const colors = [...document.querySelectorAll('input[type=color]')].map(el => el.value);
  const preview = document.querySelector('#create-preview');
  if (!preview) return;
  preview.innerHTML = colors.map((c, i) => `
    <div style="background:${c};flex:${[41, 26, 18, 15][i]}">
      <span>${c.toUpperCase()}</span>
    </div>
  `).join('');
}

function renderAboutPage() {
  document.querySelector('#content').innerHTML = `
    <div class="content-page">
      <a class="back" href="/" data-route="/">← Back to palettes</a>
      <h1>About PS color</h1>
      <p class="lead" style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: var(--text-main);">PS color is an independent, free-to-use color discovery workspace engineered for web designers, mobile developers, digital artists, and brand strategists. We provide curated four-color palettes, real-time WCAG 2.1 accessibility contrast validation, intelligent image-to-palette extraction, and instant multi-format developer token export.</p>
      
      <h2>Our Philosophy: Visual Hierarchy & Harmony</h2>
      <p>Color theory is fundamental to user experience, brand recognition, and visual ergonomics. Unlike random color generators that produce disconnected hues, every four-color palette on PS color follows an intentional visual weight hierarchy inspired by classical composition:</p>
      <ul style="margin: 12px 0 20px 20px; line-height: 1.8;">
        <li><strong>Base Canvas (41%):</strong> The dominant primary background or canvas tone establishing visual stability and ambiance.</li>
        <li><strong>Structural Surface (26%):</strong> Card surfaces, secondary containers, sidebars, and structural content sections.</li>
        <li><strong>Secondary Complement (18%):</strong> Borders, subtle dividers, secondary typography, and muted interactive states.</li>
        <li><strong>Focal Accent (15%):</strong> High-contrast callouts, primary buttons, badges, key metrics, and brand emphasis points.</li>
      </ul>

      <h2>Accessibility & WCAG 2.1 Compliance</h2>
      <p>Accessible design is a core principle of modern software engineering. PS color computes relative luminance using the linearized sRGB formula recommended by the World Wide Web Consortium (W3C):</p>
      <p style="background: var(--bg-surface); padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-btn); font-family: monospace; font-size: 13px;">L = 0.2126 × R + 0.7152 × G + 0.0722 × B</p>
      <p>We evaluate contrast ratios ($[L_1 + 0.05] / [L_2 + 0.05]$) directly within each palette to classify pairings against WCAG Level AA (4.5:1), AAA (7.0:1), and AA Large Text (3.0:1) standards. This guarantees your digital interfaces remain legible for all users across diverse display environments.</p>

      <h2>Developer Token Ecosystem</h2>
      <p>Bridging design and production code should be frictionless. PS color automatically translates every curated and user-generated palette into ready-to-paste developer tokens:</p>
      <ul style="margin: 12px 0 20px 20px; line-height: 1.8;">
        <li><strong>Tailwind CSS:</strong> Ready-to-paste <code>theme.extend.colors</code> module configuration objects.</li>
        <li><strong>CSS Custom Properties:</strong> Scoped <code>:root</code> variables (<code>--color-1</code> through <code>--color-4</code>).</li>
        <li><strong>Figma Design Tokens:</strong> Standardized W3C/DTCG JSON token schemas compatible with Figma Variables and Tokens Studio.</li>
      </ul>

      <h2>100% Free Personal & Commercial License</h2>
      <p>Every palette on PS color is free for personal and commercial usage in websites, mobile apps, SaaS applications, brand packaging, and print media without mandatory attribution. You hold complete ownership over any derivative designs you create.</p>

      <h2>Publisher & Operational Transparency</h2>
      <p>PS color is operated by PS Color Studio as an independent digital creative resource. For partnership inquiries, feedback, or technical assistance, visit our <a href="/contact" data-route="/contact">Contact Page</a> or email us at <code>support@pscolor.online</code>.</p>

      <div style="margin-top: 32px; display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="button primary" data-route="/">Browse Palettes</button>
        <button class="button" data-route="/create">Create Custom Palette</button>
      </div>
    </div>
  `;
  renderMeta();
}

function renderContactPage() {
  document.querySelector('#content').innerHTML = `
    <div class="content-page">
      <a class="back" href="/" data-route="/">← Back to palettes</a>
      <h1>Contact PS color</h1>
      <p class="lead" style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: var(--text-main);">Have a question about our color discovery algorithms, design token exports, commercial licensing, or publisher partnerships? We welcome inquiries and respond promptly.</p>
      
      <div class="contact-grid">
        <div class="contact-info-card">
          <div class="contact-info-item">
            <h3>Support & General Inquiries</h3>
            <p>For help with palette creation, image extraction, or technical issues:</p>
            <p><a href="mailto:support@pscolor.online" style="color: var(--accent-color, #2563eb); font-weight: 600;">support@pscolor.online</a></p>
          </div>
          <div class="contact-info-item">
            <h3>Partnerships & Advertising</h3>
            <p>For design tool integrations, sponsored features, and commercial opportunities:</p>
            <p><a href="mailto:partners@pscolor.online" style="color: var(--accent-color, #2563eb); font-weight: 600;">partners@pscolor.online</a></p>
          </div>
          <div class="contact-info-item">
            <h3>Legal & Copyright (DMCA)</h3>
            <p>For copyright notices, privacy policy inquiries, or legal concerns:</p>
            <p><a href="mailto:legal@pscolor.online" style="color: var(--accent-color, #2563eb); font-weight: 600;">legal@pscolor.online</a></p>
          </div>
          <div class="contact-info-item" style="margin-bottom: 0;">
            <h3>Operating Publisher</h3>
            <p style="margin: 0;"><strong>PS Color Studio</strong><br>Independent Design &amp; Developer Tools Platform<br>Global Availability &bull; Cloudflare Edge Network<br>Response Time: Within 24–48 business hours</p>
          </div>
        </div>

        <div class="contact-form-wrapper">
          <form class="contact-form" id="contact-form" novalidate data-rendered-at="${Date.now()}">
            <h3 style="margin: 0 0 4px 0; font-size: 18px;">Send a Direct Message</h3>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: var(--text-muted);">Fill out this form and our support team will get back to you via email.</p>
            
            <div id="contact-success" class="contact-alert success" role="alert" aria-live="polite" hidden>
              ✓ Thank you! Your message has been sent successfully. We will reply within 24–48 hours.
            </div>

            <div id="contact-error" class="contact-alert error" role="alert" aria-live="assertive" hidden></div>

            <!-- Anti-spam honeypot (hidden from human visitors) -->
            <input type="checkbox" name="botcheck" id="contact-botcheck" style="display:none !important;" tabindex="-1" autocomplete="off">

            <div class="form-group">
              <label for="contact-name">Your Name <span class="required" aria-hidden="true">*</span></label>
              <input type="text" id="contact-name" name="name" required placeholder="e.g. Alex Rivera" autocomplete="name" maxlength="80">
              <span class="field-error" id="name-error" hidden></span>
            </div>
            
            <div class="form-group">
              <label for="contact-email">Email Address <span class="required" aria-hidden="true">*</span></label>
              <input type="email" id="contact-email" name="email" required placeholder="e.g. alex@example.com" autocomplete="email" maxlength="120">
              <span class="field-error" id="email-error" hidden></span>
            </div>

            <div class="form-group">
              <label for="contact-topic">Inquiry Topic <span class="required" aria-hidden="true">*</span></label>
              <select id="contact-topic" name="topic" required>
                <option value="support">General Support &amp; Feature Feedback</option>
                <option value="partnership">Commercial / Partnership Inquiry</option>
                <option value="bug">Bug Report / Technical Issue</option>
                <option value="privacy">Privacy / Data Protection</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            <div class="form-group">
              <label for="contact-subject">Subject <span class="required" aria-hidden="true">*</span></label>
              <input type="text" id="contact-subject" name="subject" required placeholder="Brief summary of your inquiry" maxlength="120" autocomplete="off">
              <span class="field-error" id="subject-error" hidden></span>
            </div>

            <div class="form-group">
              <label for="contact-message">Message <span class="required" aria-hidden="true">*</span></label>
              <textarea id="contact-message" name="message" required placeholder="Please describe your question or feedback in detail (at least 10 characters)..." maxlength="5000"></textarea>
              <span class="field-error" id="message-error" hidden></span>
            </div>

            <button type="submit" id="contact-submit-btn" class="button primary" style="padding: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
              <span>Send Message</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
  renderMeta();
}

let isContactSubmitting = false;

async function handleContactSubmit(e) {
  e.preventDefault();
  if (isContactSubmitting) return;

  const form = e.target;
  const successEl = form.querySelector('#contact-success');
  const errorEl = form.querySelector('#contact-error');
  const submitBtn = form.querySelector('#contact-submit-btn') || form.querySelector('button[type="submit"]');

  // Reset top alerts
  if (successEl) successEl.hidden = true;
  if (errorEl) {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  // Clear previous inline field errors
  form.querySelectorAll('.field-error').forEach(el => {
    el.hidden = true;
    el.textContent = '';
  });
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.removeAttribute('aria-invalid');
  });

  // Extract field values
  const nameInput = form.querySelector('#contact-name');
  const emailInput = form.querySelector('#contact-email');
  const topicInput = form.querySelector('#contact-topic');
  const subjectInput = form.querySelector('#contact-subject');
  const messageInput = form.querySelector('#contact-message');
  const botcheckInput = form.querySelector('#contact-botcheck');

  const name = (nameInput?.value || '').trim();
  const email = (emailInput?.value || '').trim();
  const topic = (topicInput?.value || '').trim();
  const subject = (subjectInput?.value || '').trim();
  const message = (messageInput?.value || '').trim();

  // Spam protection 1: Honeypot check
  if (botcheckInput && (botcheckInput.checked || botcheckInput.value === 'true')) {
    console.warn('Bot submission blocked via honeypot.');
    if (successEl) successEl.hidden = false;
    form.reset();
    return;
  }

  // Spam protection 2: Submission elapsed time (< 1200ms is automated)
  const renderedAt = Number(form.dataset.renderedAt || 0);
  if (renderedAt && (Date.now() - renderedAt < 1200)) {
    if (errorEl) {
      errorEl.textContent = 'Please take a moment to review your message before submitting.';
      errorEl.hidden = false;
    }
    return;
  }

  // Client-side field validations
  const errors = {};
  if (!name || name.length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  if (!email || !emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!subject || subject.length < 3) {
    errors.subject = 'Please enter a subject (at least 3 characters).';
  }

  if (!message || message.length < 10) {
    errors.message = 'Please enter a message (at least 10 characters).';
  }

  const errorFields = Object.keys(errors);
  if (errorFields.length > 0) {
    errorFields.forEach(field => {
      const errSpan = form.querySelector(`#${field}-error`);
      const inputEl = form.querySelector(`#contact-${field}`);
      if (errSpan) {
        errSpan.textContent = errors[field];
        errSpan.hidden = false;
      }
      if (inputEl) {
        inputEl.setAttribute('aria-invalid', 'true');
      }
    });

    const firstInvalid = form.querySelector(`#contact-${errorFields[0]}`);
    if (firstInvalid) firstInvalid.focus();

    if (errorEl) {
      errorEl.textContent = 'Please correct the highlighted fields and try again.';
      errorEl.hidden = false;
    }
    return;
  }

  // Read Web3Forms access key from environment
  const accessKey = (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '').trim();
  if (!accessKey) {
    if (errorEl) {
      errorEl.textContent = 'Contact submission is currently unconfigured. Please email us directly at support@pscolor.online.';
      errorEl.hidden = false;
    }
    return;
  }

  // Prevent duplicate submissions & set loading state
  isContactSubmitting = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.innerHTML = '<span>Sending message...</span>';
  }

  try {
    const payload = {
      access_key: accessKey,
      name,
      email,
      subject: `[PS Color Contact: ${topic.toUpperCase()}] ${subject}`,
      topic,
      message,
      from_name: 'PS Color Contact Form',
      botcheck: ''
    };

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 200 && data.success) {
      if (successEl) {
        successEl.textContent = '✓ Thank you! Your message has been sent successfully. We will reply within 24–48 hours.';
        successEl.hidden = false;
      }
      form.reset();
      form.dataset.renderedAt = String(Date.now());
      // Track generic submission event in GA4 (Zero PII logged)
      trackEvent('contact_form_submit', { topic });
    } else {
      const errorMsg = data.message || 'Unable to deliver your message. Please email us directly at support@pscolor.online.';
      if (errorEl) {
        errorEl.textContent = errorMsg;
        errorEl.hidden = false;
      }
      trackEvent('contact_form_fail', { reason: 'api_error' });
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Network error: could not connect to submission server. Please email support@pscolor.online directly.';
      errorEl.hidden = false;
    }
    trackEvent('contact_form_fail', { reason: 'network_error' });
  } finally {
    isContactSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      submitBtn.innerHTML = '<span>Send Message</span>';
    }
  }
}

function renderTermsPage() {
  document.querySelector('#content').innerHTML = `
    <div class="content-page">
      <a class="back" href="/" data-route="/">← Back to palettes</a>
      <h1>Terms of Service</h1>
      <p class="lead" style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">Effective Date: October 17, 2026. Welcome to PS color. By accessing or using our website (pscolor.online), you agree to be bound by these Terms of Service.</p>
      
      <h2>1. Free Personal and Commercial License</h2>
      <p>All color palette arrangements, color swatches, hex codes, and RGB values published on PS color are provided under an open, royalty-free license. You may freely use, modify, embed, and reproduce these color schemes in any medium, including commercial websites, mobile software, SaaS applications, brand guidelines, printed materials, and video games without attribution or licensing fees.</p>

      <h2>2. User-Generated Palettes & Image Extraction</h2>
      <p>When you design palettes using our Palette Creator or extract color values from uploaded images, all processing occurs directly within your browser client. We do not claim ownership of any original imagery you upload or derivative designs you produce.</p>

      <h2>3. Intellectual Property & Brand Trademarks</h2>
      <p>The PS color name, custom emblem logo, platform user interface design, source code architecture, and proprietary documentation are protected intellectual property of PS Color Studio. You may not replicate, redistribute, or frame the PS color platform as a competing turnkey service without prior written authorization.</p>

      <h2>4. Sponsored Placements & Affiliate Links</h2>
      <p>PS color participates in affiliate and sponsored referral programs with design software partners (such as Figma and Framer). In accordance with the Federal Trade Commission (FTC) guidelines and Google Publisher Policies, sponsored cards and partner links are visibly disclosed as "Sponsored" or "Partner". We may receive compensation if you choose to sign up or make a purchase through these links, at no extra cost to you.</p>

      <h2>5. Disclaimer of Warranties</h2>
      <p>The PS color platform is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. While we strive for continuous uptime and rigorous WCAG calculation accuracy, we do not warrant that service will be uninterrupted, error-free, or compatible with all third-party systems.</p>

      <h2>6. Limitation of Liability</h2>
      <p>In no event shall PS Color Studio, its operators, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your access to or inability to use the service.</p>

      <h2>7. Modifications to Terms</h2>
      <p>We reserve the right to revise these terms as platform capabilities expand. Significant updates will be reflected with a revised Effective Date at the top of this page.</p>

      <h2>8. Governing Law & Contact</h2>
      <p>If you have any questions or legal inquiries regarding these Terms of Service, please contact our legal desk at <a href="mailto:legal@pscolor.online">legal@pscolor.online</a> or through our <a href="/contact" data-route="/contact">Contact Page</a>.</p>
    </div>
  `;
  renderMeta();
}

function renderPrivacyPage() {
  const consent = hasUserConsent();
  document.querySelector('#content').innerHTML = `
    <div class="content-page">
      <a class="back" href="/" data-route="/">← Back to palettes</a>
      <h1>Privacy Policy</h1>
      <p class="lead" style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">Effective Date: October 17, 2026. At PS color (pscolor.online), your privacy is a paramount priority. This Privacy Policy details the types of information we handle, our cookie practices, and how third-party advertising partners operate on our platform.</p>

      <h2>1. Local-First Architecture (Browser Storage)</h2>
      <p>PS color is built on a privacy-respecting local-first paradigm:</p>
      <ul style="margin: 10px 0 16px 20px; line-height: 1.8;">
        <li><strong>Saved Palettes & Collections:</strong> Your liked palettes and custom color creations persist solely in your browser's client-side <code>localStorage</code>. This data never touches a remote database and remains completely on your device.</li>
        <li><strong>JSON Export & Data Portability:</strong> You can export your entire collection at any moment using our "Export Collection (JSON)" tool, or clear it instantly via your browser settings.</li>
        <li><strong>Image Extraction Privacy:</strong> When you use our "Extract from Photo" tool, images are processed locally in an HTML5 canvas element. Photos are never uploaded to any remote server or stored in the cloud.</li>
      </ul>

      <h2>2. Google AdSense & Third-Party Advertising Disclosures</h2>
      <p>To support the free availability of our platform, PS color works with digital advertising partners, including Google AdSense. In compliance with Google Publisher Policies, we disclose the following:</p>
      <ul style="margin: 10px 0 16px 20px; line-height: 1.8;">
        <li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites on the Internet.</li>
        <li>Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visits to your sites and/or other sites on the Internet.</li>
        <li>Users may opt out of personalized advertising at any time by visiting <a href="https://myadcenter.google.com/" target="_blank" rel="noopener">Google My Ad Center</a>.</li>
        <li>Alternatively, users can opt out of a third-party vendor's use of cookies for personalized advertising by visiting the <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener">Network Advertising Initiative Consumer Choice Page (aboutads.info)</a>.</li>
        <li>For comprehensive details on how Google handles advertising data, review <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">How Google uses information from sites or apps that use our services</a>.</li>
      </ul>

      <h2>3. Cookies & Consent Management (GDPR & ePrivacy)</h2>
      <p>For visitors residing in the European Economic Area (EEA), United Kingdom, and Switzerland:</p>
      <p>We deploy Google-certified Consent Management Platform (CMP) standards compliant with the IAB Europe Transparency and Consent Framework (TCF v2.2). Non-essential cookies and personalized ad targeting are only loaded following affirmative user consent. You can modify your preferences at any time using our Cookie Preferences dialog or the telemetry toggle below.</p>

      <div style="margin: 24px 0; padding: 18px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-card);">
        <h3 style="margin: 0 0 8px 0; font-size: 15px;">Anonymous Telemetry &amp; Cookie Preferences</h3>
        <p style="margin: 0 0 12px 0; font-size: 13px;">Manage whether anonymous aggregated telemetry is shared to help improve palette search and performance. We strictly honor browser Do Not Track (DNT) signals.</p>
        <p style="margin: 0 0 14px 0;"><strong>Telemetry Status:</strong> <span id="consent-status-text" style="font-weight: 600;">${consent ? 'Active (Anonymous Aggregate)' : 'Disabled / Opted Out'}</span></p>
        <button id="toggle-consent" class="button">${consent ? 'Disable Anonymous Telemetry' : 'Enable Anonymous Telemetry'}</button>
      </div>

      <h2>4. California Consumer Privacy Act (CCPA / CPRA)</h2>
      <p>Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), California residents have specific rights regarding their personal information. PS color does not sell personal information, nor do we disclose personal data to third parties for monetary consideration. You have the right to request deletion and access your data, which can also be done locally by clearing browser storage.</p>

      <h2>5. Do Not Track (DNT) & Global Privacy Control (GPC)</h2>
      <p>Our platform automatically checks for browser <code>navigator.doNotTrack</code> and Global Privacy Control headers. When detected, non-essential telemetry is automatically disabled without requiring manual user interaction.</p>

      <h2>6. Privacy Desk & Inquiries</h2>
      <p>If you have questions, feedback, or data privacy requests, please contact our Data Protection Officer at <a href="mailto:privacy@pscolor.online">privacy@pscolor.online</a> or through our <a href="/contact" data-route="/contact">Contact Support Page</a>.</p>
    </div>
  `;
  renderMeta();
}

// PASSIVE INFINITE SCROLL
window.addEventListener('scroll', () => {
  if (['new', 'popular', 'random', 'collection'].includes(mode) &&
      !location.pathname.startsWith('/palette/') &&
      !location.pathname.startsWith('/create') &&
      !location.pathname.startsWith('/about') &&
      !location.pathname.startsWith('/contact') &&
      !location.pathname.startsWith('/terms') &&
      !location.pathname.startsWith('/privacy')) {
    if (!isLoadingMore && window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
      const list = filtered();
      if (limit < list.length) {
        isLoadingMore = true;
        limit += 36;
        renderFeed(false);
        setTimeout(() => { isLoadingMore = false; }, 250);
      }
    }
  }
}, { passive: true });

// SEARCH LISTENERS
search.addEventListener('focus', () => {
  renderPanel();
  panel.hidden = false;
  search.setAttribute('aria-expanded', 'true');
  closeMenu();
});

search.addEventListener('input', () => {
  query = search.value;
  limit = 36;
  renderPanel();
  renderFeed();
  document.querySelector('#clear-search').hidden = !query && !tags.length;
});

search.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSearch();
  if (e.key === 'Enter') {
    e.preventDefault();
    closeSearch();
    search.blur();
  }
  if (e.key === 'Backspace' && !search.value && tags.length) {
    tags.pop();
    navigate(tags.length ? '/palettes/' + tags.join('-') : '/');
  }
});

// GLOBAL CLICK DELEGATION
document.addEventListener('click', e => {
  const button = e.target.closest('button, a, div[data-tab], .dropzone');

  if (!e.target.closest('.search-area')) closeSearch();
  if (!e.target.closest('.header-right')) closeMenu();

  if (!button) return;

  const sponsorLink = button.closest('a[rel*="sponsored"]') || (button.tagName === 'A' && button.rel && button.rel.includes('sponsored') ? button : null);
  if (sponsorLink) {
    trackAffiliateClick(sponsorLink.textContent.trim() || 'Partner', sponsorLink.href);
  }

  if (button.id === 'toggle-consent') {
    const current = hasUserConsent();
    setAnalyticsConsent(!current);
    renderPrivacyPage();
    toast(!current ? 'Anonymous telemetry enabled' : 'Anonymous telemetry disabled');
    return;
  }

  if (button.dataset.copy) {
    e.preventDefault();
    copy(button.dataset.copy, button);
    trackColorCopy(button.dataset.copy, location.pathname.split('/').pop());
    return;
  }

  if (button.dataset.copyCss) {
    e.preventDefault();
    copy(button.dataset.copyCss, button);
    trackCodeExport('css', location.pathname.split('/').pop());
    return;
  }

  if (button.dataset.copyText) {
    e.preventDefault();
    copy(button.dataset.copyText, button);
    trackCodeExport('snippet', location.pathname.split('/').pop());
    return;
  }

  if (button.dataset.openExport) {
    e.preventDefault();
    openExportModal(button.dataset.openExport);
    trackCodeExport('open_modal', button.dataset.openExport);
    return;
  }

  if (button.dataset.tab) {
    const tabName = button.dataset.tab;
    document.querySelectorAll('.code-modal-tab').forEach(t => t.classList.remove('active'));
    button.classList.add('active');
    ['tailwind', 'css', 'tokens'].forEach(name => {
      const el = document.querySelector(`#code-tab-${name}`);
      if (el) el.hidden = name !== tabName;
    });
    return;
  }

  if (button.dataset.creatorMode) {
    creatorMode = button.dataset.creatorMode;
    document.querySelectorAll('.creator-mode-tabs button').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    const dropzone = document.querySelector('#dropzone-area');
    if (dropzone) dropzone.hidden = creatorMode !== 'extract';
    return;
  }

  if (button.id === 'dropzone-area' || button.closest('#dropzone-area')) {
    const fileInput = document.querySelector('#image-upload-input');
    if (fileInput && e.target !== fileInput) fileInput.click();
    return;
  }

  if (button.dataset.route !== undefined) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(button.dataset.route);
    return;
  }

  if (button.dataset.like) {
    toggleLike(button.dataset.like);
    return;
  }

  if (button.dataset.unlike) {
    toggleLike(button.dataset.unlike);
    return;
  }

  if (button.dataset.tag) {
    const t = button.dataset.tag.toLowerCase();
    tags = tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t];
    navigate(tags.length ? '/palettes/' + tags.join('-') : '/');
    return;
  }

  if (button.dataset.remove) {
    tags = tags.filter(t => t !== button.dataset.remove.toLowerCase());
    navigate(tags.length ? '/palettes/' + tags.join('-') : '/');
    return;
  }

  if (button.dataset.time) {
    timeframe = button.dataset.time;
    renderNavigation();
    renderFeed();
    return;
  }

  if (button.dataset.download) {
    downloadPalette(button.dataset.download);
    return;
  }

  if (button.dataset.link) {
    copy(location.origin + '/palette/' + button.dataset.link, button);
    return;
  }

  if (button.hasAttribute('data-close')) {
    dialog.close();
    return;
  }

  if (button.hasAttribute('data-about')) {
    closeMenu();
    showDialog(
      'About PS color',
      '<p>PS color is an independent, free color exploration workspace for creators and developers.</p><p>Find harmonized four-color palettes, copy hex/RGB values, export CSS tokens, or generate your own color schemes.</p><p>All data is preserved locally in your browser storage.</p>'
    );
    return;
  }

  if (button.hasAttribute('data-cookie-settings')) {
    closeMenu();
    navigate('/privacy');
    return;
  }

  if (button.hasAttribute('data-export')) {
    const data = [...saved].map(getPalette).filter(Boolean);
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'ps-color-collection.json');
    closeMenu();
    return;
  }

  if (button.id === 'clear-search') {
    navigate('/');
    return;
  }

  if (button.id === 'load-more') {
    limit += 36;
    renderFeed();
    return;
  }

  if (button.id === 'menu-toggle') {
    const menu = document.querySelector('#menu');
    menu.hidden = !menu.hidden;
    button.setAttribute('aria-expanded', String(!menu.hidden));
    closeSearch();
    return;
  }

  if (button.id === 'bookmark') {
    showDialog(
      'Bookmark PS color',
      `<p>Add PS color to your browser bookmarks for instant palette inspiration whenever you need it.</p>
       <div class="keyboard-shortcut">
         <kbd>${navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}</kbd>
         <span>+</span>
         <kbd>D</kbd>
       </div>
       <p class="storage-note">On mobile, tap your browser menu and choose "Add to Home Screen" or "Bookmark".</p>`
    );
    return;
  }

  if (button.id === 'randomize') {
    const p = palettes[Math.floor(Math.random() * palettes.length)];
    document.querySelectorAll('input[type=color]').forEach((el, i) => {
      el.value = p.colors[i];
      document.querySelector(`[data-color-index="${i}"]`).value = p.colors[i];
    });
    updateCreator();
  }
});

// COLOR PICKER & HEX INPUT LISTENERS
document.addEventListener('input', e => {
  if (e.target.matches('input[type=color]')) {
    const i = e.target.name.slice(-1);
    const hexInput = document.querySelector(`[data-color-index="${i}"]`);
    if (hexInput) hexInput.value = e.target.value.toUpperCase();
    updateCreator();
  }
  if (e.target.matches('.hex-input') && /^#[a-f0-9]{6}$/i.test(e.target.value)) {
    const colorInput = document.querySelector(`[name="color${e.target.dataset.colorIndex}"]`);
    if (colorInput) colorInput.value = e.target.value;
    updateCreator();
  }
});

// FILE UPLOAD & DROPZONE LISTENER
document.addEventListener('change', e => {
  if (e.target.id === 'image-upload-input' && e.target.files?.length) {
    processImageFile(e.target.files[0]);
  }
});

document.addEventListener('dragover', e => {
  const dropzone = e.target.closest('#dropzone-area');
  if (dropzone) {
    e.preventDefault();
    dropzone.classList.add('dragover');
  }
});

document.addEventListener('dragleave', e => {
  const dropzone = e.target.closest('#dropzone-area');
  if (dropzone) dropzone.classList.remove('dragover');
});

document.addEventListener('drop', e => {
  const dropzone = e.target.closest('#dropzone-area');
  if (dropzone) {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files?.length) {
      processImageFile(e.dataTransfer.files[0]);
    }
  }
});

// FORM SUBMIT HANDLERS
document.addEventListener('submit', e => {
  if (e.target.id === 'contact-form') {
    handleContactSubmit(e);
    return;
  }
  if (e.target.id !== 'create-form') return;
  e.preventDefault();
  const colors = [...e.target.querySelectorAll('input[type=color]')].map(el => el.value.toUpperCase());
  const id = colors.join('').replaceAll('#', '').toLowerCase();

  if (!all().some(p => p.id === id)) {
    custom.unshift({ id, colors, tags: ['custom'], likes: 1, days: 0 });
  }
  saved.add(id);
  persist();
  navigate('/palette/' + id);
  toast('Palette saved to your collection');
  trackPaletteCreate(id, colors);
});

// KEYBOARD SHORTCUTS
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeSearch();
    closeMenu();
  }
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !dialog.open) {
    e.preventDefault();
    search.focus();
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
    const bookmarkBtn = document.querySelector('#bookmark');
    if (bookmarkBtn) bookmarkBtn.click();
  }
});

dialog.addEventListener('click', e => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
      dialog.close();
    }
  }
});

function renderCookieBanner() {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem('ps-color-analytics-consent') !== null) return;
  if (document.querySelector('#cookie-banner')) return;

  const banner = document.createElement('aside');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Cookie and privacy consent');
  banner.innerHTML = `
    <h3>Cookie &amp; Privacy Preferences</h3>
    <p>PS color uses essential browser storage to preserve your curated color collections and custom palettes. We also use privacy-first aggregate metrics and advertising partner features to keep this resource 100% free. You can customize your preferences anytime.</p>
    <div class="cookie-actions">
      <button id="cookie-accept" class="button primary">Accept All</button>
      <button id="cookie-essential" class="button">Essential Only</button>
      <a href="/privacy" data-route="/privacy" class="button" style="text-align:center; display:flex; align-items:center; justify-content:center;">Read Policy</a>
    </div>
  `;
  document.body.appendChild(banner);

  banner.querySelector('#cookie-accept').addEventListener('click', () => {
    setAnalyticsConsent(true);
    initAnalytics();
    banner.remove();
  });

  banner.querySelector('#cookie-essential').addEventListener('click', () => {
    setAnalyticsConsent(false);
    banner.remove();
  });
}

window.addEventListener('popstate', route);
window.addEventListener('storage', () => {
  saved = getSavedSet();
  route();
});

route();
renderCookieBanner();
