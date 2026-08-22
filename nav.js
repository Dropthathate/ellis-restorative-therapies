// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('link[data-ert-legal-nav]')) {
    const legalStyle = document.createElement('link');
    legalStyle.rel = 'stylesheet';
    legalStyle.href = 'legal-nav.css';
    legalStyle.dataset.ertLegalNav = 'true';
    document.head.appendChild(legalStyle);
  }
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  // Active link highlight
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.includes(path) || (path === '' && href.includes('index'))) {
      a.classList.add('active');
    }
  });

  document.querySelectorAll('.footer-bottom').forEach((footerBottom) => {
    if (footerBottom.querySelector('.legal-nav')) return;
    const legalNav = document.createElement('nav');
    legalNav.className = 'legal-nav';
    legalNav.setAttribute('aria-label', 'Legal navigation');
    legalNav.innerHTML = '<a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="faq.html">FAQ</a>';
    footerBottom.appendChild(legalNav);
  });
});
