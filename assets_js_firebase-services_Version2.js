// assets/js/firebase-services.js
// Small, focused service helpers that use the initialized Firebase services.
// - subscribeNewsletter(email) -> adds a doc to 'newsletter'
// - submitContact(payload) -> adds a doc to 'contacts'
// - createOrder(order) -> adds a doc to 'orders' with status 'pending'
// - logEvent(name, params) -> analytics event (no-op if analytics unavailable)
//
// These helpers do minimal validation and return a promise that resolves with
// the Firestore write result (docRef.id) or rejects with an error. They DO NOT
// handle payment processing — orders are created with status 'pending' and must
// be reconciled server-side.

import { db, analytics, ensureAnonymousAuth } from './firebase-init.js';
import {
  collection,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

/**
 * Log analytics event if analytics is available.
 * Safe to call even if analytics is not initialized.
 */
export function logEvent(name, params = {}) {
  if (!analytics) {
    // no analytics in this environment (adblocker, local file previews, etc.)
    return;
  }
  try {
    // dynamic import of analytics methods to avoid bundling assumptions
    // We already initialized analytics in firebase-init; here we just call the global
    // analytics object. If you prefer, you can import `logEvent` from firebase-analytics.
    // But to keep runtime small and guarded, we call window.__IWCFirebase.analytics
    const a = window.__IWCFirebase && window.__IWCFirebase.analytics;
    if (a && typeof a.logEvent === 'function') {
      a.logEvent(name, params);
    } else {
      // As a fallback try to import and call logEvent
      import('https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js').then(mod => {
        if (mod && typeof mod.logEvent === 'function' && window.__IWCFirebase && window.__IWCFirebase.analytics) {
          mod.logEvent(window.__IWCFirebase.analytics, name, params);
        }
      }).catch(() => {/* ignore */});
    }
  } catch (err) {
    // non-critical
    // eslint-disable-next-line no-console
    console.warn('Analytics logEvent failed:', err && err.message ? err.message : err);
  }
}

/**
 * Subscribe an email to the 'newsletter' collection.
 * Returns the new document ID on success.
 */
export async function subscribeNewsletter(email, meta = {}) {
  if (!email) throw new Error('Email required');
  // Attempt to sign in anonymously so Firestore rules that expect authentication succeed.
  await ensureAnonymousAuth().catch(() => null);
  const payload = {
    email: String(email).toLowerCase(),
    createdAt: serverTimestamp(),
    source: meta.source || 'website',
    utm: meta.utm || null
  };
  const col = collection(db, 'newsletter');
  const docRef = await addDoc(col, payload);
  logEvent('newsletter_subscribed', { method: 'website' });
  return docRef.id;
}

/**
 * Submit contact form payload to 'contacts' collection.
 * payload: { name, email, message, meta }
 */
export async function submitContact(payload = {}) {
  if (!payload || !payload.email || !payload.message) throw new Error('Invalid contact payload');
  await ensureAnonymousAuth().catch(() => null);
  const col = collection(db, 'contacts');
  const docRef = await addDoc(col, {
    name: payload.name || '',
    email: payload.email,
    message: payload.message,
    meta: payload.meta || null,
    createdAt: serverTimestamp()
  });
  logEvent('contact_submitted', { source: 'website' });
  return docRef.id;
}

/**
 * Create an order in Firestore as 'pending'. Do NOT collect card data here.
 * order: {
 *   items: [{ id, title, price, quantity }],
 *   customer: { name, email },
 *   totals: { subtotal, currency },
 *   meta: {...}
 * }
 */
export async function createOrder(order = {}) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    throw new Error('Order must include items');
  }
  await ensureAnonymousAuth().catch(() => null);
  const col = collection(db, 'orders');
  const payload = {
    items: order.items,
    customer: order.customer || null,
    totals: order.totals || null,
    status: 'pending', // engineer-friendly: payment must be confirmed server-side
    meta: order.meta || null,
    createdAt: serverTimestamp()
  };
  const docRef = await addDoc(col, payload);
  logEvent('order_created', { value: order.totals && order.totals.subtotal ? order.totals.subtotal : 0 });
  return docRef.id;
}