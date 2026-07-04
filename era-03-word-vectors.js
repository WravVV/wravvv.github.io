/* ============================================================
   WIDGET 03-A · VECTOR MATH SPACE
   Era 03 — The Geometry of Words (2013)

   An interactive 2D embedding graph (grid + axes + crosshairs).
   "Process" runs the canonical Word2Vec analogy as a geometric
   construction:
       [King] ── (− Man) ── (+ Woman) ──▶ [Queen]
   Each vector draws in turn; the final arrowhead (cursor head)
   snaps onto the Queen target, which lights up with a radar ping.
   ============================================================ */

(function () {
  'use strict';

  /* ---- Geometry (viewBox 0 0 440 360, scale 24, origin center) -- */
  const SCALE = 24;
  const O = { x: 220, y: 180 };                  // origin
  // word coordinates (math units → svg via O ± unit*SCALE)
  const K = { x: O.x +  5 * SCALE, y: O.y -  1 * SCALE }; // King   (5, 1)
  const M = { x: O.x +  2 * SCALE, y: O.y -  2 * SCALE }; // Man    (2, 2)
  const W = { x: O.x +  2 * SCALE, y: O.y +  2 * SCALE }; // Woman  (2,-2)
  const I = { x: K.x - (M.x - O.x), y: K.y - (M.y - O.y) }; // King − Man
  const Q = { x: I.x + (W.x - O.x), y: I.y + (W.y - O.y) }; // ... + Woman = Queen

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DRAW_MS = reduced ? 1 : 720;

  let root, running = false;

  /* ---- SVG markup (grid generated programmatically) -------- */
  function svgMarkup() {
    // grid lines
    let grid = '';
    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      const x = O.x + i * SCALE;
      grid += `<line class="${i % 2 === 0 ? 'grid-major' : 'grid-line'}" x1="${x}" y1="24" x2="${x}" y2="336"/>`;
      const y = O.y + i * SCALE;
      grid += `<line class="${i % 2 === 0 ? 'grid-major' : 'grid-line'}" x1="40" y1="${y}" x2="400" y2="${y}"/>`;
    }

    // tick labels (sparse)
    let ticks = '';
    for (const v of [-4, -2, 2, 4]) {
      ticks += `<text x="${O.x + v * SCALE}" y="178" text-anchor="middle" class="tick-text">${v}</text>`;
      ticks += `<text x="214" y="${O.y - v * SCALE + 3}" text-anchor="end" class="tick-text">${v}</text>`;
    }

    return `
    <svg class="vm-svg" viewBox="0 0 440 360" role="img"
         aria-label="2D vector space demonstrating King minus Man plus Woman equals Queen">
      <defs>
        <marker id="vm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--term)"/>
        </marker>
      </defs>

      <!-- frame notes -->
      <text x="6"   y="14" class="frame-note">[ X:28 Y:71 ]</text>
      <text x="434" y="14" text-anchor="end" class="frame-note">W2V-03</text>

      <!-- grid + axes -->
      ${grid}
      <line class="axis" x1="40"  y1="${O.y}" x2="400" y2="${O.y}"/>
      <line class="axis" x1="${O.x}" y1="24"  x2="${O.x}" y2="336"/>
      ${ticks}
      <text x="404" y="184" class="axis-label">X</text>
      <text x="214" y="20"  text-anchor="end" class="axis-label">Y</text>

      <!-- origin crosshair -->
      <line class="origin-cross" x1="${O.x - 7}" y1="${O.y}" x2="${O.x + 7}" y2="${O.y}"/>
      <line class="origin-cross" x1="${O.x}" y1="${O.y - 7}" x2="${O.x}" y2="${O.y + 7}"/>
      <text x="${O.x + 8}" y="${O.y + 14}" class="tick-text">0</text>

      <!-- faint reference vectors: Man & Woman from origin -->
      <line class="ref-vec" x1="${O.x}" y1="${O.y}" x2="${M.x}" y2="${M.y}"/>
      <line class="ref-vec" x1="${O.x}" y1="${O.y}" x2="${W.x}" y2="${W.y}"/>
      <text x="${M.x + 4}" y="${M.y - 4}" class="ref-label">Man</text>
      <text x="${W.x + 4}" y="${W.y + 10}" class="ref-label">Woman</text>

      <!-- construction vectors (animated by JS) -->
      <line id="vec-king" class="vec vec-king" x1="${O.x}" y1="${O.y}" x2="${O.x}" y2="${O.y}"/>
      <line id="vec-sub"   class="vec vec-sub"   x1="${K.x}" y1="${K.y}" x2="${K.x}" y2="${K.y}"/>
      <line id="vec-add"   class="vec vec-add"   x1="${I.x}" y1="${I.y}" x2="${I.x}" y2="${I.y}"
            marker-end="url(#vm-arrow)"/>

      <!-- King point + label -->
      <circle class="pt-dot" id="pt-king-dot" cx="${K.x}" cy="${K.y}" r="3.5"/>
      <text class="pt-label king" id="pt-king-lbl" x="${K.x + 8}" y="${K.y - 6}">King</text>

      <!-- step labels -->
      <text class="pt-label mid" id="lbl-subman" x="${(K.x + I.x) / 2 - 26}" y="${(K.y + I.y) / 2}">− Man</text>
      <text class="pt-label mid" id="lbl-addwoman" x="${(I.x + Q.x) / 2 - 30}" y="${(I.y + Q.y) / 2 + 4}">+ Woman</text>

      <!-- Queen target + radar ping -->
      <g id="queen">
        <circle class="ping"    cx="${Q.x}" cy="${Q.y}" r="6"/>
        <circle class="ping p2" cx="${Q.x}" cy="${Q.y}" r="6"/>
        <circle class="ping p3" cx="${Q.x}" cy="${Q.y}" r="6"/>
        <circle id="queen-target" cx="${Q.x}" cy="${Q.y}" r="13"/>
        <circle class="pt-dot" id="pt-queen-dot" cx="${Q.x}" cy="${Q.y}" r="3.5"/>
        <text class="pt-label queen" id="pt-queen-lbl" x="${Q.x + 8}" y="${Q.y + 4}">Queen</text>
      </g>
    </svg>`;
  }

  function controlsMarkup() {
    return `
    <div class="vm-controls">
      <div class="vm-equation" id="vm-eq">
        King <span class="op">−</span> Man <span class="op">+</span> Woman <span class="op">=</span> <span class="op">?</span>
      </div>
      <div class="vm-actions">
        <button class="vm-btn" id="vm-run">[King] - [Man] + [Woman]</button>
        <button class="vm-btn ghost" id="vm-reset">Reset</button>
      </div>
      <div class="vm-legend">
        <span><i class="lg-solid"></i> result vector</span>
        <span><i class="lg-dash"></i> subtraction</span>
        <span><i class="lg-ref"></i> reference</span>
      </div>
    </div>`;
  }

  /* ---- Helpers --------------------------------------------- */
  function setEq(stage) {
    const eq = root.querySelector('#vm-eq');
    const res = (s) => `<span class="res">${s}</span>`;
    const op  = (s) => `<span class="op">${s}</span>`;
    const base = (hlMan, hlWoman, rhs) =>
      `${res('King')} ${op('−')} ${hlMan ? res('Man') : 'Man'} ${op('+')} ${hlWoman ? res('Woman') : 'Woman'} ${op('=')} ${rhs}`;
    let html;
    switch (stage) {
      case 'king':  html = base(false, false, op('?')); break;
      case 'sub':   html = base(true,  false, op('?')); break;
      case 'add':   html = base(true,  true,  op('?')); break;
      case 'found': html = base(true,  true,  `${res('Queen')} <span class="match">MATCH FOUND</span>`); break;
      default:      html = `${res('King')} ${op('−')} Man ${op('+')} Woman ${op('=')} ${op('?')}`;
    }
    eq.innerHTML = html;
  }

  function show(id) {
    const el = root.querySelector('#' + id);
    if (el) el.classList.add('shown');
  }
  function hideAll() {
    root.querySelectorAll('.pt-label, .pt-dot').forEach((el) => el.classList.remove('shown'));
    root.querySelector('#queen').classList.remove('found');
  }

  function resetVecs() {
    // park each construction vector at its start point
    const k = root.querySelector('#vec-king'); k.setAttribute('x2', O.x); k.setAttribute('y2', O.y);
    const s = root.querySelector('#vec-sub');  s.setAttribute('x2', K.x); s.setAttribute('y2', K.y);
    const a = root.querySelector('#vec-add');  a.setAttribute('x2', I.x); a.setAttribute('y2', I.y);
  }

  /* ---- Animated draw of a <line> endpoint ------------------ */
  function animateLine(line, from, to, dur) {
    return new Promise((resolve) => {
      if (reduced || dur <= 1) {
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y);
        return resolve();
      }
      const start = performance.now();
      const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      function frame(now) {
        const t = Math.min(1, (now - start) / dur);
        const e = ease(t);
        line.setAttribute('x2', (from.x + (to.x - from.x) * e).toFixed(2));
        line.setAttribute('y2', (from.y + (to.y - from.y) * e).toFixed(2));
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  /* ---- Run the analogy construction ------------------------- */
  async function run() {
    if (running) return;
    running = true;
    root.querySelector('#vm-run').disabled = true;
    hideAll();
    resetVecs();
    setEq('king');

    // 1) King vector from origin
    await animateLine(root.querySelector('#vec-king'), O, K, DRAW_MS);
    show('pt-king-dot'); show('pt-king-lbl');

    // 2) subtract Man (dashed) from King → King−Man
    setEq('sub');
    await animateLine(root.querySelector('#vec-sub'), K, I, DRAW_MS);
    show('lbl-subman');

    // 3) add Woman (arrow) from King−Man → Queen; arrowhead = cursor head
    setEq('add');
    await animateLine(root.querySelector('#vec-add'), I, Q, DRAW_MS);
    show('lbl-addwoman');

    // 4) cursor head snaps onto Queen → match found + radar ping
    setEq('found');
    root.querySelector('#queen').classList.add('found');
    show('pt-queen-dot'); show('pt-queen-lbl');

    root.querySelector('#vm-run').disabled = false;
    running = false;
  }

  function reset() {
    if (running) return;
    hideAll();
    resetVecs();
    setEq('init');
  }

  /* ---- Wire + mount ---------------------------------------- */
  function wire() {
    root.querySelector('#vm-run').addEventListener('click', run);
    root.querySelector('#vm-reset').addEventListener('click', reset);
  }

  function mount(slot) {
    slot.innerHTML = `
      <div class="vm">
        ${svgMarkup()}
        ${controlsMarkup()}
      </div>`;
    root = slot;
    wire();
    reset();
  }

  function init() {
    const slot = document.querySelector('.widget-slot[data-widget="word-vectors"]');
    if (!slot) return;
    mount(slot);
    if (window.BlueprintOfIntelligence) {
      window.BlueprintOfIntelligence.mountWidget =
        window.BlueprintOfIntelligence.mountWidget || {};
      window.BlueprintOfIntelligence.mountWidget.wordVectors = () => mount(slot);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
