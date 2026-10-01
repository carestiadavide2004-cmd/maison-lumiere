/* ==========================================================
   Maison Lumière — cursore gemma
   Diamante champagne che segue il puntatore con un movimento fluido.
   Attivo solo con mouse/trackpad: su touch resta tutto invariato.
   ========================================================== */
(function () {
  "use strict";

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!finePointer.matches) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  // Elementi cliccabili: il diamante si ingrandisce e il bagliore si intensifica
  const INTERACTIVE = "a[href], button:not(:disabled), [role='button'], [role='tab'], label, select, summary, .card, .gallery__item, .line__img, [data-close], [data-lb-close], [data-drawer-close]";
  // Campi di testo: si torna al cursore nativo per posizionare il caret con precisione
  const TEXT_FIELD = "input:not([type='checkbox']):not([type='radio']):not([type='range']):not([type='submit']):not([type='button']), textarea, [contenteditable='true']";

  const SPARK = '<svg viewBox="0 0 10 10"><path d="M5 0 L5.9 4.1 L10 5 L5.9 5.9 L5 10 L4.1 5.9 L0 5 L4.1 4.1 Z"/></svg>';

  const cursor = document.createElement("div");
  cursor.className = "gem-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML =
    '<div class="gem-cursor__body">' +
      '<span class="gem-cursor__halo"></span>' +
      '<svg class="gem-cursor__gem" viewBox="0 0 24 24">' +
        "<defs>" +
          '<linearGradient id="gemFill" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#fffaf0"/>' +
            '<stop offset="0.45" stop-color="#e6d3b0"/>' +
            '<stop offset="1" stop-color="#b8975f"/>' +
          "</linearGradient>" +
        "</defs>" +
        '<path class="gem-cursor__fill" d="M6.5 4 H17.5 L22 9.5 L12 21 L2 9.5 Z"/>' +
        '<path class="gem-cursor__facets" d="M2 9.5 H22 M6.5 4 L9 9.5 L12 4 L15 9.5 L17.5 4 M9 9.5 L12 21 L15 9.5"/>' +
        '<path class="gem-cursor__edge" d="M6.5 4 H17.5 L22 9.5 L12 21 L2 9.5 Z"/>' +
      "</svg>" +
      '<span class="gem-cursor__spark gem-cursor__spark--a">' + SPARK + "</span>" +
      '<span class="gem-cursor__spark gem-cursor__spark--b">' + SPARK + "</span>" +
    "</div>";

  const dot = document.createElement("div");
  dot.className = "gem-cursor__dot";
  dot.setAttribute("aria-hidden", "true");

  document.body.append(cursor, dot);

  // Posizione reale del puntatore (target) e posizione animata del diamante
  let tx = -100, ty = -100, x = tx, y = ty, tilt = 0;
  let frame = 0, last = 0, visible = false;

  function render(now) {
    const dt = last ? Math.min(now - last, 64) : 16.7;
    last = now;
    // Interpolazione indipendente dal frame rate
    const k = reduceMotion ? 1 : 1 - Math.pow(1 - 0.24, dt / 16.7);
    const dx = tx - x, dy = ty - y;
    x += dx * k;
    y += dy * k;
    // Leggera inclinazione nella direzione del movimento
    const targetTilt = reduceMotion ? 0 : Math.max(-14, Math.min(14, dx * 0.6));
    tilt += (targetTilt - tilt) * Math.min(1, k * 1.2);

    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${tilt.toFixed(2)}deg)`;

    // Si ferma quando il diamante ha raggiunto il puntatore: nessun lavoro a vuoto
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 || Math.abs(tilt) > 0.05) {
      frame = requestAnimationFrame(render);
    } else {
      frame = 0;
      last = 0;
    }
  }

  function setVisible(v) {
    if (v === visible) return;
    visible = v;
    root.classList.toggle("gem-cursor-visible", v);
  }

  function onMove(e) {
    if (e.pointerType && e.pointerType !== "mouse") {
      // Touch o penna su dispositivi ibridi: si torna al comportamento nativo
      root.classList.remove("has-gem-cursor");
      setVisible(false);
      return;
    }
    root.classList.add("has-gem-cursor");
    tx = e.clientX;
    ty = e.clientY;
    dot.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    if (!visible) {
      // Prima comparsa: il diamante parte già sotto il puntatore
      x = tx; y = ty;
      setVisible(true);
    }
    if (!frame) frame = requestAnimationFrame(render);
  }

  function onOver(e) {
    const t = e.target instanceof Element ? e.target : null;
    const isText = !!(t && t.closest(TEXT_FIELD));
    root.classList.toggle("gem-cursor-text", isText);
    root.classList.toggle("gem-cursor-hover", !isText && !!(t && t.closest(INTERACTIVE)));
  }

  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerdown", () => root.classList.add("gem-cursor-press"), { passive: true });
  document.addEventListener("pointerup", () => root.classList.remove("gem-cursor-press"), { passive: true });
  root.addEventListener("mouseleave", () => setVisible(false));
  window.addEventListener("blur", () => setVisible(false));
})();
