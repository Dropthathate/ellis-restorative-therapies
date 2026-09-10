from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, random

ROOT = Path(__file__).resolve().parents[1]
OUT_PNG = ROOT / 'hunter-september-30-off-business-card-glassmorphism.png'
OUT_PDF = ROOT / 'hunter-september-30-off-business-card-glassmorphism.pdf'
LOGO = ROOT / 'logo.png'
QR = ROOT / 'hunter-30-off-qr.png'
W, H = 1050, 600
random.seed(17)

# Futuristic ERT palette: midnight, teal, mint, cyan, and restrained crimson.
navy = (5, 16, 27)
navy2 = (7, 31, 43)
teal = (41, 198, 205)
mint = (174, 255, 230)
white = (239, 255, 252)
muted = (173, 208, 210)
red = (188, 73, 92)

font_dir = Path('/usr/share/fonts/truetype/dejavu')
def font(name, size):
    return ImageFont.truetype(font_dir / name, size)
regular = font('DejaVuSans.ttf', 18)
small = font('DejaVuSans.ttf', 15)
small_bold = font('DejaVuSans-Bold.ttf', 17)
label = font('DejaVuSans-Bold.ttf', 14)
headline = font('DejaVuSans-Bold.ttf', 68)
subhead = font('DejaVuSans-Bold.ttf', 31)
code_font = font('DejaVuSans-Bold.ttf', 25)

# Gradient base.
img = Image.new('RGB', (W, H), navy)
p = img.load()
for y in range(H):
    for x in range(W):
        glow = max(0, 1 - math.hypot(x - 760, y - 250) / 650)
        p[x, y] = (
            int(navy[0] + 5 * glow),
            int(navy[1] + 31 * glow),
            int(navy[2] + 42 * glow),
        )

# Technical background layer: circuit traces, nodes, orbital lines, and molecular hexagons.
bg = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(bg)
for i in range(34):
    x = random.randint(20, W - 20); y = random.randint(18, H - 18)
    col = (*teal, random.randint(25, 75))
    pts = [(x, y)]
    for _ in range(random.randint(2, 5)):
        x += random.choice([-1, 1]) * random.randint(16, 42)
        y += random.choice([-1, 1]) * random.randint(10, 28)
        pts.append((x, y))
    d.line(pts, fill=col, width=2)
    for px, py in pts[1:]: d.ellipse((px-3, py-3, px+3, py+3), fill=(*mint, 85))
for i in range(12):
    cx = random.randint(0, W); cy = random.randint(0, H); r = random.randint(18, 50)
    d.ellipse((cx-r, cy-r, cx+r, cy+r), outline=(*teal, 28), width=2)
    d.ellipse((cx-r//3, cy-r//3, cx+r//3, cy+r//3), outline=(*mint, 30), width=1)
for i in range(8):
    x = random.randint(50, W-50); y = random.randint(45, H-45); s = random.randint(10, 25)
    hexpts = [(x+s*math.cos(math.pi/3*j), y+s*math.sin(math.pi/3*j)) for j in range(6)]
    d.line(hexpts+[hexpts[0]], fill=(*mint, 42), width=2)
img = Image.alpha_composite(img.convert('RGBA'), bg)

# Glowing radial accent behind the offer.
glow = Image.new('RGBA', (W, H), (0,0,0,0))
gd = ImageDraw.Draw(glow)
for r in range(260, 10, -8):
    a = int(2 + 12 * (1 - r / 260))
    gd.ellipse((785-r, 275-r, 785+r, 275+r), fill=(21, 210, 197, a))
glow = glow.filter(ImageFilter.GaussianBlur(30))
img = Image.alpha_composite(img, glow)

def glass_card(base, box, radius=22, fill=(190, 255, 245, 24), outline=(174, 255, 230, 115), width=2):
    x1,y1,x2,y2 = box
    layer = Image.new('RGBA', base.size, (0,0,0,0))
    ld = ImageDraw.Draw(layer)
    ld.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)
    # top highlight and inner edge give a real glass edge rather than flat boxes
    ld.line((x1+radius, y1+2, x2-radius, y1+2), fill=(255,255,255,95), width=2)
    ld.rounded_rectangle((x1+8,y1+8,x2-8,y2-8), radius=max(4,radius-8), outline=(255,255,255,24), width=1)
    return Image.alpha_composite(base, layer)

# Left glass identity panel and right offer panel.
img = glass_card(img, (28, 28, 420, 572), radius=28, fill=(38, 101, 112, 42), outline=(174, 255, 230, 120))
img = glass_card(img, (435, 28, 1022, 572), radius=28, fill=(12, 36, 51, 120), outline=(41, 198, 205, 155))
d = ImageDraw.Draw(img)

# Real logo, preserved and framed.
logo = Image.open(LOGO).convert('RGBA')
logo.thumbnail((250, 250), Image.Resampling.LANCZOS)
logo_panel = Image.new('RGBA', (270, 270), (0,0,0,0))
lpd = ImageDraw.Draw(logo_panel)
lpd.rounded_rectangle((5,5,265,265), radius=24, fill=(4, 17, 26, 155), outline=(174,255,230,85), width=2)
logo_panel.alpha_composite(logo, ((270-logo.width)//2, (270-logo.height)//2))
img.alpha_composite(logo_panel, (89, 56))
d = ImageDraw.Draw(img)
d.text((65, 355), 'ELLIS', font=subhead, fill=white)
d.text((67, 397), 'RESTORATIVE THERAPIES', font=small_bold, fill=mint)
d.line((67, 435, 365, 435), fill=teal, width=3)
d.text((67, 456), 'Restore. Realign. Rebuild.', font=small, fill=muted)
d.text((67, 508), 'MODESTO, CALIFORNIA', font=label, fill=teal)

# Offer typography and glass code chip.
d.text((478, 62), 'SEPTEMBER // LIMITED OFFER', font=label, fill=mint)
d.text((475, 98), '$30 OFF', font=headline, fill=white)
d.text((480, 182), 'HUNTER ELLIS', font=subhead, fill=teal)
d.text((480, 224), 'THERAPEUTIC + NEUROMUSCULAR', font=label, fill=muted)
d.text((480, 247), 'MASSAGE', font=label, fill=muted)
d.text((480, 278), 'SCAN  •  ENTER CODE', font=label, fill=white)
img = glass_card(img, (480, 308, 705, 359), radius=12, fill=(188, 73, 92, 190), outline=(255, 170, 178, 150), width=2)
d = ImageDraw.Draw(img)
d.text((510, 320), 'HUNTER30', font=code_font, fill=white)
d.text((480, 387), 'VALID FOR SEPTEMBER APPOINTMENTS ONLY', font=small_bold, fill=mint)
d.text((480, 420), '60  ·  90  ·  120 MINUTE SESSIONS', font=small, fill=muted)
d.text((480, 466), '2209 Coffee Rd, Suite M  ·  Modesto, CA 95355', font=small, fill=white)
d.text((480, 502), 'restorewithellis.com   •   (209) 450-5296', font=small, fill=teal)

# QR glass tile; preserve a large white quiet zone for reliable scanning.
img = glass_card(img, (790, 80, 990, 302), radius=20, fill=(230, 255, 250, 24), outline=(174,255,230,120))
d = ImageDraw.Draw(img)
qr = Image.open(QR).convert('RGB').resize((158, 158), Image.Resampling.NEAREST)
d.rounded_rectangle((811, 100, 969, 258), radius=5, fill=white)
img.paste(qr, (811, 100))
d = ImageDraw.Draw(img)
d.text((817, 270), 'SCAN TO BOOK HUNTER', font=label, fill=white)

# Accent corners echo the reference’s technical geometry.
d.line((460, 48, 530, 48), fill=red, width=5)
d.line((460, 48, 460, 78), fill=red, width=5)
d.line((985, 531, 985, 560), fill=teal, width=5)
d.line((985, 560, 915, 560), fill=teal, width=5)

img = img.convert('RGB')
img.save(OUT_PNG, dpi=(300, 300), optimize=True)
img.save(OUT_PDF, 'PDF', resolution=300.0)
print(OUT_PNG)
print(OUT_PDF)
