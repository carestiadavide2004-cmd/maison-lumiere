/* ==========================================================
   Maison Lumière — interazioni
   ========================================================== */
(function () {
  "use strict";

  const img = (id, w) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

  /* ---------- Prodotti ---------- */
  // I prodotti arrivano da Firestore (js/firebase-products.js). Se Firebase non è
  // configurato o non risponde, si usano quelli di esempio in js/products-data.js.
  const CATEGORY_LABELS = { abiti: "Abiti", capispalla: "Capispalla", camicie: "Camicie & Maglie", accessori: "Accessori" };
  const DEFAULT_PRODUCTS = window.MAISON_DEFAULT_PRODUCTS || [];
  const liveMode = !!window.MAISON_FIREBASE_READY && location.protocol !== "file:";

  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toList = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim()).filter(Boolean);

  // Ridimensiona le immagini Unsplash; gli altri indirizzi restano invariati
  function sized(url, w) {
    if (!/^https:\/\/images\.unsplash\.com\//.test(url)) return url;
    try { const u = new URL(url); u.searchParams.set("w", w); return u.toString(); } catch (e) { return url; }
  }

  function normalizeProduct(raw) {
    const cat = CATEGORY_LABELS[raw.category] ? raw.category : "accessori";
    const sizes = toList(raw.sizes);
    const image = /^https?:\/\//i.test(raw.image || "") ? raw.image : "";
    return {
      id: String(raw.id),
      name: String(raw.name || "Senza nome"),
      price: Math.max(0, Number(raw.price) || 0),
      image,
      cat,
      catLabel: raw.label || CATEGORY_LABELS[cat],
      alt: raw.alt || raw.name || "",
      desc: raw.description || "",
      material: raw.material || "",
      sizes: sizes.length ? sizes : ["Unica"],
      soldOut: toList(raw.soldOutSizes),
      tag: raw.tag || "",
      available: raw.available !== false,
      order: Number(raw.order) || 0
    };
  }
  const sortProducts = (list) => list.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name, "it"));

  let products = liveMode ? [] : sortProducts(DEFAULT_PRODUCTS.map(normalizeProduct));
  let productsLoaded = !liveMode;

  const galleryItems = [
    { photo: "1539109136881-3be0616acf4b", caption: "Passeggiata in città", alt: "Donna elegante con cappotto azzurro e borsa davanti al Duomo" },
    { photo: "1496747611176-843222e1e57c", caption: "Seta al vento", alt: "Abito floreale in seta fotografato al mare" },
    { photo: "1490481651871-ab68de25d43d", caption: "L'atelier", alt: "Boutique moda interno con camicie bianche e capi neutri appesi" },
    { photo: "1485968579580-b6d095142e6e", caption: "Tartan e silenzi", alt: "Donna con cappotto a quadri in una strada cittadina" },
    { photo: "1567401893414-76b7b1e5a7a5", caption: "Il guardaroba", alt: "Interno di boutique moda con abiti e borse esposti" },
    { photo: "1581044777550-4cfa60707c03", caption: "Luce d'oro", alt: "Ritratto editoriale di moda con abito rosa a balze in un campo dorato" },
    { photo: "1594633312681-425c7b97ccd1", caption: "Linee morbide", alt: "Pantaloni in seta rosa cipria con sandali eleganti" },
    { photo: "1512436991641-6745cdb1723f", caption: "Toni neutri", alt: "Capi di maglieria e cappotti in toni neutri su stender" }
  ];

  const reviewsData = [
    { name: "Giulia R.", meta: "Pescara", stars: 5, text: "Un luogo dove il tempo rallenta. Mi hanno aiutata a scegliere l'abito per il matrimonio di mia sorella con una cura rara. Mi sono sentita unica." },
    { name: "Francesca M.", meta: "Chieti", stars: 5, text: "Il trench cammello è diventato il mio capo preferito. Tessuto meraviglioso e finiture impeccabili: si vede che è fatto per durare." },
    { name: "Elena D.", meta: "Montesilvano", stars: 5, text: "Atmosfera elegante e mai intimidatoria. Il servizio di sartoria ha sistemato il mio cappotto alla perfezione in pochi giorni." },
    { name: "Martina C.", meta: "Roma", stars: 4, text: "Passo sempre da Maison Lumière quando torno in Abruzzo. Selezione raffinata, pezzi che non trovi altrove e un gusto sicuro." },
    { name: "Alessandra P.", meta: "Pescara", stars: 5, text: "La borsa Aurora è un piccolo capolavoro. Il packaging, il biglietto scritto a mano: ogni dettaglio racconta attenzione." },
    { name: "Sofia B.", meta: "Francavilla al Mare", stars: 5, text: "Ho regalato gli orecchini Notte a mia madre: si è commossa. Consulenza gentile e competente, tornerò sicuramente." }
  ];

  /* ---------- Stato (wishlist e carrello) ---------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage non disponibile */ }
    }
  };
  let wishlist = new Set(store.get("ml-wishlist", []).map(String));
  // Carrello: righe { id, size, qty } (converte anche il vecchio formato senza qty)
  let cart = store.get("ml-cart", []).reduce((acc, item) => {
    const id = String(item.id);
    const row = acc.find((r) => r.id === id && r.size === item.size);
    if (row) row.qty += item.qty || 1;
    else acc.push({ id, size: item.size, qty: item.qty || 1 });
    return acc;
  }, []);
  // Si contano solo i prodotti ancora presenti nel catalogo
  const validCart = () => cart.filter((r) => productById(r.id));
  const validWish = () => Array.from(wishlist).filter((id) => productById(id));
  const cartQty = () => validCart().reduce((s, r) => s + r.qty, 0);
  const cartTotal = () => validCart().reduce((s, r) => s + r.qty * productById(r.id).price, 0);
  const saveCart = () => store.set("ml-cart", cart);

  function productById(id) { return products.find((p) => p.id === id); }
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  // Formato italiano: € 1.150 oppure € 89,90
  const euro = (n) => {
    const [int, dec] = (Number(n) || 0).toFixed(2).split(".");
    return "€ " + int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (dec === "00" ? "" : "," + dec);
  };
  const heartSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.8 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.4 0 5.6 3.3 4.4 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"/></svg>';

  /* ---------- Toast ---------- */
  const toast = $("#toast");
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  /* ---------- Badge ---------- */
  function updateBadge(el, count, bump) {
    el.textContent = count;
    el.classList.toggle("is-visible", count > 0);
    if (bump && count > 0) {
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    }
  }
  const wishlistCount = $("#wishlistCount");
  const cartCount = $("#cartCount");
  function refreshBadges() {
    updateBadge(wishlistCount, validWish().length);
    updateBadge(cartCount, cartQty());
  }
  refreshBadges();

  /* ---------- Header allo scroll ---------- */
  const header = $("#header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  const burger = $("#burger");
  const nav = $("#nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    header.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
  }
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$(".nav__link").forEach((l) => l.addEventListener("click", () => setMenu(false)));
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !header.contains(e.target)) setMenu(false);
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 900) setMenu(false); });

  /* ---------- Voce attiva del menu ---------- */
  const navLinks = $$(".nav__link");
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => sectionObserver.observe(s));

  /* ---------- Griglia prodotti ---------- */
  const productsEl = $("#products");
  let currentFilter = "tutti";
  let revealObserver = null;

  const cardHTML = (p) => `
    <article class="card reveal${p.available ? "" : " card--out"}" data-id="${esc(p.id)}" data-cat="${p.cat}" tabindex="0" role="button" aria-label="Apri dettaglio ${esc(p.name)}">
      <div class="card__media">
        ${p.image ? `<img src="${esc(sized(p.image, 700))}" alt="${esc(p.alt)}" loading="lazy">` : ""}
        ${!p.available ? `<span class="card__tag card__tag--out">Esaurito</span>` : p.tag ? `<span class="card__tag">${esc(p.tag)}</span>` : ""}
        <button class="heart${wishlist.has(p.id) ? " is-active" : ""}" data-heart="${esc(p.id)}"
                aria-label="${wishlist.has(p.id) ? "Rimuovi dalla" : "Aggiungi alla"} wishlist: ${esc(p.name)}"
                aria-pressed="${wishlist.has(p.id)}">${heartSVG}</button>
        <span class="card__quick">Scopri</span>
      </div>
      <div class="card__info">
        <div>
          <h3 class="card__name">${esc(p.name)}</h3>
          <p class="card__cat">${esc(p.catLabel)}</p>
        </div>
        <span class="card__price">${euro(p.price)}</span>
      </div>
    </article>`;

  function renderProducts() {
    if (!productsLoaded) {
      productsEl.innerHTML = Array.from({ length: 8 }, () =>
        `<div class="card card--skeleton" aria-hidden="true"><div class="card__media"></div><div class="card__info"><span></span><span></span></div></div>`).join("");
      productsEl.setAttribute("aria-busy", "true");
      return;
    }
    productsEl.removeAttribute("aria-busy");
    productsEl.innerHTML = products.length
      ? products.map(cardHTML).join("")
      : `<p class="products__empty">La nuova collezione è in arrivo. Torna a trovarci presto.</p>`;
    applyFilter(false);
    $$(".card", productsEl).forEach((card, i) => {
      card.style.setProperty("--delay", (i % 4) * 0.12 + "s");
      if (revealObserver) revealObserver.observe(card);
    });
  }

  function applyFilter(animate) {
    $$(".card", productsEl).forEach((card) => {
      const show = currentFilter === "tutti" || card.dataset.cat === currentFilter;
      card.classList.toggle("is-hidden", !show);
      if (show && animate) {
        card.classList.remove("is-visible");
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add("is-visible")));
      }
    });
  }

  renderProducts();

  function syncHearts(id) {
    const active = wishlist.has(id);
    const p = productById(id);
    const name = p ? p.name : "";
    $$(`[data-heart="${id}"]`).concat(currentProduct && currentProduct.id === id ? [$("#modalHeart")] : [])
      .forEach((btn) => {
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
        btn.setAttribute("aria-label", `${active ? "Rimuovi dalla" : "Aggiungi alla"} wishlist: ${name}`);
      });
  }

  function toggleWishlist(id, btn) {
    const adding = !wishlist.has(id);
    if (adding) wishlist.add(id);
    else wishlist.delete(id);
    store.set("ml-wishlist", Array.from(wishlist));
    syncHearts(id);
    updateBadge(wishlistCount, validWish().length, true);
    btn.classList.remove("pop");
    void btn.offsetWidth;
    btn.classList.add("pop");
    // Lascia terminare l'animazione del cuore prima di aprire il pannello
    if (adding) setTimeout(() => openDrawer("wishlist"), 450);
  }

  productsEl.addEventListener("click", (e) => {
    const heart = e.target.closest("[data-heart]");
    if (heart) {
      e.stopPropagation();
      toggleWishlist(heart.dataset.heart, heart);
      return;
    }
    const card = e.target.closest(".card");
    if (card && card.dataset.id) openProduct(card.dataset.id);
  });
  productsEl.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("card")) {
      e.preventDefault();
      openProduct(e.target.dataset.id);
    }
  });

  /* Filtri */
  $$(".filter").forEach((btn) => btn.addEventListener("click", () => {
    $$(".filter").forEach((b) => { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
    btn.classList.add("is-active");
    btn.setAttribute("aria-selected", "true");
    currentFilter = btn.dataset.filter;
    applyFilter(true);
  }));

  $("#wishlistBtn").addEventListener("click", () => openDrawer("wishlist"));
  $("#cartBtn").addEventListener("click", () => openDrawer("cart"));

  /* ---------- Modale prodotto ---------- */
  const modal = $("#productModal");
  const modalHeart = $("#modalHeart");
  const sizesWrap = $(".sizes", modal);
  let currentProduct = null;
  let selectedSize = null;
  let lastFocus = null;

  // Il body resta bloccato finché è aperto almeno un livello (modale, lightbox, pannello)
  function syncScrollLock() {
    document.body.classList.toggle("no-scroll", !!$(".modal.is-open, .lightbox.is-open, .drawer.is-open"));
  }
  function openDialog(el) {
    lastFocus = document.activeElement;
    el.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-open")));
  }
  function closeDialog(el) {
    el.classList.remove("is-open");
    syncScrollLock();
    setTimeout(() => { if (!el.classList.contains("is-open")) el.hidden = true; }, 500);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  function fillProduct(p) {
    currentProduct = p;
    selectedSize = p.available && p.sizes.length === 1 ? p.sizes[0] : null;
    $("#modalImg").src = p.image ? sized(p.image, 1000) : "";
    $("#modalImg").alt = p.alt;
    $("#modalCat").textContent = p.catLabel;
    $("#modalTitle").textContent = p.name;
    $("#modalPrice").textContent = euro(p.price);
    $("#modalDesc").textContent = p.desc;
    $("#modalMaterial").textContent = p.material;
    $("#modalSizes").innerHTML = p.sizes.map((s) => {
      const out = !p.available || p.soldOut.includes(s);
      const sel = s === selectedSize;
      return `<button class="size${sel ? " is-selected" : ""}" data-size="${esc(s)}" ${out ? `disabled aria-label="${esc(s)} esaurita"` : ""} aria-pressed="${sel}">${esc(s)}</button>`;
    }).join("");
    const addBtn = $("#addToCart");
    addBtn.disabled = !p.available;
    addBtn.textContent = p.available ? "Aggiungi al carrello" : "Non disponibile";
    syncHearts(p.id);
  }

  function openProduct(id) {
    const p = productById(id);
    if (!p) return;
    fillProduct(p);
    openDialog(modal);
    setTimeout(() => $(".modal__close", modal).focus({ preventScroll: true }), 50);
  }

  $("#modalSizes").addEventListener("click", (e) => {
    const b = e.target.closest(".size");
    if (!b || b.disabled) return;
    $$(".size", modal).forEach((x) => { x.classList.remove("is-selected"); x.setAttribute("aria-pressed", "false"); });
    b.classList.add("is-selected");
    b.setAttribute("aria-pressed", "true");
    selectedSize = b.dataset.size;
  });

  modalHeart.addEventListener("click", () => currentProduct && toggleWishlist(currentProduct.id, modalHeart));

  $("#addToCart").addEventListener("click", () => {
    if (!currentProduct || !currentProduct.available) return;
    if (!selectedSize) {
      sizesWrap.classList.remove("shake");
      void sizesWrap.offsetWidth;
      sizesWrap.classList.add("shake");
      showToast("Seleziona una taglia");
      return;
    }
    const row = cart.find((r) => r.id === currentProduct.id && r.size === selectedSize);
    if (row) row.qty += 1;
    else cart.push({ id: currentProduct.id, size: selectedSize, qty: 1 });
    saveCart();
    updateBadge(cartCount, cartQty(), true);
    closeDialog(modal);
    openDrawer("cart");
  });

  $$("[data-close]", modal).forEach((el) => el.addEventListener("click", () => closeDialog(modal)));

  /* ---------- Pannelli laterali: carrello e wishlist ---------- */
  const drawers = { cart: $("#cartDrawer"), wishlist: $("#wishlistDrawer") };
  let drawerReturnFocus = null;

  const lineMedia = (p) =>
    `<img class="line__img" src="${esc(sized(p.image, 240))}" alt="${esc(p.alt)}" data-open="${esc(p.id)}" loading="lazy">`;

  function renderCart(animate) {
    const list = $("#cartList");
    list.innerHTML = validCart().map((r, i) => {
      const p = productById(r.id);
      return `
      <li class="line${animate ? " line--enter" : ""}" style="--i:${i}" data-id="${esc(r.id)}" data-size="${esc(r.size)}">
        ${lineMedia(p)}
        <div class="line__info">
          <p class="line__cat">${esc(p.catLabel)}</p>
          <h4 class="line__name">${esc(p.name)}</h4>
          <p class="line__meta">Taglia: ${esc(r.size)} · ${euro(p.price)}</p>
          <div class="line__row">
            <div class="qty" aria-label="Quantità">
              <button data-qty="-1" aria-label="Diminuisci quantità di ${esc(p.name)}"${r.qty <= 1 ? " disabled" : ""}>&minus;</button>
              <span>${r.qty}</span>
              <button data-qty="1" aria-label="Aumenta quantità di ${esc(p.name)}">+</button>
            </div>
            <span class="line__price">${euro(p.price * r.qty)}</span>
          </div>
        </div>
        <button class="line__remove" data-remove aria-label="Rimuovi ${esc(p.name)} dal carrello">&times;</button>
      </li>`;
    }).join("");
    updateCartSummary();
  }

  function updateCartSummary() {
    const qty = cartQty();
    $("#cartDrawerCount").textContent = qty ? `(${qty})` : "";
    $("#cartSubtotal").textContent = euro(cartTotal());
    $("#cartTotal").textContent = euro(cartTotal());
    $("#cartEmpty").hidden = qty > 0;
    $("#cartFoot").hidden = qty === 0;
    updateBadge(cartCount, qty);
  }

  function renderWishlist(animate) {
    const items = validWish().map(productById);
    $("#wishlistList").innerHTML = items.map((p, i) => `
      <li class="line${animate ? " line--enter" : ""}" style="--i:${i}" data-id="${esc(p.id)}">
        ${lineMedia(p)}
        <div class="line__info">
          <p class="line__cat">${esc(p.catLabel)}</p>
          <h4 class="line__name">${esc(p.name)}</h4>
          <div class="line__row">
            <span class="line__price">${euro(p.price)}</span>
            <button class="line__link" data-open="${esc(p.id)}">${p.available ? "Scegli la taglia" : "Esaurito"}</button>
          </div>
        </div>
        <button class="line__remove" data-remove aria-label="Rimuovi ${esc(p.name)} dalla wishlist">&times;</button>
      </li>`).join("");
    updateWishlistSummary();
  }

  function updateWishlistSummary() {
    const ids = validWish();
    const n = ids.length;
    const total = ids.reduce((s, id) => s + productById(id).price, 0);
    $("#wishlistDrawerCount").textContent = n ? `(${n})` : "";
    $("#wishlistTotal").textContent = euro(total);
    $("#wishlistEmpty").hidden = n > 0;
    $("#wishlistFoot").hidden = n === 0;
  }

  function openDrawer(name) {
    const other = name === "cart" ? "wishlist" : "cart";
    if (drawers[other].classList.contains("is-open")) closeDrawer(other, false);
    const d = drawers[name];
    if (d.classList.contains("is-open")) return;
    if (!Object.values(drawers).some((x) => x.contains(document.activeElement))) {
      drawerReturnFocus = document.activeElement;
    }
    setMenu(false);
    if (name === "cart") renderCart(true); else renderWishlist(true);
    $("#checkoutNote").classList.remove("is-highlight");
    $("#checkoutNote").textContent = "IVA inclusa · Reso gratuito entro 30 giorni";
    d.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("is-open")));
    setTimeout(() => $(".drawer__close", d).focus({ preventScroll: true }), 80);
  }

  function closeDrawer(name, restoreFocus = true) {
    const d = drawers[name];
    d.classList.remove("is-open");
    syncScrollLock();
    setTimeout(() => { if (!d.classList.contains("is-open")) d.hidden = true; }, 750);
    if (restoreFocus && drawerReturnFocus) drawerReturnFocus.focus({ preventScroll: true });
  }

  const openDrawerName = () => Object.keys(drawers).find((k) => drawers[k].classList.contains("is-open"));

  // Rimozione con dissolvenza e chiusura morbida della riga
  function removeLine(li, done) {
    li.style.height = li.offsetHeight + "px";
    void li.offsetHeight;
    li.classList.add("is-leaving");
    li.style.height = "0px";
    setTimeout(() => { li.remove(); done(); }, 600);
  }

  Object.entries(drawers).forEach(([name, d]) => {
    d.addEventListener("click", (e) => {
      if (e.target.closest("[data-drawer-close]")) {
        closeDrawer(name, !e.target.closest("a"));
        return;
      }
      const li = e.target.closest(".line");
      if (!li || li.classList.contains("is-leaving")) return;
      const id = li.dataset.id;

      if (e.target.closest("[data-remove]")) {
        if (name === "cart") {
          cart = cart.filter((r) => !(r.id === id && r.size === li.dataset.size));
          saveCart();
          removeLine(li, updateCartSummary);
        } else {
          wishlist.delete(id);
          store.set("ml-wishlist", Array.from(wishlist));
          syncHearts(id);
          updateBadge(wishlistCount, validWish().length);
          removeLine(li, updateWishlistSummary);
        }
        return;
      }

      const qtyBtn = e.target.closest("[data-qty]");
      if (qtyBtn && name === "cart") {
        const row = cart.find((r) => r.id === id && r.size === li.dataset.size);
        row.qty = Math.max(1, row.qty + Number(qtyBtn.dataset.qty));
        saveCart();
        const p = productById(id);
        if (!p) return;
        $(".qty span", li).textContent = row.qty;
        $('[data-qty="-1"]', li).disabled = row.qty <= 1;
        $(".line__price", li).textContent = euro(p.price * row.qty);
        updateCartSummary();
        return;
      }

      const opener = e.target.closest("[data-open]");
      if (opener) {
        closeDrawer(name, false);
        setTimeout(() => openProduct(opener.dataset.open), 300);
      }
    });
  });

  $("#checkoutBtn").addEventListener("click", () => {
    const note = $("#checkoutNote");
    note.textContent = "Sito dimostrativo: nessun pagamento viene effettuato.";
    note.classList.add("is-highlight");
  });

  /* ---------- Galleria + Lightbox ---------- */
  const galleryEl = $("#gallery");
  galleryEl.innerHTML = galleryItems.map((g, i) => `
    <button class="gallery__item reveal" data-index="${i}" data-caption="${g.caption}" aria-label="Apri immagine: ${g.caption}">
      <img src="${img(g.photo, 800)}" alt="${g.alt}" loading="lazy">
    </button>`).join("");

  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCaption = $("#lbCaption");
  let lbIndex = 0;

  function showLb(i, animate) {
    lbIndex = (i + galleryItems.length) % galleryItems.length;
    const g = galleryItems[lbIndex];
    const apply = () => {
      lbImg.src = img(g.photo, 1600);
      lbImg.alt = g.alt;
      lbCaption.textContent = g.caption;
    };
    if (!animate) { apply(); return; }
    lbImg.classList.add("is-changing");
    setTimeout(() => {
      apply();
      lbImg.onload = () => lbImg.classList.remove("is-changing");
      if (lbImg.complete) lbImg.classList.remove("is-changing");
    }, 300);
  }

  galleryEl.addEventListener("click", (e) => {
    const item = e.target.closest(".gallery__item");
    if (!item) return;
    showLb(Number(item.dataset.index), false);
    openDialog(lightbox);
  });
  $("#lbPrev").addEventListener("click", () => showLb(lbIndex - 1, true));
  $("#lbNext").addEventListener("click", () => showLb(lbIndex + 1, true));
  $("[data-lb-close]").addEventListener("click", () => closeDialog(lightbox));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeDialog(lightbox); });

  let touchX = null;
  lightbox.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1), true);
    touchX = null;
  });

  document.addEventListener("keydown", (e) => {
    const openName = openDrawerName();
    if (openName) {
      if (e.key === "Escape") closeDrawer(openName);
    } else if (!lightbox.hidden && lightbox.classList.contains("is-open")) {
      if (e.key === "Escape") closeDialog(lightbox);
      if (e.key === "ArrowRight") showLb(lbIndex + 1, true);
      if (e.key === "ArrowLeft") showLb(lbIndex - 1, true);
    } else if (!modal.hidden && e.key === "Escape") {
      closeDialog(modal);
    } else if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
    }
  });

  /* ---------- Video sfilata ---------- */
  // Il video si carica solo quando la sezione si avvicina, in versione verticale
  // leggera su smartphone. Con "risparmio dati" o movimento ridotto resta l'immagine statica.
  const video = $("#visionVideo");
  const videoToggle = $("#visionToggle");
  const mobileVideo = window.matchMedia("(max-width: 640px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  let videoPausedByUser = false;

  const videoSrc = () => (mobileVideo.matches ? video.dataset.srcMobile : video.dataset.srcDesktop);

  function playVideo() {
    const p = video.play();
    if (p && p.catch) p.catch(() => { /* autoplay bloccato: resta l'immagine statica */ });
  }

  function loadVideo() {
    video.src = videoSrc();
    video.load();
    playVideo();
  }

  if (video && !reduceMotion && !saveData) {
    video.addEventListener("playing", () => {
      video.classList.add("is-playing");
      videoToggle.hidden = false;
    });

    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!video.getAttribute("src")) loadVideo();
          else if (!videoPausedByUser) playVideo();
        } else if (video.getAttribute("src")) {
          video.pause();
        }
      });
    }, { rootMargin: "300px 0px" });
    videoObserver.observe(video.closest(".vision"));

    mobileVideo.addEventListener("change", () => {
      if (video.getAttribute("src")) {
        video.classList.remove("is-playing");
        loadVideo();
      }
    });

    videoToggle.addEventListener("click", () => {
      videoPausedByUser = !video.paused;
      if (videoPausedByUser) video.pause(); else playVideo();
      videoToggle.classList.toggle("is-paused", videoPausedByUser);
      videoToggle.setAttribute("aria-label", videoPausedByUser ? "Riproduci il video" : "Metti in pausa il video");
    });
  }

  /* ---------- Recensioni ---------- */
  const star = (on) => `<svg viewBox="0 0 24 24" class="${on ? "" : "is-empty"}" aria-hidden="true"><path d="M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 17l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z"/></svg>`;
  $("#reviews").innerHTML = reviewsData.map((r) => `
    <article class="review reveal">
      <div class="stars" role="img" aria-label="${r.stars} stelle su 5">${[1, 2, 3, 4, 5].map((n) => star(n <= r.stars)).join("")}</div>
      <p class="review__text">${r.text}</p>
      <div class="review__author">
        <span class="review__avatar" aria-hidden="true">${r.name.charAt(0)}</span>
        <div><p class="review__name">${r.name}</p><p class="review__meta">${r.meta}</p></div>
      </div>
    </article>`).join("");

  /* ---------- Newsletter ---------- */
  const form = $("#newsletterForm");
  const msg = $("#newsletterMsg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    msg.classList.remove("is-error", "is-ok");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      msg.textContent = "Inserisci un indirizzo email valido.";
      msg.classList.add("is-error");
      return;
    }
    msg.textContent = "Grazie. Benvenuta nel mondo Maison Lumière.";
    msg.classList.add("is-ok");
    form.reset();
  });

  /* ---------- Scroll reveal ---------- */
  // Ritardo sfalsato per gli elementi che condividono lo stesso contenitore
  $$(".products, .gallery__grid, .reviews__grid").forEach((grid) => {
    $$(".reveal", grid).forEach((el, i) => el.style.setProperty("--delay", (i % 4) * 0.12 + "s"));
  });
  $$(".about__text, .contact__info, .vision__content").forEach((wrap) => {
    $$(".reveal", wrap).forEach((el, i) => el.style.setProperty("--delay", i * 0.1 + "s"));
  });

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => revealObserver.observe(el));

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Aggiornamento prodotti dal database ---------- */
  function setProducts(list) {
    products = sortProducts(list.map(normalizeProduct));
    productsLoaded = true;
    clearTimeout(fallbackTimer);
    renderProducts();
    refreshBadges();
    wishlist.forEach((id) => syncHearts(id));
    // Aggiorna gli elementi già aperti senza chiuderli
    if (drawers.cart.classList.contains("is-open")) renderCart(false);
    if (drawers.wishlist.classList.contains("is-open")) renderWishlist(false);
    if (currentProduct && !modal.hidden) {
      const fresh = productById(currentProduct.id);
      if (fresh) fillProduct(fresh); else closeDialog(modal);
    }
  }
  const useFallbackProducts = () => { if (!productsLoaded) setProducts(DEFAULT_PRODUCTS); };

  // Se il database non risponde entro pochi secondi, mostra i prodotti di esempio
  const fallbackTimer = liveMode ? setTimeout(useFallbackProducts, 8000) : null;

  window.MaisonLumiere = { setProducts, useFallbackProducts };
})();
