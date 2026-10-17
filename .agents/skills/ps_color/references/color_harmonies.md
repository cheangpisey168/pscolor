# Color Harmonies & Palette Taxonomy Guide

PS Color organizes 4-color palettes based on visual hierarchy, mathematical contrast, and semantic taxonomy.

---

## 1. Visual Hierarchy & Proportions

A standard PS Color palette uses a 4-layer stacked hierarchy corresponding to classical UI distribution:

| Swatch Layer | Flex Proportion | Typical Role in Design |
| :--- | :---: | :--- |
| **Color 1 (Dominant / Canvas)** | **41%** | Background, primary card surface, or light canvas fill. |
| **Color 2 (Secondary Surface)** | **26%** | Secondary containers, cards, borders, or large layout blocks. |
| **Color 3 (Structural Accent)** | **18%** | Headings, icons, active tab highlights, or subheadings. |
| **Color 4 (High-Contrast Hero)** | **15%** | Primary action buttons, CTA badges, key indicators, or deep text. |

This distribution ensures that designs created with PS Color palettes avoid color fatigue and maintain balance.

---

## 2. Palette ID Encoding

In PS Color, every palette has a canonical 24-character hexadecimal identifier constructed by concatenating its four 6-character hex colors (without `#`):

```
#F7F0DC + #D9E4C8 + #A2B89B + #52796F
  --> ID: "f7f0dcd9e4c8a2b89b52796f"
```

This format provides several advantages:
1. **Stateless Reconstruction**: Any palette can be reconstructed on-the-fly without database lookups.
2. **Deep Linking**: Direct URL access via `/palette/f7f0dcd9e4c8a2b89b52796f`.
3. **Idempotence**: Prevents duplicate custom palettes in `localStorage`.

---

## 3. Taxonomy & Categorization

Palettes are categorized across 4 orthogonal dimensions:

### A. Hue Families
- `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `brown`, `grey`, `black`, `white`

### B. Aesthetic Styles
- `pastel`: Soft, low-saturation, high-lightness tones.
- `vintage` / `retro`: Warm, muted, 70s/80s analog film tones.
- `neon`: High-vibrancy, fluorescent RGB values.
- `gold`: Warm metallic yellows, deep ochres, and bronze hues.
- `warm` / `cold`: Color temperature classifications.

### C. Moods & Atmospheres
- `happy`: Bright, playful, cheerful primary and secondary combinations.
- `nature` / `earth`: Organic forest greens, soil browns, sand beiges.
- `night` / `space`: Deep indigos, midnight blues, celestial purples.
- `sunset`: Gradient transitions from violet to crimson and gold.

### D. Seasonal & Events
- `summer`, `fall`, `winter`, `spring`, `wedding`, `christmas`, `halloween`
