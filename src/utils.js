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
