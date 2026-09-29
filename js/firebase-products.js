/* ==========================================================
   Maison Lumière — prodotti in tempo reale da Firestore
   Legge la collezione "products" e aggiorna il sito ad ogni
   modifica fatta dal pannello admin, senza ricaricare la pagina.
   ========================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const site = window.MaisonLumiere;

if (window.MAISON_FIREBASE_READY && site) {
  try {
    const app = initializeApp(window.MAISON_FIREBASE_CONFIG);
    const db = getFirestore(app);
    onSnapshot(
      collection(db, "products"),
      (snap) => site.setProducts(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => {
        console.warn("Firestore non raggiungibile, uso i prodotti di esempio.", err);
        site.useFallbackProducts();
      }
    );
  } catch (err) {
    console.warn("Configurazione Firebase non valida, uso i prodotti di esempio.", err);
    site.useFallbackProducts();
  }
}
