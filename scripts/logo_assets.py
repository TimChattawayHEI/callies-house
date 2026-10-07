# Makes the app icon and splash screen from the "House badge" logo (Claude Design export).
# Usage: python3 scripts/logo_assets.py <folder with logo.html> assets vendor/fonts/baloo2-latin.woff2
import asyncio, pathlib, sys, base64
from playwright.async_api import async_playwright
from PIL import Image
D = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2]); FONT = pathlib.Path(sys.argv[3])
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch()
    pg = await b.new_page(viewport={'width': 1400, 'height': 900}, device_scale_factor=1024 / 360)
    await pg.goto('file://' + str((D / 'logo.html').resolve())); await pg.wait_for_timeout(3500)
    # the big House badge tile
    h = await pg.evaluate_handle("""[...document.querySelectorAll('div')].find(d => d.style.width === '360px' && d.style.height === '360px' && d.style.background.includes('255, 246, 234'))""")
    el = h.as_element()
    await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(500)
    await el.evaluate("d => { d.style.borderRadius = '0'; d.style.boxShadow = 'none'; }")
    await el.screenshot(path=str(D / 'badge_square.png'))
    await el.evaluate("d => { for (let e = d; e; e = e.parentElement) { e.style.background = 'transparent'; e.style.backgroundColor = 'transparent'; } document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; }")
    await el.screenshot(path=str(D / 'badge_fg.png'), omit_background=True)
    # splash: the badge art over the cream colour, with the name underneath
    art = base64.b64encode((D / 'badge_fg.png').read_bytes()).decode(); font = base64.b64encode(FONT.read_bytes()).decode()
    for name, bg, ink, pink in (('splash.png', '#fff6ea', '#3b2a24', '#c25a7a'), ('splash-dark.png', '#3b2a24', '#fff6ea', '#f3a6bf')):
      sp = await b.new_page(viewport={'width': 2732, 'height': 2732})
      await sp.set_content(f"""<html><head><style>@font-face{{font-family:'Baloo 2';src:url(data:font/woff2;base64,{font}) format('woff2');font-weight:600 800}}
        html,body{{margin:0;width:2732px;height:2732px;background:{bg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;font-family:'Baloo 2'}}
        img{{width:980px;height:980px}} h1{{margin:0;font-size:200px;font-weight:800;letter-spacing:-4px;color:{ink};line-height:1}} h1 span{{color:{pink}}}</style></head>
        <body><img src="data:image/png;base64,{art}"><h1><span>Callie's</span> House</h1></body></html>""")
      await sp.evaluate("document.fonts.ready"); await sp.wait_for_timeout(400)
      await sp.screenshot(path=str(OUT / name))
    await b.close()
  fg = Image.open(D / 'badge_fg.png').convert('RGBA'); sq = Image.open(D / 'badge_square.png').convert('RGBA')
  sq.resize((1024, 1024), Image.LANCZOS).save(OUT / 'icon-only.png')
  # adaptive icon: the art fills the middle two thirds so no launcher shape cuts it
  canvas = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)); s = int(1024 * 0.64); art = fg.resize((s, s), Image.LANCZOS)
  canvas.paste(art, ((1024 - s) // 2, (1024 - s) // 2), art); canvas.save(OUT / 'icon-foreground.png')
  Image.new('RGBA', (1024, 1024), (255, 246, 234, 255)).save(OUT / 'icon-background.png')
asyncio.run(main())
