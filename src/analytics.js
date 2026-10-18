/**
 * PS Color - Production Privacy-First Analytics & Consent Mode Module
 * 
 * Supports:
 *  - Google Consent Mode v2 (ad_storage, analytics_storage, ad_user_data, ad_personalization)
 *  - Google Analytics 4 (GA4) via VITE_GA_ID under Basic Consent Mode
 *  - IAB Europe TCF v2.2 / v2.3 synchronization via window.__tcfapi
 *  - Strict Do Not Track (DNT) browser settings
 *  - Affirmative, unbundled opt-in for analytics and advertising
 *  - Complete cookie purging on consent withdrawal
 */

const GA_ID = import.meta.env.VITE_GA_ID || '';
export const STORAGE_ANALYTICS_KEY = 'ps-color-analytics-consent';
export const STORAGE_ADVERTISING_KEY = 'ps-color-advertising-consent';

let isInitialized = false;

/**
 * Checks if the user has requested Do Not Track (DNT) or Global Privacy Control (GPC)
 */
export function isDntEnabled() {
  if (typeof window === 'undefined') return true;
  return (
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    navigator.msDoNotTrack === '1' ||
    window.navigator?.globalPrivacyControl === true
  );
}

/**
 * Checks if analytics tracking consent is affirmatively granted.
 * Strict opt-in: null or unknown state NEVER implies granted consent.
 */
export function hasUserConsent() {
  if (typeof localStorage === 'undefined') return false;
  if (isDntEnabled()) return false;
  const consent = localStorage.getItem(STORAGE_ANALYTICS_KEY);
  return consent === 'granted';
}

/**
 * Checks if advertising cookies and personalization consent is granted.
 */
export function hasAdConsent() {
  if (typeof localStorage === 'undefined') return false;
  if (isDntEnabled()) return false;
  const consent = localStorage.getItem(STORAGE_ADVERTISING_KEY);
  return consent === 'granted';
}

/**
 * Dispatch Google Consent Mode v2 updates to gtag
 */
export function updateGtagConsent(updates = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', updates);
  } else {
    window.dataLayer.push(['consent', 'update', updates]);
  }
}

/**
 * Delete application-controlled Google tracking cookies upon withdrawal.
 * Strictly avoids deleting unrelated third-party or functional application cookies.
 */
export function purgeTrackingCookies() {
  if (typeof document === 'undefined') return;
  const targetPrefixes = ['_ga', '_gid', '_gat', '_gac_'];
  const hostname = window.location.hostname;
  const rootDomain = hostname.replace(/^www\./, '');

  const cookies = document.cookie.split(';');
  for (const rawCookie of cookies) {
    const name = rawCookie.split('=')[0].trim();
    const matchesTarget = targetPrefixes.some(prefix => name === prefix || name.startsWith(prefix));
    if (matchesTarget) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${rootDomain};`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname};`;
    }
  }
}

/**
 * Update analytics consent preference
 */
export function setAnalyticsConsent(granted) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_ANALYTICS_KEY, granted ? 'granted' : 'denied');
  }

  if (GA_ID && typeof window !== 'undefined') {
    window[`ga-disable-${GA_ID}`] = !granted;
  }

  updateGtagConsent({
    analytics_storage: granted ? 'granted' : 'denied'
  });

  if (granted) {
    initAnalytics();
  } else {
    purgeTrackingCookies();
  }
}

/**
 * Update advertising consent preference
 */
export function setAdvertisingConsent(granted) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_ADVERTISING_KEY, granted ? 'granted' : 'denied');
  }

  updateGtagConsent({
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
    personalization_storage: granted ? 'granted' : 'denied'
  });
}

/**
 * Update both consent categories simultaneously
 */
export function setAllConsent({ analytics = false, advertising = false } = {}) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_ANALYTICS_KEY, analytics ? 'granted' : 'denied');
    localStorage.setItem(STORAGE_ADVERTISING_KEY, advertising ? 'granted' : 'denied');
  }

  if (GA_ID && typeof window !== 'undefined') {
    window[`ga-disable-${GA_ID}`] = !analytics;
  }

  updateGtagConsent({
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: advertising ? 'granted' : 'denied',
    ad_user_data: advertising ? 'granted' : 'denied',
    ad_personalization: advertising ? 'granted' : 'denied',
    personalization_storage: advertising ? 'granted' : 'denied'
  });

  if (analytics) {
    initAnalytics();
  } else {
    purgeTrackingCookies();
  }
}

/**
 * Withdraw all non-essential consent
 */
export function withdrawAllConsent() {
  setAllConsent({ analytics: false, advertising: false });
}

/**
 * Initialize Google Analytics 4 under Basic Consent Mode
 * In Basic Consent Mode, the GA4 tag is only injected after explicit user consent.
 */
export function initAnalytics() {
  if (!GA_ID || isInitialized) return;
  if (!hasUserConsent()) return;

  try {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      anonymize_ip: true,
      send_page_view: false // Managed manually for SPA navigation
    });

    isInitialized = true;
  } catch (err) {
    console.warn('Analytics initialization failed safely:', err);
  }
}

/**
 * IAB TCF v2.2 / v2.3 synchronization
 * Integrates with Google's Certified CMP (Funding Choices / AdSense CMP).
 * Automatically updates Google Consent Mode v2 when European visitors make CMP selections.
 */
export function initTcfConsentSync() {
  if (typeof window === 'undefined') return;

  function handleTcfEvent(tcData, success) {
    if (!success || !tcData) return;

    // Signal to application that Google CMP UI is visible or GDPR applies
    if (tcData.eventStatus === 'cmpuishown' || tcData.gdprApplies) {
      if (typeof window !== 'undefined') {
        window.__tcfActive = true;
      }
      if (typeof document !== 'undefined' && document.body) {
        document.body.classList.add('has-google-cmp');
      }
      window.dispatchEvent(new CustomEvent('ps-color-tcf-active', { detail: tcData }));
    }

    // Process user decision - strictly only when GDPR applies to this visitor
    if (tcData.gdprApplies !== false && (tcData.eventStatus === 'useractioncomplete' || tcData.eventStatus === 'tcloaded')) {
      const consents = tcData.purpose?.consents || {};
      // Purpose 1: Store/access information on a device
      // Purpose 8: Measure content performance (analytics)
      const analyticsGranted = Boolean(consents[1] && consents[8]);
      // Purpose 2, 3, 4: Basic ads, personalized ads, ad profile
      const adsGranted = Boolean(consents[1] && consents[2] && consents[3] && consents[4]);

      setAllConsent({
        analytics: analyticsGranted,
        advertising: adsGranted
      });
    }
  }

  if (typeof window.__tcfapi === 'function') {
    window.__tcfapi('addEventListener', 2, handleTcfEvent);
  } else {
    // Retry polling briefly to catch asynchronous TCF registration
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (typeof window.__tcfapi === 'function') {
        clearInterval(interval);
        window.__tcfapi('addEventListener', 2, handleTcfEvent);
      } else if (count > 25) {
        clearInterval(interval);
      }
    }, 150);
  }
}

/**
 * Generic event tracker
 * Respects strict consent opt-in and blocks tracking when consent is absent.
 */
export function trackEvent(eventName, params = {}) {
  if (!hasUserConsent()) return;

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }

  // Dispatch custom DOM event for local debugging and tests
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
    export_type: exportType,
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

/**
 * Track Contact Form Submission (Zero PII logged)
 */
export function trackContactSubmit(topic) {
  trackEvent('contact_form_submit', {
    topic: topic || 'general'
  });
}

/**
 * Track Live UI Visualizer Open
 */
export function trackUiPreviewOpen(paletteId, template) {
  trackEvent('ui_preview_open', {
    palette_id: paletteId || 'default',
    template: template || 'landing'
  });
}

/**
 * Track Visualizer Template Switch
 */
export function trackUiPreviewTemplateChange(template) {
  trackEvent('ui_preview_template_change', {
    template: template || 'landing'
  });
}

/**
 * Track Visualizer Palette Switch
 */
export function trackUiPreviewPaletteChange(paletteId) {
  trackEvent('ui_preview_palette_change', {
    palette_id: paletteId || 'unknown'
  });
}

/**
 * Track Visualizer Theme / Token Export
 */
export function trackUiPreviewExport(exportType, paletteId) {
  trackEvent('ui_preview_export', {
    export_type: exportType,
    palette_id: paletteId || 'unknown'
  });
}

