/**
 * PS Color - Production Privacy-First Analytics Module
 * 
 * Supports Google Analytics 4 (GA4) via VITE_GA_ID.
 * Respects:
 *  - Do Not Track (DNT) browser settings
 *  - Explicit user consent stored in localStorage ('ps-color-analytics-consent')
 *  - Silent no-op when VITE_GA_ID is not configured
 */

const GA_ID = import.meta.env.VITE_GA_ID || '';
let isInitialized = false;

/**
 * Checks if the user has requested Do Not Track
 */
export function isDntEnabled() {
  if (typeof window === 'undefined') return true;
  return (
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    navigator.msDoNotTrack === '1'
  );
}

/**
 * Checks if tracking consent is allowed
 */
export function hasUserConsent() {
  if (typeof localStorage === 'undefined') return false;
  const consent = localStorage.getItem('ps-color-analytics-consent');
  // If user explicitly denied, respect it
  if (consent === 'denied') return false;
  // If Do Not Track is enabled, respect it by default
  if (isDntEnabled()) return false;
  // Consent granted or default allowed for non-identifying telemetry
  return consent === 'granted' || consent === null;
}

/**
 * Update consent preference
 */
export function setAnalyticsConsent(granted) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('ps-color-analytics-consent', granted ? 'granted' : 'denied');
  }
}

/**
 * Initialize Google Analytics 4 dynamically
 */
export function initAnalytics() {
  if (!GA_ID || isInitialized) return;
  if (!hasUserConsent()) return;

  try {
    // Inject gtag script asynchronously
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      anonymize_ip: true,
      send_page_view: false // Managed manually for SPA
    });

    isInitialized = true;
  } catch (err) {
    console.warn('Analytics initialization failed safely:', err);
  }
}

/**
 * Generic event tracker
 */
export function trackEvent(eventName, params = {}) {
  if (!hasUserConsent()) return;

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }

  // Also dispatch a custom DOM event for local debugging and tests
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ps-color-analytics', {
        detail: { event: eventName, params }
      })
    );
  }
}

/**
 * Track SPA Page Views
 */
export function trackPageView(path, title) {
  trackEvent('page_view', {
    page_path: path,
    page_title: title,
    page_location: typeof window !== 'undefined' ? window.location.href : path
  });
}

/**
 * Track Palette Detail Views
 */
export function trackPaletteView(paletteId, colors) {
  trackEvent('view_item', {
    item_id: paletteId,
    item_name: `Palette ${paletteId}`,
    item_category: 'Color Palette',
    colors: Array.isArray(colors) ? colors.join(',') : colors
  });
}

/**
 * Track Color Copy to Clipboard
 */
export function trackColorCopy(hex, paletteId) {
  trackEvent('copy_color', {
    color_hex: hex,
    palette_id: paletteId || 'unknown'
  });
}

/**
 * Track Palette Creation
 */
export function trackPaletteCreate(paletteId, colors) {
  trackEvent('create_palette', {
    palette_id: paletteId,
    colors: Array.isArray(colors) ? colors.join(',') : colors
  });
}

/**
 * Track Image-to-Palette Extraction
 */
export function trackImageExtract(fileType) {
  trackEvent('extract_palette', {
    file_type: fileType || 'image'
  });
}

/**
 * Track Developer Code Exports
 */
export function trackCodeExport(exportType, paletteId) {
  trackEvent('export_code', {
    export_type: exportType, // 'tailwind' | 'css' | 'tokens'
    palette_id: paletteId
  });
}

/**
 * Track Affiliate / Sponsored Clicks
 */
export function trackAffiliateClick(partnerName, partnerUrl) {
  trackEvent('affiliate_click', {
    partner_name: partnerName,
    destination_url: partnerUrl
  });
}
