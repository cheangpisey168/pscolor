/**
 * PS Color - Phase 2: Share Palette as Image Module
 * 
 * Generates high-resolution, professional shareable palette images entirely in browser:
 *  - 3 templates: Minimal, Modern, and Social Media
 *  - 3 export dimensions: 1080×1080 (1:1 Square), 1080×1350 (4:5 Portrait), 1080×1920 (9:16 Story)
 *  - Full customization: Title, HEX codes toggle, PS Color watermark toggle
 *  - Real-time live preview canvas
 *  - 3 export actions: High-Res Download PNG, Clipboard Copy Image, Native Web Share API
 *  - Zero external dependencies; 100% Canvas 2D with exact color fidelity
 */

import { getContrast, getWcagRating, applyWatermark, drawLogoMark } from './utils.js';
export { applyWatermark, drawLogoMark };
import {
  trackShareImageOpen,
  trackShareImageExport,
  trackShareImageTemplateChange,
  trackShareImageDimensionChange
} from './analytics.js';

export const IMAGE_DIMENSIONS = {
  '1080x1080': {
    width: 1080,
    height: 1080,
    label: '1:1 Square',
    desc: 'Instagram, LinkedIn, X/Twitter Feed Post',
    aspect: '1 / 1'
  },
  '1080x1350': {
    width: 1080,
    height: 1350,
    label: '4:5 Portrait',
    desc: 'Instagram Portrait Feed Post',
    aspect: '4 / 5'
  },
  '1080x1920': {
    width: 1080,
    height: 1920,
    label: '9:16 Story',
    desc: 'Instagram Story, TikTok, Wallpaper, Pinterest',
    aspect: '9 / 16'
  }
};

export const IMAGE_TEMPLATES = {
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    desc: 'Clean, full-bleed color stripes with sleek typography'
  },
  modern: {
    id: 'modern',
    label: 'Modern',
    desc: 'Structured design system cards with tokens & contrast'
  },
  social: {
    id: 'social',
    label: 'Social Media',
    desc: 'Punchy, high-impact aesthetic for viral sharing'
  }
};

/**
 * Returns accessible text color (dark or light) for a given background hex
 */
export function getReadableTextColor(bgHex) {
  if (!bgHex || !/^#[0-9a-f]{6}$/i.test(bgHex)) return '#0f172a';
  const darkContrast = getContrast(bgHex, '#0f172a');
  const lightContrast = getContrast(bgHex, '#ffffff');
  return darkContrast >= lightContrast ? '#0f172a' : '#ffffff';
}

/**
 * Converts Hex string to RGB object { r, g, b }
 */
export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Draws a rounded rectangle path on canvas
 */
export function drawRoundedRect(ctx, x, y, width, height, radius) {
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
 * Draws a pill/capsule badge with text
 */
function drawPillBadge(ctx, x, y, text, bgColor, textColor, fontSize = 16, paddingX = 16, paddingY = 8) {
  ctx.font = `600 ${fontSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const badgeWidth = textWidth + (paddingX * 2);
  const badgeHeight = fontSize + (paddingY * 2);

  ctx.fillStyle = bgColor;
  drawRoundedRect(ctx, x, y, badgeWidth, badgeHeight, badgeHeight / 2);
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + paddingX, y + (badgeHeight / 2));
  return badgeWidth;
}

/**
 * Renders Template 1: Minimal
 */
export function renderMinimalTemplate(ctx, { width, height, colors, title, showHex, showBranding }) {
  const stripeWidth = width / 4;

  // 1. Full-bleed vertical stripes
  colors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(i * stripeWidth, 0, stripeWidth, height);

    // If showHex is true, render a vertical/horizontal contrast-aware badge in the upper half
    if (showHex) {
      const textColor = getReadableTextColor(color);
      const isLightText = textColor === '#ffffff';
      const badgeBg = isLightText ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.75)';

      const badgeX = (i * stripeWidth) + (stripeWidth / 2) - 55;
      const badgeY = height * 0.16;

      ctx.save();
      ctx.fillStyle = badgeBg;
      drawRoundedRect(ctx, badgeX, badgeY, 110, 42, 10);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = "700 16px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(color.toUpperCase(), (i * stripeWidth) + (stripeWidth / 2), badgeY + 21);
      ctx.restore();
    }
  });

  // 2. Floating Minimalist White Glass Card at bottom
  const cardMargin = 64;
  const cardW = width - (cardMargin * 2);
  const cardH = 170;
  const cardY = height - cardH - cardMargin;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
  drawRoundedRect(ctx, cardMargin, cardY, cardW, cardH, 24);
  ctx.fill();

  // Subtle card border
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Card Content
  const textX = cardMargin + 36;

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = "800 34px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const cleanTitle = title || 'Minimalist Color Palette';
  ctx.fillText(cleanTitle.slice(0, 42), textX, cardY + 28);

  // Subtitle / Hex row
  if (showHex) {
    let swatchX = textX;
    const swatchY = cardY + 84;
    colors.forEach(c => {
      // Color Dot
      ctx.fillStyle = c;
      drawRoundedRect(ctx, swatchX, swatchY, 18, 18, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Hex code
      ctx.fillStyle = '#475569';
      ctx.font = "600 16px 'JetBrains Mono', monospace";
      ctx.textBaseline = 'middle';
      ctx.fillText(c.toUpperCase(), swatchX + 26, swatchY + 9);

      swatchX += 135;
    });
  }

  // Branding Watermark
  if (showBranding) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = "600 14px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('PS color • pscolor.online', width - cardMargin - 36, cardY + cardH - 24);
  }

  ctx.restore();
}

/**
 * Renders Template 2: Modern
 */
export function renderModernTemplate(ctx, { width, height, colors, title, showHex, showBranding, palette }) {
  // 1. Clean Canvas Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Top color ribbon (4 stripes)
  const ribbonW = width / 4;
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i * ribbonW, 0, ribbonW, 10);
  });

  // 2. Header Area
  const marginX = 64;
  const headerY = 70;

  // Eyebrow badge
  ctx.save();
  drawPillBadge(ctx, marginX, headerY, 'DESIGN TOKENS • 4-COLOR PALETTE', 'rgba(15, 23, 42, 0.06)', '#475569', 13, 14, 6);

  // Main Title
  ctx.fillStyle = '#0f172a';
  ctx.font = "800 44px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const cleanTitle = title || 'Design System Palette';
  ctx.fillText(cleanTitle.slice(0, 38), marginX, headerY + 44);

  // Subtitle
  ctx.fillStyle = '#64748b';
  ctx.font = "500 20px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText('WCAG 2.1 relative luminance & accessible design tokens', marginX, headerY + 104);
  ctx.restore();

  // 3. Swatches Layout
  const roles = ['01 BASE', '02 SURFACE', '03 STRUCTURE', '04 ACCENT'];
  const roleWeights = ['41% Base Canvas', '26% Surface Card', '18% Structure Line', '15% CTA Accent'];

  if (height === 1080) {
    // Square layout: 4 vertical columns
    const cardY = 240;
    const cardH = 680;
    const cardW = (width - (marginX * 2) - (3 * 20)) / 4; // ~218px

    colors.forEach((color, i) => {
      const cardX = marginX + (i * (cardW + 20));

      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;

      // Card background
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Top color swatch block (occupies ~68% of card height)
      const swatchH = Math.round(cardH * 0.68);
      ctx.fillStyle = color;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(cardX, cardY, cardW, swatchH, [20, 20, 0, 0]);
      } else {
        drawRoundedRect(ctx, cardX, cardY, cardW, swatchH, 20);
      }
      ctx.fill();

      // Card Bottom Info
      const infoY = cardY + swatchH + 20;

      // Role label
      ctx.fillStyle = '#64748b';
      ctx.font = "700 13px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(roles[i], cardX + 18, infoY);

      // HEX Code
      if (showHex) {
        ctx.fillStyle = '#0f172a';
        ctx.font = "800 24px 'JetBrains Mono', monospace";
        ctx.fillText(color.toUpperCase(), cardX + 18, infoY + 24);

        // RGB
        const rgb = hexToRgb(color);
        ctx.fillStyle = '#94a3b8';
        ctx.font = "600 14px 'JetBrains Mono', monospace";
        ctx.fillText(`RGB (${rgb.r}, ${rgb.g}, ${rgb.b})`, cardX + 18, infoY + 58);
      }

      // Role weight
      ctx.fillStyle = '#64748b';
      ctx.font = "500 13px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.fillText(roleWeights[i], cardX + 18, infoY + 86);

      ctx.restore();
    });
  } else {
    // Portrait / Story layout: 4 horizontal rows
    const startY = 240;
    const availableH = height - startY - 140;
    const rowH = (availableH - (3 * 18)) / 4;
    const cardW = width - (marginX * 2);

    colors.forEach((color, i) => {
      const cardY = startY + (i * (rowH + 18));

      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.06)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;

      ctx.fillStyle = '#ffffff';
      drawRoundedRect(ctx, marginX, cardY, cardW, rowH, 18);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Left color block (35% width)
      const swatchW = Math.round(cardW * 0.36);
      ctx.fillStyle = color;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(marginX, cardY, swatchW, rowH, [18, 0, 0, 18]);
      } else {
        drawRoundedRect(ctx, marginX, cardY, swatchW, rowH, 18);
      }
      ctx.fill();

      // Right detail info
      const infoX = marginX + swatchW + 36;
      const centerY = cardY + (rowH / 2);

      // Role & Weight
      ctx.fillStyle = '#64748b';
      ctx.font = "700 15px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${roles[i]}  •  ${roleWeights[i]}`, infoX, centerY - 28);

      // HEX Code
      if (showHex) {
        ctx.fillStyle = '#0f172a';
        ctx.font = "800 32px 'JetBrains Mono', monospace";
        ctx.fillText(color.toUpperCase(), infoX, centerY + 8);

        // RGB
        const rgb = hexToRgb(color);
        ctx.fillStyle = '#94a3b8';
        ctx.font = "600 16px 'JetBrains Mono', monospace";
        ctx.fillText(`RGB (${rgb.r}, ${rgb.g}, ${rgb.b})`, infoX + 220, centerY + 10);
      }

      ctx.restore();
    });
  }

  // 4. Footer Bar
  if (showBranding) {
    ctx.save();
    ctx.fillStyle = '#64748b';
    ctx.font = "600 15px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('PS color • Curated Free Color Palettes', marginX, height - 42);

    ctx.textAlign = 'right';
    ctx.fillText('pscolor.online', width - marginX, height - 42);
    ctx.restore();
  }
}

/**
 * Renders Template 3: Social Media
 */
export function renderSocialTemplate(ctx, { width, height, colors, title, showHex, showBranding, palette }) {
  // 1. Deep Midnight Black Canvas
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, width, height);

  // Ambient Color Glows from primary/secondary
  const cPrimary = colors[3] || colors[0];
  const cBase = colors[0];

  const grad1 = ctx.createRadialGradient(width * 0.8, height * 0.15, 50, width * 0.8, height * 0.15, 450);
  grad1.addColorStop(0, `${cPrimary}33`);
  grad1.addColorStop(1, 'transparent');
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, width, height);

  const grad2 = ctx.createRadialGradient(width * 0.2, height * 0.85, 50, width * 0.2, height * 0.85, 400);
  grad2.addColorStop(0, `${cBase}28`);
  grad2.addColorStop(1, 'transparent');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, width, height);

  // 2. Header
  const marginX = 64;
  const headerY = 70;

  ctx.save();
  // Pill Badge
  drawPillBadge(ctx, marginX, headerY, '✦ COLOR PALETTE INSPIRATION', 'rgba(255, 255, 255, 0.1)', '#38bdf8', 13, 16, 7);

  // Big Bold Title
  ctx.fillStyle = '#ffffff';
  ctx.font = "800 48px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const cleanTitle = title || 'Vibrant Color Harmony';
  ctx.fillText(cleanTitle.slice(0, 36), marginX, headerY + 48);

  ctx.fillStyle = '#94a3b8';
  ctx.font = "500 20px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText('Tap to save & export for Web, Mobile, and Figma', marginX, headerY + 110);
  ctx.restore();

  // 3. Hero Arched Pill Swatches
  const swatchStartY = 240;
  const swatchBottomMargin = showBranding ? 140 : 80;
  const swatchH = height - swatchStartY - swatchBottomMargin;
  const pillW = (width - (marginX * 2) - (3 * 22)) / 4; // ~216px
  const pillRadius = Math.min(100, pillW / 2);

  colors.forEach((color, i) => {
    const pillX = marginX + (i * (pillW + 22));

    ctx.save();
    ctx.shadowColor = `${color}40`;
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;

    // Draw pill shape
    ctx.fillStyle = color;
    drawRoundedRect(ctx, pillX, swatchStartY, pillW, swatchH, pillRadius);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Top Index Circle
    const circleX = pillX + (pillW / 2);
    const circleY = swatchStartY + 50;
    const textColor = getReadableTextColor(color);

    ctx.fillStyle = textColor === '#ffffff' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(circleX, circleY, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = "800 16px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}`, circleX, circleY);

    // Bottom Hex Pill Badge
    if (showHex) {
      const badgeW = pillW - 24;
      const badgeH = 44;
      const badgeX = pillX + 12;
      const badgeY = swatchStartY + swatchH - badgeH - 24;

      ctx.fillStyle = textColor === '#ffffff' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.85)';
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = "700 16px 'JetBrains Mono', monospace";
      ctx.fillText(color.toUpperCase(), circleX, badgeY + (badgeH / 2));
    }

    ctx.restore();
  });

  // 4. Footer Social Bar
  if (showBranding) {
    ctx.save();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = "700 16px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('PS color  •  pscolor.online', marginX, height - 42);

    ctx.fillStyle = '#94a3b8';
    ctx.font = "500 15px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText('Save for your next project 🔖', width - marginX, height - 42);
    ctx.restore();
  }
}

/**
 * Universal Palette Canvas Exporter
 */
export function renderPaletteToCanvas(canvas, options = {}) {
  const {
    palette = {},
    colors = palette.colors || ['#F7F0DC', '#D9E4C8', '#A2B89B', '#52796F'],
    title = palette.title || (palette.id ? `Palette #${palette.id.slice(0, 8)}` : 'PS Color Palette'),
    template = 'minimal',
    dimensions = '1080x1080',
    showHex = true,
    showBranding = true
  } = options;

  const dim = IMAGE_DIMENSIONS[dimensions] || IMAGE_DIMENSIONS['1080x1080'];
  canvas.width = dim.width;
  canvas.height = dim.height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, dim.width, dim.height);

  const renderArgs = {
    width: dim.width,
    height: dim.height,
    colors,
    title,
    showHex,
    showBranding,
    palette
  };

  if (template === 'modern') {
    renderModernTemplate(ctx, renderArgs);
  } else if (template === 'social') {
    renderSocialTemplate(ctx, renderArgs);
  } else {
    renderMinimalTemplate(ctx, renderArgs);
  }

  return canvas;
}

/**
 * Generates PNG Blob asynchronously with watermark
 */
export function generateShareImageBlob(palette, options = {}) {
  return new Promise((resolve) => {
    // 1. Generate base export image on canvas
    const baseCanvas = document.createElement('canvas');
    renderPaletteToCanvas(baseCanvas, { palette, ...options });

    // 2. Draw onto export canvas and add watermark before blob generation
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = baseCanvas.width;
    exportCanvas.height = baseCanvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.drawImage(baseCanvas, 0, 0);

    applyWatermark(exportCanvas, {
      text: 'PSColor.online',
      withLogo: true,
      ...options.watermarkOptions
    });

    exportCanvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * Triggers native browser file download of the image with watermark
 */
export function downloadShareImage(palette, options = {}) {
  // 1. Generate base export image on canvas
  const baseCanvas = document.createElement('canvas');
  renderPaletteToCanvas(baseCanvas, { palette, ...options });

  // 2. Draw onto export canvas and add watermark before download
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = baseCanvas.width;
  exportCanvas.height = baseCanvas.height;
  const exportCtx = exportCanvas.getContext('2d');
  exportCtx.drawImage(baseCanvas, 0, 0);

  applyWatermark(exportCanvas, {
    text: 'PSColor.online',
    withLogo: true,
    ...options.watermarkOptions
  });

  exportCanvas.toBlob((blob) => {
    if (!blob) return;
    const template = options.template || 'minimal';
    const dim = options.dimensions || '1080x1080';
    const id = palette?.id ? palette.id.slice(0, 8) : 'custom';
    const filename = `ps-color-palette-${id}-${template}-${dim}.png`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    trackShareImageExport(palette?.id, template, dim, 'download');
  }, 'image/png');
}

/**
 * Open the interactive Share Palette as Image modal
 */
export function openShareImageModal(palette, customOptions = {}) {
  const dialog = document.querySelector('#dialog');
  if (!dialog) return;

  const colors = customOptions.colors || palette?.colors || ['#F7F0DC', '#D9E4C8', '#A2B89B', '#52796F'];
  const defaultTitle = customOptions.title || (palette?.tags && palette.tags.length ? `${palette.tags[0].toUpperCase()} Harmony` : `Palette #${palette?.id ? palette.id.slice(0, 8) : 'Custom'}`);

  // Studio State
  const state = {
    palette: palette || {},
    colors,
    title: defaultTitle,
    template: 'minimal',
    dimensions: '1080x1080',
    showHex: true,
    showBranding: true
  };

  trackShareImageOpen(palette?.id);

  // Render Modal HTML
  dialog.className = 'share-image-dialog';
  dialog.innerHTML = `
    <button class="icon-button dialog-close" data-close aria-label="Close dialog">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="m6 6 12 12M6 18 18 6"/></svg>
    </button>
    <div class="share-modal-header">
      <div class="share-modal-title-group">
        <span class="share-modal-badge">✦ PHASE 2 STUDIO</span>
        <h2 id="share-modal-heading">Share Palette as Image</h2>
      </div>
      <p class="share-modal-sub">Create high-resolution, exportable graphics for social media, presentations, and design systems.</p>
    </div>

    <div class="share-studio-layout">
      <!-- Left: Real-time Live Preview -->
      <div class="share-preview-pane">
        <div class="share-canvas-container" id="share-canvas-wrapper" style="aspect-ratio: ${IMAGE_DIMENSIONS[state.dimensions].aspect}">
          <canvas id="share-preview-canvas"></canvas>
          <div class="share-canvas-dimension-tag" id="share-dimension-tag">${IMAGE_DIMENSIONS[state.dimensions].label}</div>
        </div>
      </div>

      <!-- Right: Controls & Actions -->
      <div class="share-controls-pane">
        <!-- 1. Template Tabs -->
        <div class="share-control-group">
          <label class="share-control-label">Image Template</label>
          <div class="share-template-buttons" role="tablist">
            ${Object.values(IMAGE_TEMPLATES).map(t => `
              <button type="button" class="share-template-btn ${t.id === state.template ? 'active' : ''}" data-template="${t.id}" title="${t.desc}">
                <span>${t.label}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 2. Export Dimensions -->
        <div class="share-control-group">
          <label class="share-control-label">Aspect Ratio &amp; Dimensions</label>
          <div class="share-dimension-buttons">
            ${Object.entries(IMAGE_DIMENSIONS).map(([key, d]) => `
              <button type="button" class="share-dim-btn ${key === state.dimensions ? 'active' : ''}" data-dim="${key}">
                <strong>${d.label}</strong>
                <span>${key}px</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 3. Palette Title Customization -->
        <div class="share-control-group">
          <label class="share-control-label" for="share-input-title">Palette Title</label>
          <input type="text" id="share-input-title" class="share-text-input" value="${state.title.replace(/"/g, '&quot;')}" maxlength="45" placeholder="Enter palette name...">
        </div>

        <!-- 4. Action Buttons -->
        <div class="share-actions-group">
          <button type="button" id="btn-share-download" class="button primary full-width share-action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></svg>
            <span id="share-download-btn-text">Download PNG (${IMAGE_DIMENSIONS[state.dimensions].width}px)</span>
          </button>
        </div>
      </div>
    </div>
  `;

  dialog.showModal();

  const previewCanvas = dialog.querySelector('#share-preview-canvas');
  const canvasWrapper = dialog.querySelector('#share-canvas-wrapper');
  const dimensionTag = dialog.querySelector('#share-dimension-tag');
  const titleInput = dialog.querySelector('#share-input-title');

  // Live Render Helper
  function updatePreview() {
    renderPaletteToCanvas(previewCanvas, state);
    if (canvasWrapper) {
      canvasWrapper.style.aspectRatio = IMAGE_DIMENSIONS[state.dimensions].aspect;
    }
    if (dimensionTag) {
      dimensionTag.textContent = `${IMAGE_DIMENSIONS[state.dimensions].label} (${IMAGE_DIMENSIONS[state.dimensions].width}×${IMAGE_DIMENSIONS[state.dimensions].height})`;
    }
    const dlBtnText = dialog.querySelector('#share-download-btn-text');
    if (dlBtnText) {
      dlBtnText.textContent = `Download PNG (${IMAGE_DIMENSIONS[state.dimensions].width}px)`;
    }
  }

  // Initial draw
  updatePreview();

  // Template Switching
  dialog.querySelectorAll('.share-template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      dialog.querySelectorAll('.share-template-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.template = btn.dataset.template;
      trackShareImageTemplateChange(state.template);
      updatePreview();
    });
  });

  // Dimension Switching
  dialog.querySelectorAll('.share-dim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      dialog.querySelectorAll('.share-dim-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.dimensions = btn.dataset.dim;
      trackShareImageDimensionChange(state.dimensions);
      updatePreview();
    });
  });

  // Title Input
  titleInput?.addEventListener('input', (e) => {
    state.title = e.target.value.trim() || 'Color Palette';
    updatePreview();
  });

  // Download Action
  dialog.querySelector('#btn-share-download')?.addEventListener('click', () => {
    downloadShareImage(state.palette, state);
    showModalFeedback(dialog.querySelector('#btn-share-download'), 'Downloaded!');
  });

  // Close Dialog Action
  dialog.querySelector('[data-close]')?.addEventListener('click', () => {
    dialog.close();
  });
}

function showModalFeedback(button, message) {
  if (!button) return;
  const originalHtml = button.innerHTML;
  button.innerHTML = `<span>✓ ${message}</span>`;
  button.disabled = true;
  setTimeout(() => {
    button.innerHTML = originalHtml;
    button.disabled = false;
  }, 1600);
}
