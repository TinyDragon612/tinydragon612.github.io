function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const el = document.getElementById(name);
  if (!el) return;
  el.classList.add('active');
  const src = el.getAttribute('data-src');
  if (src && el.innerHTML.trim() === '') {
    fetch(src)
      .then(r => r.text())
      .then(html => {
        el.innerHTML = html;
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

showTab(location.hash.slice(1) || 'home');

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
    if (cell) cell.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  });
  grid.addEventListener('mouseout', e => {
    const cell = e.target.closest('.box-cell');
    if (cell) cell.style.backgroundColor = '';
  });
})();
