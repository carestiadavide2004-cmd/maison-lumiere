# Maison Lumière — Configurazione di Firebase

Questa guida collega il sito a Firebase: il login del pannello `/admin` e il database dei prodotti.
Tempo richiesto: circa 15 minuti. Il piano gratuito di Firebase (Spark) è più che sufficiente.

---

## 1. Crea il progetto Firebase

1. Vai su **https://console.firebase.google.com** e accedi con il tuo account Google.
2. Clicca **Crea un progetto** (o "Aggiungi progetto").
3. Nome: ad esempio `maison-lumiere`. Continua.
4. Google Analytics non serve: puoi disattivarlo. Clicca **Crea progetto**.

## 2. Registra l'app web e copia le chiavi

1. Nella pagina iniziale del progetto clicca l'icona **`</>`** (Web).
2. Nickname dell'app: `Sito Maison Lumière`. Non serve spuntare Hosting ora. Clicca **Registra app**.
3. Firebase mostra un blocco di codice con `const firebaseConfig = { ... }`.
   **Copia solo i valori** tra le graffe.
4. Apri il file **`js/firebase-config.js`** del sito e sostituisci i valori `INSERISCI_...`:

```js
window.MAISON_FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "maison-lumiere.firebaseapp.com",
  projectId: "maison-lumiere",
  storageBucket: "maison-lumiere.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123..."
};
```

> **Dove ritrovarle in seguito:** icona ingranaggio ⚙️ in alto a sinistra → **Impostazioni progetto** →
> scheda **Generali** → sezione **Le tue app** → la tua app web → **Configurazione SDK** → opzione **Config**.

> Queste chiavi **non sono segrete**: identificano il progetto e sono visibili a chiunque apra il sito.
> I dati sono protetti dalle regole di Firestore (passaggio 4).

## 3. Attiva il login con email e password

1. Menu a sinistra: **Build → Authentication** → **Inizia**.
2. Scheda **Metodo di accesso** (Sign-in method) → **Email/password** → attiva il primo interruttore
   (non serve "Link via email") → **Salva**.
3. Scheda **Utenti** (Users) → **Aggiungi utente**: inserisci l'email e una password robusta del proprietario.
4. Nella lista utenti, copia il valore della colonna **UID utente** (una stringa tipo `Xy7Ab...`): serve al passaggio 4.
5. Consigliato: **Impostazioni** (Settings) → **Azioni utente** (User actions) → togli la spunta a
   **Abilita creazione (registrazione)**, così nessun altro può creare account.
6. Sempre in **Impostazioni → Domini autorizzati**: `localhost` è già presente. Quando pubblichi il sito,
   aggiungi qui il tuo dominio (es. `www.maisonlumiere.it`). Se usi Firebase Hosting, i domini
   `*.web.app` e `*.firebaseapp.com` sono già inclusi.
7. Apri **`js/firebase-config.js`** e metti la stessa email in `MAISON_ADMIN_EMAILS`:

```js
window.MAISON_ADMIN_EMAILS = [
  "tua-email@esempio.it"
];
```

## 4. Crea il database Firestore e proteggilo

1. Menu a sinistra: **Build → Firestore Database** → **Crea database**.
2. Edizione **Standard**, ID database `(default)`.
3. Posizione: scegli una località europea, es. **eur3 (Europa)** o **europe-west8 (Milano)**.
   ⚠️ Non si può cambiare in seguito.
4. Scegli **Avvia in modalità produzione** → **Crea**.
5. Apri la scheda **Regole**, cancella tutto e incolla il contenuto del file **`firestore.rules`** del sito.
6. Nel testo incollato sostituisci `INSERISCI_UID_PROPRIETARIO` con l'UID copiato al passaggio 3.
7. Clicca **Pubblica**.

Con queste regole:
- chiunque può **leggere** i prodotti (servono al sito pubblico);
- solo il proprietario loggato può **aggiungere, modificare o eliminare**;
- tutto il resto del database è chiuso.

## 5. Prova in locale

Firebase funziona solo se il sito è aperto tramite un indirizzo `http://`, non con doppio clic sul file.

1. Apri il **Terminale** nella cartella del sito ed esegui:

```bash
python3 -m http.server 8000
```

2. Apri **http://localhost:8000/admin/** e accedi con email e password del passaggio 3.
3. Il catalogo è vuoto: clicca **Importa prodotti di esempio** per caricare i 12 capi già presenti sul sito.
4. Apri **http://localhost:8000** in un'altra scheda: ogni modifica fatta nel pannello compare sul sito
   in tempo reale, senza ricaricare la pagina.

## 6. Pubblica il sito (Firebase Hosting, gratuito)

Serve [Node.js](https://nodejs.org). Nel Terminale, dalla cartella del sito:

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # scegli il progetto maison-lumiere
firebase deploy
```

Il file `firebase.json` è già pronto: pubblica il sito e le regole di Firestore.
Al termine vedrai l'indirizzo, ad esempio `https://maison-lumiere.web.app`.
Il pannello sarà su `https://maison-lumiere.web.app/admin`.

Puoi usare anche un altro hosting (Netlify, Vercel, il tuo provider): carica tutti i file della cartella
e ricordati di aggiungere il dominio in **Authentication → Impostazioni → Domini autorizzati**.

---

## Come funziona

| File | A cosa serve |
|---|---|
| `js/firebase-config.js` | Le chiavi del progetto e l'email del proprietario (**l'unico file da modificare**) |
| `js/firebase-products.js` | Legge i prodotti da Firestore e aggiorna il sito in tempo reale |
| `js/products-data.js` | I 12 prodotti di esempio: usati per l'importazione iniziale e come riserva se il database non risponde |
| `admin/` | Il pannello di amministrazione (login, elenco, form prodotto) |
| `firestore.rules` | Le regole di sicurezza del database |
| `firebase.json` | La configurazione per pubblicare con Firebase Hosting |

**Campi di ogni prodotto** (collezione `products` in Firestore): nome, prezzo, immagine (URL), categoria,
disponibilità, e facoltativi etichetta, descrizione, materiali, taglie, taglie esaurite,
descrizione immagine e posizione nell'elenco.

**Immagini:** il pannello usa l'indirizzo (URL) di un'immagine già online. Il caricamento diretto di file
richiederebbe Firebase Storage, che per i nuovi progetti è disponibile solo con il piano a consumo (Blaze).

## Problemi comuni

| Messaggio | Soluzione |
|---|---|
| "Collega Firebase" aprendo `/admin` | `js/firebase-config.js` contiene ancora i valori `INSERISCI_...` |
| "Email o password non corretti" | Controlla l'utente in Authentication → Utenti, o usa "Password dimenticata?" |
| "Questo account non è autorizzato" | L'email non è in `MAISON_ADMIN_EMAILS` |
| "Permesso negato" al salvataggio | L'UID in `firestore.rules` non corrisponde al tuo, o le regole non sono state pubblicate |
| "Dominio non autorizzato" | Aggiungi il dominio in Authentication → Impostazioni → Domini autorizzati |
| Il sito mostra i prodotti di esempio e non quelli del database | Il sito è aperto con doppio clic (`file://`): usa `http://localhost:8000` o il sito pubblicato |
