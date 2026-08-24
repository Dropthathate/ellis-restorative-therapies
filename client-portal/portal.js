(() => {
  // 1. Check the URL for the custom promo code
  const urlParams = new URLSearchParams(window.location.search);
  const promoCode = urlParams.get('promo');
  let promoText = '';

  // 2. If a code exists, format it to be added to the email
  if (promoCode) {
    sessionStorage.setItem('activePromo', promoCode);
    promoText = `\n\nPromo Code Claimed: ${promoCode}`;
  }

  const form = document.querySelector('#access-request-form');
  const email = document.querySelector('#access-email');
  const note = document.querySelector('#access-request-note');

  if (!form || !email || !note) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!email.validity.valid) {
      note.textContent = 'Enter a valid email address to request access.';
      email.focus();
      return;
    }

    const subject = encodeURIComponent('ERT Client Portal Access Request');
    
    // 3. Inject the promoText into the email body
    const body = encodeURIComponent(
      `Hello Ellis Restorative Therapies,\n\nI would like to request access to the client portal.\n\nEmail for access: ${email.value}${promoText}\n\nPlease do not reply with private care details. Thank you.`
    );

    note.textContent = 'Your email app will open with a pre-addressed access request. Do not add care details to the request.';
    window.location.href = `mailto:restorewithellis@gmail.com?subject=${subject}&body=${body}`;
  });
})();
