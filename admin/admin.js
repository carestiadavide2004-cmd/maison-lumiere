/* ==========================================================
   Maison Lumière — pannello di amministrazione
   Firebase Authentication (email e password) + Firestore
   ========================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore, collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const CATEGORY_LABELS = { abiti: "Abiti", capispalla: "Capispalla", camicie: "Camicie & Maglie", accessori: "Accessori" };
const ADMIN_EMAILS = (window.MAISON_ADMIN_EMAILS || []).map((e) => e.trim().toLowerCase()).filter(Boolean);

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const toList = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim()).filter(Boolean);
const euro = (n) => {
  const [int, dec] = (Number(n) || 0).toFixed(2).split(".");
  return "€ " + int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (dec === "00" ? "" : "," + dec);
};
const thumb = (url) => (/^https:\/\/images\.unsplash\.com\//.test(url || "") ? url.replace(/([?&])w=\d+/, "$1w=160") : url || "");

/* ---------- Viste ---------- */
const views = { loading: $("#viewLoading"), setup: $("#viewSetup"), login: $("#viewLogin"), app: $("#viewApp") };
function showView(name) {
  Object.entries(views).forEach(([k, el]) => { el.hidden = k !== name; });
}

/* ---------- Toast ---------- */
const toast = $("#toast");
let toastTimer;
function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), isError ? 5000 : 3000);
}

function friendlyError(err) {
  const code = (err && err.code) || "";
  const map = {
    "auth/invalid-credential": "Email o password non corretti.",
    "auth/wrong-password": "Email o password non corretti.",
    "auth/user-not-found": "Email o password non corretti.",
    "auth/invalid-email": "L'indirizzo email non è valido.",
    "auth/missing-password": "Inserisci la password.",
    "auth/too-many-requests": "Troppi tentativi. Riprova tra qualche minuto.",
    "auth/user-disabled": "Questo account è stato disattivato.",
    "auth/network-request-failed": "Connessione assente. Controlla la rete e riprova.",
    "auth/unauthorized-domain": "Dominio non autorizzato: aggiungilo in Firebase → Authentication → Impostazioni → Domini autorizzati.",
    "auth/operation-not-allowed": "L'accesso con email e password non è attivo in Firebase Authentication.",
    "permission-denied": "Permesso negato. Controlla che le regole di Firestore contengano il tuo UID.",
    "unavailable": "Database non raggiungibile. Controlla la connessione.",
    "not-found": "Il prodotto non esiste più."
  };
  return map[code] || "Si è verificato un errore" + (code ? ` (${code})` : "") + ".";
}

/* ---------- Avvio ---------- */
if (!window.MAISON_FIREBASE_READY) {
  showView("setup");
} else {
  start();
}

function start() {
  let app;
  try {
    app = initializeApp(window.MAISON_FIREBASE_CONFIG);
  } catch (err) {
    console.error(err);
    showView("setup");
    return;
  }
  const auth = getAuth(app);
  const db = getFirestore(app);
  const productsCol = collection(db, "products");

  let products = [];
  let unsubscribeProducts = null;
  let editingId = null;

  /* ---------- Autenticazione ---------- */
  const loginForm = $("#loginForm");
  const loginMsg = $("#loginMsg");
  const loginSubmit = $("#loginSubmit");
  const emailInput = $("#loginEmail");
  const passwordInput = $("#loginPassword");

  onAuthStateChanged(auth, (user) => {
    if (unsubscribeProducts) { unsubscribeProducts(); unsubscribeProducts = null; }
    if (!user) {
      showView("login");
      return;
    }
    if (ADMIN_EMAILS.length && !ADMIN_EMAILS.includes((user.email || "").toLowerCase())) {
      signOut(auth);
      loginMsg.classList.remove("is-ok");
      loginMsg.textContent = "Questo account non è autorizzato ad accedere al pannello.";
      return;
    }
    $("#userEmail").textContent = user.email;
    showView("app");
    listenProducts();
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginMsg.classList.remove("is-ok");
    loginMsg.textContent = "";
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      loginMsg.textContent = "Inserisci email e password.";
      return;
    }
    loginSubmit.disabled = true;
    loginSubmit.textContent = "Accesso in corso…";
    try {
      await signInWithEmailAndPassword(auth, email, password);
      passwordInput.value = "";
    } catch (err) {
      loginMsg.textContent = friendlyError(err);
    } finally {
      loginSubmit.disabled = false;
      loginSubmit.textContent = "Accedi";
    }
  });

  $("#togglePassword").addEventListener("click", (e) => {
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    e.currentTarget.textContent = show ? "Nascondi" : "Mostra";
    e.currentTarget.setAttribute("aria-label", show ? "Nascondi password" : "Mostra password");
  });

  $("#forgotPassword").addEventListener("click", async () => {
    const email = emailInput.value.trim();
    loginMsg.classList.remove("is-ok");
    if (!email) {
      loginMsg.textContent = "Scrivi la tua email qui sopra, poi premi di nuovo \"Password dimenticata?\".";
      emailInput.focus();
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      if (err.code === "auth/invalid-email" || err.code === "auth/network-request-failed") {
        loginMsg.textContent = friendlyError(err);
        return;
      }
    }
    // Stesso messaggio in ogni caso, per non rivelare quali email sono registrate
    loginMsg.classList.add("is-ok");
    loginMsg.textContent = "Se l'indirizzo è registrato, riceverai un'email per reimpostare la password.";
  });

  $("#logoutBtn").addEventListener("click", () => signOut(auth));

  /* ---------- Prodotti in tempo reale ---------- */
  function listenProducts() {
    unsubscribeProducts = onSnapshot(productsCol, (snap) => {
      products = snap.docs.map((d) => ({ ...d.data(), id: d.id }))
        .sort((a, b) => ((Number(a.order) || 0) - (Number(b.order) || 0)) || String(a.name).localeCompare(String(b.name), "it"));
      renderStats();
      renderRows();
    }, (err) => {
      console.error(err);
      showToast(friendlyError(err), true);
    });
  }

  function renderStats() {
    const available = products.filter((p) => p.available !== false);
    $("#statTotal").textContent = products.length;
    $("#statAvailable").textContent = available.length;
    $("#statOut").textContent = products.length - available.length;
    $("#statValue").textContent = euro(available.reduce((s, p) => s + (Number(p.price) || 0), 0));
  }

  const searchInput = $("#searchInput");
  const categoryFilter = $("#categoryFilter");
  const availabilityFilter = $("#availabilityFilter");
  [searchInput, categoryFilter, availabilityFilter].forEach((el) => el.addEventListener("input", renderRows));

  const editIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>';
  const trashIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg>';

  function renderRows() {
    const q = searchInput.value.trim().toLowerCase();
    const cat = categoryFilter.value;
    const av = availabilityFilter.value;
    const list = products.filter((p) =>
      (!q || String(p.name || "").toLowerCase().includes(q)) &&
      (!cat || p.category === cat) &&
      (!av || (av === "yes") === (p.available !== false)));

    $("#emptyState").hidden = products.length > 0;
    $(".table").hidden = products.length === 0;
    $("#noResults").hidden = products.length === 0 || list.length > 0;

    $("#productRows").innerHTML = list.map((p, i) => {
      const available = p.available !== false;
      return `
      <div class="row${available ? "" : " is-out"}" role="row" data-id="${esc(p.id)}" style="animation-delay:${Math.min(i, 12) * 30}ms">
        <div class="row__product" role="cell">
          <img class="row__thumb" src="${esc(thumb(p.image))}" alt="" loading="lazy">
          <div>
            <p class="row__name">${esc(p.name)}${p.tag ? `<span class="chip">${esc(p.tag)}</span>` : ""}</p>
            <p class="row__meta">${esc(toList(p.sizes).join(" · ") || "Taglia unica")}</p>
          </div>
        </div>
        <span class="row__cat" role="cell">${esc(p.label || CATEGORY_LABELS[p.category] || "—")}</span>
        <span class="row__price" role="cell">${euro(p.price)}</span>
        <span class="row__avail" role="cell">
          <label class="switch">
            <input type="checkbox" data-toggle ${available ? "checked" : ""} aria-label="Disponibilità di ${esc(p.name)}">
            <span class="switch__track" aria-hidden="true"></span>
            <span class="row__mobile-label">${available ? "Disponibile" : "Esaurito"}</span>
          </label>
        </span>
        <span class="row__actions" role="cell">
          <button class="icon-btn" data-edit aria-label="Modifica ${esc(p.name)}" title="Modifica">${editIcon}</button>
          <button class="icon-btn icon-btn--danger" data-delete aria-label="Elimina ${esc(p.name)}" title="Elimina">${trashIcon}</button>
        </span>
      </div>`;
    }).join("");
  }

  $("#productRows").addEventListener("click", (e) => {
    const row = e.target.closest(".row");
    if (!row) return;
    const product = products.find((p) => p.id === row.dataset.id);
    if (!product) return;
    if (e.target.closest("[data-edit]")) openForm(product);
    else if (e.target.closest("[data-delete]")) askDelete(product);
  });

  // Cambio rapido di disponibilità direttamente dall'elenco
  $("#productRows").addEventListener("change", async (e) => {
    if (!e.target.matches("[data-toggle]")) return;
    const row = e.target.closest(".row");
    const available = e.target.checked;
    row.classList.add("is-busy");
    try {
      await updateDoc(doc(db, "products", row.dataset.id), { available, updatedAt: serverTimestamp() });
      showToast(available ? "Prodotto di nuovo disponibile" : "Prodotto segnato come esaurito");
    } catch (err) {
      e.target.checked = !available;
      showToast(friendlyError(err), true);
    } finally {
      row.classList.remove("is-busy");
    }
  });

  /* ---------- Importazione prodotti di esempio ---------- */
  $("#seedBtn").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const defaults = window.MAISON_DEFAULT_PRODUCTS || [];
    btn.disabled = true;
    btn.textContent = "Importazione…";
    try {
      const batch = writeBatch(db);
      defaults.forEach(({ id, ...data }) => {
        batch.set(doc(db, "products", String(id)), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });
      await batch.commit();
      showToast(`${defaults.length} prodotti importati`);
    } catch (err) {
      showToast(friendlyError(err), true);
    } finally {
      btn.disabled = false;
      btn.textContent = "Importa prodotti di esempio";
    }
  });

  /* ---------- Form prodotto ---------- */
  const drawer = $("#formDrawer");
  const form = $("#productForm");
  const F = form.elements; // campi del form (form.name sarebbe il nome del form stesso)
  const formMsg = $("#formMsg");
  const saveBtn = $("#saveBtn");
  const preview = $("#imagePreview");
  const previewImg = $("#imagePreviewImg");
  const previewText = $("#imagePreviewText");
  let returnFocus = null;

  function updatePreview() {
    const url = F.image.value.trim();
    preview.classList.remove("has-image", "is-error");
    if (!/^https?:\/\//i.test(url)) {
      previewImg.removeAttribute("src");
      previewText.textContent = url ? "L'indirizzo deve iniziare con https://" : "Anteprima immagine";
      if (url) preview.classList.add("is-error");
      return;
    }
    previewText.textContent = "Caricamento anteprima…";
    previewImg.src = url;
  }
  previewImg.addEventListener("load", () => preview.classList.add("has-image"));
  previewImg.addEventListener("error", () => {
    if (!previewImg.getAttribute("src")) return;
    preview.classList.add("is-error");
    previewText.textContent = "Immagine non trovata: controlla l'indirizzo";
  });
  F.image.addEventListener("input", updatePreview);
  form.addEventListener("input", (e) => e.target.classList.remove("is-invalid"));

  function openForm(product) {
    editingId = product ? product.id : null;
    returnFocus = document.activeElement;
    form.reset();
    formMsg.textContent = "";
    $$(".is-invalid", form).forEach((el) => el.classList.remove("is-invalid"));
    $("#formEyebrow").textContent = product ? "Modifica" : "Nuovo capo";
    $("#formTitle").textContent = product ? product.name : "Aggiungi prodotto";
    saveBtn.textContent = product ? "Salva modifiche" : "Aggiungi prodotto";

    const p = product || {};
    F.image.value = p.image || "";
    F.name.value = p.name || "";
    F.price.value = p.price != null ? p.price : "";
    F.category.value = p.category || "abiti";
    F.available.checked = p.available !== false;
    F.tag.value = p.tag || "";
    F.label.value = p.label || "";
    F.description.value = p.description || "";
    F.material.value = p.material || "";
    F.sizes.value = toList(p.sizes).join(", ");
    F.soldOutSizes.value = toList(p.soldOutSizes).join(", ");
    F.alt.value = p.alt || "";
    F.order.value = product ? (p.order != null ? p.order : "") :
      products.reduce((m, x) => Math.max(m, Number(x.order) || 0), 0) + 1;
    $(".more", form).open = !!product;
    updatePreview();

    drawer.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add("is-open")));
    setTimeout(() => (product ? F.name : F.image).focus({ preventScroll: true }), 350);
  }

  function closeForm() {
    drawer.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    setTimeout(() => { if (!drawer.classList.contains("is-open")) drawer.hidden = true; }, 700);
    if (returnFocus) returnFocus.focus({ preventScroll: true });
  }

  $("#newProductBtn").addEventListener("click", () => openForm(null));
  $("#emptyNewBtn").addEventListener("click", () => openForm(null));
  $$("[data-close-form]").forEach((el) => el.addEventListener("click", closeForm));

  function readForm() {
    const errors = [];
    const mark = (el, bad) => el.classList.toggle("is-invalid", bad);
    const name = F.name.value.trim();
    const price = Number(String(F.price.value).replace(",", "."));
    const image = F.image.value.trim();

    mark(F.name, !name);
    if (!name) errors.push("il nome");
    const badPrice = F.price.value === "" || !isFinite(price) || price < 0;
    mark(F.price, badPrice);
    if (badPrice) errors.push("un prezzo valido");
    const badImage = !/^https?:\/\/\S+$/i.test(image);
    mark(F.image, badImage);
    if (badImage) errors.push("l'indirizzo dell'immagine (https://…)");

    if (errors.length) return { errors };

    const sizes = toList(F.sizes.value);
    return {
      data: {
        name,
        price: Math.round(price * 100) / 100,
        category: F.category.value,
        label: F.label.value.trim(),
        image,
        alt: F.alt.value.trim() || name,
        available: F.available.checked,
        tag: F.tag.value.trim(),
        description: F.description.value.trim(),
        material: F.material.value.trim(),
        sizes: sizes.length ? sizes : ["Unica"],
        soldOutSizes: toList(F.soldOutSizes.value),
        order: Number(F.order.value) || 0,
        updatedAt: serverTimestamp()
      }
    };
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { data, errors } = readForm();
    if (errors) {
      formMsg.classList.remove("is-ok");
      formMsg.textContent = "Inserisci " + errors.join(", ") + ".";
      return;
    }
    saveBtn.disabled = true;
    const label = saveBtn.textContent;
    saveBtn.textContent = "Salvataggio…";
    try {
      if (editingId) {
        await setDoc(doc(db, "products", editingId), data, { merge: true });
        showToast(`"${data.name}" aggiornato`);
      } else {
        await addDoc(productsCol, { ...data, createdAt: serverTimestamp() });
        showToast(`"${data.name}" aggiunto alla collezione`);
      }
      closeForm();
    } catch (err) {
      formMsg.textContent = friendlyError(err);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = label;
    }
  });

  /* ---------- Eliminazione ---------- */
  const confirmDialog = $("#confirmDialog");
  let deleting = null;

  function askDelete(product) {
    deleting = product;
    returnFocus = document.activeElement;
    $("#confirmText").textContent = `"${product.name}" verrà rimosso dal sito. L'operazione non può essere annullata.`;
    confirmDialog.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => confirmDialog.classList.add("is-open")));
    setTimeout(() => $("[data-cancel].btn", confirmDialog).focus(), 50);
  }
  function closeConfirm() {
    confirmDialog.classList.remove("is-open");
    setTimeout(() => { if (!confirmDialog.classList.contains("is-open")) confirmDialog.hidden = true; }, 450);
    deleting = null;
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
  }
  $$("[data-cancel]", confirmDialog).forEach((el) => el.addEventListener("click", closeConfirm));

  $("#confirmDelete").addEventListener("click", async (e) => {
    if (!deleting) return;
    const btn = e.currentTarget;
    const product = deleting;
    btn.disabled = true;
    try {
      await deleteDoc(doc(db, "products", product.id));
      showToast(`"${product.name}" eliminato`);
      closeConfirm();
    } catch (err) {
      showToast(friendlyError(err), true);
    } finally {
      btn.disabled = false;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!confirmDialog.hidden) closeConfirm();
    else if (!drawer.hidden) closeForm();
  });
}
