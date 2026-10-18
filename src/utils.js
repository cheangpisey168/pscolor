// Centralized Partner & Monetization Configuration
export const monetizationConfig = {
  // Ad Network Integration (e.g. Carbon Ads / BuySellAds / EthicalAds)
  // Set enabled: true and provide scriptSrc when your account is approved.
  adNetwork: {
    enabled: false,
    provider: 'Carbon Ads',
    scriptSrc: '' // Example: '//cdn.carbonads.com/carbon.js?serve=XXXXXX&placement=yourdomain'
  },
  // Affiliate Partner Integrations
  // Replace these standard URLs with your registered affiliate referral links
  partners: {
    figma: {
      name: 'Figma',
      label: 'Sponsored',
      url: 'https://www.figma.com/', // Insert your affiliate link: e.g. https://psm.figma.com/...
      headline: 'Design in Figma',
      description: 'Import color tokens, manage design variables, and build accessible UI components.',
      cta: 'Try Figma Free →'
    },
    framer: {
      name: 'Framer',
      label: 'Sponsored',
      url: 'https://www.framer.com/', // Insert your affiliate link: e.g. https://framer.com?via=...
      headline: 'Design Partner',
      description: 'Build responsive websites with interactive components and custom color themes.',
      cta: 'Design with Framer →'
    }
  }
};

// WCAG 2.1 MATHEMATICAL CONTRAST CALCULATION
export function getLuminance(rOrHex, g, b) {
  let red, green, blue;
  if (typeof rOrHex === 'string') {
    const clean = rOrHex.replace('#', '');
    const num = parseInt(clean, 16);
    red = (num >> 16) & 255;
    green = (num >> 8) & 255;
    blue = num & 255;
  } else {
    red = rOrHex;
    green = g;
    blue = b;
  }
  const [rs, gs, bs] = [red, green, blue].map(c => {
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

export function getWcagRating(contrastRatio) {
  if (contrastRatio >= 7.0) return { label: 'WCAG AAA Pass', level: 'aaa', pass: true };
  if (contrastRatio >= 4.5) return { label: 'WCAG AA Pass', level: 'aa', pass: true };
  if (contrastRatio >= 3.0) return { label: 'WCAG AA Large Pass', level: 'aa-large', pass: true };
  return { label: 'Low Contrast (< 3:1)', level: 'fail', pass: false };
}

// CODE EXPORT GENERATORS
export function getTailwindSnippet(colors) {
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        palette: {\n          100: '${colors[0]}',\n          200: '${colors[1]}',\n          300: '${colors[2]}',\n          400: '${colors[3]}',\n        }\n      }\n    }\n  }\n};`;
}

export function getCssSnippet(colors) {
  return `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n')}\n}`;
}

export function getFigmaTokens(colors) {
  return JSON.stringify({
    "PS_Color": {
      "color_1": { "value": colors[0], "type": "color" },
      "color_2": { "value": colors[1], "type": "color" },
      "color_3": { "value": colors[2], "type": "color" },
      "color_4": { "value": colors[3], "type": "color" }
    }
  }, null, 2);
}

/**
 * Universal text clipboard copy helper with modern Async Clipboard API
 * and document.execCommand('copy') fallback for restricted environments.
 * 
 * @param {string} text - Plain text to copy
 * @returns {Promise<{ success: boolean, method?: 'clipboard' | 'execCommand', error?: Error }>}
 */
export async function copyTextToClipboard(text) {
  if (text == null) return { success: false, error: new Error('Empty text') };
  const str = String(text);

  // 1. Try modern async Clipboard API if available
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(str);
      return { success: true, method: 'clipboard' };
    } catch (clipErr) {
      console.warn('navigator.clipboard.writeText failed, falling back to execCommand:', clipErr);
    }
  }

  // 2. Fallback to document.execCommand('copy') with offscreen textarea
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = str;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      textarea.style.width = '2em';
      textarea.style.height = '2em';
      textarea.style.padding = '0';
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';

      document.body.appendChild(textarea);
      textarea.focus({ preventScroll: true });
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (successful) {
        return { success: true, method: 'execCommand' };
      }
    } catch (execErr) {
      console.warn('document.execCommand fallback failed:', execErr);
    }
  }

  return {
    success: false,
    error: new Error('Unable to copy text to clipboard. Please check browser permissions.')
  };
}

/**
 * Draws rounded rectangle path on canvas 2D context
 */
function drawCanvasRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }
}

/**
 * Draws the official PS Color brand emblem logo mark onto a 2D canvas context.
 * Recreates the iconic 4-color swatch mark with vector fidelity.
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
 * @param {number} x - X coordinate of top-left corner
 * @param {number} y - Y coordinate of top-left corner
 * @param {number} size - Desired width and height of logo in pixels
 */
export function drawLogoMark(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 40;
  ctx.scale(s, s);

  // Background rounded square
  ctx.fillStyle = '#16161a';
  drawCanvasRoundedRect(ctx, 0, 0, 40, 40, 10);
  ctx.fill();

  // 4 iconic color swatches forming modern PS color mark
  // Swatch 1: Pink (#FF4365)
  ctx.fillStyle = '#FF4365';
  drawCanvasRoundedRect(ctx, 7, 7, 11.5, 15, 5.75);
  ctx.fill();

  // Swatch 2: Orange (#FFB020)
  ctx.fillStyle = '#FFB020';
  drawCanvasRoundedRect(ctx, 21.5, 7, 11.5, 10, 5);
  ctx.fill();

  // Swatch 3: Green (#00D29E)
  ctx.fillStyle = '#00D29E';
  drawCanvasRoundedRect(ctx, 7, 25, 11.5, 8, 4);
  ctx.fill();

  // Swatch 4: Blue (#4361EE)
  ctx.fillStyle = '#4361EE';
  drawCanvasRoundedRect(ctx, 21.5, 20, 11.5, 13, 5.75);
  ctx.fill();

  // 2 dots
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(12.75, 12.75, 2, 0, Math.PI * 2);
  ctx.arc(27.25, 26.5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Applies a professional, semi-transparent watermark to a canvas.
 * Watermark includes "PSColor.online" text with optional logo emblem,
 * positioned in the bottom-right corner with proper scaled padding.
 * 
 * @param {HTMLCanvasElement} canvas - Target canvas to watermark
 * @param {Object} [options]
 * @param {string} [options.text='PSColor.online'] - Watermark text
 * @param {boolean} [options.withLogo=true] - Whether to include the logo emblem
 * @param {number} [options.paddingRight=36] - Padding from right edge
 * @param {number} [options.paddingBottom=32] - Padding from bottom edge
 * @returns {HTMLCanvasElement} The watermarked canvas
 */
export function applyWatermark(canvas, options = {}) {
  if (!canvas) return canvas;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const text = options.text || 'PSColor.online';
  const withLogo = options.withLogo !== false;

  // Responsive scale factor based on minimum dimension (scales for 1080x1080, 1080x1350, 1080x1920, 1200x1200)
  const scale = Math.max(0.7, Math.min(width, height) / 1080);

  const fontSize = Math.round(18 * scale);
  const logoSize = Math.round(22 * scale);
  const pillPaddingX = Math.round(14 * scale);
  const pillPaddingY = Math.round(8 * scale);
  const gap = Math.round(9 * scale);
  const marginX = Math.round((options.paddingRight ?? 36) * scale);
  const marginY = Math.round((options.paddingBottom ?? 32) * scale);

  ctx.save();

  // Measure text
  ctx.font = `600 ${fontSize}px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;

  const contentWidth = (withLogo ? logoSize + gap : 0) + textWidth;
  const pillWidth = contentWidth + (pillPaddingX * 2);
  const pillHeight = Math.max(logoSize, fontSize) + (pillPaddingY * 2);

  // Position: bottom-right corner with proper padding
  const x = width - pillWidth - marginX;
  const y = height - pillHeight - marginY;
  const radius = pillHeight / 2;

  // Semi-transparent pill background for universal contrast & visibility on any palette colors
  ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
  drawCanvasRoundedRect(ctx, x, y, pillWidth, pillHeight, radius);
  ctx.fill();

  // Subtle border highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = Math.max(1, Math.round(1 * scale));
  ctx.stroke();

  // Logo mark (if enabled and present)
  let textStartX = x + pillPaddingX;
  if (withLogo) {
    const logoY = y + (pillHeight - logoSize) / 2;
    drawLogoMark(ctx, textStartX, logoY, logoSize);
    textStartX += logoSize + gap;
  }

  // Semi-transparent clean white text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
  ctx.font = `600 ${fontSize}px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, textStartX, y + (pillHeight / 2));

  ctx.restore();
  return canvas;
}


