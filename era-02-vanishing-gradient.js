/* ============================================================
   WIDGET 02-A · THE VANISHING GRADIENT LOOP
   Era 02 — The Hidden Layers & Sequential Text (1980s–90s)

   An unrolled-RNN schematic: 5 wireframe node blocks (timesteps)
   connected forward, with a dashed loop-back denoting unrolled-
   through-time recurrence. A "Process Sentence" button streams a
   test sentence through the chain one word at a time. The neon
   data pulse dims at every step (gradient strength 100 → 75 →
   50 → 28 → 12), visually teaching why early RNNs forgot
   long-term context.
   ============================================================ */

(function () {
  'use strict';

  /* ---- Geometry (viewBox 0 0 440 190) ---------------------- */
  const CX = [50, 130, 210, 290, 370]; // node centers
  const CY = 100;
  const N = CX.length;

  const WORDS = ['The', 'weather', 'today', 'is', 'surprisingly…'];
  // gradient strength (%) at each timestep — multiplicative decay
  const GRAD = [100, 75, 50, 28, 12];

  /* ---- Colour helpers: bright term-green → faint tactical -- */
  const C_TERM = [0x00, 0xff, 0x66];
  const C_TACT = [0x1a, 0x5f, 0x36];
  function lerp(a, b, t) { return a + (b - a) * t; }
  function strengthColor(s) {
    const t = Math.max(0, Math.min(1, s / 100));
    const r = lerp(C_TACT[0], C_TERM[0], t) | 0;
    const g = lerp(C_TACT[1], C_TERM[1], t) | 0;
    const b = lerp(C_TACT[2], C_TERM[2], t) | 0;
    return `rgb(${r},${g},${b})`;
  }
  function strengthGlow(s) {
    const t = Math.max(0, Math.min(1, s / 100));
    return `drop-shadow(0 0 ${(t * 6).toFixed(1)}px ${strengthColor(s)})`;
  }

  /* ---- SVG markup (built programmatically) ----------------- */
  function svgMarkup(reduced) {
    const transition = reduced ? 'none' : undefined;

    // nodes
    let nodes = '';
    for (let i = 0; i < N; i++) {
      const x = CX[i];
      nodes += `
      <g class="vg-node" data-i="${i}">
        <text x="${x}" y="22" text-anchor="middle" class="node-label">t=${i}</text>
        <path class="recur" d="M ${x - 16} 78 C ${x - 16} 54, ${x + 16} 54, ${x + 16} 78"/>
        <rect class="node-rect" id="nrect-${i}" x="${x - 22}" y="${CY - 22}" width="44" height="44" rx="2"/>
        <text x="${x}" y="${CY - 3}" text-anchor="middle" class="node-h" id="nh-${i}">h${i}</text>
        <text x="${x}" y="${CY + 13}" text-anchor="middle" class="node-word" id="nw-${i}">${WORDS[i]}</text>
      </g>`;
    }

    // forward connectors + input port
    let conns = `<line class="conn" id="cin"  x1="10" y1="${CY}" x2="${CX[0] - 22}" y2="${CY}"/>`;
    for (let i = 0; i < N - 1; i++) {
      conns += `<line class="conn" id="c${i}" x1="${CX[i] + 22}" y1="${CY}" x2="${CX[i + 1] - 22}" y2="${CY}"/>`;
    }

    // loop-back (BPTT / unrolled-through-time)
    const loop = `
      <path class="loopback" d="
        M ${CX[N - 1] + 22} ${CY}
        L ${CX[N - 1] + 22} 150
        L ${CX[0] - 22} 150
        L ${CX[0] - 22} ${CY}"/>
      <text x="220" y="166" text-anchor="middle" class="axis-note">BPTT · UNROLLED THROUGH TIME</text>`;

    // input/output ports
    const ports = `
      <text x="10"  y="86"  class="axis-note">IN ▶</text>
      <text x="430" y="86"  text-anchor="end" class="axis-note">▶ OUT</text>
      <text x="6"   y="14"  class="axis-note">[ X:12 Y:63 ]</text>
      <text x="434" y="14"  text-anchor="end" class="axis-note">RNN-02</text>`;

    return `
    <svg class="vg-svg ${reduced ? 'reduced' : ''}" viewBox="0 0 440 190" role="img"
         aria-label="Recurrent neural network unrolled across five timesteps with a vanishing gradient">
      <defs>
        <marker id="vg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--tactical)"/>
        </marker>
      </defs>
      ${conns}
      ${nodes}
      ${loop}
      ${ports}
      <g class="pulse-dot" id="pulse-dot" style="transform: translateX(${CX[0]}px)">
        <circle cx="0" cy="${CY}" r="5"/>
      </g>
    </svg>`;
  }

  /* ---- Control deck ---------------------------------------- */
  function controlsMarkup() {
    const cells = GRAD.map((g, i) =>
      `<div class="vg-cell" data-i="${i}">t${i}<br>${g}%</div>`).join('');
    return `
    <div class="vg-controls">
      <div class="vg-readout">
        <span class="vg-readout-label">Gradient Strength</span>
        <span class="vg-readout-val" id="vg-grad-val">100%</span>
      </div>
      <div class="vg-cells" id="vg-cells">${cells}</div>
      <div class="vg-actions">
        <button class="vg-btn" id="vg-run">▶ Process Sentence</button>
        <button class="vg-btn ghost" id="vg-reset">Reset</button>
      </div>
      <div class="vg-caption" id="vg-caption">Awaiting input stream…</div>
    </div>`;
  }

  /* ---- State / runtime ------------------------------------- */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STEP_MS = reduced ? 120 : 650;   // travel time per token
  const DWELL_MS = reduced ? 60 : 450;   // pause after arrival
  let running = false;
  let root;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function reset() {
    for (let i = 0; i < N; i++) {
      const rect = root.querySelector(`#nrect-${i}`);
      rect.style.stroke = '';
      rect.style.fill = '';
      rect.style.filter = '';
      root.querySelector(`#nh-${i}`).style.fill = '';
      root.querySelector(`#nw-${i}`).classList.remove('shown');
      const conn = root.querySelector(`#c${i - 1}`) || (i === 0 ? root.querySelector('#cin') : null);
      if (conn) { conn.style.stroke = ''; conn.style.filter = ''; }
    }
    root.querySelectorAll('.vg-cell').forEach((c) => c.classList.remove('passed', 'dim'));
    setGradVal(100);
    setCaption('Awaiting input stream…');
    // park pulse dot at input
    const dot = root.querySelector('#pulse-dot');
    dot.style.transform = `translateX(${CX[0]}px)`;
    dot.querySelector('circle').style.fill = strengthColor(100);
    dot.querySelector('circle').style.filter = strengthGlow(100);
  }

  function setGradVal(s) {
    const el = root.querySelector('#vg-grad-val');
    el.textContent = `${s}%`;
    el.style.color = strengthColor(s);
  }
  function setCaption(text, warn = false) {
    const el = root.querySelector('#vg-caption');
    el.textContent = text;
    el.classList.toggle('warn', warn);
  }

  async function travelTo(i, strength) {
    // dim the pulse to this step's gradient strength, then move it
    const dot = root.querySelector('#pulse-dot');
    const circ = dot.querySelector('circle');
    circ.style.fill = strengthColor(strength);
    circ.style.filter = strengthGlow(strength);
    circ.setAttribute('r', (3 + (strength / 100) * 3).toFixed(1));
    dot.style.transform = `translateX(${CX[i]}px)`;
    await wait(STEP_MS);
  }

  function arriveAt(i, strength) {
    // light the node + the connector feeding it
    const rect = root.querySelector(`#nrect-${i}`);
    rect.style.stroke = strengthColor(strength);
    rect.style.fill = `rgba(0,255,102,${0.04 + (strength / 100) * 0.16})`;
    rect.style.filter = strengthGlow(strength);
    root.querySelector(`#nh-${i}`).style.fill = strengthColor(strength);
    root.querySelector(`#nw-${i}`).classList.add('shown');

    const conn = i === 0
      ? root.querySelector('#cin')
      : root.querySelector(`#c${i - 1}`);
    if (conn) {
      conn.style.stroke = strengthColor(strength);
      conn.style.filter = strengthGlow(strength);
    }

    // mark cell; deeper cells render dimmer
    const cell = root.querySelector(`.vg-cell[data-i="${i}"]`);
    cell.classList.add('passed');
    if (strength < 50) cell.classList.add('dim');
    cell.style.color = strengthColor(strength);
    cell.style.borderColor = strengthColor(strength);

    setGradVal(strength);
  }

  async function run() {
    if (running) return;
    running = true;
    root.querySelector('#vg-run').disabled = true;
    reset();
    setCaption('Streaming token sequence through hidden states…');
    await wait(reduced ? 50 : 250);

    for (let i = 0; i < N; i++) {
      await travelTo(i, GRAD[i]);
      arriveAt(i, GRAD[i]);
      setCaption(`t=${i} · "${WORDS[i]}" → gradient ${GRAD[i]}%`);
      await wait(DWELL_MS);
    }

    setCaption('Signal lost in the deep layers — long-term context forgotten.', true);
    root.querySelector('#vg-run').disabled = false;
    running = false;
  }

  /* ---- Wire ------------------------------------------------ */
  function wire(slot) {
    root.querySelector('#vg-run').addEventListener('click', run);
    root.querySelector('#vg-reset').addEventListener('click', () => {
      if (running) return;
      reset();
    });
  }

  /* ---- Mount ----------------------------------------------- */
  function mount(slot) {
    slot.innerHTML = `
      <div class="vg">
        ${svgMarkup(reduced)}
        ${controlsMarkup()}
      </div>`;
    root = slot;
    wire(slot);
    reset();
  }

  function init() {
    const slot = document.querySelector('.widget-slot[data-widget="vanishing-gradient"]');
    if (!slot) return;
    mount(slot);
    if (window.BlueprintOfIntelligence) {
      window.BlueprintOfIntelligence.mountWidget =
        window.BlueprintOfIntelligence.mountWidget || {};
      window.BlueprintOfIntelligence.mountWidget.vanishingGradient = () => mount(slot);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
