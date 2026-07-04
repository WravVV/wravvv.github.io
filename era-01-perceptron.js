/* ============================================================
   WIDGET 01-A · THE WIREFRAME PERCEPTRON
   Era 01 — The Architecture of Logic (1950s–60s)

   A vanilla-JS/SVG schematic of a binary Perceptron:
     [Input 0] ──┐
                 ├─→ [Σ summation] ──⇢ [threshold θ] ──→ [Output]
     [Input 1] ──┘

   Interaction model:
     • Two binary input toggles (0 / 1)
     • A weight slider per input (-2 … +2) — each input line's
       colour tracks its own contribution (dim → bright glowing green)
     • A threshold slider (-2 … +2) drawn as a dashed gate line
     • When Σ(x·w) ≥ θ the output node "fires": neon ripple + glow
   ============================================================ */

(function () {
  'use strict';

  /* ---- Geometry (SVG viewBox 0 0 440 300) ------------------ */
  const G = {
    in0:  { x: 70,  y: 70  },
    in1:  { x: 70,  y: 230 },
    sum:  { x: 220, y: 150 },
    out:  { x: 370, y: 150 },
    gateX: 305,            // threshold gate x-position
  };

  /* ---- State ----------------------------------------------- */
  const state = {
    inputs:    [0, 0],
    weights:   [1.0, 1.0],
    threshold: 1.0,
  };

  const W_MIN = -2, W_MAX = 2, W_STEP = 0.1;

  /* ---- SVG template ---------------------------------------- */
  function svgMarkup() {
    return `
    <svg class="perc-svg" viewBox="0 0 440 300" role="img"
         aria-label="Perceptron schematic: two inputs, summation node, threshold gate, output node">
      <defs>
        <filter id="perc-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- structural data paths (faint guide lines) -->
      <g class="perc-guides" stroke="var(--tactical)" stroke-width="1" opacity="0.25">
        <line x1="0"   y1="150" x2="440" y2="150" stroke-dasharray="2 4"/>
        <line x1="220" y1="0"   x2="220" y2="300" stroke-dasharray="2 4"/>
      </g>

      <!-- axis ticks -->
      <g class="label">
        <text x="6"   y="14" class="label">[ X:00 Y:00 ]</text>
        <text x="392" y="14" class="label">PRCP-01</text>
      </g>

      <!-- signal lines: input → sum -->
      <line id="line-0" class="sig inactive"
            x1="${G.in0.x}" y1="${G.in0.y}" x2="${G.sum.x}" y2="${G.sum.y}"/>
      <line id="line-1" class="sig inactive"
            x1="${G.in1.x}" y1="${G.in1.y}" x2="${G.sum.x}" y2="${G.sum.y}"/>
      <!-- signal line: sum → output -->
      <line id="line-out" class="sig inactive"
            x1="${G.sum.x}" y1="${G.sum.y}" x2="${G.out.x}" y2="${G.out.y}"/>

      <!-- weight labels (sit on the input lines) -->
      <g id="wlabel-0" class="label">
        <rect x="120" y="92"  width="42" height="16" fill="var(--ink)" stroke="var(--tactical)" stroke-width="1"/>
        <text x="141" y="103" text-anchor="middle" class="label" id="wtext-0">w0 +1.0</text>
      </g>
      <g id="wlabel-1" class="label">
        <rect x="120" y="192" width="42" height="16" fill="var(--ink)" stroke="var(--tactical)" stroke-width="1"/>
        <text x="141" y="203" text-anchor="middle" class="label" id="wtext-1">w1 +1.0</text>
      </g>

      <!-- threshold gate line -->
      <line class="threshold"
            x1="${G.gateX}" y1="108" x2="${G.gateX}" y2="192"/>
      <text x="${G.gateX}" y="200" text-anchor="middle" class="threshold-label">θ GATE</text>
      <text x="${G.gateX}" y="212" text-anchor="middle" class="threshold-label" id="theta-text">θ = 1.0</text>

      <!-- Input nodes -->
      <g id="input-0">
        <circle class="node-fill node-stroke" cx="${G.in0.x}" cy="${G.in0.y}" r="18"/>
        <text x="${G.in0.x}" y="${G.in0.y + 4}" text-anchor="middle" class="value">x0</text>
        <text x="${G.in0.x}" y="${G.in0.y - 28}" text-anchor="middle" class="label">INPUT 0</text>
        <text x="${G.in0.x}" y="${G.in0.y + 38}" text-anchor="middle" class="value" id="inval-0">0</text>
      </g>
      <g id="input-1">
        <circle class="node-fill node-stroke" cx="${G.in1.x}" cy="${G.in1.y}" r="18"/>
        <text x="${G.in1.x}" y="${G.in1.y + 4}" text-anchor="middle" class="value">x1</text>
        <text x="${G.in1.x}" y="${G.in1.y - 28}" text-anchor="middle" class="label">INPUT 1</text>
        <text x="${G.in1.x}" y="${G.in1.y + 38}" text-anchor="middle" class="value" id="inval-1">0</text>
      </g>

      <!-- Summation node -->
      <g id="sum-node">
        <circle class="node-fill node-stroke" cx="${G.sum.x}" cy="${G.sum.y}" r="22"/>
        <text x="${G.sum.x}" y="${G.sum.y - 5}" text-anchor="middle" class="label">Σ</text>
        <text x="${G.sum.x}" y="${G.sum.y + 12}" text-anchor="middle" class="value" id="sum-text">0.0</text>
      </g>

      <!-- Output node (+ ripple layer) -->
      <g id="output-node">
        <circle class="ripple" cx="${G.out.x}" cy="${G.out.y}" r="14"/>
        <circle class="node-fill node-stroke" cx="${G.out.x}" cy="${G.out.y}" r="20"/>
        <text x="${G.out.x}" y="${G.out.y - 5}" text-anchor="middle" class="label">OUT</text>
        <text x="${G.out.x}" y="${G.out.y + 12}" text-anchor="middle" class="value" id="out-text">0</text>
        <text x="${G.out.x}" y="${G.out.y - 32}" text-anchor="middle" class="label">FIRE</text>
      </g>
    </svg>
    `;
  }

  /* ---- Control deck template ------------------------------- */
  function controlsMarkup() {
    const range = (id, val) =>
      `<input type="range" class="perc-range" id="${id}"
              min="${W_MIN}" max="${W_MAX}" step="${W_STEP}" value="${val}"
              aria-label="${id}"/>`;
    const toggle = (id, idx) =>
      `<button class="perc-toggle" id="${id}" role="switch" aria-checked="false" aria-label="input ${idx} value">
         <span class="perc-toggle-val off">0</span>
         <span class="perc-toggle-val on">1</span>
       </button>`;

    return `
    <div class="perc-controls">
      <div class="perc-row">
        <span class="perc-row-label">INPUT 0</span>
        ${toggle('toggle-0', 0)}
        <span class="perc-readout" id="readout-x0">x0 = 0</span>
      </div>
      <div class="perc-row">
        <span class="perc-row-label">WEIGHT 0</span>
        ${range('weight-0', state.weights[0])}
        <span class="perc-readout" id="readout-w0">w0 +1.0</span>
      </div>
      <div class="perc-row">
        <span class="perc-row-label">INPUT 1</span>
        ${toggle('toggle-1', 1)}
        <span class="perc-readout" id="readout-x1">x1 = 0</span>
      </div>
      <div class="perc-row">
        <span class="perc-row-label">WEIGHT 1</span>
        ${range('weight-1', state.weights[1])}
        <span class="perc-readout" id="readout-w1">w1 +1.0</span>
      </div>
      <div class="perc-row">
        <span class="perc-row-label">THRESHOLD</span>
        ${range('threshold', state.threshold)}
        <span class="perc-readout" id="readout-theta">θ +1.0</span>
      </div>
      <div class="perc-row" style="border-top:1px dashed var(--tactical);padding-top:.5rem;">
        <span class="perc-badge" id="badge-sum">Σ = 0.0</span>
        <span></span>
        <span class="perc-badge" id="badge-out">OUT = 0</span>
      </div>
    </div>`;
  }

  /* ---- Helpers --------------------------------------------- */
  const fmt = (n) => (n >= 0 ? '+' : '') + n.toFixed(1);

  function compute() {
    const sum = state.inputs[0] * state.weights[0] +
                state.inputs[1] * state.weights[1];
    const fires = sum >= state.threshold;
    return { sum, fires };
  }

  /* ---- Render ---------------------------------------------- */
  function render() {
    const { sum, fires } = compute();

    // Input lines: bright when their input is 1 (signal flowing).
    [0, 1].forEach((i) => {
      const line = document.getElementById('line-' + i);
      if (!line) return;
      line.classList.toggle('active', state.inputs[i] === 1);
      line.classList.toggle('inactive', state.inputs[i] === 0);

      const wt = document.getElementById('wtext-' + i);
      if (wt) wt.textContent = `w${i} ${fmt(state.weights[i])}`;
    });

    // Sum→output line: bright only when the node fires.
    const lineOut = document.getElementById('line-out');
    if (lineOut) {
      lineOut.classList.toggle('active', fires);
      lineOut.classList.toggle('inactive', !fires);
    }

    // Input node value labels
    document.getElementById('inval-0').textContent = state.inputs[0];
    document.getElementById('inval-1').textContent = state.inputs[1];

    // Summation readout
    document.getElementById('sum-text').textContent = sum.toFixed(1);
    document.getElementById('theta-text').textContent = `θ = ${fmt(state.threshold)}`;

    // Output node firing state + ripple
    const outNode = document.getElementById('output-node');
    outNode.classList.toggle('firing', fires);
    document.getElementById('out-text').textContent = fires ? '1' : '0';

    // Control-deck readouts
    document.getElementById('readout-x0').textContent = `x0 = ${state.inputs[0]}`;
    document.getElementById('readout-x1').textContent = `x1 = ${state.inputs[1]}`;
    document.getElementById('readout-w0').textContent = `w0 ${fmt(state.weights[0])}`;
    document.getElementById('readout-w1').textContent = `w1 ${fmt(state.weights[1])}`;
    document.getElementById('readout-theta').textContent = `θ ${fmt(state.threshold)}`;

    const bSum = document.getElementById('badge-sum');
    const bOut = document.getElementById('badge-out');
    bSum.textContent = `Σ = ${sum.toFixed(1)}`;
    bOut.textContent = `OUT = ${fires ? 1 : 0}`;
    bOut.classList.toggle('eq', fires);
    bSum.classList.toggle('eq', fires);
  }

  /* ---- Wire up events -------------------------------------- */
  function wire(root) {
    [0, 1].forEach((i) => {
      const tog = root.querySelector('#toggle-' + i);
      tog.addEventListener('click', () => {
        state.inputs[i] = state.inputs[i] === 1 ? 0 : 1;
        tog.setAttribute('aria-checked', state.inputs[i] === 1 ? 'true' : 'false');
        render();
      });

      const w = root.querySelector('#weight-' + i);
      w.addEventListener('input', () => {
        state.weights[i] = parseFloat(w.value);
        render();
      });
    });

    const th = root.querySelector('#threshold');
    th.addEventListener('input', () => {
      state.threshold = parseFloat(th.value);
      render();
    });

    // Keyboard: toggle inputs with 1/2 keys when focused area is hovered
    root.addEventListener('keydown', (e) => {
      if (e.key === '1') root.querySelector('#toggle-0').click();
      if (e.key === '2') root.querySelector('#toggle-1').click();
    });
  }

  /* ---- Mount ----------------------------------------------- */
  function mount(slot) {
    slot.innerHTML = `
      <div class="perc" tabindex="0">
        ${svgMarkup()}
        ${controlsMarkup()}
      </div>`;
    wire(slot);
    render();
  }

  // Auto-mount into the Era 01 widget slot.
  function init() {
    const slot = document.querySelector('.widget-slot[data-widget="perceptron"]');
    if (!slot) return;
    mount(slot);
    if (window.BlueprintOfIntelligence) {
      window.BlueprintOfIntelligence.mountWidget = window.BlueprintOfIntelligence.mountWidget || {};
      window.BlueprintOfIntelligence.mountWidget.perceptron = () => mount(slot);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
