# Innovative World Of Congress (I.W.C) — Static E‑Commerce & Marketing Template

A modern, responsive static HTML template designed for event-driven e-commerce and marketing — focused on speed, accessibility, and conversion.

Features:
- Semantic & accessible HTML structure with ARIA attributes.
- Responsive CSS with CSS variables and components.
- Client-side shopping cart (localStorage) and simple checkout demo.
- Product grid, filtering, sorting, and search (client-side).
- Newsletter and contact forms with progressive enhancement.
- JSON-LD org schema for SEO.
- No external build tools required — drop into static hosting (Netlify, Vercel, GitHub Pages).

Files:
- index.html — main page with hero, products, features, cart sidebar, footer.
- assets/css/styles.css — styles, variables and responsive rules.
- assets/js/main.js — minimal cart & UI behavior (no libraries).
- assets/images/* — placeholder images (replace with your assets).

How to use:
1. Copy files to your web host or local folder.
2. Replace placeholder images in assets/images and update branding (logo, texts).
3. Wire newsletter/contact forms to your backend (Netlify Functions, Formspree, Mailchimp).
4. Replace the checkout handler to integrate with Stripe, PayPal, or your server.
5. Deploy to your static host.

Notes & Next steps:
- Replace example backend action URLs with production endpoints.
- For production payment flow, never collect sensitive card data in plain static JS; integrate a provider (Stripe Checkout, Payment Links).
- Consider optimizing images and adding multiple sizes for responsive images.

License: MIT