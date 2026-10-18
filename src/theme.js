/**
 * PS Color — Modern One-Click Theme System
 * Supports:
 *  - One-click instant toggle between Light and Dark modes
 *  - Default: OS preference ('system') for first-time visitors
 *  - Moon icon in Light mode (switch to dark)
 *  - Sun icon in Dark mode (switch to light)
 *  - Persistent storage in localStorage ('ps-color-theme')
 *  - OS theme listener for automatic real-time sync before manual override
 *  - Zero page-reload live theme application
 *  - Accessible focus and ARIA labels
 */

import { trackThemeChange } from './analytics.js';

export const THEME_STORAGE_KEY = 'ps-color-theme';
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

/**
 * Retrieves the stored theme preference or defaults to 'system'
 * @returns {'light' | 'dark' | 'system'}
 */
export function getThemePreference() {
  if (typeof localStorage === 'undefined') return THEMES.SYSTEM;
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === THEMES.LIGHT || saved === THEMES.DARK || saved === THEMES.SYSTEM) {
      return saved;
    }
  } catch (err) {
    console.warn('Unable to access localStorage for theme preference:', err);
  }
  return THEMES.SYSTEM;
}

/**
 * Calculates the active effective theme ('light' or 'dark') based on preference and OS setting
 * @param {'light' | 'dark' | 'system'} [preference]
 * @returns {'light' | 'dark'}
 */
export function getEffectiveTheme(preference = getThemePreference()) {
  if (preference === THEMES.LIGHT) return THEMES.LIGHT;
  if (preference === THEMES.DARK) return THEMES.DARK;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
  }
  return THEMES.LIGHT;
}

/**
 * Returns accessible Feather/Lucide SVG icon markup for a given theme state
 * - Displays Moon icon in Light Mode (action: switch to Dark)
 * - Displays Sun icon in Dark Mode (action: switch to Light)
 * @param {'light' | 'dark'} effectiveTheme
 * @returns {string} SVG markup
 */
export function getThemeIconSvg(effectiveTheme) {
  if (effectiveTheme === THEMES.DARK) {
    // Sun icon in Dark Mode
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" class="theme-icon icon-sun" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
  }
  // Moon icon in Light Mode
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" class="theme-icon icon-moon" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 0 1 1-9-9Z"/></svg>`;
}

/**
 * Updates the header theme toggle button to reflect the current state
 * @param {'light' | 'dark' | 'system'} preference
 * @param {'light' | 'dark'} effectiveTheme
 */
export function updateThemeControls(preference, effectiveTheme) {
  const toggleBtn = document.querySelector('#theme-toggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = getThemeIconSvg(effectiveTheme);
    const targetLabel = effectiveTheme === THEMES.DARK ? 'light' : 'dark';
    toggleBtn.setAttribute('title', `Switch to ${targetLabel} theme`);
    toggleBtn.setAttribute('aria-label', `Switch to ${targetLabel} theme`);
    toggleBtn.setAttribute('data-theme-current', effectiveTheme);
    toggleBtn.removeAttribute('aria-haspopup');
    toggleBtn.removeAttribute('aria-expanded');
    toggleBtn.removeAttribute('aria-controls');
  }
}

/**
 * Applies a theme preference without page reload
 * @param {'light' | 'dark' | 'system'} preference
 * @param {boolean} [save=true] - Whether to persist to localStorage
 * @returns {{ preference: string, effectiveTheme: string }}
 */
export function applyTheme(preference, save = true) {
  const validPref = [THEMES.LIGHT, THEMES.DARK, THEMES.SYSTEM].includes(preference)
    ? preference
    : THEMES.SYSTEM;

  if (save && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, validPref);
    } catch (err) {
      console.warn('Unable to save theme preference:', err);
    }
  }

  const effective = getEffectiveTheme(validPref);

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', effective);
    document.documentElement.setAttribute('data-theme-preference', validPref);
    
    // Update browser theme-color meta tag for mobile address bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effective === THEMES.DARK ? '#111318' : '#ffffff');
    }
  }

  updateThemeControls(validPref, effective);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ps-color-theme-change', {
        detail: { preference: validPref, effectiveTheme: effective }
      })
    );
  }

  trackThemeChange(validPref, effective);

  return { preference: validPref, effectiveTheme: effective };
}

/**
 * One-click toggle between Light and Dark mode
 * Directly switches to the opposite theme and saves the explicit preference.
 * @returns {{ preference: string, effectiveTheme: string }}
 */
export function toggleTheme() {
  const currentEffective = getEffectiveTheme();
  const nextTheme = currentEffective === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  return applyTheme(nextTheme, true);
}

/**
 * Initializes the theme system and registers OS prefers-color-scheme listener
 */
export function initThemeSystem() {
  const currentPref = getThemePreference();
  applyTheme(currentPref, false);

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOsChange = () => {
      if (getThemePreference() === THEMES.SYSTEM) {
        applyTheme(THEMES.SYSTEM, false);
      }
    };

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleOsChange);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(handleOsChange);
    }
  }
}
