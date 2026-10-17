#!/usr/bin/env node

/**
 * PS Color — WCAG 2.1 Contrast Ratio CLI Tool
 * 
 * Usage:
 *   node contrast_checker.mjs "#FFFFFF" "#000000"
 *   node contrast_checker.mjs "#F7F0DC" "#52796F"
 */

export function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
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

const [,, hex1, hex2] = process.argv;

if (!hex1 || !hex2) {
  console.error('Usage: node contrast_checker.mjs <hex1> <hex2>');
  console.error('Example: node contrast_checker.mjs "#FFFFFF" "#52796F"');
  process.exit(1);
}

const clean1 = hex1.startsWith('#') ? hex1 : '#' + hex1;
const clean2 = hex2.startsWith('#') ? hex2 : '#' + hex2;

if (!/^#[0-9a-fA-F]{6}$/.test(clean1) || !/^#[0-9a-fA-F]{6}$/.test(clean2)) {
  console.error('Error: Both arguments must be valid 6-character hex colors (e.g. #FFFFFF).');
  process.exit(1);
}

const ratio = getContrast(clean1, clean2);
const rating = getWcagRating(ratio);

console.log(`Comparing:      ${clean1} vs ${clean2}`);
console.log(`Contrast Ratio: ${ratio}:1`);
console.log(`WCAG Rating:    ${rating.label} (${rating.level})`);
console.log(`Accessible:     ${rating.pass ? 'YES' : 'NO'}`);
