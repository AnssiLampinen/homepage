// Load shared header
fetch('header.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('site-header').innerHTML = data;
    highlightActiveNav();
  });

// Load shared footer
fetch('footer.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('site-footer').innerHTML = data;
    setFooterYear();
  });

// Highlight active nav link
function highlightActiveNav() {
  const current = document.body.dataset.page;
  document.querySelectorAll('.nav a').forEach(a => {
    if (a.dataset.nav === current) a.classList.add('active');
  });
}

// Set dynamic footer year
function setFooterYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}
