// assets/js/firebase-init.js
// Modular Firebase initializer for I.W.C — exports app, analytics, firestore, auth, storage.
// Uses modular CDN imports (Firebase JS SDK v9+). Guarded initialization so the page won't crash
// if analytics or certain features are unavailable in preview/blocking environments.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';

// NOTE: This config is the one you provided. Keep it here for the client SDK.
// For production you should configure appropriate Firebase security rules and
// consider environment-specific configs (don't embed unrestricted keys if you
// can't restrict usage via Firebase console).
const firebaseConfig = {
  apiKey: "AIzaSyDATaOG9u7sIKVzT0BxQH5ZWDHvWMM2WSk",
  authDomain: "innovative-world-of-congress.firebaseapp.com",
  projectId: "innovative-world-of-congress",
  storageBucket: "innovative-world-of-congress.firebasestorage.app",
  messagingSenderId: "728669966037",
  appId: "1:728669966037:web:ca1f4942ff5204b9b39c5c",
  measurementId: "G-RCC3405PH0"
};

// Initialize app
const firebaseApp = initializeApp(firebaseConfig);

// Firestore, Storage and Auth are safe to initialize synchronously
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const auth = getAuth(firebaseApp);

// Analytics: may throw in some environments (file:// or blocked by privacy tools)
let analytics = null;
try {
  analytics = getAnalytics(firebaseApp);
} catch (err) {
  // Soft failure: analytics is optional for site functionality
  // eslint-disable-next-line no-console
  console.warn('Firebase analytics not available:', err && err.message ? err.message : err);
}

// Helper: sign in anonymously if not authenticated. This is useful when using
// Firestore rules that allow writes only for authenticated users. If your project
// doesn't use anonymous auth, this will silently fail and Firestore writes may be blocked by rules.
async function ensureAnonymousAuth() {
  try {
    if (!auth) return null;
    if (auth.currentUser) return auth.currentUser;
    // Attempt anonymous sign-in; if disabled, this will reject.
    const credential = await signInAnonymously(auth);
    return credential && credential.user ? credential.user : null;
  } catch (err) {
    // Auth may be disabled in the project; that's okay, calling code should handle failures.
    // eslint-disable-next-line no-console
    console.warn('Anonymous sign-in failed or disabled:', err && err.message ? err.message : err);
    return null;
  }
}

// Expose on window for non-module scripts if needed
window.__IWCFirebase = {
  app: firebaseApp,
  db,
  storage,
  auth,
  analytics,
  ensureAnonymousAuth
};

// Also export for module importers
export {
  firebaseApp as app,
  db,
  storage,
  auth,
  analytics,
  ensureAnonymousAuth
};