# PS color

A high-fidelity standalone color palette discovery platform and clone of [Color Hunt](https://colorhunt.co/), branded as PS color. Built with vanilla JavaScript, modern CSS, and Vite.

## Run

```sh
npm install
npm run dev
```

On Windows PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

Open the local URL printed by Vite (typically `http://localhost:5173`). `npm run build` creates the production bundle in `dist/`; `npm run preview` serves that build.

## Features

- **Iconic Mascot & Micro-Interactions**: Color Hunt's mascot face and multi-colored tongue in the header, with interactive bounce animation whenever you like a palette.
- **Over 650 Curated Palettes**: Rich bundled dataset of 654 authentic palettes categorized across 31 style/mood themes and 18 color groups with relative publication dates and popularity scores.
- **Smart Semantic Search & Tag Bank**: Tag suggestions categorized into **Colors**, **Collections**, and **Related** tags using Color Hunt's synonym dictionary (e.g. searching "sun" suggests yellow, gold, sunset; searching "galaxy" suggests space, cyberpunk). Supports direct hex code searches.
- **Multi-tag Filtering**: Filter palettes across multiple tags simultaneously (e.g. `/palettes/pastel-blue`).
- **Interactive Palette Cards & Swatches**: 4-tiered vertical cards (41%, 26%, 18%, 15% proportions). Hovering any swatch reveals its uppercase hex value; clicking it triggers an inline floating `Copied` badge and copies the hex code to the clipboard.
- **Dynamic Views**:
  - **New**: Chronological feed of the newest palettes.
  - **Popular**: Filter by timeframe (*Month*, *Year*, *All time*).
  - **Random**: Instant palette reshuffle on every click.
  - **Collection**: Personal collection stored in browser `localStorage`, with quick-remove `✕` buttons in the sidebar mini-grid.
- **Infinite Scrolling & Pagination**: Automatically loads more palettes as you scroll down the page, with smooth passive scroll listeners.
- **Dedicated Palette Detail View (`/palette/:id`)**:
  - Large palette preview.
  - Color breakdown table with circular color balls, clickable `#HEX` values, and `RGB(r, g, b)` copy buttons.
  - Interactive Like toggle, PNG Image download, and Share Link button.
  - Related palettes feed matching tags and color harmonies.
- **Interactive Palette Creator (`/create`)**:
  - Live 4-color vertical palette preview.
  - Real-time color pickers and hex inputs.
  - Quick randomize button to generate cohesive color combinations.
  - Saves locally to collection and opens the new palette's detail page.
- **High-Resolution PNG Generator**:
  - Generates 1200x1200px crisp PNG exports with color blocks, hex labels, and clean watermark.
- **Dedicated Information Pages**:
  - `/about`: The story of Color Hunt, curation ethos, and creator background with animated mascot GIF.
  - `/terms`: Clear terms of service with 100% free personal and commercial license.
  - `/privacy`: Zero-tracking, privacy-first local storage explanation.
- **JSON Collection Export**: Export your saved palette collection anytime as `ps-color-collection.json`.
- **Keyboard Shortcuts**:
  - `/`: Quick focus on search bar.
  - `Escape`: Close modals, search panels, and menus.
  - `Ctrl+D` / `Cmd+D`: Bookmark reminder modal.
- **Mobile First & Responsive**: Optimized for desktop, laptop, tablet, and mobile with fixed bottom navigation bar on small viewports.

## Browser Testing

With the development server running, run:

```sh
npm test
```
*(or `npm.cmd test` on Windows)*

Automated browser tests verify desktop/mobile layouts, category and search filtering, collection persistence, clipboard copying, detail views, PNG generation, palette creator, timeframe switches, dedicated routes, and dialog interactions.
