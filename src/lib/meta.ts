/**
 * TRACKING MARKETING — Meta Pixel/CAPI + TikTok Pixel
 * Les scripts ne sont injectés que si les IDs sont configurés dans
 * Admin → Paramètres → Pixels & Tracking.
 */
import type { MetaConfig } from './types';

interface FbqFn {
  (...args: unknown[]): void;
  queue?: unknown[];
  loaded?: boolean;
}

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: unknown;
    ttq?: {
      (...args: unknown[]): void;
      line?: (id: string) => void;
    };
    TiktokAnalyticsObject?: string;
  }
}

let config: MetaConfig = { pixelId: '', capiToken: '', tiktokPixelId: '', enabled: false };
let metaReady = false;
let tiktokReady = false;

// ---------------- Meta Pixel ----------------
const injectMetaPixel = (pixelId: string) => {
  if (metaReady || typeof document === 'undefined') return;
  metaReady = true;

  const fbq: FbqFn = (...args: unknown[]) => {
    fbq.queue = fbq.queue ?? [];
    fbq.queue!.push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  fbq('init', pixelId);
  fbq('track', 'PageView');
  console.info('%c[meta]%c Pixel initialisé', 'color:#1877F2;font-weight:bold', 'color:inherit', pixelId);
};

// ---------------- TikTok Pixel ----------------
const TIKTOK_EVENTS: Record<string, string> = {
  PageView: 'PageView',
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout',
  Purchase: 'CompletePayment',
  TestEvent: 'TestEvent',
};

const injectTikTokPixel = (pixelId: string) => {
  if (tiktokReady || typeof document === 'undefined') return;
  tiktokReady = true;

  // Snippet officiel TikTok (version compacte fidèle)
  window.TiktokAnalyticsObject = 'ttq';
  const stub = (...args: unknown[]) => {
    (stub as unknown as { q: unknown[] }).q?.push(args);
  };
  (stub as unknown as { q: unknown[] }).q = [];
  window.ttq = stub as Window['ttq'];

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${pixelId}&lib=ttq`;
  document.head.appendChild(script);

  window.ttq?.('init', pixelId);
  window.ttq?.('track', 'PageView');
  console.info('%c[tiktok]%c Pixel initialisé', 'color:#FE2C55;font-weight:bold', 'color:inherit', pixelId);
};

// ---------------- API publique ----------------
export const setMetaConfig = (cfg: MetaConfig) => {
  config = cfg;
  if (cfg.enabled && cfg.pixelId) injectMetaPixel(cfg.pixelId);
  if (cfg.enabled && cfg.tiktokPixelId) injectTikTokPixel(cfg.tiktokPixelId);
};

export const track = (event: string, params: Record<string, unknown> = {}) => {
  if (!config.enabled) return;
  try {
    if (config.pixelId) {
      window.fbq?.('track', event, params);
      console.info(`%c[meta]%c ${event}`, 'color:#1877F2;font-weight:bold', 'color:inherit', params);
    }
    if (config.tiktokPixelId && TIKTOK_EVENTS[event]) {
      window.ttq?.('track', TIKTOK_EVENTS[event], {
        content_type: 'product',
        ...params,
      });
      console.info(`%c[tiktok]%c ${TIKTOK_EVENTS[event]}`, 'color:#FE2C55;font-weight:bold', 'color:inherit', params);
    }
  } catch {
    /* no-op */
  }
};

export const testEvent = () => {
  track('TestEvent', { origin: 'admin-settings', at: Date.now() });
  const active = [config.pixelId && 'Meta', config.tiktokPixelId && 'TikTok'].filter(Boolean);
  return config.enabled && active.length
    ? `Événement test envoyé (${active.join(' + ')})`
    : 'Configuration incomplète — activez le suivi avec au moins un Pixel ID';
};
