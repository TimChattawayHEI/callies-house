"""Build the game into www/index.html for the Android app (and any offline copy).

Everything goes into one file: the game, React, and the fonts, so the app works with no internet.
Run from anywhere:  python3 scripts/build_app.py
Needs esbuild (npm install). Andika comes from @fontsource/andika when it is installed;
without it the game falls back to the tablet's own font.
"""
import base64, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAME, VENDOR, OUT = ROOT / 'game', ROOT / 'vendor', ROOT / 'www'

esbuild = ROOT / 'node_modules' / '.bin' / ('esbuild.cmd' if sys.platform == 'win32' else 'esbuild')
if not esbuild.exists():
    sys.exit('esbuild is missing: run "npm install" first')

r = subprocess.run([str(esbuild), 'game/src/app.jsx', '--bundle', '--minify', '--keep-names', '--format=iife', '--jsx=automatic',
                    '--target=es2019', '--loader:.js=jsx', '--log-level=warning',
                    '--alias:react/jsx-runtime=./game/shim/jsx-runtime.js', '--alias:react-dom/client=./game/shim/react-dom-client.js',
                    '--alias:react=./game/shim/react.js', '--define:process.env.NODE_ENV="production"'],
                   cwd=ROOT, capture_output=True, text=True)
if r.returncode:
    sys.exit(r.stderr)
game_js = r.stdout

def script(js):
    return '<script>' + js.replace('</script', '<\\/script') + '</script>\n'

# fonts: Baloo 2 is kept in vendor/, Andika (made for early readers) comes from npm
def face(family, weight, path):
    data = base64.b64encode(path.read_bytes()).decode()
    return f"@font-face {{ font-family: '{family}'; font-style: normal; font-weight: {weight}; font-display: swap; src: url(data:font/woff2;base64,{data}) format('woff2'); }}\n"

fonts = face('Baloo 2', '600 800', VENDOR / 'fonts' / 'baloo2-latin.woff2')
andika = ROOT / 'node_modules' / '@fontsource' / 'andika' / 'files'
for w in (400, 700):
    f = andika / f'andika-latin-{w}-normal.woff2'
    if f.exists():
        fonts += face('Andika', w, f)
    else:
        print(f'note: {f.name} not found, using the system font for reading text')

shell = (GAME / 'shell.html').read_text()
shell = re.sub(r'<link rel="(preconnect|stylesheet)"[^>]*>\n?', '', shell)
title, rest = shell.split('\n', 1)
head = ('<!doctype html>\n<html lang="en-GB">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n'
        '<meta name="theme-color" content="#efe2d0">\n' + title + '\n<style>\n' + fonts + '</style>\n')
body = rest.replace('<script>/*BUNDLE*/</script>', script((VENDOR / 'react.production.min.js').read_text())
                    + script((VENDOR / 'react-dom.production.min.js').read_text()) + script(game_js))
# the style block and app div sit in the body of the shell; put the styles in the head
style_end = body.index('</style>') + len('</style>')
page = head + body[:style_end] + '\n</head>\n<body>\n' + body[style_end:] + '\n</body>\n</html>\n'

OUT.mkdir(exist_ok=True)
(OUT / 'index.html').write_text(page)
print('built www/index.html', len(page) // 1024, 'KB')
