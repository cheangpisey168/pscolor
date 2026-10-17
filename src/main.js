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
          <a href="/terms" data-route="/terms">Terms of Service</a>
          <a href="/privacy" data-route="/privacy">Privacy Policy</a>
          <div class="line"></div>
          <button data-about>Quick About</button>
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
        <h4>${escape(monetizationConfig.partners.framer.headline)}</h4>
        <p>${escape(monetizationConfig.partners.framer.description)}</p>
        <a href="${escape(monetizationConfig.partners.framer.url)}" target="_blank" rel="noopener sponsored">${escape(monetizationConfig.partners.framer.cta)}</a>
      </div>
    </aside>
  </div>
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

  mode = ['popular', 'random', 'collection', 'palette', 'create', 'about', 'terms', 'privacy'].includes(root) ? root : 'new';
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
            'url': 'https://pscolor.com'
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
    <div class="content-page center">
      <img class="animated-logo" src="/img/ps-color-logo.svg" alt="PS color emblem">
      <h1>About PS color</h1>
      <p>PS color is an independent, free-to-use color discovery workspace engineered for web designers, mobile developers, and digital artists.</p>
      <h2>Original & Open Source</h2>
      <p>Designed with modern web standards and zero telemetry, PS color empowers you to curate palettes, test color harmonies, inspect hex & RGB codes, and export tokens effortlessly.</p>
      <h2>Local First & Privacy Respecting</h2>
      <p>Your curated collections and custom-created palettes are stored completely in your browser's local storage. You retain full freedom to export your palette collection as JSON at any time.</p>
      <div style="margin-top: 24px;">
        <button class="button primary" data-route="/">Browse Palettes</button>
      </div>
    </div>
  `;
  renderMeta();
}

function renderTermsPage() {
  document.querySelector('#content').innerHTML = `
    <div class="content-page">
      <a class="back" href="/" data-route="/">← Back to palettes</a>
      <h1>Terms of Service</h1>
      <p>Welcome to PS color. By using this service, you agree to these simple terms:</p>
      <h2>Free Personal and Commercial License</h2>
      <p>All color combinations presented on PS color are free for personal and commercial usage in websites, mobile apps, software, brand designs, and illustrations without attribution.</p>
      <h2>User Generated Palettes</h2>
      <p>Palettes you design using our palette creator are stored locally on your device. You hold complete rights to any creations derived from them.</p>
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
      <p>PS color is built with a strict privacy-first foundation:</p>
      <h2>Zero Personal Data Tracking</h2>
      <p>We do not collect personal identifying information, sell user telemetry, or profile individual visitors. The website operates locally in your browser.</p>
      <h2>Local Storage</h2>
      <p>Collections and user palettes persist only within your browser local storage (<code>localStorage</code>). You can clear your data or export your collection as JSON at any moment.</p>
      <h2>Anonymous Telemetry &amp; Do Not Track</h2>
      <p>We honor browser Do Not Track (DNT) headers. Optional anonymous page metrics are used solely to improve palette search accuracy and performance.</p>
      <div style="margin-top: 20px; padding: 16px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-btn);">
        <p style="margin: 0 0 12px 0;"><strong>Telemetry Status:</strong> <span id="consent-status-text">${consent ? 'Active (Anonymous Aggregate)' : 'Disabled / Opted Out'}</span></p>
        <button id="toggle-consent" class="button">${consent ? 'Disable Anonymous Telemetry' : 'Enable Anonymous Telemetry'}</button>
      </div>
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

// CREATOR SUBMIT
document.addEventListener('submit', e => {
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

window.addEventListener('popstate', route);
window.addEventListener('storage', () => {
  saved = getSavedSet();
  route();
});

route();
