/* ============================================================
   WIDGET 05-A · THE TOKEN PREDICTOR & REWARD LOOP
   Era 05 — The Scale & Alignment Era (Present)

   A terminal that simulates an LLM streaming a response token by
   token in glowing green. For each token, a sidebar shows the
   model's top-3 next-token probabilities updating in real time.
   Wireframe thumbs up / down buttons apply human-feedback reward
   that tweaks the live probability distribution (RLHF analogue).
   ============================================================ */

(function () {
  'use strict';

  /* ---- The canned response (typed token by token) --------- */
  const TOKENS = [
    'I', 'am', 'an', 'intelligence', 'built', 'from', 'attention.',
    'Each', 'word', 'I', 'type', 'is', 'the', 'most', 'likely', 'next', 'token.'
  ];
  const POOL = ['the', 'a', 'is', 'of', 'and', 'to', 'in', 'that', 'model',
                'word', 'signal', 'data', 'not', 'be', 'are', 'from'];

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TYPE_MS = reduced ? 35 : 165;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  let root, input, runBtn, out, stream, cursor, bars, stepEl, rewardVal, upBtn, downBtn;
  let running = false;
  let reward = 0;          // [-1, 1], RLHF signal
  let currentStep = 0;     // which token's distribution is on display

  /* ---- Helpers --------------------------------------------- */
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function distractors(i, real) {
    const realLc = real.toLowerCase().replace(/[^a-z]/g, '');
    const out = [];
    let k = i * 2;
    while (out.length < 2 && k < i * 2 + POOL.length) {
      const c = POOL[k % POOL.length];
      if (c !== realLc && !out.includes(c)) out.push(c);
      k++;
    }
    while (out.length < 2) out.push(out.length === 0 ? 'the' : 'a');
    return out;
  }

  function probs(topTok) {
    // top probability shifted by human-feedback reward
    const topP = Math.max(0.6, Math.min(0.985, 0.93 + reward * 0.05));
    const rem = 1 - topP;
    return { top: topP, d1: rem * 0.7, d2: rem * 0.3 };
  }

  const pct = (p) => (p * 100).toFixed(0) + '%';

  /* ---- Sidebar render -------------------------------------- */
  function renderSidebar(step) {
    currentStep = step;
    const real = TOKENS[step];
    const [d1, d2] = distractors(step, real);
    const p = probs(real);
    const rows = [
      { tok: real, p: p.top, alt: false },
      { tok: d1, p: p.d1, alt: true },
      { tok: d2, p: p.d2, alt: true },
    ];
    bars.innerHTML = rows.map((r) => `
      <div class="llm-bar ${r.alt ? 'alt' : ''}">
        <div class="row"><span class="tok">${escapeHtml(r.tok)}</span><span class="pct">${pct(r.p)}</span></div>
        <div class="track"><i class="fill" style="width:${(r.p * 100).toFixed(1)}%"></i></div>
      </div>`).join('');
    stepEl.textContent = `step ${String(step + 1).padStart(2, '0')}/${String(TOKENS.length).padStart(2, '0')}`;
  }

  /* ---- Typing loop ----------------------------------------- */
  function appendToken(tok) {
    const span = document.createElement('span');
    span.className = 'tk';
    span.textContent = tok + ' ';
    stream.insertBefore(span, cursor);
  }

  function autoScroll() {
    out.scrollTop = out.scrollHeight;
  }

  async function generate() {
    if (running) return;
    running = true;
    runBtn.disabled = true;
    reward = 0;
    syncRewardUI();

    const prompt = (input.value || '').trim() || 'What are you?';
    out.innerHTML =
      `<div class="llm-prompt-line"><span class="ps1">$</span> ${escapeHtml(prompt)}</div>` +
      `<div class="llm-output" id="llm-stream"><span class="llm-cursor" id="llm-cursor"></span></div>`;
    stream = out.querySelector('#llm-stream');
    cursor = out.querySelector('#llm-cursor');

    for (let i = 0; i < TOKENS.length; i++) {
      renderSidebar(i);          // model "predicts" token i
      await wait(TYPE_MS);
      appendToken(TOKENS[i]);
      autoScroll();
    }

    // final state: leave the last distribution visible
    renderSidebar(TOKENS.length - 1);
    running = false;
    runBtn.disabled = false;
  }

  /* ---- Reward (thumbs) ------------------------------------- */
  function applyReward(delta) {
    reward = Math.max(-1, Math.min(1, reward + delta));
    syncRewardUI();
    // re-render the currently displayed distribution so the tweak is visible
    renderSidebar(currentStep);
  }

  function syncRewardUI() {
    rewardVal.textContent = `reward ${reward >= 0 ? '+' : ''}${reward.toFixed(2)}`;
    upBtn.classList.toggle('active', reward > 0.01);
    downBtn.classList.toggle('active', reward < -0.01);
  }

  /* ---- Markup ---------------------------------------------- */
  function markup() {
    return `
    <div class="llm">
      <div class="llm-main">
        <div class="llm-prompt">
          <input class="llm-input" id="llm-input" type="text"
                 value="What are you?" aria-label="LLM prompt" spellcheck="false"/>
          <button class="llm-btn" id="llm-run">▶ Generate</button>
        </div>
        <div class="llm-terminal" id="llm-terminal"></div>
        <div class="llm-reward">
          <span class="lbl">HUMAN FEEDBACK</span>
          <button class="llm-thumb good" id="llm-up" aria-label="thumbs up">▲ GOOD</button>
          <button class="llm-thumb bad" id="llm-down" aria-label="thumbs down">▼ BAD</button>
          <span class="llm-reward-val" id="llm-reward-val">reward +0.00</span>
        </div>
      </div>
      <div class="llm-sidebar">
        <div class="llm-side-label"><span>NEXT TOKEN · TOP 3</span><span class="step" id="llm-step">step 00/17</span></div>
        <div class="llm-bars" id="llm-bars"></div>
      </div>
    </div>`;
  }

  /* ---- Wire + mount ---------------------------------------- */
  function wire() {
    runBtn.addEventListener('click', generate);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') generate(); });
    upBtn.addEventListener('click', () => applyReward(+0.2));
    downBtn.addEventListener('click', () => applyReward(-0.2));
  }

  function mount(slot) {
    slot.innerHTML = markup();
    root = slot;
    input = slot.querySelector('#llm-input');
    runBtn = slot.querySelector('#llm-run');
    out = slot.querySelector('#llm-terminal');
    bars = slot.querySelector('#llm-bars');
    stepEl = slot.querySelector('#llm-step');
    rewardVal = slot.querySelector('#llm-reward-val');
    upBtn = slot.querySelector('#llm-up');
    downBtn = slot.querySelector('#llm-down');
    wire();

    // idle terminal state
    out.innerHTML =
      '<div class="llm-prompt-line"><span class="ps1">$</span> awaiting prompt…</div>' +
      '<div class="llm-output"><span class="llm-cursor idle"></span></div>';
    renderSidebar(0);
  }

  function init() {
    const slot = document.querySelector('.widget-slot[data-widget="llm-terminal"]');
    if (!slot) return;
    mount(slot);
    if (window.BlueprintOfIntelligence) {
      window.BlueprintOfIntelligence.mountWidget =
        window.BlueprintOfIntelligence.mountWidget || {};
      window.BlueprintOfIntelligence.mountWidget.llmTerminal = () => mount(slot);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
