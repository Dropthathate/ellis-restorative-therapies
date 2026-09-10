from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_PNG = ROOT / 'hunter-september-30-off-business-card.png'
OUT_PDF = ROOT / 'hunter-september-30-off-business-card.pdf'
OUT_SVG = ROOT / 'hunter-september-30-off-business-card.svg'
LOGO = ROOT / 'logo.png'
QR = ROOT / 'hunter-30-off-qr.png'

W, H = 1050, 600  # 3.5 x 2 inches at 300 DPI
img = Image.new('RGB', (W, H), '#f3f0e8')
d = ImageDraw.Draw(img)

# Palette from the ERT site.
ink = '#173a3b'
red = '#963641'
teal = '#16717c'
muted = '#536363'
cream = '#f3f0e8'
white = '#ffffff'

# Fonts available on the sandbox; all text is rendered deterministically.
font_dir = Path('/usr/share/fonts/truetype/dejavu')
def font(name, size):
    return ImageFont.truetype(font_dir / name, size)

bold = font('DejaVuSans-Bold.ttf', 34)
heavy = font('DejaVuSans-Bold.ttf', 62)
medium = font('DejaVuSans.ttf', 24)
small = font('DejaVuSans.ttf', 18)
small_bold = font('DejaVuSans-Bold.ttf', 18)
tiny = font('DejaVuSans.ttf', 14)
tiny_bold = font('DejaVuSans-Bold.ttf', 14)

# Left brand panel.
d.rounded_rectangle((0, 0, 280, H), radius=0, fill=ink)
d.rectangle((260, 0, 280, H), fill=red)
logo = Image.open(LOGO).convert('RGBA')
# The supplied logo has a dark background that works with the panel.
logo.thumbnail((220, 220), Image.Resampling.LANCZOS)
img.paste(logo, (30, 56), logo)
d = ImageDraw.Draw(img)
d.text((34, 300), 'ELLIS', font=bold, fill=white)
d.text((34, 345), 'RESTORATIVE', font=small_bold, fill='#b9d3d0')
d.text((34, 372), 'THERAPIES', font=small_bold, fill='#b9d3d0')
d.line((34, 416, 226, 416), fill=teal, width=3)
d.text((34, 438), 'Modesto, California', font=small, fill=white)
d.text((34, 472), 'restorewithellis.com', font=tiny, fill='#b9d3d0')
d.text((34, 500), '(209) 450-5296', font=tiny, fill='#b9d3d0')

# Main offer area.
d = ImageDraw.Draw(img)
d.text((322, 48), 'SEPTEMBER SPECIAL', font=small_bold, fill=red)
d.text((320, 86), '$30 OFF', font=heavy, fill=ink)
d.text((322, 166), 'Hunter Ellis', font=bold, fill=teal)
d.text((322, 214), 'Therapeutic & neuromuscular massage', font=small, fill=muted)
d.text((322, 252), 'Use code', font=medium, fill=ink)
d.rounded_rectangle((430, 244, 680, 292), radius=8, fill=red)
d.text((460, 253), 'HUNTER30', font=small_bold, fill=white)
d.text((322, 320), 'Valid for September appointments only.', font=small_bold, fill=ink)
d.text((322, 350), 'Hunter Ellis sessions · 60, 90, or 120 minutes', font=small, fill=muted)
d.text((322, 386), 'Scan to book your session', font=medium, fill=ink)

# QR code in a clean white quiet zone.
qr = Image.open(QR).convert('RGB').resize((190, 190), Image.Resampling.NEAREST)
d.rounded_rectangle((800, 310, 1012, 522), radius=12, fill=white)
img.paste(qr, (811, 321))
d.text((822, 532), 'SCAN TO BOOK', font=tiny_bold, fill=red)

# Bottom details and fine print.
d.line((320, 560, 780, 560), fill='#c6d3cf', width=2)
d.text((322, 570), '2209 Coffee Rd, Suite M · Modesto, CA 95355', font=tiny, fill=muted)
d.text((805, 570), 'One code per booking.', font=tiny, fill=muted)

# Save 300-DPI print PNG and PDF.
img.save(OUT_PNG, dpi=(300, 300), optimize=True)
img.save(OUT_PDF, 'PDF', resolution=300.0)

# Also provide a compact source record for editable/reproducible production.
OUT_SVG.write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="3.5in" height="2in" viewBox="0 0 1050 600"><!-- Recreate with tools/create_hunter_flyer.py for exact print output. --><image href="hunter-september-30-off-business-card.png" width="1050" height="600"/></svg>\n''', encoding='utf-8')
print(OUT_PNG)
print(OUT_PDF)
print(OUT_SVG)
