/* ============================================================
   THE BLUEPRINT OF INTELLIGENCE — PHASE 01
   Core layout script
   - Generates coordinate axis ticks (top/bottom bars)
   - Assigns per-era [X:..,Y:..] coordinate readouts
   - Scroll-reveal for schematic era sheets
   - Tracks the "active" era along the central timeline axis
   - Lightweight: no widgets yet (Phase 02 will mount into
     .widget-slot[data-widget="..."] containers)
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     0. Loading screen — fake AI chatbot prompt page
        Types "The history of You." into the prompt box, then
        fades + lifts out of frame on Enter (or click).
  ---------------------------------------------------------- */
  function wireLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    const textEl = document.getElementById('loader-text');
    const cursorEl = document.getElementById('loader-cursor');
    const placeholderEl = document.getElementById('loader-placeholder');
    const hintEl = document.getElementById('loader-hint');
    if (!textEl || !cursorEl || !placeholderEl || !hintEl) return;

    const PHRASE = 'The history of You.';
    const TYPE_STEP_MS = 72;          // base per-character cadence
    const START_DELAY_MS = 600;       // beat before typing begins
    const LEAD_OUT_MS = 220;          // pause after Enter before lift-off
    const LIFT_MS = 700;              // matches the CSS transition

    let i = 0;
    let leaving = false;
    let typingTimer = null;

    // Lock background scroll while the loader is on screen.
    document.documentElement.style.overflow = 'hidden';

    const typeNext = () => {
      if (i >= PHRASE.length) {
        hintEl.classList.add('is-shown');
        return;
      }
      textEl.textContent += PHRASE[i];
      i++;
      // slight humanized jitter (page JS — Math.random is fine here)
      typingTimer = setTimeout(typeNext, TYPE_STEP_MS + Math.random() * 45);
    };

    setTimeout(() => {
      placeholderEl.classList.add('is-hidden');
      typeNext();
    }, START_DELAY_MS);

    const leave = () => {
      if (leaving) return;
      leaving = true;
      if (typingTimer) clearTimeout(typingTimer);
      // make sure the full phrase reads before lift-off
      textEl.textContent = PHRASE;
      cursorEl.classList.add('idle');

      setTimeout(() => {
        loader.classList.add('is-leaving');
        document.documentElement.style.overflow = '';
        // drop it from the DOM once the transition has finished
        setTimeout(() => loader.remove(), LIFT_MS + 50);
      }, LEAD_OUT_MS);
    };

    const onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.removeEventListener('keydown', onKey);
        leave();
      }
    };
    document.addEventListener('keydown', onKey);
    // also allow click-to-continue
    loader.addEventListener('click', leave);
  }

  /* ----------------------------------------------------------
     1. Coordinate tick bars
     Each bar is filled with evenly-spaced ticks labelled with a
     running X (top) / Y (bottom) coordinate so the page reads as
     a technical schematic frame.
  ---------------------------------------------------------- */
  function buildCoordBars() {
    const top = document.getElementById('coord-top');
    const bottom = document.getElementById('coord-bottom');
    if (!top || !bottom) return;

    const TICKS = 14;
    const fmt = (n, axis) => `${axis}:${String(n).padStart(2, '0')}`;

    const make = (axis) => {
      const frag = document.createDocumentFragment();
      for (let i = 0; i <= TICKS; i++) {
        const span = document.createElement('span');
        span.className = 'tick';
        span.textContent = `[${fmt(i, axis)}]`;
        frag.appendChild(span);
      }
      return frag;
    };

    top.appendChild(make('X'));
    bottom.appendChild(make('Y'));
  }

  /* ----------------------------------------------------------
     2. Tag each era sheet as a scroll-reveal target
  ---------------------------------------------------------- */
  function tagRevealTargets() {
    document.querySelectorAll('.era-sheet').forEach((el) => {
      el.classList.add('reveal');
    });
  }

  /* ----------------------------------------------------------
     3. Scroll-reveal + active-era tracking via IntersectionObserver
  ---------------------------------------------------------- */
  function wireScrollObservers() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reveal observer: fade sheets in as they enter the viewport.
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    document.querySelectorAll('.era-sheet').forEach((el) => {
      if (reduced) el.classList.add('is-visible');
      else revealObs.observe(el);
    });

    // Active-era observer: brighten the era closest to the viewport center.
    const activeObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const card = entry.target.querySelector('.era-card');
        if (!card) return;
        if (entry.isIntersecting) {
          document.querySelectorAll('.era-card.is-active').forEach((c) => c.classList.remove('is-active'));
          card.classList.add('is-active');
          updateStatusBar(entry.target);
        }
      });
    }, { threshold: 0.55 });

    document.querySelectorAll('.era-sheet').forEach((el) => activeObs.observe(el));
  }

  /* ----------------------------------------------------------
     4. Live status readout in the header (current era + year)
  ---------------------------------------------------------- */
  function updateStatusBar(eraEl) {
    const era = eraEl.getAttribute('data-era');
    const year = eraEl.getAttribute('data-year');
    const nav = document.querySelector('header nav');
    if (nav && era) {
      nav.innerHTML = `<span class="text-term">${era}</span>/05 ERAS · ${year || ''}`;
    }
  }

  /* ----------------------------------------------------------
     5. Live coordinate readout that follows the scroll position
        (updates the bottom-right frame coordinate in real time)
  ---------------------------------------------------------- */
  function wireLiveCoords() {
    const bottom = document.getElementById('coord-bottom');
    if (!bottom) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = (doc.scrollHeight - doc.clientHeight) || 1;
        const pct = Math.min(1, Math.max(0, window.scrollY / max));
        const yVal = Math.round(pct * 99);
        // Replace the last tick with a live marker
        const ticks = bottom.querySelectorAll('.tick');
        if (ticks.length) {
          const last = ticks[ticks.length - 1];
          last.textContent = `[Y:${String(yVal).padStart(2, '0')}]`;
          last.style.color = 'var(--term)';
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------
     6. Widget expand-on-click
        Clicking a widget slot expands it (full-width, brighter,
        larger) and restacks the era body so the widget leads and
        the prose drops below. Clicking again (or scrolling the
        slot out of view) collapses it. Clicks on interactive
        controls inside the widget are left alone.
  ---------------------------------------------------------- */
  function wireWidgetExpand() {
    const slots = document.querySelectorAll('.widget-slot[data-widget]');
    if (!slots.length) return;

    // Elements that should consume the click themselves, not toggle.
    const isInteractive = (el) =>
      el.closest('input, button, select, textarea, a, [contenteditable], .attn-token');

    const collapse = (slot) => {
      slot.classList.remove('is-expanded');
      slot.setAttribute('aria-expanded', 'false');
      const body = slot.closest('.era-body');
      if (body) body.classList.remove('is-widget-expanded');
    };

    const expand = (slot) => {
      slot.classList.add('is-expanded');
      slot.setAttribute('aria-expanded', 'true');
      const body = slot.closest('.era-body');
      if (body) body.classList.add('is-widget-expanded');
    };

    slots.forEach((slot) => {
      slot.setAttribute('aria-expanded', 'false');

      slot.addEventListener('click', (e) => {
        if (isInteractive(e.target)) return;
        if (slot.classList.contains('is-expanded')) collapse(slot);
        else expand(slot);
      });
    });

    // Shrink back down when the slot scrolls out of view.
    const collapseObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && entry.target.classList.contains('is-expanded')) {
          collapse(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });

    slots.forEach((slot) => collapseObs.observe(slot));
  }

  /* ----------------------------------------------------------
     7. Public mount point reserved for Phase 02 widgets.
        Each widget slot carries a data-widget identifier; the
        widget loader (Phase 02) will hydrate them in place.
  ---------------------------------------------------------- */
  function logWidgetSlots() {
    const slots = document.querySelectorAll('.widget-slot[data-widget]');
    const ids = Array.from(slots).map((s) => s.getAttribute('data-widget'));
    if (ids.length) {
      console.info(
        '%c[BLUEPRINT] Phase 01 shell ready · %d widget slots pending: %s',
        'color:#00FF66',
        ids.length,
        ids.join(', ')
      );
    }
  }

  /* ----------------------------------------------------------
     Boot
  ---------------------------------------------------------- */
  function init() {
    wireLoader();
    buildCoordBars();
    tagRevealTargets();
    wireScrollObservers();
    wireLiveCoords();
    wireWidgetExpand();
    logWidgetSlots();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Reserved export for Phase 02 widget hydration.
  window.BlueprintOfIntelligence = window.BlueprintOfIntelligence || { mountWidget: null };
})();
