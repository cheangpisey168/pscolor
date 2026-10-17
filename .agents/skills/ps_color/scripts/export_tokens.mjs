#!/usr/bin/env node

/**
 * PS Color — Developer Token Exporter CLI Tool
 * 
 * Usage:
 *   node export_tokens.mjs tailwind "#F7F0DC" "#D9E4C8" "#A2B89B" "#52796F"
 *   node export_tokens.mjs css "#F7F0DC" "#D9E4C8" "#A2B89B" "#52796F"
 *   node export_tokens.mjs figma "#F7F0DC" "#D9E4C8" "#A2B89B" "#52796F"
 */

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

const [,, format, ...colors] = process.argv;

if (!format || colors.length < 4) {
  console.error('Usage: node export_tokens.mjs <tailwind|css|figma> <c1> <c2> <c3> <c4>');
  console.error('Example: node export_tokens.mjs tailwind "#F7F0DC" "#D9E4C8" "#A2B89B" "#52796F"');
  process.exit(1);
}

const cleaned = colors.slice(0, 4).map(c => c.startsWith('#') ? c.toUpperCase() : '#' + c.toUpperCase());

if (cleaned.some(c => !/^#[0-9A-F]{6}$/.test(c))) {
  console.error('Error: All 4 colors must be valid 6-character hex colors (e.g. #F7F0DC).');
  process.exit(1);
}

switch (format.toLowerCase()) {
  case 'tailwind':
    console.log(getTailwindSnippet(cleaned));
    break;
  case 'css':
    console.log(getCssSnippet(cleaned));
    break;
  case 'figma':
  case 'json':
  case 'tokens':
    console.log(getFigmaTokens(cleaned));
    break;
  default:
    console.error(`Unknown format: "${format}". Choose from: tailwind, css, figma`);
    process.exit(1);
}
