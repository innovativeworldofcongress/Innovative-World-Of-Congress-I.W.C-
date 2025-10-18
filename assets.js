// Simple client-side cart and UI interactions for I.W.C static template.
// No external dependencies. Uses localStorage for persistence and progressive enhancement.

(() => {
  const PRODUCTS = [
    { id: 'pro-pack', title: 'Congress Pro Pack', category: 'kits', price: 19900, priceDisplay: '$199.00', image: 'assets/images/product-sample.jpg', description: 'Complete event kit: badges, lanyards, printed materials.' },
    { id: 'express-setup', title: 'Express Setup Service', category: 'services', price: 89900, priceDisplay: '$899.00', image: 'assets/images/service-sample.jpg', description: 'Fast turn-key storefront and marketing funnel setup.' },
    { id: 'swag-bundle', title: 'Swag Bundle', category: 'swag', price: 4900, priceDisplay: '$49.00', image: 'assets/images/swag-sample.jpg', description: 'T‑shirts, stickers, and branded goodies.' },
    { id: 'vip-workshop', title: 'VIP Workshop Access', category: 'services', price: 12900, priceDisplay: '$129.00', image: 'assets/images/workshop-sample.jpg', description: 'Online pre-event workshop for organizers.' }
  ];

  // Utilities
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // DOM elements
  const productGrid = $('#productGrid');
  const categoryFilter = $('#categoryFilter');
  const sortSelect = $('#sortSelect');
  const productSearch = $('#productSearch');
  const cartToggle = $('#cartToggle');
  const cartPanel = $('#cartPanel');
  const cartClose = $('#cartClose');
  const cartItemsEl = $('#cartItems');
  const cartCountEl = $('#cartCount');
  const cartSubtotalEl = $('#cartSubtotal');
  const checkoutBtn = $('#checkoutBtn');
  const clearCartBtn = $('#clearCart');
  const addToCartButtons = () => $$('.btn[data-sku]');

  // Cart (store cents to avoid float error)
  let cart = JSON.parse(localStorage.getItem('iwc_cart') || '[]');

  function saveCart() {
    localStorage.setItem('iwc_cart', JSON.stringify(cart));
    renderCart();
  }

  function addToCart(sku, qty = 1) {
    const prod = PRODUCTS.find(p => p.id === sku);
    if (!prod) return;
    const existing = cart.find(i => i.id === sku);
    if (existing) existing.quantity += qty;
    else cart.push({ id: sku, quantity: qty, title: prod.title, price: prod.price, image: prod.image });
    saveCart();
    flashCartCount();
  }

  function removeFromCart(sku) {
    cart = cart.filter(i => i.id !== sku);
    saveCart();
  }

  function updateQuantity(sku, qty) {
    const item = cart.find(i => i.id === sku);
    if (!item) return;
    item.quantity = Math.max(0, Number(qty));
    if (item.quantity === 0) removeFromCart(sku);
    saveCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
  }

  function cartTotals() {
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      subtotal,
      display: (subtotal / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
    };
  }

  function renderProducts(list = PRODUCTS) {
    productGrid.innerHTML = '';
    list.forEach(p => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy">
        <h4>${escapeHtml(p.title)}</h4>
        <p class="muted">${escapeHtml(p.description)}</p>
        <div class="meta">
          <div class="price">${p.priceDisplay}</div>
          <div>
            <button class="btn compact" data-sku="${p.id}">Add</button>
          </div>
        </div>
      `;
      productGrid.appendChild(card);
    });
    // attach handlers
    addToCartButtons().forEach(btn => {
      btn.addEventListener('click', e => {
        const sku = e.currentTarget.dataset.sku;
        addToCart(sku);
      });
    });
  }

  function renderCart() {
    cartItemsEl.innerHTML = '';
    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<p class="muted">Your cart is empty.</p>';
      cartCountEl.textContent = '0';
      cartSubtotalEl.textContent = '$0.00';
      checkoutBtn.disabled = true;
      return;
    }
    cartCountEl.textContent = cart.reduce((s, i) => s + i.quantity, 0);
    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${item.image}" alt="${escapeHtml(item.title)}">
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong>${escapeHtml(item.title)}</strong>
            <span class="muted">${(item.price/100).toLocaleString(undefined,{style:'currency',currency:'USD'})}</span>
          </div>
          <div style="display:flex;gap:.5rem;align-items:center;margin-top:.35rem">
            <label class="sr-only">Quantity for ${escapeHtml(item.title)}</label>
            <input type="number" min="0" value="${item.quantity}" data-update="${item.id}" style="width:64px;padding:.25rem;border-radius:6px;border:1px solid rgba(255,255,255,0.03);background:transparent;color:var(--text)">
            <button data-remove="${item.id}" class="btn ghost compact">Remove</button>
          </div>
        </div>
      `;
      cartItemsEl.appendChild(row);
    });

    // attach cart events
    $$('[data-remove]').forEach(btn => btn.addEventListener('click', e => {
      removeFromCart(e.currentTarget.dataset.remove);
    }));
    $$('[data-update]').forEach(input => input.addEventListener('change', e => {
      updateQuantity(e.currentTarget.dataset.update, Number(e.currentTarget.value));
    }));

    const totals = cartTotals();
    cartSubtotalEl.textContent = totals.display;
    checkoutBtn.disabled = false;
  }

  function flashCartCount() {
    cartCountEl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 400 });
  }

  // UI toggles and handlers
  function openCart() {
    cartPanel.setAttribute('aria-hidden', 'false');
    cartToggle.setAttribute('aria-expanded', 'true');
    cartClose.focus();
  }
  function closeCart() {
    cartPanel.setAttribute('aria-hidden', 'true');
    cartToggle.setAttribute('aria-expanded', 'false');
    cartToggle.focus();
  }

  // Filters, search, sorting
  function filteredProducts() {
    const cat = categoryFilter.value;
    const query = productSearch.value.trim().toLowerCase();
    let list = PRODUCTS.filter(p => (cat === 'all' || p.category === cat));
    if (query) list = list.filter(p => (p.title + ' ' + p.description).toLowerCase().includes(query));
    if (sortSelect.value === 'price-asc') list = list.sort((a,b)=>a.price-b.price);
    if (sortSelect.value === 'price-desc') list = list.sort((a,b)=>b.price-a.price);
    renderProducts(list);
  }

  // small helpers
  function escapeHtml(s){return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

  // Event wiring
  document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    renderCart();
    document.getElementById('year').textContent = new Date().getFullYear();

    // header actions
    $('#searchToggle').addEventListener('click', e=>{
      const box = $('#searchBox');
      const expanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
      e.currentTarget.setAttribute('aria-expanded', String(!expanded));
      box.style.display = expanded ? 'none' : 'block';
      box.setAttribute('aria-hidden', String(expanded));
      if (!expanded) $('#siteSearch').focus();
    });

    cartToggle.addEventListener('click', () => {
      const hidden = cartPanel.getAttribute('aria-hidden') === 'true';
      if (hidden) openCart(); else closeCart();
    });
    cartClose.addEventListener('click', closeCart);
    clearCartBtn.addEventListener('click', () => {
      clearCart();
    });

    // product toolbar
    categoryFilter.addEventListener('change', filteredProducts);
    sortSelect.addEventListener('change', filteredProducts);
    productSearch.addEventListener('input', filteredProducts);

    // hero add to cart
    document.querySelectorAll('[data-sku]').forEach(btn => {
      btn.addEventListener('click', e => {
        addToCart(e.currentTarget.dataset.sku);
      });
    });

    // checkout action (static demo)
    checkoutBtn.addEventListener('click', () => {
      // Simple client-side checkout demo: collects minimal details and "submits"
      const checkoutData = {
        items: cart,
        subtotal: cartTotals().subtotal
      };
      // In real site: send this to backend or payment provider
      alert('Checkout demo:\n\n' + JSON.stringify(checkoutData, null, 2));
      // clear cart to simulate completion
      clearCart();
      closeCart();
    });

    // newsletter form: progressive enhancement example
    const newsletter = $('#newsletterForm');
    if(newsletter){
      newsletter.addEventListener('submit', (e)=>{
        e.preventDefault();
        const email = newsletter.email.value.trim();
        if(!email){newsletter.email.focus();return;}
        // Demo: show a quick thanks state
        const btn = newsletter.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Subscribed ✓';
        setTimeout(()=>{btn.disabled=false;btn.textContent='Subscribe';newsletter.reset();},2000);
      });
    }

    // Improve accessibility: close cart on Escape
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape'){
        if(cartPanel.getAttribute('aria-hidden') === 'false') closeCart();
        const searchOpen = $('#searchBox') && $('#searchBox').style.display !== 'none';
        if(searchOpen) { $('#searchToggle').click(); }
      }
    });
  });

})();
