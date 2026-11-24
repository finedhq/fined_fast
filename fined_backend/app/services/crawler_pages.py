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


# ── home page (mirrors fined_frontend/src/pages/Home: Hero.jsx and its sections) ──
#
# The static wording below is copied from those components. If a section's text
# changes there, change it here too, or crawlers read an old page.

# StorySection.jsx
_HOME_STORY_LEAD = (
    "Most people never really learned about money. Not in school, not at home. "
    "Someone just handed you a salary one day and said good luck."
)
_HOME_STORY_FOLLOW = (
    "FinEd fixes that, but without making it feel like homework. "
    "Every lesson is short enough to finish on a lunch break."
)
_HOME_TOPICS = [
    "Your first salary", "“No cost” EMIs", "Credit scores", "How UPI makes money",
    "Index funds", "TDS on your salary", "How IPOs work", "Credit vs debit cards",
    "Nifty & Sensex", "Investing in US stocks", "Why prices keep rising", "How dividends work",
]
# FeaturesSection.jsx
_HOME_FEATURES = [
    ("Bite-sized lessons", [
        "Built for short attention spans (we get it)",
        "One money topic at a time. No information overload",
        "No boring 45-minute lectures or endless videos",
        "From budgeting to SIPs, taxes and credit scores",
    ]),
    ("Interactive Learning", [
        "Learn by doing, not just scrolling",
        "Make money decisions without real-life consequences",
        "Quick quizzes that keep things interesting",
        "Feels more like a game than a finance class",
    ]),
    ("Rewards & Leaderboards", [
        "Every lesson earns you rewards",
        "Friendly competition keeps you motivated",
        "Don't break the streak \U0001F440",
        "Build your FinScore by staying consistent",
    ]),
    ("Personalized Recommendations", [
        "No one-size-fits-all money advice",
        "We recommend what actually fits you",
        "Zero spam, Zero random product pushes",
        "The more you learn, the better we get",
    ]),
]
# CoursesSection.jsx: shown when the course has no description of its own
_HOME_COURSE_FALLBACK = (
    "This course will provide you everything you need to start investing in India. The stock market can "
    "seem complicated, but it doesn't have to be. This course breaks down how the market works, from stocks, "
    "IPOs, and key market terms to the basics of analysing companies and the economy."
)
# TestimonialsSection.jsx
_HOME_QUOTES = [
    ("The articles explain complex financial topics in a way that's actually easy to understand. "
     "I finally feel confident reading about investing.", "Gaurav", 20),
    ("I wish I had access to content like this when I started college. "
     "It's practical and doesn't overwhelm beginners.", "Rahul", 25),
    ("FinEd's mission of making financial education free and accessible is something I genuinely support. "
     "Financial literacy shouldn't be a privilege.", "Priya", 24),
    ("The content is concise, engaging, and easy to revisit whenever I need a quick refresher.", "Ananya", 19),
]
# fined_frontend/src/lib/authorTitles.js
FOUNDER_SLUGS = {"anish-pujari", "shravan-mutha"}
AUTHOR_TITLES = {
    "shishir-bhartia": "Directional Strategy Consultant, Ex Head Times Group Alliances and Brand Capital West",
    "deepan-datta": "Investment Writer",
    "dharsana-gandhi-r": "Finance Professional",
    "madhvendra": "Finance Writer",
    "puja-tayal": "Financial Writer & Equity Analyst",
}
DEFAULT_AUTHOR_TITLE = "Writer at FinEd"


def author_blurb(author: dict, title: str) -> str:
    """Like authorBlurb: the bio, unless it only repeats the title."""
    letters = lambda s: re.sub(r"[^a-z]", "", _clean(s or "").lower())
    bio = _clean(author.get("bio") or "")
    if bio and letters(bio) != letters((title or "").replace(",", "", 1)):
        return bio
    return _clean(author.get("description") or "")


def featured_course(courses: list) -> dict | None:
    """The course the home page features: the stock market one, else the newest."""
    if not courses:
        return None
    return next((c for c in courses if "stock market" in (c.get("title") or "").lower()), courses[0])


def course_display_title(course: dict) -> str:
    # The admin title can carry a "v2" marker that learners never see
    return re.sub(r"\s+v\d+$", "", course.get("title") or "", flags=re.I)


def _course_href(course: dict) -> str:
    return f"{SITE}/courses/{esc(course.get('slug') or course.get('id'))}"


def home_page_body(course: dict | None, articles: list, authors: list) -> str:
    try_link = f'<a href="{SITE}/try">Try Module 1</a>'
    articles_link = f'<a href="{SITE}/articles">Explore Articles</a>'
    topics = "".join(f"<li>{esc(t)}</li>" for t in _HOME_TOPICS)
    parts = [
        "<main>",
        "<section><h1>Learn money skills in 10 minutes a day</h1>",
        "<p>Bite-sized interactive personal finance courses built for the youth. No jargon, no fees, no excuses.</p>",
        f"<p>{try_link} · {articles_link}</p></section>",
        "<p>Join <strong>2000+</strong> learners building their financial future</p>",
        f"<section><p>{esc(_HOME_STORY_LEAD)}</p><p>{esc(_HOME_STORY_FOLLOW)}</p>",
        f'<ul aria-label="Topics we cover">{topics}</ul></section>',
        "<section><h2>Everything you need to build a strong financial future</h2>",
        "<p>Practical paths . Real skills . Lifelong effect .</p>",
    ]
    for heading, points in _HOME_FEATURES:
        items = "".join(f"<li>{esc(p)}</li>" for p in points)
        parts.append(f"<h3>{esc(heading)}</h3><ul>{items}</ul>")
    parts.append("</section>")

    parts.append("<section><h2>Start with the right course</h2><p>Practical paths. Real skills. Lifelong effect.</p>")
    if course:
        title = course_display_title(course) or "Basics of Stock Market"
        modules = course.get("planned_modules") or course.get("modules_count") or 12
        minutes = course.get("duration") or 15
        parts.append(
            f'<article><h3><a href="{_course_href(course)}">{esc(title)}</a></h3>'
            f"<p>{esc(modules)} Modules · {esc(minutes)} mins · Free</p>"
            f"<p>{esc(course.get('description') or _HOME_COURSE_FALLBACK)}</p>"
            f'<p><a href="{_course_href(course)}">View Course</a></p></article>'
        )
    parts.append("<h3>More courses coming soon...</h3><p>Stay tuned for new financial lessons</p>")
    parts.append(f'<p><a href="{SITE}/courses">Explore all courses</a></p></section>')

    parts.append("<section><h2>Insights to grow your money</h2><p>Short reads. Big takeaways.</p>")
    parts.append(article_list_html(articles))
    parts.append(f'<p><a href="{SITE}/articles">Explore all articles</a></p></section>')

    experts = [a for a in authors or [] if a.get("name") and a.get("slug") not in FOUNDER_SLUGS]
    if experts:
        parts.append("<section><h2>The experts behind FinEd</h2>")
        parts.append("<p>Learn from industry experts with years of experience in finance.</p><ul>")
        for a in experts:
            title = AUTHOR_TITLES.get(a.get("slug"), DEFAULT_AUTHOR_TITLE)
            blurb = author_blurb(a, title)
            parts.append(
                f'<li><h3><a href="{SITE}/authors/{esc(a.get("slug"))}">{esc(a["name"])}</a></h3>'
                f"<p>{esc(title)}</p>" + (f"<p>{esc(blurb)}</p>" if blurb else "") + "</li>"
            )
        parts.append("</ul></section>")

    parts.append("<section><h2>Every path leads somewhere</h2>")
    parts.append("<p>See what learners achieved after taking their first step.</p><ul>")
    for quote, name, age in _HOME_QUOTES:
        parts.append(f"<li><blockquote><p>{esc(quote)}</p></blockquote><p>{esc(name)}, {esc(age)}</p></li>")
    parts.append("</ul></section>")

    parts.append("<section><h2>Your financial journey starts here.</h2>")
    parts.append("<p>Small steps today. Bigger opportunities tomorrow.</p>")
    parts.append(f"<p>{try_link} · {articles_link}</p></section>")
    parts.append("</main>")
    return "\n".join(parts)


# ── course list (mirrors fined_frontend/src/pages/CoursesPage/Courses.jsx, signed out) ──

_COURSE_CARD_FALLBACK = (
    "Master core financial concepts through visual scenarios, bite-sized lessons, and interactive quiz cards."
)


def courses_index_body(courses: list) -> str:
    parts = [
        "<main><section><h1>Master Finance in 15-Minute Lessons</h1>",
        "<p>Visual, gamified, and practical courses on investing, market mechanics, budgeting, "
        "and wealth building designed for everyday investors.</p>",
        "<ul><li>100% Free &amp; Interactive</li><li>Gamified Scenarios</li><li>Earn Certificates</li></ul></section>",
        "<section><h2>Available Courses</h2>",
    ]
    if not courses:
        parts.append("<h3>No courses available yet</h3>")
        parts.append("<p>New interactive finance modules are being crafted. Check back shortly!</p>")
    else:
        count = len(courses)
        parts.append(f"<p>{count} {'course' if count == 1 else 'interactive courses'} available</p><ul>")
        for c in courses:
            modules = c.get("planned_modules") or c.get("modules_count") or 0
            parts.append(
                f'<li><h3><a href="{_course_href(c)}">{esc(c.get("title"))}</a></h3>'
                f"<p>{esc(modules)} Modules</p><p>{esc(c.get('description') or _COURSE_CARD_FALLBACK)}</p></li>"
            )
        parts.append("</ul>")
    parts.append("</section></main>")
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
