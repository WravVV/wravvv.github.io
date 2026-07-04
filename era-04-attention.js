/* ============================================================
   WIDGET 04-A · THE SELF-ATTENTION MATRIX
   Era 04 — The Attention Breakthrough (2017)

   Renders the Winograd sentence:
     "The animal didn't cross the street because it was too tired."
   Hovering (or focusing) the pronoun "it" draws glowing schematic
   attention arcs from "it" to its referents:
       it → animal  (thick, bright — high contextual weight)
       it → street  (thin, dim    — low contextual weight)
   A live weight readout shows the attention distribution.
   ============================================================ */

(function () {
  'use strict';

  const SENTENCE = ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'tired'];
  const SRC = 7;          // "it"
  const T_ANIMAL = 1;     // "animal"
  const T_STREET = 5;     // "street"
  const W_ANIMAL = 0.82;
  const W_STREET = 0.11;

  let root, canvas, svg, sentenceEl;
  let active = false;

  /* ---- Markup ---------------------------------------------- */
  function markup() {
    const tokens = SENTENCE.map((w, i) => {
      let cls = 'attn-token';
      if (i === SRC) cls += ' src';
      else if (i === T_ANIMAL) cls += ' tgt animal';
      else if (i === T_STREET) cls += ' tgt street';
      const focusable = i === SRC ? 'tabindex="0" role="button" aria-label="inspect attention for it"' : '';
      return `<span class="${cls}" data-i="${i}" ${focusable}>${w}</span>`;
    }).join(' ');

    return `
    <div class="attn">
      <div class="attn-canvas" id="attn-canvas">
        <svg class="attn-svg" id="attn-svg" aria-hidden="true"></svg>
        <div class="attn-sentence" id="attn-sentence">${tokens}</div>
      </div>
      <div class="attn-controls">
        <div class="attn-readout" id="attn-readout">
          <span class="attn-hint">Hover <b>it</b> to inspect self-attention weights →</span>
        </div>
        <div class="attn-weights" id="attn-weights"></div>
      </div>
    </div>`;
  }

  /* ---- Geometry helpers ------------------------------------ */
  function tokenCenter(i) {
    const span = sentenceEl.querySelector(`[data-i="${i}"]`);
    const sR = span.getBoundingClientRect();
    const cR = canvas.getBoundingClientRect();
    return {
      x: sR.left - cR.left + sR.width / 2,
      y: sR.top - cR.top + sR.height / 2,
    };
  }

  function arcPath(from, to, bow = 44) {
    const mx = (from.x + to.x) / 2;
    const my = Math.min(from.y, to.y) - bow;
    return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
  }

  function el(name, attrs) {
    const n = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ---- Draw / clear attention arcs ------------------------- */
  function draw() {
    active = true;
    svg.innerHTML = '';
    const src = tokenCenter(SRC);
    const an = tokenCenter(T_ANIMAL);
    const st = tokenCenter(T_STREET);

    // it → street (drawn first, behind); it → animal (thick, on top)
    svg.appendChild(el('path', { class: 'attn-line thin', d: arcPath(src, st, 60) }));
    svg.appendChild(el('path', { class: 'attn-line thick', d: arcPath(src, an, 44) }));

    // target nodes
    svg.appendChild(el('circle', { class: 'attn-dot dim', cx: st.x, cy: st.y, r: 3 }));
    svg.appendChild(el('circle', { class: 'attn-dot bright', cx: an.x, cy: an.y, r: 4 }));

    // light up target tokens
    sentenceEl.querySelector('.tgt.animal').classList.add('lit');
    sentenceEl.querySelector('.tgt.street').classList.add('lit');

    // weight readout
    const w = root.querySelector('#attn-weights');
    w.innerHTML = `
      <div class="attn-wrow">
        <span>it → animal</span>
        <div class="attn-wbar"><i style="width:${(W_ANIMAL * 100).toFixed(0)}%"></i></div>
        <span class="pct">${W_ANIMAL.toFixed(2)}</span>
      </div>
      <div class="attn-wrow dim">
        <span>it → street</span>
        <div class="attn-wbar"><i style="width:${(W_STREET * 100).toFixed(0)}%"></i></div>
        <span class="pct">${W_STREET.toFixed(2)}</span>
      </div>`;
    root.querySelector('#attn-readout').innerHTML =
      '<span>query = <b>it</b> · attention resolves to <b>animal</b> (coreferent)</span>';
  }

  function clear() {
    active = false;
    svg.innerHTML = '';
    sentenceEl.querySelectorAll('.tgt.lit').forEach((t) => t.classList.remove('lit'));
    root.querySelector('#attn-weights').innerHTML = '';
    root.querySelector('#attn-readout').innerHTML =
      '<span class="attn-hint">Hover <b>it</b> to inspect self-attention weights →</span>';
  }

  /* ---- Wire ------------------------------------------------ */
  function wire() {
    const src = sentenceEl.querySelector('.attn-token.src');
    src.addEventListener('mouseenter', draw);
    src.addEventListener('focus', draw);
    src.addEventListener('mouseleave', clear);
    src.addEventListener('blur', clear);
    // keep arcs aligned on resize
    window.addEventListener('resize', () => { if (active) draw(); });
  }

  /* ---- Mount ----------------------------------------------- */
  function mount(slot) {
    slot.innerHTML = markup();
    root = slot;
    canvas = slot.querySelector('#attn-canvas');
    svg = slot.querySelector('#attn-svg');
    sentenceEl = slot.querySelector('#attn-sentence');
    wire();
  }

  function init() {
    const slot = document.querySelector('.widget-slot[data-widget="attention-matrix"]');
    if (!slot) return;
    mount(slot);
    if (window.BlueprintOfIntelligence) {
      window.BlueprintOfIntelligence.mountWidget =
        window.BlueprintOfIntelligence.mountWidget || {};
      window.BlueprintOfIntelligence.mountWidget.attentionMatrix = () => mount(slot);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
