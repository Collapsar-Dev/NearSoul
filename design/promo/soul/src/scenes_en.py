import base64, os
def b64(p): return base64.b64encode(open(p,'rb').read()).decode()
LOGO = b64('/home/admin777/NearSoul/apps/app/assets/logo.png')
SHOT = {n: b64(f'en/app_{n}.png') for n in ['soul','today','match','check','map','story']}
CSS = """
*{box-sizing:border-box} body{margin:0;width:1080px;height:1920px;overflow:hidden;font-family:"Inter","Noto Sans","Segoe UI",Roboto,system-ui,sans-serif;color:#fff}
.bg{position:absolute;inset:0;background:linear-gradient(160deg,#FF5E8E 0%,#B04DFF 52%,#5B6CFF 100%)}
.dark{position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,#2a1747 0%,#0d0818 70%)}
.orb{position:absolute;border-radius:50%;background:rgba(255,255,255,.13)}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:150px 70px 0}
h1{font-size:104px;line-height:1.02;margin:0;font-weight:900;letter-spacing:-2px;text-align:center}
h2{font-size:66px;line-height:1.08;margin:0;font-weight:850;letter-spacing:-1px;text-align:center}
.sub{font-size:40px;opacity:.92;margin-top:22px;text-align:center;line-height:1.25;font-weight:600}
.phone{margin-top:70px;width:700px;height:1300px;border-radius:84px;background:#0b0b10;padding:20px;box-shadow:0 50px 120px rgba(30,0,70,.5)}
.phone img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:66px;display:block}
.tag{display:inline-block;background:#fff;color:#7B3FE4;font-weight:900;font-size:40px;padding:16px 30px;border-radius:999px;margin-top:30px}
.brand{position:absolute;top:60px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:16px;font-size:40px;font-weight:800}
.brand img{width:64px;height:64px;border-radius:16px}
.card{margin-top:80px;width:880px;background:#fff;color:#251a3d;border-radius:48px;padding:56px 50px;box-shadow:0 40px 100px rgba(30,0,70,.4)}
.card .q{font-size:30px;color:#7c6f94;font-weight:700}
.card .s{font-size:50px;font-weight:850;margin:18px 0 34px;line-height:1.15}
.opt{border:3px solid #e2dbef;border-radius:26px;padding:24px 28px;font-size:36px;margin-top:16px;display:flex;align-items:center;gap:20px;font-weight:600}
.opt b{width:52px;height:52px;border-radius:50%;background:#efe9fa;display:inline-flex;align-items:center;justify-content:center;font-size:28px;color:#7B3FE4}
.opt.sel{border-color:#B04DFF;background:#f6efff}
.opt.sel b{background:#B04DFF;color:#fff}
"""
def page(body, dark=False, brand=True):
    orbs = '' if dark else '<div class="orb" style="width:620px;height:620px;right:-220px;top:-180px"></div><div class="orb" style="width:420px;height:420px;left:-160px;bottom:220px"></div>'
    br = f'<div class="brand"><img src="data:image/png;base64,{LOGO}">NearSoul</div>' if brand else ''
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="{"dark" if dark else "bg"}"></div>{orbs}{br}<div class="wrap">{body}</div></body></html>'
def phone(n, pos='top'): return f'<div class="phone"><img style="object-position:{pos}" src="data:image/png;base64,{SHOT[n]}"></div>'
S = {}
S['01a'] = page('<div style="height:520px"></div><h1>500 swipes.</h1>', dark=True, brand=False)
S['01b'] = page('<div style="height:520px"></div><h1>500 swipes.</h1><div class="sub" style="font-size:64px;margin-top:40px;font-weight:800;color:#ff8fb3">0 real<br>conversations 😶</div>', dark=True, brand=False)
S['02'] = page(f'<div style="height:300px"></div><img src="data:image/png;base64,{LOGO}" style="width:420px;height:420px;border-radius:100px;box-shadow:0 40px 120px rgba(30,0,70,.45)"><h1 style="margin-top:70px">Stop judging<br>by photos.</h1><div class="sub">Meet by the soul ✨</div>', brand=False)
S['03'] = page('<h2>10 questions.<br>2 minutes.</h2><div class="sub">A science-based Big Five personality test</div><div class="card"><div class="q">1 of 10 · How much is this you?</div><div class="s">I easily start conversations with strangers.</div><div class="opt"><b>1</b>Not me at all</div><div class="opt"><b>3</b>Neither</div><div class="opt sel"><b>4</b>Mostly me</div><div class="opt"><b>5</b>Totally me</div></div>')
S['04'] = page('<h2>Discover your<br>soul type 👻</h2>' + phone('soul'))
S['05'] = page('<h2>See exactly<br>why you click</h2>' + phone('today'))
S['06'] = page('<h2>It’s a match! 💞</h2><div class="sub">with first words ready to go</div>' + phone('match'))
S['07'] = page('<h2>Check your compatibility<br>with a friend or crush 👀</h2>' + phone('check'))
S['08'] = page('<h2>Share your soul<br>in one tap</h2>' + phone('story'))
S['09'] = page('<h2>Your matches, nearby 📍</h2><div class="sub">an area, never your address</div>' + phone('map'))
S['10'] = page(f'<div style="height:260px"></div><img src="data:image/png;base64,{LOGO}" style="width:380px;height:380px;border-radius:92px;box-shadow:0 40px 120px rgba(30,0,70,.45)"><h1 style="margin-top:60px">NearSoul</h1><div class="sub" style="font-size:54px;font-weight:800">Find a soul that fits yours</div><div class="sub">by science, not by the stars</div><div class="tag">Link in bio ✨</div>', brand=False)
os.makedirs('en/scenes', exist_ok=True)
for k, v in S.items(): open(f'en/scenes/{k}.html', 'w').write(v)
print(len(S))
