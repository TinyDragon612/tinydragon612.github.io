// ── Redaction grades: shared by the About decipher and hover pixelation ──
const rxGrades = ['Redaction 100', 'Redaction 70', 'Redaction 50',
                  'Redaction 35', 'Redaction 20', 'Redaction 10'];
const rxReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let rxFontsReady = null;
const loadRxGrades = () =>
  rxFontsReady = rxFontsReady || Promise.all(rxGrades.map(g => document.fonts.load(`16px '${g}'`)));

// ── About text decipher: step down through the degraded grades ──
const decipherAbout = (() => {
  const stepMs = 170;
  let run = 0;
  return () => {
    const text = document.querySelector('.about-text');
    if (!text || rxReduced) return;
    const id = ++run;
    // wait for the grade fonts so every step renders, not the fallback
    loadRxGrades().then(() => {
      if (id !== run) return;
      rxGrades.forEach((g, i) => {
        setTimeout(() => {
          if (id === run) text.style.setProperty('--about-font', `'${g}', Georgia, serif`);
        }, i * stepMs);
      });
      setTimeout(() => {
        if (id === run) text.style.removeProperty('--about-font');
      }, rxGrades.length * stepMs);
    });
  };
})();

// ── Hover pixelation: words snap to the roughest grade, then re-resolve ──
// wrap each word in a span so it can carry its own font
function wrapWords(el) {
  if (el.dataset.rxWrapped) return;
  el.dataset.rxWrapped = 'true';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    if (!node.nodeValue.trim()) return;
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/\s/.test(part)) {
        frag.appendChild(document.createTextNode(part));
      } else {
        const span = document.createElement('span');
        span.className = 'rx-word';
        span.textContent = part;
        frag.appendChild(span);
      }
    });
    node.parentNode.replaceChild(frag, node);
  });
}

(function initPixelHover() {
  // static targets: the whole About text plus the landing and section titles
  document.querySelectorAll(
    '.about-text h1, .about-text h2, .about-text p:not(.about-updated), .home-content h1, #blog > h1, #projects > h1'
  ).forEach(wrapWords);

  const back = rxGrades.slice(1);
  document.addEventListener('mouseover', e => {
    const word = e.target.closest('.rx-word');
    if (!word) return;
    loadRxGrades();
    (word._rx || []).forEach(clearTimeout);
    word.style.fontFamily = "'Redaction 100', Georgia, serif";
  });
  document.addEventListener('mouseout', e => {
    const word = e.target.closest('.rx-word');
    if (!word) return;
    if (rxReduced) { word.style.fontFamily = ''; return; }
    word._rx = back.map((g, i) =>
      setTimeout(() => { word.style.fontFamily = `'${g}', Georgia, serif`; }, (i + 1) * 110));
    word._rx.push(setTimeout(() => { word.style.fontFamily = ''; }, (back.length + 1) * 110));
  });
})();

function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const el = document.getElementById(name);
  if (!el) return;
  el.classList.add('active');
  if (name === 'about') decipherAbout();

  // highlight the nav tab for the current section (posts → Blog, projects → Projects)
  const section = name.startsWith('post-') ? 'blog'
                : name.startsWith('project-') ? 'projects'
                : name;
  document.querySelectorAll('nav a').forEach(a =>
    a.classList.toggle('active', a.getAttribute('href') === '#' + section));
  const src = el.getAttribute('data-src');
  if (src && el.innerHTML.trim() === '') {
    fetch(src)
      .then(r => r.text())
      .then(html => {
        el.innerHTML = html;
        // page titles get the hover pixelation once the fragment lands
        el.querySelectorAll('h1, .likes-heading').forEach(wrapWords);
        if (window.Prism) el.querySelectorAll('pre code').forEach(c => Prism.highlightElement(c));
      })
      .catch(err => console.error('Error loading content:', err));
  }
}

document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const name = a.getAttribute('href').slice(1);
  if (!name) return;
  e.preventDefault();
  history.pushState(null, '', '#' + name);
  showTab(name);
});

window.addEventListener('popstate', () => {
  showTab(location.hash.slice(1) || 'home');
});

// ── Dark mode toggle (initial theme is applied inline in <head>) ──
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
});

showTab(location.hash.slice(1) || 'home');

// ── About page decorative grid ──
(function initAboutDeco() {
  const panel = document.getElementById('about-deco');
  const text = document.querySelector('.about-text');
  if (!panel || !text) return;

  const cols = 9, cellSize = 22, baseRows = 16;
  const colors = [
    'rgb(186 230 253)', 'rgb(251 207 232)', 'rgb(187 247 208)',
    'rgb(254 240 138)', 'rgb(254 202 202)', 'rgb(233 213 255)',
    'rgb(191 219 254)', 'rgb(199 210 254)', 'rgb(221 214 254)'
  ];

  // bar heights per column (out of `baseRows`, scaled to the actual row count)
  const baseHeights = [7, 11, 5, 14, 9, 6, 13, 8, 10];

  let rows = 0;

  function build() {
    let html = '';
    for (let c = 0; c < cols; c++) {
      const barHeight = Math.max(1, Math.round(baseHeights[c] * rows / baseRows));
      html += '<div class="deco-col">';
      for (let r = 0; r < rows; r++) {
        const filled = r >= rows - barHeight;
        const style = filled ? `background:${colors[c % colors.length]}` : '';
        html += `<div class="deco-cell" style="${style}"></div>`;
      }
      html += '</div>';
    }
    panel.innerHTML = html;
  }

  // on the first reveal, wipe the fill and cascade it back in: bars grow
  // bottom-up, columns sweep left to right
  let entered = false;
  function entrance() {
    if (entered) return;
    entered = true;
    if (rxReduced) return;
    [...panel.children].forEach((colEl, c) => {
      [...colEl.children].forEach((cell, r) => {
        const color = cell.style.backgroundColor;
        if (!color) return;
        cell.style.transition = 'background-color 0ms';
        cell.style.backgroundColor = '';
        setTimeout(() => {
          cell.style.transition = 'background-color 450ms ease';
          cell.style.backgroundColor = color;
        }, 150 + c * 70 + (colEl.children.length - 1 - r) * 35);
      });
    });
  }

  // match the grid height to the text column; the tab is display:none at
  // load, so the observer builds it once the tab first becomes visible
  function sync() {
    const target = Math.round(text.offsetHeight / cellSize);
    if (target > 0 && target !== rows) {
      rows = target;
      build();
      entrance();
    }
  }

  new ResizeObserver(sync).observe(text);
  sync();

  // the build() pattern color for a given cell
  function patternColor(col, row) {
    const barHeight = Math.max(1, Math.round(baseHeights[col] * rows / baseRows));
    return row >= rows - barHeight ? colors[col % colors.length] : '';
  }

  // while the mouse is actively moving over the grid, hold off any drift-back
  let lastMove = 0;
  panel.addEventListener('mousemove', () => { lastMove = Date.now(); });

  function scheduleDrift(cell, col, row, delay) {
    clearTimeout(cell._drift);
    cell._drift = setTimeout(() => {
      if (Date.now() - lastMove < 500) {
        scheduleDrift(cell, col, row, 400 + Math.random() * 900);
        return;
      }
      cell.style.transition = 'background-color 2400ms ease';
      cell.style.backgroundColor = patternColor(col, row);
    }, delay);
  }

  panel.addEventListener('mouseover', e => {
    const cell = e.target.closest('.deco-cell');
    if (!cell) return;
    clearTimeout(cell._drift);
    cell.style.transition = 'background-color 0ms';
    cell.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  });
  panel.addEventListener('mouseout', e => {
    const cell = e.target.closest('.deco-cell');
    if (!cell) return;
    const col = [...cell.parentElement.parentElement.children].indexOf(cell.parentElement);
    const row = [...cell.parentElement.children].indexOf(cell);
    // reveal the starting pattern flipped over the x axis and then the y axis
    // (a 180° rotation): bars hang from the top, column order mirrored
    cell.style.transition = 'background-color 600ms ease';
    cell.style.backgroundColor = patternColor(cols - 1 - col, rows - 1 - row);
    // after a while, drift back to the original pattern
    scheduleDrift(cell, col, row, 3500 + Math.random() * 3000);
  });
})();

// ── Background boxes for home tab ──
(function initBoxes() {
  const grid = document.getElementById('boxes-grid');
  if (!grid) return;

  const rows = 150, cols = 100;
  const colors = [
    'rgb(186 230 253)', 'rgb(251 207 232)', 'rgb(187 247 208)',
    'rgb(254 240 138)', 'rgb(254 202 202)', 'rgb(233 213 255)',
    'rgb(191 219 254)', 'rgb(199 210 254)', 'rgb(221 214 254)'
  ];
  const svgPlus = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="box-plus"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6"/></svg>`;

  let html = '';
  for (let i = 0; i < rows; i++) {
    html += '<div class="box-row">';
    for (let j = 0; j < cols; j++) {
      html += `<div class="box-cell">${(i % 2 === 0 && j % 2 === 0) ? svgPlus : ''}</div>`;
    }
    html += '</div>';
  }
  grid.innerHTML = html;

  grid.addEventListener('mouseover', e => {
    const cell = e.target.closest('.box-cell');
    if (cell) {
      cell.style.transition = 'background-color 0ms';
      cell.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    }
  });
  grid.addEventListener('mouseout', e => {
    const cell = e.target.closest('.box-cell');
    if (cell) {
      cell.style.transition = 'background-color 600ms ease';
      cell.style.backgroundColor = '';
    }
  });
})();
