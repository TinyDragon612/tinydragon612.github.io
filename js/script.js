// Show the tab with the given id (does not modify history)
function showTab(name) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.classList.remove('active'));
  const el = document.getElementById(name);
  if (el) el.classList.add('active');
  // If Prism is loaded, highlight any code blocks inside the shown tab
  if (window.Prism && el) {
    const codes = el.querySelectorAll('pre code');
    codes.forEach(c => Prism.highlightElement(c));
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
  const a = e.target.closest('a[href^=\