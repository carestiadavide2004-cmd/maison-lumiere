/* ==========================================================
   Maison Lumière — prodotti di esempio
   Usati dal sito se Firebase non è configurato o non risponde,
   e dal pannello admin per popolare il database la prima volta.
   ========================================================== */
window.MAISON_DEFAULT_PRODUCTS = [
  {
    "id": "1",
    "name": "Abito Scarlatto",
    "price": 890,
    "category": "abiti",
    "label": "",
    "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80",
    "alt": "Abito elegante donna lungo rosso in seta",
    "available": true,
    "tag": "Novità",
    "description": "Abito lungo da sera in seta fluida, con gonna a ruota che accompagna ogni movimento. Pensato per le occasioni che meritano di essere ricordate.",
    "material": "100% seta · Fodera in cupro · Realizzato in Italia",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "soldOutSizes": [
      "XL"
    ],
    "order": 1
  },
  {
    "id": "2",
    "name": "Abito Prugna",
    "price": 640,
    "category": "abiti",
    "label": "",
    "image": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80",
    "alt": "Abito elegante donna color prugna con scollo alla Bardot",
    "available": true,
    "tag": "",
    "description": "Silhouette aderente con scollo alla Bardot, in crêpe strutturato dal tono prugna profondo. Eleganza essenziale dal giorno alla sera.",
    "material": "Crêpe di viscosa e seta · Cerniera invisibile",
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "soldOutSizes": [
      "XS"
    ],
    "order": 2
  },
  {
    "id": "3",
    "name": "Trench Cammello",
    "price": 1150,
    "category": "capispalla",
    "label": "",
    "image": "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=900&q=80",
    "alt": "Trench cappotto donna color cammello con cintura",
    "available": true,
    "tag": "",
    "description": "Il trench che non passa mai di moda: taglio morbido, cintura in vita e spalle rilassate. Un classico reinterpretato con leggerezza.",
    "material": "Gabardine di cotone e lana · Bottoni in corno",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "soldOutSizes": [],
    "order": 3
  },
  {
    "id": "4",
    "name": "Cappotto Bordeaux",
    "price": 1290,
    "category": "capispalla",
    "label": "",
    "image": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    "alt": "Cappotto donna in lana color bordeaux con collo alto",
    "available": true,
    "tag": "Iconico",
    "description": "Cappotto in lana double dal colore intenso, con collo avvolgente e linea leggermente oversize. Caldo, leggero, impeccabile.",
    "material": "90% lana vergine, 10% cashmere · Made in Italy",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "soldOutSizes": [],
    "order": 4
  },
  {
    "id": "5",
    "name": "Camicia Chambray",
    "price": 240,
    "category": "camicie",
    "label": "Camicie",
    "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80",
    "alt": "Camicia donna in chambray azzurro con micro motivo",
    "available": true,
    "tag": "",
    "description": "Camicia in chambray leggero con un delicato micro motivo tessuto. Maniche a tre quarti e collo morbido per un'eleganza quotidiana.",
    "material": "100% cotone egiziano · Bottoni in madreperla",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "soldOutSizes": [
      "M"
    ],
    "order": 5
  },
  {
    "id": "6",
    "name": "Mantella in Maglia",
    "price": 380,
    "category": "camicie",
    "label": "Maglieria",
    "image": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
    "alt": "Mantella poncho in maglia avorio con frange",
    "available": true,
    "tag": "",
    "description": "Mantella lavorata a mano con punto aperto e frange sottili. Da portare sulle spalle nelle sere di mezza stagione.",
    "material": "Lana merino e alpaca · Lavorata a mano",
    "sizes": [
      "Taglia unica"
    ],
    "soldOutSizes": [],
    "order": 6
  },
  {
    "id": "7",
    "name": "Borsa Aurora",
    "price": 1480,
    "category": "accessori",
    "label": "",
    "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
    "alt": "Borsa a mano in pelle rossa, accessorio moda di lusso",
    "available": true,
    "tag": "Edizione limitata",
    "description": "Borsa a mano strutturata in vitello liscio, con chiusura metallica lucidata a mano e tracolla removibile. Prodotta in soli 50 esemplari.",
    "material": "Pelle di vitello conciata al vegetale · Interno in suede",
    "sizes": [
      "Unica"
    ],
    "soldOutSizes": [],
    "order": 7
  },
  {
    "id": "8",
    "name": "Giacca Biker Noir",
    "price": 960,
    "category": "capispalla",
    "label": "",
    "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80",
    "alt": "Giacca in pelle nera da donna stile biker",
    "available": true,
    "tag": "",
    "description": "La biker essenziale in nappa morbidissima, con zip asimmetrica e finiture brunite. Carattere deciso, linea pulita.",
    "material": "Pelle d'agnello nappa · Zip in ottone brunito",
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "soldOutSizes": [
      "L"
    ],
    "order": 8
  },
  {
    "id": "9",
    "name": "Décolleté Fiorite",
    "price": 520,
    "category": "accessori",
    "label": "Calzature",
    "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80",
    "alt": "Scarpe décolleté donna con tacco a stiletto e stampa floreale",
    "available": true,
    "tag": "",
    "description": "Décolleté a punta con tacco a stiletto da 10 cm, rivestite in raso stampato a motivo floreale. Suola in cuoio.",
    "material": "Raso di seta · Suola in cuoio · Tacco 10 cm",
    "sizes": [
      "36",
      "37",
      "38",
      "39",
      "40"
    ],
    "soldOutSizes": [
      "36"
    ],
    "order": 9
  },
  {
    "id": "10",
    "name": "Orecchini Notte",
    "price": 310,
    "category": "accessori",
    "label": "Gioielli",
    "image": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80",
    "alt": "Orecchini pendenti eleganti con cristalli e pietra blu",
    "available": true,
    "tag": "",
    "description": "Orecchini pendenti con cristalli incastonati a mano e una pietra centrale blu notte. Luminosi senza essere eccessivi.",
    "material": "Argento 925 placcato rodio · Cristalli",
    "sizes": [
      "Unica"
    ],
    "soldOutSizes": [],
    "order": 10
  },
  {
    "id": "11",
    "name": "Occhiali Riviera",
    "price": 290,
    "category": "accessori",
    "label": "",
    "image": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80",
    "alt": "Occhiali da sole rotondi con montatura dorata",
    "available": true,
    "tag": "",
    "description": "Occhiali da sole con montatura sottile in metallo dorato e lenti verde bottiglia. Un omaggio alle estati sull'Adriatico.",
    "material": "Titanio placcato oro · Lenti minerali UV400",
    "sizes": [
      "Unica"
    ],
    "soldOutSizes": [],
    "order": 11
  },
  {
    "id": "12",
    "name": "Abito Pois Rubino",
    "price": 460,
    "category": "abiti",
    "label": "",
    "image": "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=900&q=80",
    "alt": "Abito donna rosso a pois bianchi con volant",
    "available": true,
    "tag": "",
    "description": "Abito midi a pois con volant sulle spalle e spacco laterale. Femminile e leggero, per pomeriggi d'estate e cerimonie all'aperto.",
    "material": "Georgette di seta · Fodera in cotone",
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "soldOutSizes": [],
    "order": 12
  }
];
