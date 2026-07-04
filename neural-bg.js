/* ============================================================
   THE BLUEPRINT OF INTELLIGENCE — PHASE 01
   Faint background neural network
   - Draws a layered feed-forward mesh across the viewport
   - Pulses travel forward along the edges on a slow cadence
   - Strictly ambient: dim, behind content, pointer-events:none
   - Honors prefers-reduced-motion (static faint render, no loop)
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('neural-bg');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tunables ----------------------------------------------------------------
  const COLORS = {
    node:   'rgba(0,255,102,0.85)',
    nodeDim:'rgba(0,255,102,0.45)',
    nodeGlow:'rgba(0,255,102,0.35)',
    edge:   'rgba(0,255,102,0.055)',
    edgeHot:'rgba(0,255,102,0.55)',
    pulse:  'rgba(0,255,102,0.85)',
  };
  const NODE_R = 3.4;            // core radius
  const NODE_GLOW_R = 9;        // soft halo radius
  const PULSE_SPEED = 0.00085;   // fraction of an edge per ms
  const PULSE_GAP_MS = 1400;     // ~time between pulse waves
  const MAX_PULSES = 38;

  let W = 0, H = 0, DPR = 1;
  let layers = [];        // array of arrays of {x,y}
  let edges = [];         // {a:{x,y}, b:{x,y}, len}
  let pulses = [];        // {edge, t}  (t in 0..1)
  let lastPulse = 0;
  let rafId = null;

  /* ----------------------------------------------------------
     Layout — rebuild node positions to fill the viewport.
     Layers are spaced horizontally; nodes within a layer are
     spread vertically with gentle jitter so the mesh reads as
     organic rather than a strict grid.
  ---------------------------------------------------------- */
  function layout() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Node counts per layer scale with viewport height.
    const baseCount = Math.max(4, Math.round(H / 150));
    const counts = [
      baseCount,
      baseCount + 2,
      baseCount + 3,
      baseCount + 2,
      baseCount,
    ];
    const layerCount = counts.length;
    const padX = Math.max(60, W * 0.08);
    const usableW = W - padX * 2;
    const padY = H * 0.12;

    layers = counts.map((n, li) => {
      const x = padX + (usableW * li) / (layerCount - 1);
      const arr = [];
      for (let i = 0; i < n; i++) {
        const yF = n === 1 ? 0.5 : i / (n - 1);
        // gentle deterministic jitter (no Math.random — stays stable on resize)
        const jitter = Math.sin((li + 1) * 1.7 + (i + 1) * 2.3) * (H * 0.03);
        arr.push({ x, y: padY + yF * (H - padY * 2) + jitter });
      }
      return arr;
    });

    // Edges: fully connect adjacent layers.
    edges = [];
    for (let li = 0; li < layers.length - 1; li++) {
      for (const a of layers[li]) {
        for (const b of layers[li + 1]) {
          edges.push({ a, b });
        }
      }
    }
  }

  /* ----------------------------------------------------------
     Spawn a wave of pulses: pick a handful of edges near the
     input layer so signals appear to flow forward through the net.
  ---------------------------------------------------------- */
  function spawnPulses(now) {
    if (pulses.length >= MAX_PULSES) return;
    // Bias toward front-half edges so pulses travel forward.
    const picks = 3 + Math.floor(edges.length / 22);
    for (let k = 0; k < picks; k++) {
      const ei = (Math.sin(now * 0.0021 + k * 1.7) * 0.5 + 0.5) * edges.length;
      const edge = edges[Math.floor(ei) % edges.length];
      if (!edge) continue;
      pulses.push({ edge, t: 0 });
      if (pulses.length >= MAX_PULSES) break;
    }
  }

  /* ----------------------------------------------------------
     Render one frame.
  ---------------------------------------------------------- */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // edges (faint base)
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.edge;
    ctx.beginPath();
    for (const e of edges) {
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
    }
    ctx.stroke();

    // hot edges under active pulses — brighten the path being traveled
    for (const p of pulses) {
      ctx.strokeStyle = COLORS.edgeHot;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5 * (1 - p.t * 0.6);
      ctx.beginPath();
      ctx.moveTo(p.edge.a.x, p.edge.a.y);
      ctx.lineTo(p.edge.b.x, p.edge.b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // pulse dots
    for (const p of pulses) {
      const x = p.edge.a.x + (p.edge.b.x - p.edge.a.x) * p.t;
      const y = p.edge.a.y + (p.edge.b.y - p.edge.a.y) * p.t;
      ctx.fillStyle = COLORS.pulse;
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // nodes — soft halo + solid core, brighter on the input/output layers
    for (let li = 0; li < layers.length; li++) {
      const layer = layers[li];
      const isEdge = li === 0 || li === layers.length - 1;
      for (let i = 0; i < layer.length; i++) {
        const n = layer[i];
        // halo
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, NODE_GLOW_R);
        grad.addColorStop(0, COLORS.nodeGlow);
        grad.addColorStop(1, 'rgba(0,255,102,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, NODE_GLOW_R, 0, Math.PI * 2);
        ctx.fill();
        // core
        ctx.fillStyle = isEdge ? COLORS.node : COLORS.nodeDim;
        ctx.beginPath();
        ctx.arc(n.x, n.y, NODE_R, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* ----------------------------------------------------------
     Static render for reduced-motion: draw the mesh once, no
     pulses, no loop.
  ---------------------------------------------------------- */
  function drawStatic() {
    layout();
    // pull a single faint pass of edges + nodes only
    pulses = [];
    draw();
  }

  /* ----------------------------------------------------------
     Animation loop.
  ---------------------------------------------------------- */
  let prev = 0;
  function frame(ts) {
    if (!prev) prev = ts;
    const dt = Math.min(48, ts - prev);
    prev = ts;

    // advance pulses
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += PULSE_SPEED * dt;
      if (p.t >= 1) {
        // small chance to cascade into a following edge
        pulses.splice(i, 1);
      }
    }

    // spawn new waves on a cadence
    if (ts - lastPulse > PULSE_GAP_MS) {
      lastPulse = ts;
      spawnPulses(ts);
    }

    draw();
    rafId = requestAnimationFrame(frame);
  }

  /* ----------------------------------------------------------
     Visibility: pause the loop when the tab is hidden so we
     don't burn CPU in the background.
  ---------------------------------------------------------- */
  function onVisibility() {
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    } else if (!REDUCED) {
      prev = 0;
      if (!rafId) rafId = requestAnimationFrame(frame);
    }
  }

  /* ----------------------------------------------------------
     Resize handling — debounced via rAF.
  ---------------------------------------------------------- */
  let resizeRaf = null;
  function onResize() {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      layout();
      // cull pulses whose edges may have shifted; simplest: clear them
      pulses = [];
    });
  }

  /* ----------------------------------------------------------
     Boot. Defer until the loader has lifted so the first frame
     paints against the real viewport; if there's no loader, run
     immediately.
  ---------------------------------------------------------- */
  function start() {
    layout();
    if (REDUCED) {
      drawStatic();
      return;
    }
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    rafId = requestAnimationFrame(frame);
  }

  function boot() {
    const loader = document.getElementById('loader');
    if (loader) {
      // The loader removes itself from the DOM after lift-off; watch
      // for its departure so we begin animating the real background.
      const obs = new MutationObserver(() => {
        if (!document.getElementById('loader')) {
          obs.disconnect();
          start();
        }
      });
      obs.observe(document.body, { childList: true });
      // Safety: if the loader lingers, start anyway after 4s.
      setTimeout(() => {
        if (!rafId && !REDUCED) {
          obs.disconnect();
          start();
        }
      }, 4000);
    } else {
      start();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
