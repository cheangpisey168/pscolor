/**
 * PS Color - Professional CSS Gradient Generator Module
 * 
 * Features:
 *  - Linear gradients with angle control (0–360°)
 *  - Radial gradients with shape (circle, ellipse) and position controls
 *  - Conic gradients with starting-angle and center controls
 *  - 2 to 8 color stops with editable HEX, native color pickers, and percentage positions (0–100%)
 *  - Stop reordering (move up/down), add stop, remove stop with limits enforcement
 *  - Real-time live preview without page reload
 *  - Standards-compliant CSS code generation and one-click clipboard copy
 *  - High-res PNG export with subtle PSColor.online watermark (1080×1080, 1080×1350, 1920×1080)
 *  - Accurate Canvas 2D linear, radial, and conic rendering with fallback
 *  - Save & Load gradients via browser localStorage (ps-color-saved-gradients)
 *  - Curated gradient presets and random gradient generator
 *  - Shareable gradient URLs with validation safeguards
 *  - Comprehensive educational SEO content for CSS gradients
 */

import { copyTextToClipboard, applyWatermark } from './utils.js';
import {
  trackGradientOpen,
  trackGradientTypeChange,
  trackGradientColorChange,
  trackGradientCopyCss,
  trackGradientDownloadPng,
  trackGradientSave
} from './analytics.js';

export const STORAGE_GRADIENTS_KEY = 'ps-color-saved-gradients';

export const GRADIENT_TYPES = [
  { id: 'linear', label: 'Linear', icon: '↗' },
  { id: 'radial', label: 'Radial', icon: '◎' },
  { id: 'conic', label: 'Conic', icon: '◷' }
];

export const RADIAL_SHAPES = [
  { id: 'circle', label: 'Circle' },
  { id: 'ellipse', label: 'Ellipse' }
];

export const RADIAL_POSITIONS = [
  { id: 'center', label: 'Center' },
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'top left', label: 'Top Left' },
  { id: 'top right', label: 'Top Right' },
  { id: 'bottom left', label: 'Bottom Left' },
  { id: 'bottom right', label: 'Bottom Right' }
];

export const EXPORT_DIMENSIONS = {
  '1080x1080': {
    width: 1080,
    height: 1080,
    label: '1:1 Square (1080×1080)',
    desc: 'Instagram, LinkedIn, X/Twitter Feed'
  },
  '1080x1350': {
    width: 1080,
    height: 1350,
    label: '4:5 Portrait (1080×1350)',
    desc: 'Instagram Portrait & Mobile Wallpapers'
  },
  '1920x1080': {
    width: 1920,
    height: 1080,
    label: '16:9 Landscape (1920×1080)',
    desc: 'Desktop Wallpaper & Presentation Banners'
  }
};

export const CURATED_PRESETS = [
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#FF5E62', position: 0 },
      { color: '#FF9966', position: 100 }
    ]
  },
  {
    id: 'hyper-violet',
    name: 'Hyper Violet',
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#667EEA', position: 0 },
      { color: '#764BA2', position: 100 }
    ]
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    type: 'linear',
    angle: 180,
    stops: [
      { color: '#2AF598', position: 0 },
      { color: '#009EFD', position: 100 }
    ]
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    type: 'linear',
    angle: 90,
    stops: [
      { color: '#F72585', position: 0 },
      { color: '#7209B7', position: 50 },
      { color: '#4CC9F0', position: 100 }
    ]
  },
  {
    id: 'warm-amber',
    name: 'Warm Amber',
    type: 'linear',
    angle: 45,
    stops: [
      { color: '#F6D365', position: 0 },
      { color: '#FDA085', position: 100 }
    ]
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    type: 'linear',
    angle: 120,
    stops: [
      { color: '#00F2FE', position: 0 },
      { color: '#4FACFE', position: 50 },
      { color: '#000046', position: 100 }
    ]
  },
  {
    id: 'emerald-lush',
    name: 'Emerald Lush',
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#0BA360', position: 0 },
      { color: '#3CBA92', position: 100 }
    ]
  },
  {
    id: 'citrus-punch',
    name: 'Citrus Punch',
    type: 'linear',
    angle: 45,
    stops: [
      { color: '#FA709A', position: 0 },
      { color: '#FEE140', position: 100 }
    ]
  },
  {
    id: 'midnight-purple',
    name: 'Midnight Purple',
    type: 'linear',
    angle: 160,
    stops: [
      { color: '#2E0854', position: 0 },
      { color: '#180B22', position: 100 }
    ]
  },
  {
    id: 'cosmic-radial',
    name: 'Cosmic Radial',
    type: 'radial',
    radialShape: 'circle',
    radialPosition: 'center',
    stops: [
      { color: '#F857A6', position: 0 },
      { color: '#FF5858', position: 50 },
      { color: '#111827', position: 100 }
    ]
  },
  {
    id: 'pastel-dream',
    name: 'Pastel Dream',
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#FBC2EB', position: 0 },
      { color: '#A6C1EE', position: 100 }
    ]
  },
  {
    id: 'spectrum-conic',
    name: 'Spectrum Conic',
    type: 'conic',
    conicAngle: 0,
    conicPosition: 'center',
    stops: [
      { color: '#FF4365', position: 0 },
      { color: '#FFB020', position: 25 },
      { color: '#00D29E', position: 50 },
      { color: '#4361EE', position: 75 },
      { color: '#FF4365', position: 100 }
    ]
  }
];

export function isValidHex(hex) {
  if (typeof hex !== 'string') return false;
  return /^#?[0-9a-f]{6}$/i.test(hex.trim());
}

export function normalizeHex(hex) {
  if (!isValidHex(hex)) return '#000000';
  const clean = hex.trim().replace(/^#/, '');
  return `#${clean.toUpperCase()}`;
}

export function clamp(val, min, max) {
  const num = Number(val);
  if (Number.isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

export function hexToRgb(hex) {
  const norm = normalizeHex(hex).replace('#', '');
  const num = parseInt(norm, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHex(r, g, b) {
  const toH = c => {
    const h = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return h.length === 1 ? '0' + h : h;
  };
  return `#${toH(r)}${toH(g)}${toH(b)}`.toUpperCase();
}

export function interpolateHex(color1, color2, factor) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const f = clamp(factor, 0, 1);
  return rgbToHex(
    c1.r + (c2.r - c1.r) * f,
    c1.g + (c2.g - c1.g) * f,
    c1.b + (c2.b - c1.b) * f
  );
}

/**
 * Creates a default, well-structured gradient model
 */
export function createDefaultGradient(overrides = {}) {
  const defaultStops = [
    { id: 'stop-1', color: '#667EEA', position: 0 },
    { id: 'stop-2', color: '#764BA2', position: 100 }
  ];

  return {
    type: overrides.type && ['linear', 'radial', 'conic'].includes(overrides.type) ? overrides.type : 'linear',
    angle: typeof overrides.angle === 'number' ? clamp(overrides.angle, 0, 360) : 135,
    radialShape: overrides.radialShape === 'ellipse' ? 'ellipse' : 'circle',
    radialPosition: overrides.radialPosition || 'center',
    conicAngle: typeof overrides.conicAngle === 'number' ? clamp(overrides.conicAngle, 0, 360) : 0,
    conicPosition: overrides.conicPosition || 'center',
    stops: Array.isArray(overrides.stops) && overrides.stops.length >= 2
      ? overrides.stops.slice(0, 8).map((s, idx) => ({
          id: s.id || `stop-${idx + 1}-${Date.now()}`,
          color: normalizeHex(s.color || '#667EEA'),
          position: clamp(s.position ?? Math.round((idx / (overrides.stops.length - 1)) * 100), 0, 100)
        }))
      : defaultStops
  };
}

/**
 * Initializes a gradient from 2-8 colors (e.g. from an existing palette)
 */
export function createGradientFromColors(colors, type = 'linear') {
  if (!Array.isArray(colors) || colors.length < 2) {
    return createDefaultGradient();
  }

  const validColors = colors.filter(isValidHex).map(normalizeHex).slice(0, 8);
  if (validColors.length < 2) {
    return createDefaultGradient();
  }

  const count = validColors.length;
  const stops = validColors.map((color, i) => ({
    id: `stop-${i + 1}`,
    color,
    position: Math.round((i / (count - 1)) * 100)
  }));

  return createDefaultGradient({
    type,
    angle: 135,
    stops
  });
}

/**
 * Generates standards-compliant CSS gradient string value
 */
export function getGradientCssValue(model) {
  const stops = [...(model.stops || [])].sort((a, b) => a.position - b.position);
  if (!stops.length) {
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  const stopsStr = stops.map(s => `${normalizeHex(s.color).toLowerCase()} ${clamp(s.position, 0, 100)}%`).join(', ');

  if (model.type === 'radial') {
    const shape = model.radialShape === 'ellipse' ? 'ellipse' : 'circle';
    const pos = model.radialPosition || 'center';
    return `radial-gradient(${shape} at ${pos}, ${stopsStr})`;
  }

  if (model.type === 'conic') {
    const angle = clamp(model.conicAngle || 0, 0, 360);
    const pos = model.conicPosition || 'center';
    return `conic-gradient(from ${angle}deg at ${pos}, ${stopsStr})`;
  }

  const angle = clamp(model.angle || 0, 0, 360);
  return `linear-gradient(${angle}deg, ${stopsStr})`;
}

/**
 * Generates full CSS rule snippet (e.g. background: linear-gradient(...);)
 */
export function getGradientFullCss(model) {
  const cssValue = getGradientCssValue(model);
  return `background: ${cssValue};`;
}

/**
 * Translates position keywords to numeric Canvas pixel coordinates
 */
export function getPositionCoords(pos, width, height) {
  const p = String(pos || 'center').toLowerCase().trim();

  // Percentage coordinate (e.g. "50% 50%")
  const percentMatch = p.match(/^([0-9.]+)%\s+([0-9.]+)%$/);
  if (percentMatch) {
    return {
      x: (parseFloat(percentMatch[1]) / 100) * width,
      y: (parseFloat(percentMatch[2]) / 100) * height
    };
  }

  switch (p) {
    case 'top left':
      return { x: 0, y: 0 };
    case 'top right':
      return { x: width, y: 0 };
    case 'bottom left':
      return { x: 0, y: height };
    case 'bottom right':
      return { x: width, y: height };
    case 'top':
      return { x: width / 2, y: 0 };
    case 'bottom':
      return { x: width / 2, y: height };
    case 'left':
      return { x: 0, y: height / 2 };
    case 'right':
      return { x: width, y: height / 2 };
    case 'center':
    default:
      return { x: width / 2, y: height / 2 };
  }
}

/**
 * Software fallback for conic gradient rendering when native ctx.createConicGradient is unavailable
 */
export function renderSoftwareConicGradient(ctx, cx, cy, width, height, startAngleRad, sortedStops) {
  const maxRadius = Math.hypot(width, height);
  const steps = 720; // 0.5 degree resolution
  const stepAngle = (2 * Math.PI) / steps;

  for (let i = 0; i < steps; i++) {
    const currentNorm = i / steps; // 0 to 1
    const currentPercent = currentNorm * 100;

    // Find bounding stops
    let color = sortedStops[0].color;
    if (currentPercent <= sortedStops[0].position) {
      color = sortedStops[0].color;
    } else if (currentPercent >= sortedStops[sortedStops.length - 1].position) {
      color = sortedStops[sortedStops.length - 1].color;
    } else {
      for (let s = 0; s < sortedStops.length - 1; s++) {
        const s1 = sortedStops[s];
        const s2 = sortedStops[s + 1];
        if (currentPercent >= s1.position && currentPercent <= s2.position) {
          const span = s2.position - s1.position;
          const factor = span === 0 ? 0 : (currentPercent - s1.position) / span;
          color = interpolateHex(s1.color, s2.color, factor);
          break;
        }
      }
    }

    const a1 = startAngleRad + (i * stepAngle);
    const a2 = a1 + stepAngle + 0.005; // slight overlap to prevent seams

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxRadius, a1, a2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

/**
 * Renders gradient with high precision onto an HTML5 Canvas 2D context
 */
export function renderGradientToCanvas(canvas, model, dimensionKey = '1080x1080', options = {}) {
  if (!canvas) return canvas;
  const dim = EXPORT_DIMENSIONS[dimensionKey] || EXPORT_DIMENSIONS['1080x1080'];
  canvas.width = dim.width;
  canvas.height = dim.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = dim.width;
  const h = dim.height;
  const stops = [...(model.stops || [])].sort((a, b) => a.position - b.position);

  ctx.save();

  if (model.type === 'linear') {
    const angleDeg = Number(model.angle) || 0;
    const radCss = (angleDeg * Math.PI) / 180;
    const len = Math.abs(w * Math.sin(radCss)) + Math.abs(h * Math.cos(radCss));
    const halfLen = len / 2;

    const x0 = w / 2 - halfLen * Math.sin(radCss);
    const y0 = h / 2 + halfLen * Math.cos(radCss);
    const x1 = w / 2 + halfLen * Math.sin(radCss);
    const y1 = h / 2 - halfLen * Math.cos(radCss);

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(s => {
      grad.addColorStop(clamp(s.position / 100, 0, 1), normalizeHex(s.color));
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (model.type === 'radial') {
    const pos = getPositionCoords(model.radialPosition || 'center', w, h);
    const cx = pos.x;
    const cy = pos.y;

    const corners = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: 0, y: h },
      { x: w, y: h }
    ];
    let maxDist = 0;
    corners.forEach(c => {
      const d = Math.hypot(c.x - cx, c.y - cy);
      if (d > maxDist) maxDist = d;
    });
    const r = Math.max(maxDist, 10);

    if (model.radialShape === 'ellipse' && w !== h) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, h / w);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      stops.forEach(s => {
        grad.addColorStop(clamp(s.position / 100, 0, 1), normalizeHex(s.color));
      });
      ctx.fillStyle = grad;
      ctx.fillRect(-w * 2, -h * 2, w * 4, h * 4);
      ctx.restore();
    } else {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      stops.forEach(s => {
        grad.addColorStop(clamp(s.position / 100, 0, 1), normalizeHex(s.color));
      });
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  } else if (model.type === 'conic') {
    const pos = getPositionCoords(model.conicPosition || 'center', w, h);
    const cx = pos.x;
    const cy = pos.y;
    const startAngleDeg = Number(model.conicAngle) || 0;
    // In CSS conic-gradient(from X deg), 0deg is at 12 o'clock (-Y axis)
    // In Canvas createConicGradient(startAngle, cx, cy), 0 rad is at 3 o'clock (+X axis)
    // Offset is -90 degrees (-PI/2)
    const canvasStartRad = ((startAngleDeg - 90) * Math.PI) / 180;

    if (typeof ctx.createConicGradient === 'function') {
      try {
        const grad = ctx.createConicGradient(canvasStartRad, cx, cy);
        stops.forEach(s => {
          grad.addColorStop(clamp(s.position / 100, 0, 1), normalizeHex(s.color));
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } catch (err) {
        renderSoftwareConicGradient(ctx, cx, cy, w, h, canvasStartRad, stops);
      }
    } else {
      renderSoftwareConicGradient(ctx, cx, cy, w, h, canvasStartRad, stops);
    }
  }

  ctx.restore();

  if (options.watermark !== false) {
    applyWatermark(canvas, { text: 'PSColor.online', withLogo: true });
  }

  return canvas;
}

/**
 * Safely downloads exported canvas image with memory cleanup
 */
export function downloadGradientBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

/**
 * Reads saved gradients from localStorage with error resilience
 */
export function getSavedGradients() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_GRADIENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(item => {
      return (
        item &&
        typeof item.id === 'string' &&
        item.data &&
        Array.isArray(item.data.stops) &&
        item.data.stops.length >= 2
      );
    });
  } catch (err) {
    console.warn('Failed to parse saved gradients from localStorage:', err);
    return [];
  }
}

/**
 * Saves gradient to localStorage
 */
export function saveGradientToStorage(name, model) {
  if (typeof localStorage === 'undefined') return false;
  try {
    const list = getSavedGradients();
    const cleanName = (name || '').trim() || `Gradient ${list.length + 1}`;
    const id = `grad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const newItem = {
      id,
      name: cleanName,
      data: {
        type: model.type,
        angle: model.angle,
        radialShape: model.radialShape,
        radialPosition: model.radialPosition,
        conicAngle: model.conicAngle,
        conicPosition: model.conicPosition,
        stops: model.stops.map(s => ({
          color: normalizeHex(s.color),
          position: clamp(s.position, 0, 100)
        }))
      },
      createdAt: Date.now()
    };

    list.unshift(newItem);
    localStorage.setItem(STORAGE_GRADIENTS_KEY, JSON.stringify(list.slice(0, 50)));
    return newItem;
  } catch (err) {
    console.error('Error saving gradient to localStorage:', err);
    return false;
  }
}

/**
 * Deletes saved gradient from localStorage
 */
export function deleteGradientFromStorage(id) {
  if (typeof localStorage === 'undefined') return false;
  try {
    const list = getSavedGradients();
    const updated = list.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_GRADIENTS_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Serializes gradient model into safe URL query string
 */
export function serializeGradientToParams(model) {
  const parts = [];
  parts.push(`type=${encodeURIComponent(model.type)}`);

  if (model.type === 'linear') {
    parts.push(`angle=${model.angle}`);
  } else if (model.type === 'radial') {
    parts.push(`shape=${encodeURIComponent(model.radialShape)}`);
    parts.push(`pos=${encodeURIComponent(model.radialPosition)}`);
  } else if (model.type === 'conic') {
    parts.push(`cangle=${model.conicAngle}`);
    parts.push(`cpos=${encodeURIComponent(model.conicPosition)}`);
  }

  const stopsParam = model.stops
    .map(s => `${normalizeHex(s.color).replace('#', '')}:${clamp(s.position, 0, 100)}`)
    .join(',');
  parts.push(`stops=${stopsParam}`);

  return parts.join('&');
}

/**
 * Deserializes gradient model from URL query string with full validation safeguards
 */
export function deserializeGradientFromParams(searchStr) {
  if (!searchStr) return null;
  try {
    const query = searchStr.replace(/^\?/, '');
    if (query.length > 600) return null; // Guard against oversized URLs

    const params = new URLSearchParams(query);
    const type = params.get('type');
    const colorsParam = params.get('colors');
    const stopsParam = params.get('stops');

    // Case 1: Palette hex colors list e.g. ?colors=F7F0DC,D9E4C8,A2B89B,52796F or hyphen-separated
    if (colorsParam) {
      const parts = colorsParam.includes('-') ? colorsParam.split('-') : colorsParam.split(',');
      const hexes = parts.map(p => `#${p.replace(/^#/, '')}`).filter(isValidHex);
      if (hexes.length >= 2) {
        return createGradientFromColors(hexes, type || 'linear');
      }
    }

    // Case 2: Full stops configuration e.g. ?stops=FF5E62:0,FF9966:100
    if (stopsParam) {
      const stopParts = stopsParam.split(',').filter(Boolean);
      const parsedStops = [];
      for (const part of stopParts) {
        const [hex, posStr] = part.split(':');
        if (hex && isValidHex(hex)) {
          parsedStops.push({
            color: normalizeHex(hex),
            position: clamp(parseInt(posStr, 10) || 0, 0, 100)
          });
        }
      }

      if (parsedStops.length >= 2) {
        return createDefaultGradient({
          type: type && ['linear', 'radial', 'conic'].includes(type) ? type : 'linear',
          angle: parseInt(params.get('angle'), 10) || 135,
          radialShape: params.get('shape') === 'ellipse' ? 'ellipse' : 'circle',
          radialPosition: params.get('pos') || 'center',
          conicAngle: parseInt(params.get('cangle'), 10) || 0,
          conicPosition: params.get('cpos') || 'center',
          stops: parsedStops
        });
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Interactive CSS Gradient Generator Controller & View
 */
export class GradientGenerator {
  constructor(initialModel = null) {
    this.model = initialModel ? createDefaultGradient(initialModel) : createDefaultGradient();
    this.exportDimension = '1080x1080';
    this.isDownloading = false;
  }

  render() {
    const cssValue = getGradientCssValue(this.model);
    const fullCss = getGradientFullCss(this.model);
    const saved = getSavedGradients();

    return `
      <div class="gradient-generator-container" id="gradient-generator-root">
        <!-- Header Banner -->
        <div class="gradient-header">
          <div class="gradient-header-titles">
            <span class="gradient-badge">✦ CSS GRADIENT GENERATOR</span>
            <h1 class="gradient-page-title">CSS Gradient Generator</h1>
            <p class="gradient-page-desc">Create high-performance linear, radial, and conic gradients with live preview, customizable color stops, one-click CSS code export, and 4K/HD PNG image download.</p>
          </div>
          <div class="gradient-header-actions">
            <button type="button" class="button" id="btn-gradient-random" aria-label="Generate random gradient">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="m16 3 4 4-4 4M4 7h3c5 0 5 10 10 10h3M16 13l4 4-4 4M4 17h3c2 0 3-2 4-4m2-4c1-2 2-2 4-2h3"/></svg>
              <span>Random</span>
            </button>
            <button type="button" class="button" id="btn-gradient-reset" aria-label="Reset gradient to default">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              <span>Reset</span>
            </button>
          </div>
        </div>

        <!-- Main Workspace (Editor Left, Preview Right) -->
        <div class="gradient-workspace">
          <!-- Left Controls Column -->
          <div class="gradient-controls-panel">
            <!-- 1. Gradient Type Tabs -->
            <div class="gradient-card">
              <label class="gradient-section-label">Gradient Type</label>
              <div class="gradient-type-tabs" role="tablist" aria-label="Select gradient type">
                ${GRADIENT_TYPES.map(t => `
                  <button type="button" class="gradient-type-tab ${this.model.type === t.id ? 'active' : ''}" data-gradient-type="${t.id}" role="tab" aria-selected="${this.model.type === t.id}">
                    <span class="gradient-type-icon">${t.icon}</span>
                    <span>${t.label}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 2. Type-Specific Geometry Controls -->
            <div class="gradient-card" id="gradient-geometry-controls">
              ${this.renderGeometryControls()}
            </div>

            <!-- 3. Color Stops Manager -->
            <div class="gradient-card">
              <div class="gradient-stops-header">
                <div>
                  <label class="gradient-section-label" style="margin-bottom:2px;">Color Stops</label>
                  <span class="gradient-stops-count">${this.model.stops.length} of 8 stops</span>
                </div>
                <button type="button" class="button button-sm primary" id="btn-add-stop" ${this.model.stops.length >= 8 ? 'disabled' : ''} aria-label="Add color stop">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
                  <span>Add Stop</span>
                </button>
              </div>

              <!-- Interactive Visual Stop Track -->
              <div class="gradient-stop-track-container" aria-hidden="true">
                <div class="gradient-stop-track-bar" id="gradient-stop-track-bar" style="background: ${cssValue};"></div>
                <div class="gradient-stop-markers" id="gradient-stop-markers">
                  ${this.model.stops.map((s, i) => `
                    <div class="gradient-stop-marker" style="left: ${s.position}%; background: ${s.color};" title="Stop ${i + 1}: ${s.color} at ${s.position}%"></div>
                  `).join('')}
                </div>
              </div>

              <!-- Stops List -->
              <div class="gradient-stops-list" id="gradient-stops-list">
                ${this.renderStopsList()}
              </div>
            </div>

            <!-- 4. Curated Presets -->
            <div class="gradient-card">
              <label class="gradient-section-label">Curated Presets</label>
              <div class="gradient-presets-grid" id="gradient-presets-grid">
                ${CURATED_PRESETS.map(preset => `
                  <button type="button" class="gradient-preset-chip" data-preset-id="${preset.id}" title="${preset.name}">
                    <span class="preset-preview" style="background: ${getGradientCssValue(preset)};"></span>
                    <span class="preset-name">${preset.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 5. Saved Gradients in LocalStorage -->
            <div class="gradient-card" id="saved-gradients-section">
              <div class="gradient-saved-header">
                <label class="gradient-section-label" style="margin-bottom:0;">Saved Gradients</label>
                <button type="button" class="button button-sm" id="btn-save-current-gradient">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  <span>Save Current</span>
                </button>
              </div>
              <div class="gradient-saved-list" id="gradient-saved-list">
                ${this.renderSavedList(saved)}
              </div>
            </div>
          </div>

          <!-- Right Preview & Export Column -->
          <div class="gradient-preview-panel">
            <!-- Large Gradient Canvas Preview -->
            <div class="gradient-preview-card">
              <div class="gradient-live-display" id="gradient-live-display" style="background: ${cssValue};">
                <div class="gradient-live-overlay">
                  <span class="gradient-type-pill" id="gradient-type-pill">${this.model.type.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <!-- CSS Code Block & Copy Button -->
            <div class="gradient-card gradient-export-card">
              <div class="gradient-export-header">
                <label class="gradient-section-label" style="margin-bottom:0;">CSS Code</label>
                <button type="button" class="button primary button-sm" id="btn-copy-gradient-css">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  <span id="copy-css-btn-text">Copy CSS</span>
                </button>
              </div>
              <div class="gradient-code-box">
                <pre><code id="gradient-css-code-text">${fullCss}</code></pre>
              </div>
            </div>

            <!-- PNG Download Card -->
            <div class="gradient-card gradient-download-card">
              <label class="gradient-section-label">Download PNG Image</label>
              <div class="gradient-dim-selector">
                ${Object.entries(EXPORT_DIMENSIONS).map(([key, dim]) => `
                  <button type="button" class="gradient-dim-btn ${this.exportDimension === key ? 'active' : ''}" data-dimension="${key}">
                    <strong>${dim.width}×${dim.height}</strong>
                    <span>${dim.desc}</span>
                  </button>
                `).join('')}
              </div>
              <button type="button" class="button primary full-width" id="btn-download-gradient-png">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></svg>
                <span id="download-png-btn-text">Download PNG (${EXPORT_DIMENSIONS[this.exportDimension].width}×${EXPORT_DIMENSIONS[this.exportDimension].height})</span>
              </button>
              <p class="gradient-download-note">Includes subtle PSColor.online watermark. Zero lossy compression.</p>
            </div>

            <!-- Shareable URL Card -->
            <div class="gradient-card gradient-share-card">
              <div class="gradient-share-header">
                <div>
                  <label class="gradient-section-label" style="margin-bottom:2px;">Shareable Link</label>
                  <p class="gradient-share-desc">Copy a unique URL that preserves this exact gradient configuration.</p>
                </div>
                <button type="button" class="button button-sm" id="btn-copy-gradient-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="m10 14 4-4m-5 7-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2-2 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/></svg>
                  <span>Share URL</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Educational SEO Content Section -->
        <article class="gradient-educational-content content-page" id="gradient-educational-content">
          <h2>Mastering CSS Gradients: Linear, Radial &amp; Conic Color Harmonies</h2>
          <p class="lead">CSS gradients are computationally rendered color transitions that replace heavy image assets with lightweight, vector-sharp visual depth. Whether designing high-converting hero backgrounds, subtle card highlights, or dynamic interactive buttons, mastering CSS gradient properties ensures accessible, fast-loading, and responsive web user interfaces.</p>

          <div class="gradient-edu-grid">
            <div class="gradient-edu-card">
              <h3>1. CSS Linear Gradients</h3>
              <p>Linear gradients transition colors smoothly along a straight directional vector. In standard W3C CSS syntax, the direction can be specified either via compass keywords (<code>to bottom right</code>) or exact degrees (<code>0deg</code> to <code>360deg</code>).</p>
              <p><strong>Directional Angle Specification:</strong></p>
              <ul>
                <li><code>0deg</code>: Bottom-to-top vertical ascent.</li>
                <li><code>90deg</code>: Left-to-right horizontal flow.</li>
                <li><code>135deg</code>: Top-left to bottom-right diagonal (the most popular modern UI angle).</li>
                <li><code>180deg</code>: Standard top-to-bottom vertical descent.</li>
              </ul>
              <pre><code>background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);</code></pre>
            </div>

            <div class="gradient-edu-card">
              <h3>2. CSS Radial Gradients</h3>
              <p>Radial gradients originate from a central focal point and radiate outwards in concentric rings. They are exceptionally effective for creating spotlight illumination, spherical depth, and soft organic glows.</p>
              <p><strong>Geometry &amp; Shape Options:</strong></p>
              <ul>
                <li><strong>Circle:</strong> Maintains uniform equidistant radius in all directions regardless of container aspect ratio.</li>
                <li><strong>Ellipse:</strong> Scales proportionally with the width and height of the bounding container.</li>
                <li><strong>Center Position:</strong> Anchors the origin to <code>center</code>, <code>top</code>, <code>bottom left</code>, or explicit percentage coordinates.</li>
              </ul>
              <pre><code>background: radial-gradient(circle at center, #f857a6 0%, #ff5858 50%, #111827 100%);</code></pre>
            </div>

            <div class="gradient-edu-card">
              <h3>3. CSS Conic Gradients</h3>
              <p>Conic gradients sweep colors around a center point in a circular motion (like a radar sweep or color wheel), rather than radiating outward from the center.</p>
              <p><strong>Key Practical Applications:</strong></p>
              <ul>
                <li><strong>Color Wheels:</strong> Seamless 360-degree chromatic spectrums.</li>
                <li><strong>Progress Rings &amp; Pie Charts:</strong> Hard or soft stop angles for dashboard metrics.</li>
                <li><strong>Prismatic Reflections:</strong> Metallic Sheen and iridescent button hover effects.</li>
              </ul>
              <pre><code>background: conic-gradient(from 0deg at center, #ff4365 0%, #ffb020 25%, #00d29e 50%, #4361ee 75%, #ff4365 100%);</code></pre>
            </div>

            <div class="gradient-edu-card">
              <h3>4. Accessibility &amp; WCAG Contrast Considerations</h3>
              <p>Overlaying typography on multi-color gradients introduces complex legibility challenges. While text might achieve a passing contrast ratio over the start stop, it may become completely unreadable over the end stop.</p>
              <p><strong>Accessible Gradient Design Rules:</strong></p>
              <ul>
                <li><strong>Test Both Extremes:</strong> Always evaluate text contrast against both the darkest and lightest color stops under WCAG 2.1 AA (minimum 4.5:1 for body text, 3:1 for large headlines).</li>
                <li><strong>Use Translucent Neutral Backdrops:</strong> When text spans across contrasting stops, place an underlying backdrop surface (e.g. <code>rgba(17, 19, 24, 0.75)</code>) or subtle text shadow.</li>
                <li><strong>Avoid Extremes of Equal Luminance:</strong> Combining saturated red and saturated green produces vibrating boundaries that induce visual fatigue.</li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  renderGeometryControls() {
    if (this.model.type === 'linear') {
      const angle = Number(this.model.angle) || 0;
      return `
        <div class="gradient-geom-group">
          <div class="gradient-control-row">
            <label class="gradient-section-label" for="input-gradient-angle">Angle (${angle}°)</label>
            <div class="gradient-angle-quick-buttons">
              ${[0, 45, 90, 135, 180, 270].map(a => `
                <button type="button" class="gradient-quick-btn ${angle === a ? 'active' : ''}" data-set-angle="${a}">${a}°</button>
              `).join('')}
            </div>
          </div>
          <div class="gradient-slider-row">
            <input type="range" id="input-gradient-angle" min="0" max="360" value="${angle}" aria-label="Gradient angle in degrees">
            <input type="number" id="input-gradient-angle-num" min="0" max="360" value="${angle}" class="gradient-num-input" aria-label="Gradient angle numeric">
          </div>
        </div>
      `;
    }

    if (this.model.type === 'radial') {
      return `
        <div class="gradient-geom-group">
          <div class="gradient-control-row" style="margin-bottom:12px;">
            <label class="gradient-section-label">Radial Shape</label>
            <div class="gradient-pill-buttons" role="radiogroup" aria-label="Radial shape">
              ${RADIAL_SHAPES.map(s => `
                <button type="button" class="gradient-pill-btn ${this.model.radialShape === s.id ? 'active' : ''}" data-set-radial-shape="${s.id}">
                  ${s.label}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="gradient-control-row">
            <label class="gradient-section-label" for="select-radial-position">Center Position</label>
            <select id="select-radial-position" class="gradient-select" aria-label="Radial center position">
              ${RADIAL_POSITIONS.map(p => `
                <option value="${p.id}" ${this.model.radialPosition === p.id ? 'selected' : ''}>${p.label}</option>
              `).join('')}
            </select>
          </div>
        </div>
      `;
    }

    if (this.model.type === 'conic') {
      const cAngle = Number(this.model.conicAngle) || 0;
      return `
        <div class="gradient-geom-group">
          <div class="gradient-control-row">
            <label class="gradient-section-label" for="input-conic-angle">Starting Angle (${cAngle}°)</label>
            <div class="gradient-angle-quick-buttons">
              ${[0, 90, 180, 270].map(a => `
                <button type="button" class="gradient-quick-btn ${cAngle === a ? 'active' : ''}" data-set-conic-angle="${a}">${a}°</button>
              `).join('')}
            </div>
          </div>
          <div class="gradient-slider-row" style="margin-bottom:12px;">
            <input type="range" id="input-conic-angle" min="0" max="360" value="${cAngle}" aria-label="Conic starting angle">
            <input type="number" id="input-conic-angle-num" min="0" max="360" value="${cAngle}" class="gradient-num-input" aria-label="Conic starting angle numeric">
          </div>
          <div class="gradient-control-row">
            <label class="gradient-section-label" for="select-conic-position">Center Position</label>
            <select id="select-conic-position" class="gradient-select" aria-label="Conic center position">
              ${RADIAL_POSITIONS.map(p => `
                <option value="${p.id}" ${this.model.conicPosition === p.id ? 'selected' : ''}>${p.label}</option>
              `).join('')}
            </select>
          </div>
        </div>
      `;
    }

    return '';
  }

  renderStopsList() {
    return this.model.stops.map((stop, idx) => `
      <div class="gradient-stop-row" data-stop-index="${idx}">
        <!-- Color Preview & Color Picker -->
        <div class="gradient-stop-color-wrap">
          <label class="gradient-color-swatch-btn" style="background: ${stop.color};" title="Choose color for Stop ${idx + 1}">
            <input type="color" class="gradient-native-color-picker" value="${normalizeHex(stop.color)}" data-stop-color-picker="${idx}" aria-label="Stop ${idx + 1} color picker">
          </label>
          <input type="text" class="gradient-hex-input" value="${stop.color.toUpperCase()}" maxlength="7" data-stop-hex-input="${idx}" aria-label="Stop ${idx + 1} hex code">
        </div>

        <!-- Position Slider & Number -->
        <div class="gradient-stop-pos-wrap">
          <input type="range" class="gradient-stop-pos-slider" min="0" max="100" value="${stop.position}" data-stop-pos-slider="${idx}" aria-label="Stop ${idx + 1} position percentage">
          <div class="gradient-stop-pos-num-wrap">
            <input type="number" class="gradient-stop-pos-num" min="0" max="100" value="${stop.position}" data-stop-pos-num="${idx}" aria-label="Stop ${idx + 1} position numeric">
            <span>%</span>
          </div>
        </div>

        <!-- Reorder Actions (Up / Down) -->
        <div class="gradient-stop-reorder">
          <button type="button" class="gradient-icon-btn" data-move-stop-up="${idx}" ${idx === 0 ? 'disabled' : ''} title="Move stop up" aria-label="Move stop up">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><path d="m18 15-6-6-6 6"/></svg>
          </button>
          <button type="button" class="gradient-icon-btn" data-move-stop-down="${idx}" ${idx === this.model.stops.length - 1 ? 'disabled' : ''} title="Move stop down" aria-label="Move stop down">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>

        <!-- Delete Action -->
        <button type="button" class="gradient-icon-btn danger" data-delete-stop="${idx}" ${this.model.stops.length <= 2 ? 'disabled' : ''} title="Remove color stop" aria-label="Remove color stop ${idx + 1}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join('');
  }

  renderSavedList(saved) {
    if (!saved || !saved.length) {
      return `
        <div class="gradient-saved-empty">
          <p>No saved gradients yet. Click "Save Current" to keep your favorite gradient combinations for future sessions.</p>
        </div>
      `;
    }

    return saved.slice(0, 10).map(item => `
      <div class="gradient-saved-item" data-saved-id="${item.id}">
        <span class="gradient-saved-swatch" style="background: ${getGradientCssValue(item.data)};" aria-hidden="true"></span>
        <div class="gradient-saved-info">
          <strong class="gradient-saved-name">${item.name}</strong>
          <span class="gradient-saved-meta">${item.data.type} &bull; ${item.data.stops.length} stops</span>
        </div>
        <div class="gradient-saved-actions">
          <button type="button" class="button button-sm" data-load-saved="${item.id}" title="Load gradient into editor">Load</button>
          <button type="button" class="gradient-icon-btn danger" data-delete-saved="${item.id}" title="Delete saved gradient" aria-label="Delete saved gradient ${item.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  attachListeners(container) {
    if (!container) return;
    this.root = container;

    // Track initial generator view
    trackGradientOpen(this.model.type);

    // Gradient Type Tabs
    container.querySelectorAll('[data-gradient-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        const newType = btn.dataset.gradientType;
        if (this.model.type !== newType) {
          this.model.type = newType;
          trackGradientTypeChange(newType);
          this.refreshGeometryAndStops();
          this.updatePreview();
        }
      });
    });

    // Randomize Gradient
    container.querySelector('#btn-gradient-random')?.addEventListener('click', () => {
      this.randomize();
    });

    // Reset Gradient
    container.querySelector('#btn-gradient-reset')?.addEventListener('click', () => {
      this.reset();
    });

    // Add Stop Button
    container.querySelector('#btn-add-stop')?.addEventListener('click', () => {
      this.addStop();
    });

    // Copy CSS Button
    container.querySelector('#btn-copy-gradient-css')?.addEventListener('click', async e => {
      e.preventDefault();
      e.stopPropagation();

      const fullCss = getGradientFullCss(this.model);
      try {
        const res = await copyTextToClipboard(fullCss);
        if (res && res.success) {
          trackGradientCopyCss(this.model.type);
          window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'CSS copied!' }));
        } else {
          window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'Unable to copy CSS to clipboard' }));
        }
      } catch (err) {
        console.error('Clipboard copy error:', err);
        window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'Unable to copy CSS to clipboard' }));
      }
    });

    // Copy Shareable URL Button
    container.querySelector('#btn-copy-gradient-link')?.addEventListener('click', async e => {
      e.preventDefault();
      e.stopPropagation();

      try {
        const params = serializeGradientToParams(this.model);
        const fullUrl = `${window.location.origin}/gradient/?${params}`;
        const res = await copyTextToClipboard(fullUrl);
        if (res && res.success) {
          window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'Link copied!' }));
        } else {
          window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'Unable to copy link to clipboard' }));
        }
      } catch (err) {
        console.error('Share link copy error:', err);
        window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'Unable to copy link to clipboard' }));
      }
    });

    // Dimension Buttons
    container.querySelectorAll('.gradient-dim-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.gradient-dim-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.exportDimension = btn.dataset.dimension;
        const dlBtnText = container.querySelector('#download-png-btn-text');
        if (dlBtnText) {
          const dim = EXPORT_DIMENSIONS[this.exportDimension];
          dlBtnText.textContent = `Download PNG (${dim.width}×${dim.height})`;
        }
      });
    });

    // Download PNG Button
    container.querySelector('#btn-download-gradient-png')?.addEventListener('click', () => {
      this.handleDownloadPng();
    });

    // Save Current Gradient
    container.querySelector('#btn-save-current-gradient')?.addEventListener('click', () => {
      const defaultName = `${this.model.type[0].toUpperCase() + this.model.type.slice(1)} Gradient`;
      const name = window.prompt('Name this gradient:', defaultName);
      if (name !== null) {
        const item = saveGradientToStorage(name, this.model);
        if (item) {
          trackGradientSave(this.model.type);
          this.refreshSavedList();
          window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: `Saved "${item.name}"!` }));
        }
      }
    });

    // Presets Grid
    container.querySelector('#gradient-presets-grid')?.addEventListener('click', e => {
      const presetBtn = e.target.closest('[data-preset-id]');
      if (presetBtn) {
        const preset = CURATED_PRESETS.find(p => p.id === presetBtn.dataset.presetId);
        if (preset) {
          this.model = createDefaultGradient(preset);
          this.refreshGeometryAndStops();
          this.updatePreview();
          window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: `Loaded preset "${preset.name}"` }));
        }
      }
    });

    // Attach dynamic listeners to geometry and stops lists
    this.attachGeometryListeners();
    this.attachStopsListeners();
    this.attachSavedListListeners();
  }

  attachGeometryListeners() {
    const container = this.root;
    if (!container) return;

    // Linear Angle
    const angleRange = container.querySelector('#input-gradient-angle');
    const angleNum = container.querySelector('#input-gradient-angle-num');

    const updateAngle = val => {
      this.model.angle = clamp(val, 0, 360);
      if (angleRange) angleRange.value = this.model.angle;
      if (angleNum) angleNum.value = this.model.angle;
      const label = container.querySelector('label[for="input-gradient-angle"]');
      if (label) label.textContent = `Angle (${this.model.angle}°)`;
      container.querySelectorAll('[data-set-angle]').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.setAngle) === this.model.angle);
      });
      this.updatePreview();
    };

    angleRange?.addEventListener('input', e => updateAngle(e.target.value));
    angleNum?.addEventListener('input', e => updateAngle(e.target.value));

    container.querySelectorAll('[data-set-angle]').forEach(btn => {
      btn.addEventListener('click', () => updateAngle(btn.dataset.setAngle));
    });

    // Radial Shape & Position
    container.querySelectorAll('[data-set-radial-shape]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-set-radial-shape]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.model.radialShape = btn.dataset.setRadialShape;
        this.updatePreview();
      });
    });

    container.querySelector('#select-radial-position')?.addEventListener('change', e => {
      this.model.radialPosition = e.target.value;
      this.updatePreview();
    });

    // Conic Angle & Position
    const conicRange = container.querySelector('#input-conic-angle');
    const conicNum = container.querySelector('#input-conic-angle-num');

    const updateConicAngle = val => {
      this.model.conicAngle = clamp(val, 0, 360);
      if (conicRange) conicRange.value = this.model.conicAngle;
      if (conicNum) conicNum.value = this.model.conicAngle;
      const label = container.querySelector('label[for="input-conic-angle"]');
      if (label) label.textContent = `Starting Angle (${this.model.conicAngle}°)`;
      container.querySelectorAll('[data-set-conic-angle]').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.setConicAngle) === this.model.conicAngle);
      });
      this.updatePreview();
    };

    conicRange?.addEventListener('input', e => updateConicAngle(e.target.value));
    conicNum?.addEventListener('input', e => updateConicAngle(e.target.value));

    container.querySelectorAll('[data-set-conic-angle]').forEach(btn => {
      btn.addEventListener('click', () => updateConicAngle(btn.dataset.setConicAngle));
    });

    container.querySelector('#select-conic-position')?.addEventListener('change', e => {
      this.model.conicPosition = e.target.value;
      this.updatePreview();
    });
  }

  attachStopsListeners() {
    const container = this.root;
    if (!container) return;

    // Color Pickers & Hex Inputs
    container.querySelectorAll('[data-stop-color-picker]').forEach(picker => {
      picker.addEventListener('input', e => {
        const idx = Number(e.target.dataset.stopColorPicker);
        if (this.model.stops[idx]) {
          const hex = normalizeHex(e.target.value);
          this.model.stops[idx].color = hex;
          const hexInput = container.querySelector(`[data-stop-hex-input="${idx}"]`);
          if (hexInput) hexInput.value = hex;
          const swatch = e.target.closest('.gradient-color-swatch-btn');
          if (swatch) swatch.style.background = hex;
          trackGradientColorChange(idx);
          this.updatePreview();
        }
      });
    });

    container.querySelectorAll('[data-stop-hex-input]').forEach(hexInput => {
      hexInput.addEventListener('input', e => {
        const idx = Number(e.target.dataset.stopHexInput);
        if (this.model.stops[idx] && isValidHex(e.target.value)) {
          const hex = normalizeHex(e.target.value);
          this.model.stops[idx].color = hex;
          const picker = container.querySelector(`[data-stop-color-picker="${idx}"]`);
          if (picker) picker.value = hex;
          const swatch = hexInput.closest('.gradient-stop-color-wrap')?.querySelector('.gradient-color-swatch-btn');
          if (swatch) swatch.style.background = hex;
          trackGradientColorChange(idx);
          this.updatePreview();
        }
      });
      hexInput.addEventListener('blur', e => {
        const idx = Number(e.target.dataset.stopHexInput);
        if (this.model.stops[idx]) {
          e.target.value = this.model.stops[idx].color;
        }
      });
    });

    // Position Range & Number
    container.querySelectorAll('[data-stop-pos-slider]').forEach(slider => {
      slider.addEventListener('input', e => {
        const idx = Number(e.target.dataset.stopPosSlider);
        if (this.model.stops[idx]) {
          const pos = clamp(parseInt(e.target.value, 10), 0, 100);
          this.model.stops[idx].position = pos;
          const numInput = container.querySelector(`[data-stop-pos-num="${idx}"]`);
          if (numInput) numInput.value = pos;
          this.updatePreview();
        }
      });
    });

    container.querySelectorAll('[data-stop-pos-num]').forEach(numInput => {
      numInput.addEventListener('input', e => {
        const idx = Number(e.target.dataset.stopPosNum);
        if (this.model.stops[idx]) {
          const pos = clamp(parseInt(e.target.value, 10), 0, 100);
          this.model.stops[idx].position = pos;
          const slider = container.querySelector(`[data-stop-pos-slider="${idx}"]`);
          if (slider) slider.value = pos;
          this.updatePreview();
        }
      });
    });

    // Reorder (Move Up / Down)
    container.querySelectorAll('[data-move-stop-up]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.moveStopUp);
        if (idx > 0) {
          const temp = this.model.stops[idx];
          this.model.stops[idx] = this.model.stops[idx - 1];
          this.model.stops[idx - 1] = temp;
          this.refreshStopsList();
          this.updatePreview();
        }
      });
    });

    container.querySelectorAll('[data-move-stop-down]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.moveStopDown);
        if (idx < this.model.stops.length - 1) {
          const temp = this.model.stops[idx];
          this.model.stops[idx] = this.model.stops[idx + 1];
          this.model.stops[idx + 1] = temp;
          this.refreshStopsList();
          this.updatePreview();
        }
      });
    });

    // Delete Stop
    container.querySelectorAll('[data-delete-stop]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.deleteStop);
        if (this.model.stops.length > 2) {
          this.model.stops.splice(idx, 1);
          this.refreshStopsList();
          this.updatePreview();
        }
      });
    });
  }

  attachSavedListListeners() {
    const container = this.root;
    if (!container) return;

    container.querySelectorAll('[data-load-saved]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.loadSaved;
        const saved = getSavedGradients();
        const found = saved.find(item => item.id === id);
        if (found) {
          this.model = createDefaultGradient(found.data);
          this.refreshGeometryAndStops();
          this.updatePreview();
          window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: `Loaded "${found.name}"` }));
        }
      });
    });

    container.querySelectorAll('[data-delete-saved]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.deleteSaved;
        deleteGradientFromStorage(id);
        this.refreshSavedList();
        window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'Deleted saved gradient.' }));
      });
    });
  }

  refreshGeometryAndStops() {
    if (!this.root) return;

    // Update Type Tabs
    this.root.querySelectorAll('[data-gradient-type]').forEach(tab => {
      const isActive = tab.dataset.gradientType === this.model.type;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    // Update Geometry Controls
    const geomContainer = this.root.querySelector('#gradient-geometry-controls');
    if (geomContainer) {
      geomContainer.innerHTML = this.renderGeometryControls();
      this.attachGeometryListeners();
    }

    // Refresh Stops
    this.refreshStopsList();
  }

  refreshStopsList() {
    if (!this.root) return;
    const stopsList = this.root.querySelector('#gradient-stops-list');
    if (stopsList) {
      stopsList.innerHTML = this.renderStopsList();
      this.attachStopsListeners();
    }

    const countLabel = this.root.querySelector('.gradient-stops-count');
    if (countLabel) {
      countLabel.textContent = `${this.model.stops.length} of 8 stops`;
    }

    const addBtn = this.root.querySelector('#btn-add-stop');
    if (addBtn) {
      addBtn.disabled = this.model.stops.length >= 8;
    }
  }

  refreshSavedList() {
    if (!this.root) return;
    const savedContainer = this.root.querySelector('#gradient-saved-list');
    if (savedContainer) {
      savedContainer.innerHTML = this.renderSavedList(getSavedGradients());
      this.attachSavedListListeners();
    }
  }

  addStop() {
    if (this.model.stops.length >= 8) return;

    // Determine smart new position and interpolated color
    const sorted = [...this.model.stops].sort((a, b) => a.position - b.position);
    let newPos = 50;
    let newColor = '#38D39F';

    if (sorted.length >= 2) {
      let maxGap = 0;
      let gapIndex = 0;
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1].position - sorted[i].position;
        if (gap > maxGap) {
          maxGap = gap;
          gapIndex = i;
        }
      }
      newPos = Math.round((sorted[gapIndex].position + sorted[gapIndex + 1].position) / 2);
      newColor = interpolateHex(sorted[gapIndex].color, sorted[gapIndex + 1].color, 0.5);
    }

    this.model.stops.push({
      id: `stop-${Date.now()}`,
      color: newColor,
      position: newPos
    });

    this.refreshStopsList();
    this.updatePreview();
  }

  randomize() {
    // Curate harmonious randomized palettes
    const randomPreset = CURATED_PRESETS[Math.floor(Math.random() * CURATED_PRESETS.length)];
    const types = ['linear', 'linear', 'radial', 'conic'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    this.model = createDefaultGradient({
      ...randomPreset,
      type: chosenType,
      angle: Math.floor(Math.random() * 8) * 45 // clean 0, 45, 90, 135...
    });

    trackGradientTypeChange(this.model.type);
    this.refreshGeometryAndStops();
    this.updatePreview();
    window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'Randomized gradient!' }));
  }

  reset() {
    this.model = createDefaultGradient();
    this.refreshGeometryAndStops();
    this.updatePreview();
    window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'Reset gradient to default.' }));
  }

  updatePreview() {
    if (!this.root) return;

    const cssValue = getGradientCssValue(this.model);
    const fullCss = getGradientFullCss(this.model);

    // 1. Live Preview Display Box
    const previewEl = this.root.querySelector('#gradient-live-display');
    if (previewEl) {
      previewEl.style.background = cssValue;
    }

    const typePill = this.root.querySelector('#gradient-type-pill');
    if (typePill) {
      typePill.textContent = this.model.type.toUpperCase();
    }

    // 2. Stop Track Bar
    const trackBar = this.root.querySelector('#gradient-stop-track-bar');
    if (trackBar) {
      trackBar.style.background = cssValue;
    }

    // 3. Stop Markers
    const markersContainer = this.root.querySelector('#gradient-stop-markers');
    if (markersContainer) {
      markersContainer.innerHTML = this.model.stops.map((s, i) => `
        <div class="gradient-stop-marker" style="left: ${s.position}%; background: ${s.color};" title="Stop ${i + 1}: ${s.color} at ${s.position}%"></div>
      `).join('');
    }

    // 4. CSS Code Text
    const codeText = this.root.querySelector('#gradient-css-code-text');
    if (codeText) {
      codeText.textContent = fullCss;
    }
  }

  async handleDownloadPng() {
    if (this.isDownloading) return;
    this.isDownloading = true;

    const btn = this.root.querySelector('#btn-download-gradient-png');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Rendering PNG...</span>';
    }

    try {
      const canvas = document.createElement('canvas');
      renderGradientToCanvas(canvas, this.model, this.exportDimension, { watermark: true });

      canvas.toBlob(blob => {
        if (blob) {
          const dimKey = this.exportDimension;
          const filename = `ps-color-gradient-${this.model.type}-${dimKey}.png`;
          downloadGradientBlob(blob, filename);
          trackGradientDownloadPng(this.model.type, dimKey);
          window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'Downloaded PNG image!' }));
        } else {
          window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'PNG generation failed.' }));
        }

        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
        this.isDownloading = false;
      }, 'image/png');
    } catch (err) {
      console.error('Failed to export gradient canvas:', err);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
      this.isDownloading = false;
      window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'Failed to export image.' }));
    }
  }

  showTemporarySuccess(btn, message) {
    if (!btn) return;
    const oldHtml = btn.innerHTML;
    btn.innerHTML = `<span>✓ ${message}</span>`;
    setTimeout(() => {
      btn.innerHTML = oldHtml;
    }, 1500);
  }
}
