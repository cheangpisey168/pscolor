# Multi-Format Code Exporters Guide

PS Color generates design tokens in 3 standardized formats for seamless transition from palette discovery to implementation.

---

## 1. Tailwind CSS Config

Generates a CommonJS module snippet ready to paste into `tailwind.config.js`:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        palette: {
          100: '#F7F0DC',
          200: '#D9E4C8',
          300: '#A2B89B',
          400: '#52796F',
        }
      }
    }
  }
};
```

### Usage in Tailwind templates:
- Background: `bg-palette-100`
- Surface: `bg-palette-200`
- Borders / Icons: `border-palette-300 text-palette-300`
- Text / Action: `text-palette-400 bg-palette-400`

---

## 2. CSS Custom Properties (:root)

Generates clean W3C CSS variables:

```css
:root {
  --color-1: #F7F0DC;
  --color-2: #D9E4C8;
  --color-3: #A2B89B;
  --color-4: #52796F;
}
```

---

## 3. Figma Design Tokens (DTCG JSON)

Follows the Design Tokens Community Group (DTCG) specification compatible with Figma Tokens Studio and Style Dictionary:

```json
{
  "PS_Color": {
    "color_1": {
      "value": "#F7F0DC",
      "type": "color"
    },
    "color_2": {
      "value": "#D9E4C8",
      "type": "color"
    },
    "color_3": {
      "value": "#A2B89B",
      "type": "color"
    },
    "color_4": {
      "value": "#52796F",
      "type": "color"
    }
  }
}
```
