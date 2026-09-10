from pathlib import Path
import qrcode

TARGET = 'https://www.restorewithellis.com/book.html?therapist=hunter&promo=HUNTER30'
OUTPUT = Path(__file__).resolve().parents[1] / 'hunter-30-off-qr.png'

image = qrcode.make(TARGET)
image.save(OUTPUT)
print(OUTPUT)
print(TARGET)

if not OUTPUT.exists() or OUTPUT.stat().st_size == 0:
    raise SystemExit('QR output was not created')
