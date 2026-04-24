// ── Ellis Restorative Therapies · Email Capture ──
// Wired to Google Sheets via Apps Script.
// After deploying google-apps-script.js, paste your Web App URL below.

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwrP8rle6Ard8ZevCPzGXOJIVMIhbPTEGORFv00C7TbjM7fBL1DqVsGCoaTLTfZJOfW/exec';
// Example: 'https://script.google.com/macros/s/AKfycbXXXXXXXXXX/exec'

(function () {
  const STORAGE_KEY = 'ert_email_captured';
  const POPUP_DELAY = 12000; // 12 seconds
  const BAR_DELAY   = 6000;  // 6 seconds

  // ── Send email to Google Sheet ──
  async function subscribe(email, source) {
    try {
      await fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors', // required for Apps Script
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source })
      });
    } catch (err) {
      console.warn('[ERT] Subscription error:', err);
    }
    // Mark captured regardless — don't show forms again
    localStorage.setItem(STORAGE_KEY, '1');
  }

  function alreadyCaptured() {
    return localStorage.getItem(STORAGE_KEY) === '1';
  }

  // ────────────────────────────────────────────────
  // POPUP
  // ────────────────────────────────────────────────
  function initPopup() {
    const overlay = document.getElementById('ec-overlay');
    if (!overlay || alreadyCaptured()) return;
    setTimeout(() => overlay.classList.add('open'), POPUP_DELAY);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup();
    });
  }

  function closePopup() {
    const overlay = document.getElementById('ec-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  async function submitPopup() {
    const input = document.getElementById('ec-popup-email');
    const email = input ? input.value.trim() : '';
    if (!isValidEmail(email)) {
      input.style.borderColor = 'var(--red)';
      input.focus();
      return;
    }
    setLoading('ec-popup-submit', true);
    await subscribe(email, 'popup');
    document.getElementById('ec-popup-form').style.display = 'none';
    document.getElementById('ec-popup-success').classList.add('show');
    closeBar();
    setTimeout(closePopup, 3000);
  }

  window.closePopup  = closePopup;
  window.submitPopup = submitPopup;

  // ────────────────────────────────────────────────
  // FOOTER BAR
  // ────────────────────────────────────────────────
  function initBar() {
    const bar = document.getElementById('ec-bar');
    if (!bar || alreadyCaptured()) return;
    setTimeout(() => bar.classList.add('open'), BAR_DELAY);
  }

  function closeBar() {
    const bar = document.getElementById('ec-bar');
    if (bar) bar.classList.remove('open');
  }

  async function submitBar() {
    const input = document.getElementById('ec-bar-email');
    const email = input ? input.value.trim() : '';
    if (!isValidEmail(email)) {
      input.style.borderColor = 'var(--red)';
      input.focus();
      return;
    }
    setLoading('ec-bar-btn', true);
    await subscribe(email, 'footer-bar');
    input.value = '';
    input.placeholder = '✓ You\'re on the list!';
    input.disabled = true;
    const btn = document.getElementById('ec-bar-btn');
    if (btn) { btn.textContent = 'Done!'; btn.disabled = true; }
    setTimeout(closeBar, 2500);
  }

  window.closeBar  = closeBar;
  window.submitBar = submitBar;

  // ────────────────────────────────────────────────
  // HOMEPAGE SECTION
  // ────────────────────────────────────────────────
  async function submitSection() {
    const input = document.getElementById('ec-section-email');
    const email = input ? input.value.trim() : '';
    if (!isValidEmail(email)) {
      input.style.borderColor = 'var(--red)';
      input.focus();
      return;
    }
    setLoading('ec-section-btn', true);
    await subscribe(email, 'homepage-section');
    document.getElementById('ec-section-form-wrap').style.display = 'none';
    document.getElementById('ec-section-success').classList.add('show');
    closeBar();
  }

  window.submitSection = submitSection;

  // ────────────────────────────────────────────────
  // Enter key support
  // ────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (document.activeElement.id === 'ec-popup-email')   submitPopup();
      if (document.activeElement.id === 'ec-bar-email')     submitBar();
      if (document.activeElement.id === 'ec-section-email') submitSection();
    }
    if (e.key === 'Escape') closePopup();
  });

  // ────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────
  function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Sending…' : 'Subscribe';
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    initPopup();
    initBar();
  });

})();

(function () {
  const STORAGE_KEY = 'ert_email_captured';
  const POPUP_DELAY = 12000; // 12 seconds
  const BAR_DELAY   = 6000;  // 6 seconds

  // ── Stub: wire this up to your email service ──
  function subscribe(email, source) {
    // Example Mailchimp fetch call:
    // fetch('https://your-mc-endpoint', { method:'POST', body: JSON.stringify({email}) })
    console.log(`[ERT] New subscriber: ${email} (via ${source})`);
    localStorage.setItem(STORAGE_KEY, '1');
    return true;
  }

  function alreadyCaptured() {
    return localStorage.getItem(STORAGE_KEY) === '1';
  }

  // ────────────────────────────────────────────────
  // POPUP
  // ────────────────────────────────────────────────
  function initPopup() {
    const overlay = document.getElementById('ec-overlay');
    if (!overlay) return;

    if (alreadyCaptured()) return;

    setTimeout(() => overlay.classList.add('open'), POPUP_DELAY);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup();
    });
  }

  function closePopup() {
    const overlay = document.getElementById('ec-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function submitPopup() {
    const input = document.getElementById('ec-popup-email');
    const email = input ? input.value.trim() : '';
    if (!isValidEmail(email)) { input.focus(); input.style.borderColor = 'var(--red)'; return; }
    subscribe(email, 'popup');
    document.getElementById('ec-popup-form').style.display = 'none';
    document.getElementById('ec-popup-success').classList.add('show');
    setTimeout(closePopup, 3000);
    closeBar();
  }

  window.closePopup  = closePopup;
  window.submitPopup = submitPopup;

  // ────────────────────────────────────────────────
  // FOOTER BAR
  // ────────────────────────────────────────────────
  function initBar() {
    const bar = document.getElementById('ec-bar');
    if (!bar) return;

    if (alreadyCaptured()) return;

    setTimeout(() => bar.classList.add('open'), BAR_DELAY);
  }

  function closeBar() {
    const bar = document.getElementById('ec-bar');
    if (bar) bar.classList.remove('open');
  }

  function submitBar() {
    const input = document.getElementById('ec-bar-email');
    const email = input ? input.value.trim() : '';
    if (!isValidEmail(email)) { input.focus(); input.style.borderColor = 'var(--red)'; return; }
    subscribe(email, 'footer-bar');
    input.value = '';
    input.placeholder = '✓ You\'re on the list!';
    input.disabled = true;
    const btn = document.getElementById('ec-bar-btn');
    if (btn) { btn.textContent = 'Done!'; btn.disabled = true; }
    setTimeout(closeBar, 2500);
  }

  window.closeBar  = closeBar;
  window.submitBar = submitBar;

  // ────────────────────────────────────────────────
  // HOMEPAGE SECTION
  // ────────────────────────────────────────────────
  function submitSection() {
    const input = document.getElementById('ec-section-email');
    const email = input ? input.value.trim() : '';
    if (!isValidEmail(email)) { input.focus(); input.style.borderColor = 'var(--red)'; return; }
    subscribe(email, 'homepage-section');
    document.getElementById('ec-section-form-wrap').style.display = 'none';
    document.getElementById('ec-section-success').classList.add('show');
    closeBar();
  }

  window.submitSection = submitSection;

  // ────────────────────────────────────────────────
  // Enter key support
  // ────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (document.activeElement.id === 'ec-popup-email')   submitPopup();
      if (document.activeElement.id === 'ec-bar-email')     submitBar();
      if (document.activeElement.id === 'ec-section-email') submitSection();
    }
    if (e.key === 'Escape') closePopup();
  });

  // ────────────────────────────────────────────────
  // Util
  // ────────────────────────────────────────────────
  function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    initPopup();
    initBar();
  });

})();
