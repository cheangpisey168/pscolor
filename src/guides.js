/**
 * PS Color — Educational Color Guides Module
 * In-depth educational articles, SEO structured data, and interactive developer guides.
 */

import { copyTextToClipboard } from './utils.js';

export const GUIDES_DATA = [
  {
    slug: 'how-to-create-css-gradients',
    title: 'How to Create CSS Gradients — Linear, Radial & Conic Tutorial',
    shortTitle: 'How to Create CSS Gradients',
    category: 'CSS & Code',
    readingTime: '8 min read',
    publishDate: 'October 19, 2026',
    isoDate: '2026-10-19',
    author: 'PS Color Design Team',
    description: 'Master CSS gradients from syntax to production. Learn linear, radial, and conic gradient mechanics, color stops, angles, performance best practices, and WCAG contrast.',
    keywords: 'CSS gradients, linear-gradient, radial-gradient, conic-gradient, CSS color stops, gradient generator, web gradients, CSS background gradient',
    relatedSlugs: ['how-to-choose-colors-for-a-website', 'understanding-color-contrast-and-wcag'],
    toc: [
      { id: 'what-are-css-gradients', text: '1. What Are CSS Gradients?' },
      { id: 'linear-gradients', text: '2. CSS Linear Gradients (Syntax & Angles)' },
      { id: 'radial-gradients', text: '3. CSS Radial Gradients (Shapes & Positioning)' },
      { id: 'conic-gradients', text: '4. CSS Conic Gradients (Angles & Sweeps)' },
      { id: 'color-stops-positions', text: '5. Multi-Stop Gradients & Position Control' },
      { id: 'color-banding-spaces', text: '6. Eliminating Color Banding & Muddy Grays' },
      { id: 'wcag-contrast-gradients', text: '7. Text Contrast & Accessibility Over Gradients' },
      { id: 'interactive-generator-tool', text: '8. Interactive Tool: PS Color Gradient Generator' },
      { id: 'gradient-faq', text: '9. Frequently Asked Questions' }
    ],
    contentHtml: `
      <section id="what-are-css-gradients">
        <h2>1. What Are CSS Gradients?</h2>
        <p>In modern web design, a CSS gradient is not a static raster image file (like PNG or JPEG); it is a synthetic image generated algorithmically by the browser's graphics rendering engine. Gradients are defined using the <code>background</code> or <code>background-image</code> CSS property and provide multiple significant performance benefits:</p>
        <ul class="guide-bullets">
          <li><strong>Zero HTTP Network Overhead:</strong> Gradients require no external asset requests, DNS lookups, or image decoding latency, resulting in faster Largest Contentful Paint (LCP) times.</li>
          <li><strong>Infinite Resolution Scalability:</strong> Because gradients are vector calculations, they render with razor-sharp fidelity on standard displays, 4K Retina screens, and ultra-wide mobile viewports without pixelation.</li>
          <li><strong>Dynamic Customizability:</strong> Color stops, angles, and opacities can be adjusted dynamically in real time using CSS custom properties (variables) or JavaScript state.</li>
        </ul>
        <p>CSS Level 3 and 4 Image Values specifications define three primary gradient types: <strong>Linear Gradients</strong> (transitions along a directional axis), <strong>Radial Gradients</strong> (emanating from a central focal point), and <strong>Conic Gradients</strong> (rotational sweeps around a center point).</p>
      </section>

      <section id="linear-gradients">
        <h2>2. CSS Linear Gradients (Syntax & Angles)</h2>
        <p>A linear gradient transitions smoothly between two or more colors along a straight imaginary line called the <em>gradient ray</em>. The syntax accepts an optional direction followed by a comma-separated list of color stops:</p>
        
        <div class="guide-code-box">
          <div class="guide-code-header">
            <span>CSS Linear Gradient Syntax</span>
            <button type="button" class="guide-copy-btn" data-copy-code="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">Copy</button>
          </div>
          <pre><code>background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);</code></pre>
        </div>

        <h3>Understanding the Angle Coordinate System</h3>
        <p>Angles specify the trajectory of the gradient ray. By standard CSS convention:</p>
        <div class="guide-table-wrap">
          <table class="guide-table">
            <thead>
              <tr>
                <th>Angle (deg)</th>
                <th>Keyword Equivalent</th>
                <th>Direction of Flow</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>0deg</code></td>
                <td><code>to top</code></td>
                <td>Bottom to Top (vertical upward)</td>
              </tr>
              <tr>
                <td><code>90deg</code></td>
                <td><code>to right</code></td>
                <td>Left to Right (horizontal forward)</td>
              </tr>
              <tr>
                <td><code>135deg</code></td>
                <td><code>to bottom right</code></td>
                <td>Top-Left to Bottom-Right (classic UI diagonal)</td>
              </tr>
              <tr>
                <td><code>180deg</code></td>
                <td><code>to bottom</code></td>
                <td>Top to Bottom (default if angle omitted)</td>
              </tr>
              <tr>
                <td><code>270deg</code></td>
                <td><code>to left</code></td>
                <td>Right to Left (horizontal backward)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="guide-callout info">
          <strong>Pro Tip on Corner Angles:</strong> When using named keywords such as <code>to bottom right</code>, the gradient ray targets the exact corner of the element, adapting proportionally if the element is resized. When using fixed degree values like <code>135deg</code>, the angle remains strictly invariant regardless of container aspect ratio.
        </div>
      </section>

      <section id="radial-gradients">
        <h2>3. CSS Radial Gradients (Shapes & Positioning)</h2>
        <p>Radial gradients radiate colors outward from a focal point, expanding in concentric circles or ellipses. They are ideal for creating spotlight effects, soft background glows, and futuristic atmospheric depths.</p>
        
        <div class="guide-code-box">
          <div class="guide-code-header">
            <span>CSS Radial Gradient Syntax</span>
            <button type="button" class="guide-copy-btn" data-copy-code="background: radial-gradient(circle at center, #f857a6 0%, #ff5858 50%, #111827 100%);">Copy</button>
          </div>
          <pre><code>background: radial-gradient(circle at center, #f857a6 0%, #ff5858 50%, #111827 100%);</code></pre>
        </div>

        <h3>Key Parameters:</h3>
        <ul class="guide-bullets">
          <li><strong>Shape:</strong> <code>circle</code> maintains an exact 1:1 circular aspect ratio; <code>ellipse</code> (default) stretches automatically to fill the container's width and height.</li>
          <li><strong>Position:</strong> Defined using the <code>at &lt;position&gt;</code> clause. Standard presets include <code>at center</code>, <code>at top left</code>, <code>at bottom right</code>, or exact coordinates like <code>at 30% 70%</code>.</li>
          <li><strong>Extent Keywords:</strong> <code>closest-side</code>, <code>farthest-side</code>, <code>closest-corner</code>, and <code>farthest-corner</code> (default) govern how far the ending color stop extends relative to container boundaries.</li>
        </ul>
      </section>

      <section id="conic-gradients">
        <h2>4. CSS Conic Gradients (Angles & Sweeps)</h2>
        <p>Conic gradients sweep colors around a central point, similar to a radar sweep, color wheel, or pie chart slice. Unlike radial gradients where colors diffuse outward from the center, conic colors rotate around the center point from a starting angle.</p>

        <div class="guide-code-box">
          <div class="guide-code-header">
            <span>CSS Conic Gradient Syntax</span>
            <button type="button" class="guide-copy-btn" data-copy-code="background: conic-gradient(from 0deg at 50% 50%, #f43f5e, #fbbf24, #10b981, #3b82f6, #f43f5e);">Copy</button>
          </div>
          <pre><code>background: conic-gradient(from 0deg at 50% 50%, #f43f5e, #fbbf24, #10b981, #3b82f6, #f43f5e);</code></pre>
        </div>

        <div class="guide-callout tip">
          <strong>Seamless 360° Looping:</strong> To avoid a harsh seam line where the sweep begins and ends, ensure your starting color and terminating color are identical (e.g. <code>#f43f5e</code> at 0% and 100%).
        </div>
      </section>

      <section id="color-stops-positions">
        <h2>5. Multi-Stop Gradients & Position Control</h2>
        <p>A CSS gradient requires a minimum of 2 color stops, but can support up to 8 or more stops to craft rich, multidimensional color tapestries. Color stops can be assigned explicit position percentages (e.g., <code>0%</code>, <code>25%</code>, <code>60%</code>, <code>100%</code>).</p>
        
        <h3>Creating Hard Stripe Transitions</h3>
        <p>By placing two distinct color stops at the exact same percentage position, you eliminate the smooth blend and produce an instant crisp line (hard stop):</p>
        
        <div class="guide-code-box">
          <div class="guide-code-header">
            <span>Crisp Split Dual Tone</span>
            <button type="button" class="guide-copy-btn" data-copy-code="background: linear-gradient(90deg, #1e293b 0%, #1e293b 50%, #3b82f6 50%, #3b82f6 100%);">Copy</button>
          </div>
          <pre><code>background: linear-gradient(90deg, #1e293b 0%, #1e293b 50%, #3b82f6 50%, #3b82f6 100%);</code></pre>
        </div>
      </section>

      <section id="color-banding-spaces">
        <h2>6. Eliminating Color Banding & Muddy Grays</h2>
        <p>One of the most frequent frustrations in gradient design is <em>color banding</em> or the "gray dead zone" — when transitioning between two vibrant complementary hues (such as blue and orange), standard sRGB interpolation blends through an unappealing, desaturated muddy brownish-gray.</p>
        
        <h3>Solutions:</h3>
        <ul class="guide-bullets">
          <li><strong>Add an Intermediate Bridge Stop:</strong> Introduce a harmonious third color stop near the 50% midpoint (such as purple between blue and red, or turquoise between blue and yellow) to keep luminance and saturation high.</li>
          <li><strong>Modern CSS Color Spaces (CSS Color 4):</strong> Modern browsers now support color space interpolation syntax:
            <div class="guide-code-box">
              <pre><code>background: linear-gradient(in oklch 90deg, #3b82f6, #f97316);</code></pre>
            </div>
            The <code>oklch</code> and <code>srgb-linear</code> color spaces calculate transitions based on perceptual human lightness, completely eliminating muddy gray midpoints.
          </li>
        </ul>
      </section>

      <section id="wcag-contrast-gradients">
        <h2>7. Text Contrast & Accessibility Over Gradients</h2>
        <p>When displaying typography or interactive UI elements over a gradient background, compliance with <strong>WCAG 2.1 Level AA (minimum 4.5:1 contrast for normal text, 3:1 for large text)</strong> is essential. Because gradients shift in luminance across their surface, a text color that passes on one side might completely fail on the other.</p>

        <div class="guide-callout warning">
          <strong>Accessibility Best Practices:</strong>
          <ul style="margin: 8px 0 0 16px; padding: 0; line-height: 1.6;">
            <li>Calculate contrast against both the lightest and darkest stops in the gradient.</li>
            <li>If text spans across both light and dark stops, introduce a semi-transparent dark backing card: <code>background: rgba(17, 19, 24, 0.75); backdrop-filter: blur(8px);</code>.</li>
            <li>Never rely on faint CSS text-shadow alone to compensate for severe contrast failures.</li>
          </ul>
        </div>
      </section>

      <section id="interactive-generator-tool">
        <h2>8. Interactive Tool: PS Color Gradient Generator</h2>
        <div class="guide-tool-card">
          <div class="guide-tool-visual" style="background: linear-gradient(135deg, #5046e5 0%, #ec4899 50%, #f59e0b 100%);">
            <span class="tool-preview-badge">Live Generator</span>
          </div>
          <div class="guide-tool-details">
            <h3>PS Color CSS Gradient Generator</h3>
            <p>Design, customize, and export high-performance linear, radial, and conic gradients in real time. Features full 0–360° angle dials, 2 to 8 editable color stops, instant CSS copy, and 4K PNG downloads with zero setup.</p>
            <div class="guide-tool-actions">
              <a href="/gradient" data-route="/gradient" class="button primary">Launch Gradient Generator →</a>
              <a href="/visualizer" data-route="/visualizer" class="button">Test on UI Components</a>
            </div>
          </div>
        </div>
      </section>

      <section id="gradient-faq">
        <h2>9. Frequently Asked Questions</h2>
        <div class="guide-faq-item">
          <h4>Q: What is the difference between background and background-image for gradients?</h4>
          <p><code>background-image</code> specifically sets the gradient layers, whereas the shorthand <code>background</code> also resets background-color, background-position, background-repeat, and background-attachment to their defaults. Shorthand <code>background</code> is widely preferred for clean, single-declaration styling.</p>
        </div>
        <div class="guide-faq-item">
          <h4>Q: Can CSS gradients be animated with transitions?</h4>
          <p>Traditionally, browsers could not interpolate between gradient strings in CSS transitions. However, by using modern CSS Houdini <code>@property</code> declarations to animate custom property values (such as an angle or color stop percentage), smooth 60fps gradient animations are now natively achievable in all modern browsers.</p>
        </div>
        <div class="guide-faq-item">
          <h4>Q: How do I export my gradient as a high-resolution PNG image?</h4>
          <p>Use the <a href="/gradient" data-route="/gradient">PS Color Gradient Generator</a>. Simply configure your desired gradient, select your target aspect ratio (Square 1080×1080, Portrait 1080×1350, or Landscape 1920×1080), and click "Download PNG" to export locally with PS Color quality branding.</p>
        </div>
      </section>
    `
  },
  {
    slug: 'how-to-choose-colors-for-a-website',
    title: 'How to Choose Colors for a Website — Complete UI Color Theory Guide',
    shortTitle: 'How to Choose Colors for a Website',
    category: 'UI Color Theory',
    readingTime: '10 min read',
    publishDate: 'October 19, 2026',
    isoDate: '2026-10-19',
    author: 'PS Color Design Team',
    description: 'Learn how to build professional website color schemes using the 60-30-10 rule, visual hierarchy, color psychology, dark mode pairing, and developer token exports.',
    keywords: 'website color schemes, color theory for web design, 60-30-10 rule, UI color palette, dark mode colors, tailwind colors, web accessibility colors',
    relatedSlugs: ['how-to-create-css-gradients', 'understanding-color-contrast-and-wcag'],
    toc: [
      { id: 'why-color-architecture-matters', text: '1. Why Color Architecture Determines UX' },
      { id: 'the-60-30-10-rule', text: '2. The 60-30-10 Rule & 4-Layer Hierarchy' },
      { id: 'color-harmonies-explained', text: '3. Classic Digital Color Harmonies' },
      { id: 'brand-mood-psychology', text: '4. Establishing Brand Mood & Color Psychology' },
      { id: 'light-and-dark-mode-pairing', text: '5. Designing for Light & Dark Mode Simultaneously' },
      { id: 'costly-color-mistakes', text: '6. 5 Costly Color Mistakes in Web Design' },
      { id: 'exporting-tokens', text: '7. Exporting to Code: Tailwind CSS & Tokens' },
      { id: 'interactive-palette-tools', text: '8. Interactive Tools: Visualizer & Palette Library' },
      { id: 'web-color-faq', text: '9. Frequently Asked Questions' }
    ],
    contentHtml: `
      <section id="why-color-architecture-matters">
        <h2>1. Why Color Architecture Determines UX</h2>
        <p>In user interface engineering, color is not mere visual ornamentation; it is a fundamental architectural system that directs human attention, establishes brand identity, communicates interface status, and dictates cognitive processing speed. Research in visual ergonomics shows that users make sub-conscious aesthetic evaluations of a website within 50 milliseconds of page render, and over 80% of initial impressions are driven by color harmony.</p>
        <p>A poorly constructed color scheme creates sensory fatigue, blurs calls-to-action, and elevates bounce rates. Conversely, an intentional, structured palette makes an application effortless to navigate.</p>
      </section>

      <section id="the-60-30-10-rule">
        <h2>2. The 60-30-10 Rule & PS Color's 4-Layer Hierarchy</h2>
        <p>A classic principle borrowed from interior design and master painting is the <strong>60-30-10 Rule</strong>: allocate 60% of visual real estate to a dominant neutral background, 30% to structural surfaces (cards, sidebars, containers), and 10% to a high-contrast accent reserved strictly for interactive actions.</p>
        
        <p>At PS Color, we refine this into a mathematically precise <strong>4-Tier Visual Weight Hierarchy</strong> utilized across all curated four-color palettes:</p>

        <div class="guide-table-wrap">
          <table class="guide-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Flex %</th>
                <th>UI Functional Role</th>
                <th>Design Application</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Color 1: Base Canvas</strong></td>
                <td><code>41%</code></td>
                <td>Dominant Background</td>
                <td>Establishes the foundational canvas tone, ambient atmosphere, and page ground.</td>
              </tr>
              <tr>
                <td><strong>Color 2: Structural Surface</strong></td>
                <td><code>26%</code></td>
                <td>Cards & Sidebars</td>
                <td>Defines container elevation, module boundaries, content cards, and input fields.</td>
              </tr>
              <tr>
                <td><strong>Color 3: Secondary Accent</strong></td>
                <td><code>18%</code></td>
                <td>Structural Complement</td>
                <td>Subtle dividers, table borders, icon outlines, secondary tags, and muted text.</td>
              </tr>
              <tr>
                <td><strong>Color 4: Hero Accent</strong></td>
                <td><code>15%</code></td>
                <td>Focal CTA & Key Indicators</td>
                <td>High-contrast primary buttons, notification badges, active states, and brand marks.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="guide-callout info">
          <strong>Why This Balance Works:</strong> When every element on the screen fights for attention with loud colors, the user experiences visual overload. Keeping 67% (41% + 26%) of the surface area calm and neutral guarantees that the 15% hero accent creates maximum visual pull.
        </div>
      </section>

      <section id="color-harmonies-explained">
        <h2>3. Classic Digital Color Harmonies</h2>
        <p>Color harmonies are geometric relationships between hues on the traditional 360° color wheel that produce natural visual pleasure:</p>
        
        <ul class="guide-bullets">
          <li><strong>Monochromatic:</strong> Variations in lightness and saturation of a single hue. Ideal for sleek, data-dense SaaS dashboards and minimalist corporate tools.</li>
          <li><strong>Analogous:</strong> Hues adjacent to each other on the color wheel (e.g. blue, teal, and green). Creates serene, cohesive, and organic aesthetics commonly favored by healthcare and eco-conscious platforms.</li>
          <li><strong>Complementary:</strong> Hues positioned directly opposite each other (e.g. warm amber and deep navy). Delivers high visual tension and energetic contrast, exceptional for e-commerce conversion triggers.</li>
          <li><strong>Split-Complementary:</strong> A base color paired with the two colors adjacent to its direct complement. Offers strong visual contrast with less visual vibration than pure complementary pairs.</li>
          <li><strong>Triadic:</strong> Three hues spaced evenly at 120° intervals. Provides vibrant, energetic palettes suitable for entertainment, creative portfolios, and educational apps.</li>
        </ul>
      </section>

      <section id="brand-mood-psychology">
        <h2>4. Establishing Brand Mood & Color Psychology</h2>
        <p>Colors evoke distinct physiological and psychological responses that influence user trust and decision-making:</p>
        <div class="guide-table-wrap">
          <table class="guide-table">
            <thead>
              <tr>
                <th>Color Family</th>
                <th>Psychological Association</th>
                <th>Standard Industry Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Blue</strong></td>
                <td>Security, stability, precision, confidence</td>
                <td>Fintech, cybersecurity, SaaS, healthcare</td>
              </tr>
              <tr>
                <td><strong>Green</strong></td>
                <td>Growth, prosperity, balance, wellness</td>
                <td>Sustainability, wealth management, organic brands</td>
              </tr>
              <tr>
                <td><strong>Purple / Indigo</strong></td>
                <td>Creativity, ambition, intelligence, luxury</td>
                <td>AI platforms, developer tools, premium products</td>
              </tr>
              <tr>
                <td><strong>Warm Coral / Orange</strong></td>
                <td>Energy, warmth, accessibility, enthusiasm</td>
                <td>Creator economy, modern food delivery, social apps</td>
              </tr>
              <tr>
                <td><strong>Dark Slate / Obsidian</strong></td>
                <td>Elegance, authority, technical mastery</td>
                <td>Developer workstations, high-end hardware, design suites</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="light-and-dark-mode-pairing">
        <h2>5. Designing for Light & Dark Mode Simultaneously</h2>
        <p>A common modern engineering mistake is designing solely in light mode and then automatically inverting colors with a naive filter. High-end dark mode requires dedicated intentionality:</p>

        <ul class="guide-bullets">
          <li><strong>Never Use Pure Pitch Black (<code>#000000</code>):</strong> Pure black creates aggressive contrast against bright white text (causing halation and eye fatigue) and causes severe pixel smearing on OLED mobile displays. Instead, use rich dark slates (e.g., <code>#111318</code>, <code>#16161A</code>).</li>
          <li><strong>Elevation via Lightness Rather Than Drop Shadows:</strong> In light mode, elevated cards cast dark shadows. In dark mode, shadows are largely invisible; elevation is represented by progressively lighter surface gray tints (e.g., canvas at <code>#111318</code>, card surface at <code>#1B1E26</code>, elevated popover at <code>#252A34</code>).</li>
          <li><strong>Desaturate Brand Accents in Dark Mode:</strong> Highly saturated vibrant colors that look crisp on white surfaces can vibrate uncomfortably against dark backgrounds. Slightly lower saturation or increase lightness for dark mode tokens.</li>
        </ul>
      </section>

      <section id="costly-color-mistakes">
        <h2>6. 5 Costly Color Mistakes in Web Design</h2>
        <div class="guide-callout warning">
          <ol style="margin: 8px 0 0 16px; padding: 0; line-height: 1.7;">
            <li><strong>Failing WCAG AA Contrast Ratios:</strong> Muted gray text like <code>#94a3b8</code> on a white background yields less than 2.5:1 contrast, rendering body copy unreadable for millions of users with impaired vision or in direct sunlight.</li>
            <li><strong>Oversaturating Background Canvases:</strong> Bright primary yellow or neon cyan as a full-page background creates overwhelming eye fatigue within seconds.</li>
            <li><strong>Multiple Competing CTA Accent Colors:</strong> When buttons feature purple, red, green, and orange simultaneously, users experience decision paralysis. Strict UI discipline requires a single primary accent color.</li>
            <li><strong>Ignoring Semantic Color Conventions:</strong> Misusing red for positive confirmations or green for destructive account deletions breaks established cognitive mental models.</li>
            <li><strong>Color-Only Information Encoding:</strong> Relying solely on color to indicate form errors or system states locks out color-blind visitors. Always supplement color with icons and descriptive text.</li>
          </ol>
        </div>
      </section>

      <section id="exporting-tokens">
        <h2>7. Exporting to Code: Tailwind CSS & Tokens</h2>
        <p>Modern frontend engineering bridges design systems directly into build tools via design tokens. PS Color generates ready-to-paste configurations for every palette:</p>

        <div class="guide-code-box">
          <div class="guide-code-header">
            <span>Tailwind CSS Token Configuration</span>
            <button type="button" class="guide-copy-btn" data-copy-code="module.exports = {
  theme: {
    extend: {
      colors: {
        canvas: '#F7F0DC',
        surface: '#D9E4C8',
        secondary: '#A2B89B',
        accent: '#52796F'
      }
    }
  }
};">Copy</button>
          </div>
          <pre><code>module.exports = {
  theme: {
    extend: {
      colors: {
        canvas: '#F7F0DC',
        surface: '#D9E4C8',
        secondary: '#A2B89B',
        accent: '#52796F'
      }
    }
  }
};</code></pre>
        </div>
      </section>

      <section id="interactive-palette-tools">
        <h2>8. Interactive Tools: Visualizer & Palette Library</h2>
        <div class="guide-tool-card">
          <div class="guide-tool-visual" style="background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #5046e5 100%);">
            <span class="tool-preview-badge">Live UI Tool</span>
          </div>
          <div class="guide-tool-details">
            <h3>PS Color Live UI Visualizer</h3>
            <p>Don't guess how colors look in isolated stripes. Test four-color palettes live on realistic website components including SaaS Dashboards, Landing Pages, and E-Commerce stores with instant WCAG validation.</p>
            <div class="guide-tool-actions">
              <a href="/visualizer" data-route="/visualizer" class="button primary">Open Live UI Visualizer →</a>
              <a href="/" data-route="/" class="button">Explore Curated Palettes</a>
            </div>
          </div>
        </div>
      </section>

      <section id="web-color-faq">
        <h2>9. Frequently Asked Questions</h2>
        <div class="guide-faq-item">
          <h4>Q: How many colors should a typical design system include?</h4>
          <p>Most enterprise design systems operate with a foundational core of 3 to 5 primary semantic colors (Background, Surface, Text, Primary Accent, and Destructive/Danger), paired with a neutral gray scale (50 to 900) for borders and subtle elevations.</p>
        </div>
        <div class="guide-faq-item">
          <h4>Q: Can I extract colors from an existing photograph or brand logo?</h4>
          <p>Yes. Use the <a href="/create" data-route="/create">PS Color Palette Creator</a> to upload or drag-and-drop any PNG, JPG, or WebP image. Our algorithm samples dominant tones and maps them into an organized four-color palette directly in your browser.</p>
        </div>
        <div class="guide-faq-item">
          <h4>Q: Are palettes on PS Color free for commercial client projects?</h4>
          <p>Yes, 100%. All color palettes, hex codes, and exported code tokens on PS Color are provided under an open royalty-free license for personal and commercial usage without attribution fees.</p>
        </div>
      </section>
    `
  },
  {
    slug: 'understanding-color-contrast-and-wcag',
    title: 'Understanding Color Contrast & WCAG — Web Accessibility Guide',
    shortTitle: 'Understanding Color Contrast & WCAG',
    category: 'Web Accessibility',
    readingTime: '9 min read',
    publishDate: 'October 19, 2026',
    isoDate: '2026-10-19',
    author: 'PS Color Design Team',
    description: 'Learn how WCAG 2.1 contrast ratios are calculated using linearized sRGB luminance, contrast thresholds (AA, AAA), testing UI components, and accessible color pairing.',
    keywords: 'WCAG contrast, color contrast ratio, accessibility WCAG 2.1, relative luminance formula, web accessibility contrast, color blindness contrast',
    relatedSlugs: ['how-to-choose-colors-for-a-website', 'how-to-create-css-gradients'],
    toc: [
      { id: 'why-color-contrast-matters', text: '1. Why Color Contrast & WCAG Matter' },
      { id: 'relative-luminance-formula', text: '2. The Mathematics of Relative Luminance' },
      { id: 'contrast-ratio-equation', text: '3. The Contrast Ratio Equation Explained' },
      { id: 'wcag-levels-thresholds', text: '4. WCAG 2.1 Compliance Levels & Thresholds' },
      { id: 'non-text-contrast', text: '5. Non-Text Contrast (UI Controls & Borders)' },
      { id: 'color-vision-deficiency', text: '6. Designing for Color Vision Deficiencies' },
      { id: 'benchmark-contrast-table', text: '7. Real-World Benchmark Contrast Reference' },
      { id: 'interactive-contrast-checker', text: '8. Interactive Tool: PS Color Accessibility Checker' },
      { id: 'wcag-faq', text: '9. Frequently Asked Questions' }
    ],
    contentHtml: `
      <section id="why-color-contrast-matters">
        <h2>1. Why Color Contrast & WCAG Matter</h2>
        <p>Web accessibility is a fundamental requirement of modern software development. The <strong>Web Content Accessibility Guidelines (WCAG) 2.1</strong>, maintained by the World Wide Web Consortium (W3C), establish international standards to ensure digital interfaces are usable by everyone, including people with low vision, aging eyes, situational impairments (e.g. glare in bright daylight), and color vision deficiencies.</p>
        <p>Beyond moral and ethical responsibilities, color contrast compliance is legally mandated across many jurisdictions under the <strong>Americans with Disabilities Act (ADA Title III)</strong>, Section 508, and the <strong>European Accessibility Act (EAA 2025)</strong>. Non-compliant digital platforms risk costly legal exposure and alienate up to 20% of their potential audience.</p>
      </section>

      <section id="relative-luminance-formula">
        <h2>2. The Mathematics of Relative Luminance</h2>
        <p>To accurately calculate contrast between two colors, computers cannot simply compare raw RGB numbers. Human eyes do not perceive the brightness of red, green, and blue equally — green appears dramatically brighter to human photoreceptors than blue at equivalent digital intensities.</p>
        <p>The W3C specifies the calculation of <strong>Relative Luminance (<var>L</var>)</strong>, normalized from <code>0.0</code> (pure darkest black) to <code>1.0</code> (pure brightest white), via linearized sRGB transformations:</p>

        <div class="guide-callout guide-callout-info">
          <h3 class="guide-callout-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            Step-by-Step Luminance Calculation
          </h3>
          
          <div class="guide-calc-step">
            <span class="calc-step-num">Step 1</span>
            <div class="calc-step-content">
              <strong>Extract and Normalize 8-Bit RGB Channels</strong>
              <p>Extract the 8-bit integer color components <var>R</var><sub>8bit</sub>, <var>G</var><sub>8bit</sub>, and <var>B</var><sub>8bit</sub> (each ranging from 0 to 255) from the hexadecimal color code, then divide each by 255 to obtain a normalized value <var>c</var> in the range [0.0, 1.0]:</p>
              <div class="formula-block">
                <var>c</var> = <var>C</var><sub>8bit</sub> / 255
              </div>
            </div>
          </div>

          <div class="guide-calc-step">
            <span class="calc-step-num">Step 2</span>
            <div class="calc-step-content">
              <strong>Convert Gamma-Compressed sRGB to Linear Space</strong>
              <p>Because digital displays apply non-linear gamma curves to optimize bandwidth, the normalized channel <var>c</var> must be linearized according to IEC 61966-2-1 and W3C WCAG 2.1 specifications:</p>
              
              <div class="formula-block formula-piecewise">
                <div class="piecewise-row">
                  <span class="piecewise-cond">If <var>c</var> &le; 0.04045:</span>
                  <span class="piecewise-expr"><var>c</var><sub>linear</sub> = <var>c</var> / 12.92</span>
                </div>
                <div class="piecewise-row">
                  <span class="piecewise-cond">Otherwise:</span>
                  <span class="piecewise-expr"><var>c</var><sub>linear</sub> = ((<var>c</var> + 0.055) / 1.055)<sup>2.4</sup></span>
                </div>
              </div>

              <div class="guide-code-box">
                <div class="guide-code-header">
                  <span>JavaScript Linearization Function</span>
                  <button type="button" class="guide-copy-btn" data-copy-code="function sRgbToLinear(c) {
  return c <= 0.04045
    ? c / 12.92
    : Math.pow((c + 0.055) / 1.055, 2.4);
}">Copy</button>
                </div>
                <pre><code>function sRgbToLinear(c) {
  return c &lt;= 0.04045
    ? c / 12.92
    : Math.pow((c + 0.055) / 1.055, 2.4);
}</code></pre>
              </div>
            </div>
          </div>

          <div class="guide-calc-step">
            <span class="calc-step-num">Step 3</span>
            <div class="calc-step-content">
              <strong>Apply ITU-R BT.709 Spectral Weighting Coefficients</strong>
              <p>Combine the linearized red, green, and blue components using standardized human visual perception weights:</p>
              <div class="formula-block formula-highlight">
                <var>L</var> = 0.2126 &times; <var>R</var><sub>linear</sub> + 0.7152 &times; <var>G</var><sub>linear</sub> + 0.0722 &times; <var>B</var><sub>linear</sub>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contrast-ratio-equation">
        <h2>3. The Contrast Ratio Equation Explained</h2>
        <p>Once the relative luminances of the lighter color (<var>L</var><sub>1</sub>) and the darker color (<var>L</var><sub>2</sub>) are calculated, the contrast ratio is determined by the W3C equation:</p>
        
        <div class="formula-block formula-highlight" style="font-size: 15px; text-align: center; padding: 16px;">
          Contrast Ratio = (<var>L</var><sub>1</sub> + 0.05) / (<var>L</var><sub>2</sub> + 0.05)
        </div>

        <p>The constant <code>0.05</code> in the numerator and denominator accounts for <em>ambient light flare</em> — the subtle light from room lighting or daylight reflecting off physical screen glass that prevents absolute zero darkness. Contrast ratios range from a minimum of <strong>1:1</strong> (identical colors) up to a maximum of <strong>21:1</strong> (pure white on pure black).</p>
      </section>

      <section id="wcag-levels-thresholds">
        <h2>4. WCAG 2.1 Compliance Levels & Thresholds</h2>
        <p>WCAG defines two conformance tiers for text readability based on typography size:</p>

        <div class="guide-table-wrap">
          <table class="guide-table">
            <thead>
              <tr>
                <th>Conformance Level</th>
                <th>Minimum Ratio</th>
                <th>Applicable Typography</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>WCAG Level AA (Minimum)</strong></td>
                <td><strong>4.5 : 1</strong></td>
                <td>Normal body copy, paragraph text, and UI labels (under 18pt regular or under 14pt bold).</td>
              </tr>
              <tr>
                <td><strong>WCAG Level AA Large</strong></td>
                <td><strong>3.0 : 1</strong></td>
                <td>Large text (&ge; 18pt or &ge; 14pt bold, approximately 24px regular or 18.5px bold).</td>
              </tr>
              <tr>
                <td><strong>WCAG Level AAA (Enhanced)</strong></td>
                <td><strong>7.0 : 1</strong></td>
                <td>Enhanced standard for body copy in high-legibility government or medical apps.</td>
              </tr>
              <tr>
                <td><strong>WCAG Level AAA Large</strong></td>
                <td><strong>4.5 : 1</strong></td>
                <td>Large text under the enhanced AAA standard.</td>
              </tr>
              <tr>
                <td><strong>Fail / Inaccessible</strong></td>
                <td><strong>&lt; 3.0 : 1</strong></td>
                <td>Fails all standards. Never use for informative content or interactive controls.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="non-text-contrast">
        <h2>5. Non-Text Contrast (UI Controls & Borders)</h2>
        <p>Introduced in WCAG 2.1 (Success Criterion 1.4.11), <strong>Non-Text Contrast</strong> requires a minimum ratio of <strong>3.0:1</strong> for visual information required to identify user interface components and states:</p>
        <ul class="guide-bullets">
          <li><strong>Form Field Boundaries:</strong> The border outline of an input field must maintain at least 3:1 contrast against adjacent background colors so users can identify clickable areas.</li>
          <li><strong>Keyboard Focus Rings:</strong> Custom focus indicators (<code>:focus-visible</code>) must stand out with at least 3:1 contrast against both the button and background.</li>
          <li><strong>Standalone Graphical Icons:</strong> Icons carrying semantic meaning without accompanying text (such as search magnifying glasses or hamburger menus) must meet 3:1 contrast.</li>
        </ul>
      </section>

      <section id="color-vision-deficiency">
        <h2>6. Designing for Color Vision Deficiencies</h2>
        <p>Approximately 1 in 12 men (8%) and 1 in 200 women have some form of Color Vision Deficiency (CVD). The most common types include:</p>
        <ul class="guide-bullets">
          <li><strong>Deuteranopia & Protanopia:</strong> Red-green color blindness. Red and green appear as indistinguishable muddy olive-browns.</li>
          <li><strong>Tritanopia:</strong> Blue-yellow color blindness. Blues appear greenish, and yellows appear violet or light gray.</li>
          <li><strong>Achromatopsia:</strong> Complete absence of color perception; the user views interfaces in pure monochrome grayscale.</li>
        </ul>
        <div class="guide-callout warning">
          <strong>The Golden Rule of Accessible UI:</strong> Never use color as the sole visual cue to convey state or meaning (WCAG Success Criterion 1.4.1). Always pair colored error borders with an explicit warning icon and descriptive error text.
        </div>
      </section>

      <section id="benchmark-contrast-table">
        <h2>7. Real-World Benchmark Contrast Reference</h2>
        <p>Use these established color pairings as reliable benchmarks for rapid contrast checks:</p>
        <div class="guide-table-wrap">
          <table class="guide-table">
            <thead>
              <tr>
                <th>Foreground Color</th>
                <th>Background Color</th>
                <th>Contrast Ratio</th>
                <th>WCAG Classification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>#FFFFFF</code> (White)</td>
                <td><code>#000000</code> (Black)</td>
                <td><strong>21.0 : 1</strong></td>
                <td>AAA Pass (Maximum)</td>
              </tr>
              <tr>
                <td><code>#FFFFFF</code> (White)</td>
                <td><code>#5046E5</code> (PS Color Indigo)</td>
                <td><strong>7.8 : 1</strong></td>
                <td>AAA Pass</td>
              </tr>
              <tr>
                <td><code>#FFFFFF</code> (White)</td>
                <td><code>#595959</code> (Medium Gray)</td>
                <td><strong>7.0 : 1</strong></td>
                <td>AAA Pass (Exact Threshold)</td>
              </tr>
              <tr>
                <td><code>#FFFFFF</code> (White)</td>
                <td><code>#767676</code> (Accessible Gray)</td>
                <td><strong>4.54 : 1</strong></td>
                <td>AA Pass (Exact Threshold)</td>
              </tr>
              <tr>
                <td><code>#111116</code> (Deep Slate)</td>
                <td><code>#F4F4F7</code> (Light Gray)</td>
                <td><strong>15.2 : 1</strong></td>
                <td>AAA Pass</td>
              </tr>
              <tr>
                <td><code>#94A3B8</code> (Slate 400)</td>
                <td><code>#FFFFFF</code> (White)</td>
                <td><strong>2.4 : 1</strong></td>
                <td>Fail (Low Contrast)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="interactive-contrast-checker">
        <h2>8. Interactive Tool: PS Color Accessibility Checker</h2>
        <div class="guide-tool-card">
          <div class="guide-tool-visual" style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #064e3b 100%);">
            <span class="tool-preview-badge">Accessibility Suite</span>
          </div>
          <div class="guide-tool-details">
            <h3>PS Color Live Contrast Scorecard</h3>
            <p>Every palette on PS Color automatically generates an interactive WCAG 2.1 matrix. Preview relative luminance calculations and test typography against simulated dashboard interfaces in real time.</p>
            <div class="guide-tool-actions">
              <a href="/visualizer" data-route="/visualizer" class="button primary">Audit Contrast in Visualizer →</a>
              <a href="/" data-route="/" class="button">Browse Compliant Palettes</a>
            </div>
          </div>
        </div>
      </section>

      <section id="wcag-faq">
        <h2>9. Frequently Asked Questions</h2>
        <div class="guide-faq-item">
          <h4>Q: Do brand logos need to meet WCAG contrast requirements?</h4>
          <p>No. Text that is part of an official brand logo or trademark is explicitly exempt from WCAG 2.1 contrast rules. However, navigation text, header buttons, and slogans surrounding the logo must strictly comply.</p>
        </div>
        <div class="guide-faq-item">
          <h4>Q: Are disabled buttons required to meet 4.5:1 or 3:1 contrast?</h4>
          <p>Under WCAG 2.1 Criterion 1.4.3, text or components in an inactive, disabled state are technically exempt. However, modern usability standards advise against extremely low-contrast disabled buttons because users cannot read what feature is being disabled.</p>
        </div>
        <div class="guide-faq-item">
          <h4>Q: How does PS Color calculate contrast ratios?</h4>
          <p>PS Color implements the official W3C linearized sRGB relative luminance algorithm (<var>L</var> = 0.2126 &times; <var>R</var> + 0.7152 &times; <var>G</var> + 0.0722 &times; <var>B</var>) and calculates (<var>L</var><sub>1</sub> + 0.05) / (<var>L</var><sub>2</sub> + 0.05) directly within your browser client with zero external tracking.</p>
        </div>
      </section>
    `
  }
];

export function getGuide(slug) {
  return GUIDES_DATA.find(g => g.slug === slug) || null;
}

export function getAllGuides() {
  return GUIDES_DATA;
}

/**
 * Render Breadcrumbs HTML
 */
export function renderBreadcrumbs(crumbs = []) {
  return `
    <nav class="guide-breadcrumbs" aria-label="Breadcrumb navigation">
      <ol>
        <li><a href="/" data-route="/">Home</a></li>
        ${crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return isLast
            ? `<li aria-current="page"><span>${c.name}</span></li>`
            : `<li><a href="${c.path}" data-route="${c.path}">${c.name}</a></li>`;
        }).join('')}
      </ol>
    </nav>
  `;
}

/**
 * Render HTML for the Guides Index Page (/guides/)
 */
export function renderGuidesIndexHtml() {
  const breadcrumbs = renderBreadcrumbs([{ name: 'Guides', path: '/guides' }]);

  const cardsHtml = GUIDES_DATA.map(guide => {
    return `
      <article class="guide-card" data-slug="${guide.slug}">
        <div class="guide-card-header">
          <span class="guide-badge">${guide.category}</span>
          <span class="guide-reading-time">${guide.readingTime}</span>
        </div>
        <h2 class="guide-card-title">
          <a href="/guides/${guide.slug}/" data-route="/guides/${guide.slug}/">${guide.shortTitle}</a>
        </h2>
        <p class="guide-card-desc">${guide.description}</p>
        <div class="guide-card-footer">
          <span class="guide-author">${guide.author}</span>
          <a href="/guides/${guide.slug}/" data-route="/guides/${guide.slug}/" class="guide-card-link">
            <span>Read Guide</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </div>
      </article>
    `;
  }).join('');

  return `
    <div class="guides-container">
      ${breadcrumbs}
      
      <header class="guides-index-header">
        <div class="guides-index-header-content">
          <span class="guides-header-kicker">Educational Resources &amp; Documentation</span>
          <h1 class="guides-index-title">Color Theory, CSS &amp; Accessibility Guides</h1>
          <p class="guides-index-subtitle">In-depth guides, practical code snippets, and mathematical foundations to help you build accessible, visually stunning digital interfaces.</p>
        </div>
      </header>

      <section class="guides-grid" aria-label="Color guides and tutorials">
        ${cardsHtml}
      </section>

      <section class="guides-tools-banner">
        <div class="guides-tools-banner-header">
          <h2>Explore Interactive PS Color Tools</h2>
          <p>Put theory into practice with our free browser-based creator workstations.</p>
        </div>
        <div class="guides-tools-grid">
          <a href="/gradient" data-route="/gradient" class="guide-mini-tool-card">
            <div class="mini-tool-icon" style="background: linear-gradient(135deg, #6366f1, #ec4899);">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9"/></svg>
            </div>
            <div class="mini-tool-text">
              <strong>Gradient Generator</strong>
              <span>Linear, radial, and conic gradients with CSS &amp; 4K PNG export.</span>
            </div>
          </a>
          <a href="/visualizer" data-route="/visualizer" class="guide-mini-tool-card">
            <div class="mini-tool-icon" style="background: linear-gradient(135deg, #3b82f6, #10b981);">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" width="20" height="20"><path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/></svg>
            </div>
            <div class="mini-tool-text">
              <strong>Live UI Visualizer</strong>
              <span>Simulate palettes on dashboards, landing pages &amp; mobile views.</span>
            </div>
          </a>
          <a href="/" data-route="/" class="guide-mini-tool-card">
            <div class="mini-tool-icon" style="background: linear-gradient(135deg, #f59e0b, #ef4444);">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" width="20" height="20"><path d="M12 2c1.5 3.5 0 6-2 8-2 2-3 4-3 6a7 7 0 0 0 14 0c0-5-4-8-4-10-1.5 2-2 3-2 3s-1-4-3-7Z"/></svg>
            </div>
            <div class="mini-tool-text">
              <strong>Palette Library</strong>
              <span>Browse curated 4-color palettes with hex codes &amp; tokens.</span>
            </div>
          </a>
        </div>
      </section>
    </div>
  `;
}

/**
 * Render HTML for an Individual Guide Article (/guides/:slug/)
 */
export function renderGuideArticleHtml(guide) {
  if (!guide) return '';

  const breadcrumbs = renderBreadcrumbs([
    { name: 'Guides', path: '/guides' },
    { name: guide.shortTitle, path: `/guides/${guide.slug}/` }
  ]);

  const tocHtml = guide.toc.map(item => `
    <li>
      <a href="#${item.id}" class="guide-toc-link">${item.text}</a>
    </li>
  `).join('');

  // Related guides (other 2 guides)
  const relatedGuides = GUIDES_DATA.filter(g => g.slug !== guide.slug).slice(0, 2);
  const relatedHtml = relatedGuides.map(rel => `
    <div class="related-guide-card">
      <span class="guide-badge">${rel.category}</span>
      <h3><a href="/guides/${rel.slug}/" data-route="/guides/${rel.slug}/">${rel.shortTitle}</a></h3>
      <p>${rel.description}</p>
      <a href="/guides/${rel.slug}/" data-route="/guides/${rel.slug}/" class="related-guide-link">
        <span>Read Guide</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>
    </div>
  `).join('');

  return `
    <div class="guides-container">
      ${breadcrumbs}

      <article class="guide-article-wrap">
        <header class="guide-article-header">
          <div class="guide-article-meta-top">
            <span class="guide-badge">${guide.category}</span>
            <span class="guide-meta-item">${guide.readingTime}</span>
            <span class="guide-meta-item">Updated: ${guide.publishDate}</span>
          </div>
          <h1 class="guide-article-title">${guide.title}</h1>
          <p class="guide-article-lead">${guide.description}</p>
          <div class="guide-author-bar">
            <div class="guide-author-info">
              <span class="guide-author-name">By ${guide.author}</span>
              <span class="guide-author-role">PS Color Design &amp; Accessibility Research</span>
            </div>
          </div>
        </header>

        <div class="guide-article-layout">
          <aside class="guide-toc-sidebar" aria-label="Table of contents">
            <div class="guide-toc-sticky">
              <h2 class="guide-toc-heading">Table of Contents</h2>
              <ul class="guide-toc-list">
                ${tocHtml}
              </ul>
            </div>
          </aside>

          <div class="guide-article-body">
            ${guide.contentHtml}

            <section class="related-guides-section">
              <h2 class="related-guides-title">Related Color &amp; Web Design Guides</h2>
              <div class="related-guides-grid">
                ${relatedHtml}
              </div>
            </section>
          </div>
        </div>
      </article>
    </div>
  `;
}

/**
 * Attach Browser Listeners for Guide Pages
 */
export function attachGuidesListeners(container) {
  if (!container) return;

  // 1. Copy code button handlers
  container.querySelectorAll('.guide-copy-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault();
      e.stopPropagation();
      const code = btn.getAttribute('data-copy-code') || btn.parentElement?.nextElementSibling?.textContent || '';
      if (!code) return;

      const res = await copyTextToClipboard(code);
      if (res.success) {
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'Code copied to clipboard!' }));
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, 2000);
      } else {
        window.dispatchEvent(new CustomEvent('ps-color-toast', { detail: 'Could not copy code automatically.' }));
      }
    });
  });

  // 2. Smooth scrolling for Table of Contents links
  container.querySelectorAll('.guide-toc-link').forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        e.preventDefault();
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', targetId);
        }
      }
    });
  });
}
