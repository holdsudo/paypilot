#!/usr/bin/env python3
"""Build PayPilot: src/ -> docs/ (GitHub Pages)."""
import json, re, shutil, hashlib, datetime, html
from html import unescape as _unesc
from email.utils import format_datetime
from pathlib import Path
ROOT = Path(__file__).parent; SRC, OUT = ROOT / "src", ROOT / "docs"
SITE, DOMAIN = "https://paypilot.fastapi.online", "paypilot.fastapi.online"
def read(p): return (SRC / p).read_text(encoding="utf-8")
def icons(h): return re.sub(r"\{\{i:([a-z0-9-]+)\}\}", lambda m: f'<svg class="icon" aria-hidden="true"><use href="#i-{m.group(1)}"/></svg>', h)
def mincss(s): s = re.sub(r"/\*.*?\*/", "", s, flags=re.S); s = re.sub(r"\s+", " ", s); return re.sub(r"\s*([{};:,>])\s*", r"\1", s).replace(";}", "}")
def minjs(s): return "\n".join(t for t in (l.strip() for l in s.splitlines()) if t and not t.startswith("//"))
TOPICS = {"money": ("Send & receive", "send", "linear-gradient(135deg,#8B5CF6,#E879F9)"), "cards": ("Card payments", "card", "linear-gradient(135deg,#7C3AED,#67E8F9)"),
          "pos": ("Point of sale", "pos", "linear-gradient(135deg,#6D28D9,#A78BFA)"), "online": ("Online payments", "globe", "linear-gradient(135deg,#4F46E5,#67E8F9)"),
          "security": ("Security", "shield", "linear-gradient(135deg,#312E81,#8B5CF6)"), "growth": ("Growth", "chart", "linear-gradient(135deg,#A855F7,#FBBF24)")}
TODAY = datetime.date.today()
def esc(x): return html.escape(str(x), quote=True)
def ld(o): return '<script type="application/ld+json">' + json.dumps(o, separators=(",", ":")).replace("</", "<\\/") + "</script>"
def crumbs(items): return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u} for i, (n, u) in enumerate(items)]}
def variant(slug, opts): return opts[int(hashlib.md5(slug.encode()).hexdigest(), 16) % len(opts)]
MID = [("Ready to run it on PayPilot?", "Tap, chip, wallets, online and person-to-person — one platform.", "Get started"),
       ("See PayPilot in action", "Try the live POS and wallet demos on our homepage.", "Explore PayPilot"),
       ("Questions about your setup?", "Real people answer 24/7 at 844.826.6227.", "Talk to us"),
       ("Thinking about going to zero?", "Our Zero plan uses compliant dual pricing to cover card costs.", "See pricing"),
       ("Make this easier tomorrow", "Set up PayPilot in days, keep your terminal where possible.", "Start now")]
MID_URL = {"Get started": "/get-started/", "Explore PayPilot": "/", "Talk to us": "/get-started/", "See pricing": "/pricing/", "Start now": "/get-started/"}
def words(p): return len((" ".join(p.get("intro", [])) + " ".join(" ".join(x.get("paragraphs", []) + x.get("bullets", []) + x.get("steps", [])) for x in p.get("sections", [])) + " ".join(f["a"] for f in p.get("faq", []))).split())
def bcard(p, feature=False):
    t = TOPICS[p["topic"]]
    return (f'<a class="bcard glass{" bcard--feature" if feature else ""}" href="/blog/{p["slug"]}/" data-topic="{p["topic"]}"><span class="bcard__art" style="background:{t[2]}">'
            f'<svg class="icon" aria-hidden="true"><use href="#i-{t[1]}"/></svg><em>{t[0]}</em></span><span class="bcard__body"><h3>{esc(p["title"])}</h3>'
            f'<p>{esc(p.get("dek", ""))}</p><small>{p.get("read_minutes", 6)} min read</small></span></a>')
def render_post(p, by):
    t = TOPICS[p["topic"]]; url = f"/blog/{p['slug']}/"; mid = variant(p["slug"], MID)
    toc, body = [], []
    for i, sec in enumerate(p["sections"]):
        hid = re.sub(r"[^a-z0-9]+", "-", sec["h2"].lower()).strip("-")[:60] or f"s{i}"; toc.append((hid, sec["h2"]))
        b = f'<h2 id="{hid}">{esc(sec["h2"])}</h2>' + "".join(f"<p>{esc(x)}</p>" for x in sec.get("paragraphs", []))
        if sec.get("bullets"): b += "<ul>" + "".join(f"<li>{esc(x)}</li>" for x in sec["bullets"]) + "</ul>"
        if sec.get("steps"): b += '<ol class="steps">' + "".join(f"<li>{esc(x)}</li>" for x in sec["steps"]) + "</ol>"
        body.append(b)
        if i == 1: body.append(f'<aside class="midcta glass"><div><b>{mid[0]}</b><span>{mid[1]}</span></div><a class="btn btn--primary btn--sm" href="{MID_URL[mid[2]]}">{mid[2]} {{{{i:arrow}}}}</a></aside>')
    rel = [by[x] for x in p.get("related", []) if x in by and x != p["slug"]][:3]
    rel += [q for q in by.values() if q["topic"] == p["topic"] and q["slug"] != p["slug"] and q not in rel][: max(0, 3 - len(rel))]
    faq = "".join(f'<details><summary>{esc(f["q"])}</summary><p>{esc(f["a"])}</p></details>' for f in p.get("faq", []))
    kt = "".join(f"<li>{{{{i:check}}}}<span>{esc(x)}</span></li>" for x in p.get("key_takeaways", []))
    head = (ld(crumbs([("Home", "/"), ("Blog", "/blog/"), (p["title"], url)])) +
            (ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in p["faq"]]}) if p.get("faq") else "") +
            ld({"@context": "https://schema.org", "@type": "BlogPosting", "headline": p["title"], "description": p["meta_description"], "url": SITE + url, "mainEntityOfPage": SITE + url,
                "datePublished": TODAY.isoformat(), "dateModified": TODAY.isoformat(), "image": SITE + "/assets/img/og.jpg", "keywords": ", ".join(p.get("keywords", [])), "articleSection": t[0], "wordCount": words(p),
                "author": {"@type": "Organization", "name": "PayPilot Editorial", "url": SITE + "/blog/"}, "publisher": {"@type": "Organization", "name": "PayPilot", "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/apple-touch-icon.png"}}}))
    page = f'''<article class="post">
<header class="post__head"><div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog/">Blog</a><span>/</span><a href="/blog/#{p["topic"]}">{t[0]}</a></nav>
  <span class="kicker" style="margin-top:26px">{esc(p.get("eyebrow", t[0]))}</span>
  <h1 class="h1">{esc(p["title"])}</h1>
  <p class="lede">{esc(p.get("dek", ""))}</p>
  <div class="post__meta"><span>PayPilot Editorial</span><span>{TODAY.strftime("%B %-d, %Y")}</span><span>{p.get("read_minutes", 6)} min read</span><button class="link" type="button" data-share>{{{{i:send}}}} Share</button></div>
</div></header>
<div class="wrap post__grid">
  <div class="prose">
    {"".join(f"<p>{esc(x)}</p>" for x in p.get("intro", []))}
    {'<div class="kt glass"><h2>Quick takeaways</h2><ul>' + kt + '</ul></div>' if kt else ''}
    {"".join(body)}
    <section class="faq post__faq" aria-labelledby="faq-t"><h2 id="faq-t">FAQ</h2>{faq}</section>
    <p class="post__fine">General information, not legal, tax or financial advice. PayPilot features, fees, limits and availability depend on eligibility and may change; card-network and state rules apply.</p>
  </div>
  <aside class="post__side"><div class="post__sticky">
    <nav class="toc glass" aria-label="On this page"><h4>On this page</h4>{"".join(f'<a href="#{i}">{esc(h)}</a>' for i, h in toc)}<a href="#faq-t">FAQ</a></nav>
    <div class="sidecta glass"><svg aria-hidden="true"><use href="#logo"/></svg><b>Payments, piloted.</b><p>POS, hardware, online and person-to-person — one platform.</p><a class="btn btn--primary btn--sm" href="/get-started/">Get started</a></div>
  </div></aside>
</div>
</article>
<section class="sec" style="padding-top:20px"><div class="wrap"><div class="row-head"><h2 class="h3">Keep reading</h2><a class="link" href="/blog/">All articles {{{{i:arrow}}}}</a></div><div class="bgrid">{"".join(bcard(r) for r in rel)}</div></div></section>'''
    return {"title": p["seo_title"], "desc": p["meta_description"], "nav": "blog"}, page, head
def render_hub(posts):
    chips = '<button class="chip-f on" data-f="all">All</button>' + "".join(f'<button class="chip-f" data-f="{k}">{v[0]}</button>' for k, v in TOPICS.items())
    grid = "".join(bcard(p, i == 0) for i, p in enumerate(posts))
    body = f'''<section class="phero" style="padding-bottom:50px"><canvas class="stage" data-scene="ambient" aria-hidden="true"></canvas><div class="hero__veil"></div><div class="wrap"><div class="phero__copy">
<span class="kicker fade">The PayPilot Blog</span><h1 class="h1 fade d1" style="margin-top:20px">Money moves, <span class="grad">explained.</span></h1>
<p class="lede fade d2">{len(posts)} guides on taking cards, running a POS, selling online, sending money and keeping it all secure.</p></div></div></section>
<section class="sec" style="padding-top:10px"><div class="wrap">
<div class="hubbar"><div class="chips-f" role="group" aria-label="Filter by topic">{chips}</div><label class="hubsearch glass">{{{{i:search}}}}<span class="sr-only">Search articles</span><input type="search" placeholder="Search articles" data-hub-q></label></div>
<div class="bgrid" data-hub>{grid}</div>
<div class="center" style="margin-top:40px"><button class="btn btn--glass btn--lg" type="button" data-hub-more hidden>Load more</button></div>
<p class="center muted" data-hub-empty hidden style="padding:40px 0">No articles match yet.</p>
</div></section>'''
    head = ld(crumbs([("Home", "/"), ("Blog", "/blog/")])) + ld({"@context": "https://schema.org", "@type": "Blog", "name": "The PayPilot Blog", "url": SITE + "/blog/",
        "blogPost": [{"@type": "BlogPosting", "headline": p["title"], "url": SITE + f"/blog/{p['slug']}/"} for p in posts]})
    return {"title": "The PayPilot Blog — Payments, POS & Sending Money, Explained", "desc": f"{len(posts)} practical guides on card payments, point of sale, online checkout, peer-to-peer money transfers and payment security.", "nav": "blog"}, body, head

def main():
    if OUT.exists(): shutil.rmtree(OUT)
    (OUT / "assets").mkdir(parents=True)
    for d in ("img", "fonts", "vendor"): shutil.copytree(SRC / "assets" / d, OUT / "assets" / d)
    css = mincss(read("assets/css/app.css")); app = minjs(read("assets/js/app.js")); sc = read("assets/js/scenes.js")
    ver = hashlib.sha1((css + app + sc).encode()).hexdigest()[:8]
    (OUT / "assets/app.css").write_text(css); (OUT / "assets/app.js").write_text(app); (OUT / "assets/scenes.js").write_text(sc)
    head, nav, foot, sprite = (read(f"partials/{n}") for n in ("head.html", "nav.html", "footer.html", "sprite.svg"))
    site_ld = ld({"@context": "https://schema.org", "@type": "WebSite", "name": "PayPilot", "url": SITE + "/"}) + ld({"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "PayPilot POS", "applicationCategory": "BusinessApplication", "operatingSystem": "iOS, Android, Web", "description": "Point of sale, card processing, online payments and person-to-person wallet in one platform.", "publisher": {"@type": "Organization", "name": "PayPilot"}})
    urls = []; items = []
    for f in sorted((SRC / "pages").rglob("*.html")):
        raw = f.read_text(); m = re.match(r"<!--(\{.*?\})-->\s*", raw, re.S); meta = json.loads(m.group(1)); body = raw[m.end():]
        rel = f.relative_to(SRC / "pages").as_posix()
        route = "/" if rel == "index.html" else None if rel == "404.html" else "/" + rel.removesuffix(".html") + "/"
        items.append((route, meta, body, meta.get("ld", "")))
    man = json.load(open(ROOT / "content/manifest.json")); by = {}
    for mm in man:
        fp = ROOT / "content/pages" / f"{mm['slug']}.json"
        if fp.exists():
            pj = json.load(open(fp)); pj["slug"] = mm["slug"]; pj["topic"] = mm["topic"]; pj.setdefault("seo_title", mm["title"] + " | PayPilot"); pj.setdefault("meta_description", pj.get("dek", mm["title"])); by[mm["slug"]] = pj
    if by:
        meta, body, hd = render_hub(list(by.values())); items.append(("/blog/", meta, body, hd))
        for pj in by.values():
            meta, body, hd = render_post(pj, by); items.append((f"/blog/{pj['slug']}/", meta, body, hd))
    latest = "".join(bcard(p) for p in list(by.values())[:3])
    for route, meta, body, extra in items:
        body = body.replace("{{latest-posts}}", latest).replace("{{count:posts}}", str(len(by)))
        if '<div class="faq' in body and '"FAQPage"' not in extra:
            qa = re.findall(r"<details><summary>(.*?)</summary><p>(.*?)</p></details>", body, re.S)
            if qa: extra += ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": _unesc(re.sub(r"<[^>]+>", "", q)), "acceptedAnswer": {"@type": "Answer", "text": _unesc(re.sub(r"<[^>]+>", "", a))}} for q, a in qa]})
        if route not in ("/", None) and not route.startswith("/blog/"):
            extra += ld(crumbs([("Home", "/"), (meta["title"].split(" — ")[0].split(" | ")[0], route)]))
        dest = OUT / ("404.html" if route is None else ("index.html" if route == "/" else route.strip("/") + "/index.html")); dest.parent.mkdir(parents=True, exist_ok=True)
        n = nav.replace(f'data-nav="{meta.get("nav","")}"', f'data-nav="{meta.get("nav","")}" aria-current="page"') if meta.get("nav") else nav
        h = head.replace("{{title}}", meta["title"]).replace("{{desc}}", meta["desc"]).replace("{{canonical}}", SITE + (route or "/")).replace("{{site}}", SITE).replace("{{ver}}", ver).replace("{{robots}}", "noindex" if route is None else "index,follow,max-image-preview:large").replace("{{extra_head}}", extra + (site_ld if route == "/" else ""))
        html = (h + "<body>" + sprite + n + f'<main id="main">{body}</main>' + foot +
                f'<script src="/assets/app.js?v={ver}" defer></script><script type="module" src="/assets/scenes.js?v={ver}"></script></body></html>')
        dest.write_text(icons(html).replace("{{year}}", str(datetime.date.today().year)))
        if route: urls.append(route)
    def smap(name, rs): (OUT / name).write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"<url><loc>{SITE}{u}</loc><lastmod>{TODAY.isoformat()}</lastmod></url>\n" for u in rs) + "</urlset>\n")
    smap("sitemap-pages.xml", [u for u in urls if not u.startswith("/blog/") or u == "/blog/"]); smap("sitemap-blog.xml", [u for u in urls if u.startswith("/blog/") and u != "/blog/"])
    (OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"<sitemap><loc>{SITE}/{n}</loc><lastmod>{TODAY.isoformat()}</lastmod></sitemap>\n" for n in ("sitemap-pages.xml", "sitemap-blog.xml")) + "</sitemapindex>\n")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    now = format_datetime(datetime.datetime.combine(TODAY, datetime.time(9), tzinfo=datetime.timezone.utc))
    (OUT / "blog").mkdir(exist_ok=True)
    (OUT / "blog/feed.xml").write_text('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>The PayPilot Blog</title><link>' + SITE + '/blog/</link><description>Payments, POS and sending money, explained.</description><language>en-us</language>' + "".join(f"<item><title>{esc(p['title'])}</title><link>{SITE}/blog/{p['slug']}/</link><guid>{SITE}/blog/{p['slug']}/</guid><pubDate>{now}</pubDate><description>{esc(p['meta_description'])}</description></item>" for p in by.values()) + "</channel></rss>")
    (OUT / "llms.txt").write_text("# PayPilot\n\n> Payments platform by MCCPS: card processing, POS, hardware (Terminal, Go, Reader), online checkout and payment links, and PayPilot Wallet for person-to-person payments. 24/7 support 844.826.6227.\n\n## Pages\n" + "".join(f"- [{u}]({SITE}{u})\n" for u in urls if not u.startswith("/blog/") or u == "/blog/") + "\n## Blog\n" + "".join(f"- [{p['title']}]({SITE}/blog/{p['slug']}/): {p['meta_description']}\n" for p in by.values()))
    (OUT / "CNAME").write_text(DOMAIN + "\n"); (OUT / ".nojekyll").write_text("")
    wc = [words(p) for p in by.values()]
    print(f"built {len(urls)} pages, {len(by)} posts (words min {min(wc) if wc else 0} avg {sum(wc)//max(1,len(wc))}) (v{ver})")
if __name__ == "__main__": main()
