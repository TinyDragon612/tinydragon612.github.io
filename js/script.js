// Show the tab with the given id (does not modify history)
function showTab(name) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.classList.remove('active'));
  const el = document.getElementById(name);
  if (el) {
    el.classList.add('active');
    // Load content if data-src is present and content is empty
    const src = el.getAttribute('data-src');
    if (src && el.innerHTML.trim() === '') {
      fetch(src)
        .then(response => response.text())
        .then(html => {
          el.innerHTML = html;
          // If Prism is loaded, highlight any code blocks
          if (window.Prism) {
            const codes = el.querySelectorAll('pre code');
            codes.forEach(c => Prism.highlightElement(c));
          }
        })
        .catch(error => console.error('Error loading content:', error));
    }
  }
}

// Change location hash to create a history entry; the hashchange
// listener will call showTab.
function openTab(name) {
  location.hash = name;
}

// When the hash changes (including when a link with href='#...' is clicked),
// show the correct tab.
window.addEventListener('hashchange', () => {
  const name = location.hash.replace(/^#/, '') || 'home';
  showTab(name);
});

// If a fragment link is clicked but the hash doesn't change (clicking the
// same anchor), call showTab directly so the UI still responds.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const name = a.getAttribute('href').replace(/^#/, '');
  // allow normal navigation (hash will update), but if hash is unchanged,
  // ensure the tab is shown.
  if (location.hash.replace(/^#/, '') === name) {
    e.preventDefault();
    showTab(name);
  }
});

// On initial load, show tab from hash or default to 'home'.
(function initFromHash() {
  const name = location.hash.replace(/^#/, '') || 'home';
  showTab(name);
})();
