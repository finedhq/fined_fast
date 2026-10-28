# Visible page text for crawlers that don't run JavaScript (Bing, AI search tools,
# and Google's first pass). The SPA replaces all of it when it starts, so it must
# show the same things a reader sees on that page: no extra or hidden text.
#
# Article markdown is converted the same way the frontend's ArticleReader does it
# (one block per non-empty line, then links/images, then bold/italic/code), and
# every piece of text and every URL is escaped.

import html
import json
import re
from datetime import datetime

SITE = "https://myfined.com"
DEFAULT_IMAGE = f"{SITE}/fined_card_banner.png"

_ROOT_DIV = re.compile(r'<div id="root">\s*</div>', re.I)
_BODY_OPEN = re.compile(r"<body[^>]*>", re.I)


def esc(value) -> str:
    return html.escape(str(value or ""), quote=True)


def slugify_tag(tag: str) -> str:
    """Same as the frontend's tag links: /tags/personal-finance."""
    return re.sub(r"(^-|-$)+", "", re.sub(r"[^a-z0-9]+", "-", (tag or "").lower()))


def json_ld(data: dict) -> str:
    # Safe inside <script>: no "</script>" or HTML-significant characters
    text = json.dumps(data, ensure_ascii=False)
    return (
        text.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
        .replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    )


def format_date(value) -> str:
    """Like the frontend's formatDate: "Oct 5, 2026"."""
    if not value:
        return ""
    try:
        d = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return ""
    return f"{d:%b} {d.day}, {d.year}"


# ── safe URLs ──

def _safe_href(url: str) -> str | None:
    url = (url or "").strip()
    if re.match(r"^https?://", url, re.I) or url.startswith("mailto:"):
        return url
    if url.startswith("/") and not url.startswith("//"):
        return SITE + url
    if url.startswith("#"):
        return url
    return None


def _safe_src(url: str) -> str | None:
    url = (url or "").strip()
    if re.match(r"^https?://", url, re.I):
        return url
    if url.startswith("/") and not url.startswith("//"):
        return SITE + url
    return None


# ── inline markdown (mirrors formatInlineMarkdown + renderTextWithLinksAndImages) ──

_INLINE = re.compile(r"(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|`([^`]+)`)")
_LINK_OR_IMAGE = re.compile(r'(!?\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\))')


def _format_inline(text: str) -> str:
    out, last = [], 0
    for m in _INLINE.finditer(text):
        out.append(esc(text[last:m.start()]))
        if m.group(2):
            out.append(f"<strong>{esc(m.group(2))}</strong>")
        elif m.group(3):
            out.append(f"<em>{esc(m.group(3))}</em>")
        elif m.group(4):
            out.append(f"<em>{esc(m.group(4))}</em>")
        else:
            out.append(f"<code>{esc(m.group(5))}</code>")
        last = m.end()
    out.append(esc(text[last:]))
    return "".join(out)


def _image_caption(label: str, title: str) -> tuple[str, str]:
    """(alt, caption) the way the frontend reads ![alt|caption](url "title")."""
    if "|" in label:
        alt, caption = label.split("|", 1)
        return alt.strip(), caption.strip()
    return label.strip(), (title or label).strip()


def _figure(url: str, label: str, title: str) -> str:
    src = _safe_src(url)
    if not src:
        return ""
    alt, caption = _image_caption(label, title)
    shown = caption or alt
    figcaption = f"<figcaption>{esc(shown)}</figcaption>" if shown else ""
    return f'<figure><img src="{esc(src)}" alt="{esc(shown or "Article illustration")}" loading="lazy" />{figcaption}</figure>'


def inline_html(text: str) -> str:
    out, last = [], 0
    for m in _LINK_OR_IMAGE.finditer(text):
        out.append(_format_inline(text[last:m.start()]))
        label, url, title = m.group(2) or "", m.group(3) or "", m.group(4) or ""
        if m.group(1).startswith("!"):
            out.append(_figure(url, label, title))
        else:
            href = _safe_href(url)
            out.append(f'<a href="{esc(href)}">{esc(label)}</a>' if href else esc(label))
        last = m.end()
    out.append(_format_inline(text[last:]))
    return "".join(out)


# ── article body blocks (mirrors ArticleReader's `blocks`) ──

def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def paragraphs(content: str) -> list[str]:
    return [p.strip() for p in re.split(r"\r?\n+", content or "") if p.strip()]


def _is_disclaimer(text: str) -> bool:
    v = text.strip()
    lower = v.lower()
    if lower.startswith(("*disclaimer", "disclaimer:", "*this article is for educational", "this article is for educational")):
        return True
    if (v.startswith("*") and v.endswith("*")) or (v.startswith("_") and v.endswith("_")):
        return any(k in lower for k in (
            "educational purposes", "investment advice", "financial advice", "disclaimer",
            "verify current", "registered financial advisor", "licensed financial advisor",
        ))
    return False


def _clean_disclaimer(text: str) -> str:
    cleaned = text.strip()
    if (cleaned.startswith("*") and cleaned.endswith("*")) or (cleaned.startswith("_") and cleaned.endswith("_")):
        cleaned = cleaned[1:-1].strip()
    return re.sub(r"^disclaimer:\s*", "", cleaned, flags=re.I)


def _is_likely_heading(text: str) -> bool:
    v = _clean(text)
    if v.startswith(("![", "<img", "<figure")):
        return False
    if len(v) < 4 or len(v) > 95 or re.search(r"[.!]$", v):
        return False
    words = v.split(" ")
    if len(words) > 12:
        return False
    starts_ok = re.match(r"^(\d+\.|[A-Z][\w'-]+|FAQs?$)", v, re.ASCII)
    title_like = v == v.upper() or sum(1 for w in words if re.match(r"^[A-Z0-9]", w)) >= max(1, len(words) - 2)
    return bool(starts_ok) and (title_like or bool(re.search(r"[?:]$", v)))


_IMAGE_LINE = re.compile(r'^\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$')
_RULE_LINE = re.compile(r"^(-{3,}|\*{3,}|_{3,})$")


def article_description(article: dict) -> str:
    """The line under the title: same choice as the frontend."""
    explicit = article.get("meta_description") or article.get("description")
    if explicit:
        return explicit
    texts = [p for p in paragraphs(article.get("content") or "") if not p.startswith(("![", "<img", "##"))]
    return texts[0] if texts else ""


def article_body_html(article: dict) -> str:
    items = paragraphs(article.get("content") or "")
    if not items:
        return ""
    first_is_media_or_heading = items[0].startswith(("##", "![", "<img"))
    # Without a description the first paragraph is shown as the description, not repeated in the body
    if not article.get("description") and not first_is_media_or_heading and len(items) > 1:
        items = items[1:]
    explicit_headings = any(p.startswith(("## ", "### ")) for p in items)

    out: list[str] = []
    open_list = None  # "ul" or "ol"

    def close_list():
        nonlocal open_list
        if open_list:
            out.append(f"</{open_list}>")
            open_list = None

    for text in items:
        image = _IMAGE_LINE.match(text)
        disclaimer = _is_disclaimer(text)
        bullet = numbered = None
        if not image and not text.startswith(("### ", "## ")) and not disclaimer:
            if not (not explicit_headings and _is_likely_heading(text)):
                bullet = re.match(r"^[-*•]\s+(.*)$", text)
                numbered = None if bullet else re.match(r"^(\d+)\.\s+(.*)$", text)

        if bullet or numbered:
            kind = "ul" if bullet else "ol"
            if open_list != kind:
                close_list()
                out.append(f"<{kind}>")
                open_list = kind
            if bullet:
                out.append(f"<li>{inline_html(bullet.group(1).strip())}</li>")
            else:
                out.append(f'<li value="{esc(numbered.group(1))}">{inline_html(numbered.group(2).strip())}</li>')
            continue
        close_list()

        if image:
            out.append(_figure(image.group(2), image.group(1) or "", image.group(3) or ""))
        elif text.startswith("### "):
            out.append(f"<h3>{inline_html(text[4:].strip())}</h3>")
        elif text.startswith("## "):
            out.append(f"<h2>{inline_html(text[3:].strip())}</h2>")
        elif not explicit_headings and not disclaimer and _is_likely_heading(text):
            out.append(f"<h2>{inline_html(text)}</h2>")
        elif disclaimer:
            out.append(f"<aside><p><strong>Disclaimer</strong></p><p>{inline_html(_clean_disclaimer(text))}</p></aside>")
        elif _RULE_LINE.match(text):
            out.append("<hr />")
        else:
            out.append(f"<p>{inline_html(text)}</p>")
    close_list()
    return "\n".join(out)


# ── page bodies ──

def article_page_body(article: dict) -> str:
    tag = article.get("tag") or ""
    author = article.get("authors") if isinstance(article.get("authors"), dict) else None
    reviewer = article.get("reviewer") if isinstance(article.get("reviewer"), dict) else None
    date = article.get("published_at") or article.get("created_at")
    meta = []
    if date and format_date(date):
        meta.append(f'<time datetime="{esc(date)}">{esc(format_date(date))}</time>')
    if tag:
        meta.append(f'<a href="{SITE}/tags/{esc(slugify_tag(tag))}">{esc(tag)}</a>')
    byline = []
    if author and author.get("name"):
        byline.append(f'By <a href="{SITE}/authors/{esc(author.get("slug"))}">{esc(author["name"])}</a>')
    if reviewer and reviewer.get("name"):
        byline.append(f'Reviewed by <a href="{SITE}/authors/{esc(reviewer.get("slug"))}">{esc(reviewer["name"])}</a>')
    description = article_description(article)
    image = _safe_src(article.get("image_url") or "")

    parts = ["<main><article><header>"]
    if meta:
        parts.append(f"<p>{' · '.join(meta)}</p>")
    parts.append(f"<h1>{esc(article.get('title'))}</h1>")
    if byline:
        parts.append(f"<p>{' · '.join(byline)}</p>")
    if description:
        parts.append(f"<p>{esc(description)}</p>")
    parts.append("</header>")
    if image:
        parts.append(f'<img src="{esc(image)}" alt="{esc(article.get("title"))}" />')
    parts.append(article_body_html(article))
    parts.append("</article></main>")
    return "\n".join(parts)


def article_list_html(articles: list) -> str:
    items = []
    for a in articles:
        slug = a.get("slug")
        if not slug or not a.get("title"):
            continue
        desc = f"<p>{esc(a['description'])}</p>" if a.get("description") else ""
        items.append(f'<li><h3><a href="{SITE}/articles/{esc(slug)}">{esc(a["title"])}</a></h3>{desc}</li>')
    return f"<ul>{''.join(items)}</ul>" if items else ""


def author_page_body(author: dict, articles: list) -> str:
    name = author.get("name") or ""
    parts = [f"<main><h1>{esc(name)}</h1>"]
    if author.get("bio"):
        parts.append(f"<p><strong>{esc(author['bio'])}</strong></p>")
    if author.get("description"):
        parts.append(f"<p>{esc(author['description'])}</p>")
    linkedin = _safe_href(author.get("linkedin_url") or "")
    if linkedin:
        parts.append(f'<p><a href="{esc(linkedin)}" rel="noopener noreferrer">LinkedIn Profile</a></p>')
    listing = article_list_html(articles)
    if listing:
        parts.append(f"<h2>Articles by {esc(name)}</h2>{listing}")
    parts.append("</main>")
    return "\n".join(parts)


def tag_page_body(tag: str, articles: list) -> str:
    # Same heading and line as the frontend's tag page
    return (
        f"<main><h1>Tag: {esc(tag)}</h1>\n<p>Articles tagged with {esc(tag)}.</p>\n"
        f"{article_list_html(articles)}</main>"
    )


def articles_index_body(articles: list, tags: list) -> str:
    # Same heading, subtitle, topic filters and list heading as the frontend's articles page
    topics = "".join(f'<li><a href="{SITE}/tags/{esc(slugify_tag(t))}">{esc(t)}</a></li>' for t in tags)
    return (
        "<main><h1>Articles &amp; Insights</h1>\n"
        "<p>Clear, research-backed financial explainers, deep dives, and market perspectives.</p>\n"
        + (f"<nav><ul>{topics}</ul></nav>\n" if topics else "")
        + f"<h2>Explore All Articles</h2>\n{article_list_html(articles)}</main>"
    )


def course_page_body(course: dict, modules: list) -> str:
    parts = [f"<main><h1>{esc(course.get('title'))}</h1>"]
    if course.get("description"):
        parts.append(f"<p>{esc(course['description'])}</p>")
    items = []
    for i, m in enumerate(modules, start=1):
        desc = f"<p>{esc(m['description'])}</p>" if m.get("description") else ""
        items.append(f"<li><h2>Module {i}: {esc(m.get('title'))}</h2>{desc}</li>")
    if items:
        parts.append(f"<ol>{''.join(items)}</ol>")
    parts.append("</main>")
    return "\n".join(parts)


# ── head tags ──

def head_tags(*, title: str, description: str, url: str, image: str = DEFAULT_IMAGE,
              og_type: str = "website", robots: str = "index, follow", schema: dict | None = None) -> str:
    t, d, u, i = esc(title), esc(description), esc(url), esc(image or DEFAULT_IMAGE)
    tags = f"""
  <title>{t}</title>
  <meta name="description" content="{d}" />
  <link rel="canonical" href="{u}" />
  <meta name="robots" content="{esc(robots)}" />
  <meta property="og:type" content="{esc(og_type)}" />
  <meta property="og:site_name" content="FinEd" />
  <meta property="og:title" content="{t}" />
  <meta property="og:description" content="{d}" />
  <meta property="og:image" content="{i}" />
  <meta property="og:url" content="{u}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@FinEd" />
  <meta name="twitter:title" content="{t}" />
  <meta name="twitter:description" content="{d}" />
  <meta name="twitter:image" content="{i}" />
"""
    if schema:
        tags += f'  <script type="application/ld+json">{json_ld(schema)}</script>\n'
    return tags


def short(text: str, limit: int = 160) -> str:
    return _clean(text or "")[:limit].strip()


# ── whole page ──

def build_page(shell_html: str | None, head: str, body: str, strip_tags) -> str:
    """The frontend shell with this page's head tags and its text inside #root."""
    if shell_html and "</head>" in shell_html:
        page = strip_tags(shell_html).replace("</head>", f"{head}\n</head>", 1)
        root = f'<div id="root">\n{body}\n</div>'
        if _ROOT_DIV.search(page):
            return _ROOT_DIV.sub(lambda _: root, page, count=1)
        if _BODY_OPEN.search(page):
            return _BODY_OPEN.sub(lambda m: m.group(0) + root, page, count=1)
        return page.replace("</head>", "</head>" + root, 1)
    return (
        '<!doctype html><html lang="en"><head><meta charset="UTF-8" />'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
        f'{head}</head><body><div id="root">\n{body}\n</div></body></html>'
    )
