/* ==========================================================
   Maison Lumière — configurazione Firebase
   ----------------------------------------------------------
   Incolla qui i valori che trovi nella console Firebase:
   Impostazioni progetto (icona ingranaggio) → Generali →
   "Le tue app" → la tua app web → "Configurazione SDK" → Config.
   Vedi GUIDA-FIREBASE.md per tutti i passaggi.

   Queste chiavi NON sono segrete: identificano il progetto.
   La protezione dei dati è data dalle regole di Firestore
   (file firestore.rules) e dal login del pannello admin.
   ========================================================== */
window.MAISON_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCrvrsVc7_yg-nU88xlw7DgIkGXxFOkpKA",
  authDomain: "maison-lumiere-admin.firebaseapp.com",
  projectId: "maison-lumiere-admin",
  storageBucket: "maison-lumiere-admin.firebasestorage.app",
  messagingSenderId: "653736630740",
  appId: "1:653736630740:web:d4e7e6fc1efcd323e51e41",
  measurementId: "G-WVBVTRT132"
};

/* Email del proprietario autorizzato ad accedere al pannello /admin.
   (La sicurezza vera è nelle regole di Firestore: questo controllo
   serve solo a mostrare subito un messaggio chiaro agli altri account.) */
window.MAISON_ADMIN_EMAILS = [
  "carestia.davide2004@gmail.com"
];

/* true quando la configurazione qui sopra è stata compilata */
window.MAISON_FIREBASE_READY = !/^INSERISCI/.test(window.MAISON_FIREBASE_CONFIG.apiKey || "INSERISCI");
