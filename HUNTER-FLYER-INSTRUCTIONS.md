# Ellis Restorative Therapies — Hunter September Flyer

## Print-ready files

Use the PDF for professional printing. It is a one-page landscape business-card layout sized at **3.5 × 2 inches** and rendered at **300 DPI**.

- `hunter-september-30-off-business-card.pdf` — recommended print file
- `hunter-september-30-off-business-card.png` — 1050 × 600 pixel preview/print image at 300 DPI
- `hunter-september-30-off-business-card.svg` — source wrapper for the rendered design
- `hunter-30-off-qr.png` — standalone QR code
- `tools/create_hunter_flyer.py` — reproducible source script

## Printing instructions

1. Download `hunter-september-30-off-business-card.pdf`.
2. Print at **100% / Actual Size**. Do not choose “Fit to Page” or “Scale to Fit.”
3. Use heavy matte or satin cardstock, ideally 100–130 lb cover stock.
4. Print in color, landscape orientation, one side.
5. If printing on letter-size paper, place multiple copies per sheet using your printer or print shop’s business-card template, then cut to the trim size of **3.5 × 2 inches**.
6. Test-scan the QR code from the printed copy before producing a large batch.

## Offer details shown on the flyer

- Therapist: **Hunter Ellis**
- Offer: **$30 off**
- Code: **HUNTER30**
- Valid for: **September appointments only**
- Eligible services: Hunter’s 60-, 90-, or 120-minute sessions
- Address: **2209 Coffee Rd, Suite M, Modesto, CA 95355**
- Phone: **(209) 450-5296**
- Website: **restorewithellis.com**

## Important live-site note

The flyer’s QR destination is:

`https://www.restorewithellis.com/book.html?therapist=hunter&promo=HUNTER30`

The QR is correct, but the public Hostinger site must contain the updated booking files before visitors see the promotion field. Upload the current versions of these files to the live site’s public root:

- `book.html`
- `index.html`
- `contact.html`
- `faq.html`
- `proxy.php`
- `hunter-30-off-qr.png`

The booking backend also needs the updated Apps Script source deployed as a new version. The server-side rule only accepts `HUNTER30` for Hunter Ellis appointments dated in September.

## Source repository

The updated source is committed to:

https://github.com/Dropthathate/ellis-restorative-therapies

Latest relevant commit: `3c5158a`.
