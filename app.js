/* ============================================================
   1. Skills strip — seamless infinite scroll
   The pill run is cloned once, then the track is animated by
   exactly one run width, so the loop has no visible seam.
   ============================================================ */
(function initNavMarquee() {
  const nav = document.querySelector('.site-nav');
  const track = nav && nav.querySelector('.site-nav-track');
  if (!nav || !track) return;

  const PX_PER_SECOND = 70;   // scroll speed — raise to go faster

  const originals = Array.from(track.children);
  if (!originals.length) return;

  function build() {
    // Remove any previous clones before re-measuring.
    Array.from(track.querySelectorAll('[data-clone]')).forEach(n => n.remove());

    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    const runWidth = track.scrollWidth + gap;   // one run, plus the gap before the clone

    const clone = document.createDocumentFragment();
    originals.forEach(node => {
      const c = node.cloneNode(true);
      c.setAttribute('data-clone', '');
      c.setAttribute('aria-hidden', 'true');
      c.setAttribute('tabindex', '-1');
      clone.appendChild(c);
    });
    track.appendChild(clone);

    track.style.setProperty('--run-width', runWidth + 'px');
    track.style.setProperty('--marquee-dur', (runWidth / PX_PER_SECOND) + 's');
    nav.classList.add('site-nav--running');
  }

  // Fonts change pill widths, so measure after they load.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(build);
  } else {
    build();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });
})();


/* ============================================================
   2. "Campbell" font cycle
   Steps through the 12 Header variants from the Figma and holds
   longer on the initial (Default) face each time it comes round.
   ============================================================ */
(function initBrandFontCycle() {
  const el = document.querySelector('.brand-first');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const VARIANT_COUNT = 12;   // Default + Variant2..Variant12
  const STEP_MS = 2000;       // time on each of the other faces
  const HOLD_MS = 6000;       // longer pause on the initial face

  let i = 0;
  el.classList.add('brand-font-0');

  function step() {
    el.classList.remove('brand-font-' + i);
    i = (i + 1) % VARIANT_COUNT;
    el.classList.add('brand-font-' + i);
    setTimeout(step, i === 0 ? HOLD_MS : STEP_MS);
  }

  setTimeout(step, HOLD_MS);
})();


/* ============================================================
   3. Contact address
   Kept out of the page source as two halves so scrapers that read
   the raw HTML don't harvest it; assembled here for real visitors.
   ============================================================ */
(function initEmail() {
  const el = document.getElementById('email-link');
  if (!el) return;
  const addr = el.dataset.u + '@' + el.dataset.d;
  el.textContent = addr;
  el.href = 'mailto:' + addr;
})();


/* ============================================================
   4. Document banners
   PDFs are drawn into the page with pdf.js rather than dropped into an
   iframe: the native viewer is missing in some embedded browsers, and
   iOS Safari renders only the first page of an embedded PDF. pdf.js is
   fetched on first open, and pages render as they scroll into view, so
   a page with several documents stays cheap until one is opened.
   ============================================================ */
(function initDocBanners() {
  const banners = document.querySelectorAll('.doc-banner');
  if (!banners.length) return;

  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  let loading = null;

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PDFJS;
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER;
        resolve(window.pdfjsLib);
      };
      s.onerror = () => reject(new Error('pdf.js failed to load'));
      document.head.appendChild(s);
    });
    return loading;
  }

  function fallback(view, src, msg) {
    view.innerHTML = '<p class="doc-fallback">' + msg +
      ' <a href="' + src + '" target="_blank" rel="noopener">Open the PDF in a new tab</a>.</p>';
  }

  async function renderInto(view, src) {
    view.innerHTML = '<p class="doc-fallback">Loading document…</p>';
    let lib;
    try { lib = await loadPdfJs(); }
    catch { return fallback(view, src, 'The viewer could not load.'); }

    let doc;
    try { doc = await lib.getDocument(src).promise; }
    catch { return fallback(view, src, 'This document could not be opened.'); }

    view.innerHTML = '';
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const holder = document.createElement('div');
      holder.className = 'doc-page';
      holder.dataset.page = String(n);
      view.appendChild(holder);
      pages.push(holder);
    }

    const drawn = new Set();
    async function draw(holder) {
      const n = Number(holder.dataset.page);
      if (drawn.has(n)) return;
      drawn.add(n);
      const page = await doc.getPage(n);
      const width = holder.clientWidth || view.clientWidth || 900;
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2, width / base.width) * (window.devicePixelRatio || 1);
      const vp = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(vp.width);
      canvas.height = Math.round(vp.height);
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      holder.appendChild(canvas);
      // reserve the right height before the draw so the page doesn't jump
      holder.style.aspectRatio = base.width + ' / ' + base.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { draw(e.target); io.unobserve(e.target); } });
    }, { root: view, rootMargin: '400px 0px' });
    pages.forEach(p => io.observe(p));

    const count = document.createElement('p');
    count.className = 'doc-count';
    count.textContent = doc.numPages + (doc.numPages === 1 ? ' page' : ' pages');
    view.appendChild(count);
  }

  banners.forEach(btn => {
    const view = btn.nextElementSibling;
    const cue = btn.querySelector('.doc-cue');
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      view.hidden = open;
      if (cue) cue.textContent = open ? 'Read' : 'Close';
      if (!open && !view.dataset.ready) {
        view.dataset.ready = '1';
        renderInto(view, btn.dataset.src);
      }
    });
  });
})();
