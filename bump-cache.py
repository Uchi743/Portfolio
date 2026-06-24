#!/usr/bin/env python3
"""
bump-cache.py — busts browser/CDN cache for static assets.

Usage:  python bump-cache.py
Run it AFTER editing any css/js/image/video and BEFORE committing.
It stamps a fresh ?v=N on every asset URL so visitors fetch the new files.
"""
import re, glob, os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

EXT = r'(?:css|js|png|jpe?g|webp|svg|mp4)'
files = glob.glob('*.html') + glob.glob('work/*.html') + glob.glob('js/*.js')

# current version = highest ?v=N found, else 0
cur = 0
for f in files:
    for m in re.findall(r'\?v=(\d+)', open(f, encoding='utf-8').read()):
        cur = max(cur, int(m))
new = cur + 1

# match an asset path ending in a known extension, optionally already ?v=NN,
# inside "..." , '...' or url(...)
pat = re.compile(r'((?:href|src|data-src|poster)="[^"]+?\.' + EXT + r')(?:\?v=\d+)?(")', re.I)
pat_q = re.compile(r"((?:media|cover):\s*'[^']+?\." + EXT + r")(?:\?v=\d+)?(')", re.I)
pat_url = re.compile(r"(url\((?:'|\")?[^'\")]+?\." + EXT + r")(?:\?v=\d+)?((?:'|\")?\))", re.I)

n = 0
for f in files:
    t = open(f, encoding='utf-8').read(); o = t
    # skip external URLs (http) by only stamping paths without scheme
    def stamp(m):
        head = m.group(1)
        if 'http://' in head or 'https://' in head or '//api.' in head:
            return m.group(0)
        return f'{head}?v={new}{m.group(2)}'
    t = pat.sub(stamp, t)
    t = pat_q.sub(stamp, t)
    t = pat_url.sub(stamp, t)
    if t != o:
        open(f, 'w', encoding='utf-8', newline='').write(t); n += 1

print(f"Cache version {cur} -> {new}  ({n} fichiers mis a jour)")
print("Maintenant: git add -A && git commit && git push")
