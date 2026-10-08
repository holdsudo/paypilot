#!/usr/bin/env python3
"""Build PayPilot: src/ -> docs/ (GitHub Pages)."""
import json, re, shutil, hashlib, datetime
from pathlib import Path
ROOT = Path(__file__).parent; SRC, OUT = ROOT / "src", ROOT / "docs"
SITE, DOMAIN = "https://paypilot.fastapi.online", "paypilot.fastapi.online"
def read(p): return (SRC / p).read_text(encoding="utf-8")
def icons(h): return re.sub(r"\{\{i:([a-z0-9-]+)\}\}", lambda m: f'<svg class="icon" aria-hidden="true"><use href="#i-{m.group(1)}"/></svg>', h)
def mincss(s): s = re.sub(r"/\*.*?\*/", "", s, flags=re.S); s = re.sub(r"\s+", " ", s); return re.sub(r"\s*([{};:,>])\s*", r"\1", s).replace(";}", "}")
def minjs(s): return "\n".join(t for t in (l.strip() for l in s.splitlines()) if t and not t.startswith("//"))
def main():
    if OUT.exists(): shutil.rmtree(OUT)
    (OUT / "assets").mkdir(parents=True)
    for d in ("img", "fonts", "vendor"): shutil.copytree(SRC / "assets" / d, OUT / "assets" / d)
    css = mincss(read("assets/css/app.css")); app = minjs(read("assets/js/app.js")); sc = read("assets/js/scenes.js")
    ver = hashlib.sha1((css + app + sc).encode()).hexdigest()[:8]
    (OUT / "assets/app.css").write_text(css); (OUT / "assets/app.js").write_text(app); (OUT / "assets/scenes.js").write_text(sc)
    head, nav, foot, sprite = (read(f"partials/{n}") for n in ("head.html", "nav.html", "footer.html", "sprite.svg"))
    urls = []
    for f in sorted((SRC / "pages").rglob("*.html")):
        raw = f.read_text(); m = re.match(r"<!--(\{.*?\})-->\s*", raw, re.S); meta = json.loads(m.group(1)); body = raw[m.end():]
        rel = f.relative_to(SRC / "pages").as_posix()
        route = "/" if rel == "index.html" else None if rel == "404.html" else "/" + rel.removesuffix(".html") + "/"
        dest = OUT / ("404.html" if route is None else ("index.html" if route == "/" else route.strip("/") + "/index.html")); dest.parent.mkdir(parents=True, exist_ok=True)
        n = nav.replace(f'data-nav="{meta.get("nav","")}"', f'data-nav="{meta.get("nav","")}" aria-current="page"') if meta.get("nav") else nav
        h = head.replace("{{title}}", meta["title"]).replace("{{desc}}", meta["desc"]).replace("{{canonical}}", SITE + (route or "/")).replace("{{site}}", SITE).replace("{{ver}}", ver)
        html = (h + "<body>" + sprite + n + f'<main id="main">{body}</main>' + foot +
                f'<script src="/assets/app.js?v={ver}" defer></script><script type="module" src="/assets/scenes.js?v={ver}"></script></body></html>')
        dest.write_text(icons(html).replace("{{year}}", str(datetime.date.today().year)))
        if route: urls.append(route)
    (OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "".join(f"<url><loc>{SITE}{u}</loc></url>" for u in urls) + "</urlset>\n")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    (OUT / "CNAME").write_text(DOMAIN + "\n"); (OUT / ".nojekyll").write_text("")
    print(f"built {len(urls)} pages (v{ver})")
if __name__ == "__main__": main()
