from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, random

ROOT = Path(__file__).resolve().parents[1]
OUT_PNG = ROOT / 'hunter-september-30-off-business-card-exciting.png'
OUT_PDF = ROOT / 'hunter-september-30-off-business-card-exciting.pdf'
LOGO = ROOT / 'logo.png'
QR = ROOT / 'hunter-30-off-qr.png'
W, H = 1050, 600
random.seed(24)

navy=(2,8,18); deep=(5,18,31); cyan=(81,239,236); mint=(221,255,245); blue=(43,142,255); red=(229,67,91); gray=(160,207,211); white=(247,255,253)
font_dir=Path('/usr/share/fonts/truetype/dejavu')
def F(name,size): return ImageFont.truetype(font_dir/name,size)
mini=F('DejaVuSans-Bold.ttf',12); small=F('DejaVuSans.ttf',16); smallb=F('DejaVuSans-Bold.ttf',17); title=F('DejaVuSans-Bold.ttf',70); sub=F('DejaVuSans-Bold.ttf',29); code=F('DejaVuSans-Bold.ttf',27); contact=F('DejaVuSans.ttf',14)

img=Image.new('RGB',(W,H),navy); px=img.load()
for y in range(H):
  for x in range(W):
    g1=max(0,1-math.hypot(x-760,y-275)/520); g2=max(0,1-math.hypot(x-160,y-480)/390)
    px[x,y]=(int(2+3*g1),int(8+24*g1+10*g2),int(18+31*g1+24*g2))

# Neon technical field: angular traces and starburst energy.
bg=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(bg)
for i in range(70):
  x=random.randint(15,W-15); y=random.randint(12,H-12); pts=[(x,y)]
  for _ in range(random.randint(1,4)):
    x += random.choice([-1,1])*random.randint(14,42); y += random.choice([-1,1])*random.randint(8,30); pts.append((x,y))
  col=random.choice([(81,239,236,80),(43,142,255,66),(221,255,245,56)])
  d.line(pts,fill=col,width=random.choice([1,1,2]))
  for qx,qy in pts: d.ellipse((qx-2,qy-2,qx+2,qy+2),fill=(*col[:3],min(180,col[3]+40)))
for i in range(15):
  x=random.randint(20,W-20); y=random.randint(20,H-20); r=random.randint(16,45)
  d.ellipse((x-r,y-r,x+r,y+r),outline=(81,239,236,34),width=1)
# central energetic rays
cx,cy=765,278
for ang in [i*math.pi/14 for i in range(28)]:
  r=random.randint(160,360); x2=cx+math.cos(ang)*r; y2=cy+math.sin(ang)*r
  d.line((cx,cy,x2,y2),fill=(81,239,236,random.randint(15,45)),width=1)
img=Image.alpha_composite(img.convert('RGBA'),bg)

# Glow behind logo and offer.
glow=Image.new('RGBA',(W,H),(0,0,0,0)); gd=ImageDraw.Draw(glow)
for r in range(250,5,-8):
  a=int(2+14*(1-r/250)); gd.ellipse((180-r,270-r,180+r,270+r),fill=(43,142,255,a)); gd.ellipse((770-r,280-r,770+r,280+r),fill=(81,239,236,a))
glow=glow.filter(ImageFilter.GaussianBlur(38)); img=Image.alpha_composite(img,glow)

d=ImageDraw.Draw(img)
# Dramatic diagonal neon frame / energy shards.
d.line((24,64,24,22,315,22),fill=(81,239,236,210),width=4)
d.line((24,64,24,22,315,22),fill=(43,142,255,130),width=12)
d.line((735,578,1028,578,1028,524),fill=(81,239,236,220),width=4)
d.line((735,578,1028,578,1028,524),fill=(43,142,255,120),width=12)
d.line((316,22,386,92),fill=(229,67,91,220),width=4)
d.line((676,508,735,578),fill=(229,67,91,180),width=4)
for x,y in [(400,80),(725,50),(330,500),(1010,105)]:
  d.polygon([(x,y-22),(x+6,y-6),(x+25,y),(x+6,y+6),(x,y+24),(x-6,y+6),(x-26,y),(x-6,y-6)],outline=(81,239,236,150),fill=(81,239,236,28))

# Left logo stage.
d.rounded_rectangle((42,98,370,430),radius=28,fill=(4,18,30,170),outline=(81,239,236,120),width=2)
d.rounded_rectangle((55,111,357,417),radius=22,outline=(221,255,245,35),width=1)
logo=Image.open(LOGO).convert('RGBA'); logo.thumbnail((260,260),Image.Resampling.LANCZOS); img.alpha_composite(logo,(76,128))
d=ImageDraw.Draw(img)
d.text((67,455),'ELLIS',font=sub,fill=white)
d.text((68,495),'RESTORATIVE THERAPIES',font=smallb,fill=cyan)
d.text((68,528),'MODESTO  //  CALIFORNIA',font=mini,fill=gray)

# Right offer glass panel, more layered and energetic.
d.rounded_rectangle((400,64,1015,540),radius=30,fill=(6,27,43,190),outline=(81,239,236,165),width=2)
d.rounded_rectangle((414,78,1001,526),radius=22,outline=(221,255,245,40),width=1)
d.text((445,95),'SEPTEMBER // HUNTER ELLIS',font=mini,fill=mint)
d.text((442,121),'$30 OFF',font=title,fill=white)
d.text((446,206),'A BETTER RESET STARTS HERE.',font=smallb,fill=cyan)
d.text((446,248),'Scan. Book Hunter. Save $30.',font=small,fill=gray)
# Code chip
d.rounded_rectangle((442,292,704,350),radius=12,fill=(229,67,91,210),outline=(255,180,184,190),width=2)
d.text((485,307),'HUNTER30',font=code,fill=white)
d.text((445,373),'SEPTEMBER APPOINTMENTS ONLY',font=smallb,fill=mint)
d.text((445,405),'60  ·  90  ·  120 MINUTES',font=small,fill=gray)
d.text((445,463),'2209 Coffee Rd, Suite M  ·  (209) 450-5296',font=contact,fill=white)
d.text((445,490),'restorewithellis.com',font=smallb,fill=cyan)
# QR tile with scan label
qr=Image.open(QR).convert('RGB').resize((158,158),Image.Resampling.NEAREST)
d.rounded_rectangle((798,116,985,342),radius=18,fill=(16,45,57,230),outline=(81,239,236,160),width=2)
d.rounded_rectangle((812,130,970,288),radius=4,fill=white)
img.paste(qr,(812,130)); d=ImageDraw.Draw(img)
d.text((816,302),'SCAN TO BOOK',font=mini,fill=mint)
d.text((816,320),'HUNTER ELLIS',font=mini,fill=white)
# Small “signal” accents around QR.
d.line((770,140,790,140),fill=red,width=3); d.line((780,140,780,160),fill=red,width=3)
d.line((985,366,1004,366),fill=cyan,width=3); d.line((995,366,995,347),fill=cyan,width=3)

img=img.convert('RGB'); img.save(OUT_PNG,dpi=(300,300),optimize=True); img.save(OUT_PDF,'PDF',resolution=300.0)
print(OUT_PNG); print(OUT_PDF)
