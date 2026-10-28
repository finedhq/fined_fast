# What crawlers get for each database-backed page: the page's own head tags and
# its real text as plain HTML inside #root (not hidden, not in <noscript>).

import re

import pytest
from fastapi.testclient import TestClient

import app.services.page_shell as page_shell
from app.main import app
from app.repositories.course_repo import course_repo
from app.services import crawler_pages as cp
from app.services.article_service import article_service

SHELL = (
    '<html><head><title>FinEd</title><meta name="description" content="generic" />'
    '<meta property="og:title" content="FinEd" /></head><body>'
    '<noscript><iframe src="https://gtm.example"></iframe></noscript>'
    '<div id="root"></div><script type="module" src="/assets/app.js"></script></body></html>'
)

ARTICLE = {
    "id": "a1",
    "title": "What Is a <Credit> Score?",
    "slug": "credit-score",
    "tag": "Personal Finance",
    "description": "A three-digit number that decides what you pay.",
    "published_at": "2026-10-05T03:30:13+00:00",
    "image_url": "https://img.example/cover.png",
    "authors": {"name": "Asha Rao", "slug": "asha-rao"},
    "reviewer": {"name": "Ravi K", "slug": "ravi-k"},
    "content": "\n".join([
        "Imagine two friends applying for the same loan.",
        "## Why banks *trust* it",
        "Banks check [your report](https://www.cibil.com) and [our guide](/articles/emi).",
        "- Pay on time",
        "- Keep usage low",
        "1. Check your score",
        "2. Fix errors",
        "### A closer look",
        "![Chart|How scores move](https://img.example/chart.png)",
        "---",
        "Bad link [click](javascript:alert(1)) and <script>alert(1)</script>",
        "*Disclaimer: This article is for educational purposes only.*",
    ]),
}
LIST = [
    {"title": "What Is a <Credit> Score?", "slug": "credit-score", "description": "Score basics.", "tag": "Personal Finance"},
    {"title": "IPO 101", "slug": "ipo-101", "description": "How IPOs work.", "tag": "IPO"},
]
AUTHOR = {"id": "u1", "name": "Asha Rao", "slug": "asha-rao", "bio": "CFA", "description": "Writes about credit.",
          "linkedin_url": "https://linkedin.com/in/asha"}
COURSES = {
    "basics-of-stock-market": {"id": "11111111-1111-1111-1111-111111111111", "slug": "basics-of-stock-market",
                               "title": "Basics of Stock Market", "description": "Learn how the market works.",
                               "status": "published"},
    "old-course": {"id": "c2", "slug": "old-course", "title": "Old", "description": "Replaced.", "status": "archived"},
    "secret": {"id": "c3", "slug": "secret", "title": "Secret", "description": "Draft.", "status": "draft"},
}
MODULES = [
    {"id": "m1", "title": "Why Does the Market Exist?", "description": "The basics.", "status": "published"},
    {"id": "m2", "title": "Not Released Yet", "description": "Hidden.", "status": "draft"},
    {"id": "m3", "title": "What Is a Stock?", "description": "", "status": None},
]


@pytest.fixture
def client(monkeypatch):
    async def fake_fetch():
        return SHELL

    monkeypatch.setattr(page_shell, "_read_local", lambda: None)
    monkeypatch.setattr(page_shell, "_fetch_remote", fake_fetch)
    monkeypatch.setattr(page_shell, "_cache", {"html": None, "fetched_at": 0.0, "retry_at": 0.0})

    monkeypatch.setattr(article_service, "get_by_slug", lambda slug: ARTICLE if slug == "credit-score" else None)
    monkeypatch.setattr(article_service, "get_published_tags", lambda: ["IPO", "Personal Finance"])
    monkeypatch.setattr(
        article_service, "get_all",
        lambda limit=30, offset=0, tag=None: [a for a in LIST if tag is None or a["tag"] == tag],
    )
    monkeypatch.setattr(article_service, "get_author_by_slug", lambda slug: AUTHOR if slug == "asha-rao" else None)
    monkeypatch.setattr(article_service, "get_articles_by_author", lambda author_id, limit=12, offset=0: {"articles": LIST[:1]})

    def course_by_id(course_id):
        return next((c for c in COURSES.values() if c["id"] == course_id), None)

    monkeypatch.setattr(course_repo, "get_by_slug", lambda slug: COURSES.get(slug))
    monkeypatch.setattr(course_repo, "get_by_id", course_by_id)
    monkeypatch.setattr(course_repo, "get_modules", lambda course_id: MODULES)
    return TestClient(app)


def root_text(page: str) -> str:
    """The visible words inside #root (tags removed)."""
    root = re.search(r'<div id="root">(.*?)</div>\s*<script', page, re.S).group(1)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", root)).strip()


def head_of(page: str) -> str:
    return page.split("</head>")[0]


def assert_one_set_of_tags(page: str, title: str, canonical: str):
    head = head_of(page)
    assert head.count("<title>") == 1 and f"<title>{title}</title>" in head
    assert head.count('rel="canonical"') == 1 and f'href="{canonical}"' in head
    assert head.count('name="description"') == 1
    assert "generic" not in head


# ── articles ──

def test_article_body_has_the_article_text(client):
    resp = client.get("/articles/credit-score")
    assert resp.status_code == 200
    text = root_text(resp.text)
    assert "What Is a <Credit> Score?" not in resp.text.split("</head>")[1]  # escaped
    assert "What Is a &lt;Credit&gt; Score?" in resp.text
    assert "Imagine two friends applying for the same loan." in text
    assert "By Asha Rao" in text and "Reviewed by Ravi K" in text
    assert "Oct 5, 2026" in text
    assert "<h2>Why banks <em>trust</em> it</h2>" in resp.text
    assert "<h3>A closer look</h3>" in resp.text
    assert len(text.split()) > 40


def test_article_markdown_is_converted_safely(client):
    page = client.get("/articles/credit-score").text
    assert '<a href="https://www.cibil.com">your report</a>' in page
    assert '<a href="https://myfined.com/articles/emi">our guide</a>' in page
    assert "<ul><li>Pay on time</li><li>Keep usage low</li></ul>" in page.replace("\n", "")
    assert '<li value="1">Check your score</li>' in page
    assert '<figcaption>How scores move</figcaption>' in page
    assert "<hr />" in page
    assert "javascript:" not in page
    assert "<script>alert(1)</script>" not in page
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in page
    assert "<strong>Disclaimer</strong>" in page


def test_article_text_is_not_hidden(client):
    page = client.get("/articles/credit-score").text
    body = page.split("</head>")[1]
    root = body.split('<div id="root">')[1]
    assert "<noscript" not in root
    assert "display:none" not in root.replace(" ", "") and "hidden" not in root


def test_unknown_article_is_still_a_404(client):
    assert client.get("/articles/nope").status_code == 404


# ── authors ──

def test_author_text_is_plain_html_not_noscript(client):
    resp = client.get("/authors/asha-rao")
    assert resp.status_code == 200
    root = resp.text.split('<div id="root">')[1]
    assert "<noscript" not in root.split("</div>")[0]
    text = root_text(resp.text)
    assert "Asha Rao" in text and "Writes about credit." in text
    assert "Articles by Asha Rao" in text
    assert 'href="https://myfined.com/articles/credit-score"' in resp.text


def test_unknown_author_is_a_404(client):
    assert client.get("/authors/nobody").status_code == 404


# ── tag pages ──

def test_tag_page_lists_its_articles(client):
    resp = client.get("/tags/personal-finance")
    assert resp.status_code == 200
    assert_one_set_of_tags(resp.text, "Articles tagged &quot;Personal Finance&quot; | FinEd",
                           "https://myfined.com/tags/personal-finance")
    text = root_text(resp.text)
    assert text.startswith("Tag: Personal Finance Articles tagged with Personal Finance.")
    assert "Score basics." in text and "IPO 101" not in text
    assert '<a href="https://myfined.com/articles/credit-score">' in resp.text


def test_tag_page_with_trailing_slash(client):
    assert client.get("/tags/ipo/").status_code == 200


def test_unknown_tag_is_a_404(client):
    assert client.get("/tags/crypto").status_code == 404


# ── article list ──

def test_articles_index_lists_articles_and_topics(client):
    for path in ("/articles", "/articles/"):
        resp = client.get(path)
        assert resp.status_code == 200
        assert_one_set_of_tags(resp.text, "Articles | FinEd", "https://myfined.com/articles")
        text = root_text(resp.text)
        assert text.startswith("Articles &amp; Insights") or text.startswith("Articles & Insights")
        assert "IPO 101" in text and "How IPOs work." in text
        assert 'href="https://myfined.com/tags/personal-finance"' in resp.text


# ── course overview ──

def test_course_page_has_its_own_tags_and_released_modules(client):
    resp = client.get("/courses/basics-of-stock-market")
    assert resp.status_code == 200
    assert_one_set_of_tags(resp.text, "Basics of Stock Market | FinEd",
                           "https://myfined.com/courses/basics-of-stock-market")
    assert '"@type": "Course"' in resp.text
    text = root_text(resp.text)
    assert "Learn how the market works." in text
    assert "Module 1: Why Does the Market Exist?" in text
    assert "Module 2: What Is a Stock?" in text
    assert "Not Released Yet" not in resp.text


def test_course_by_id_points_canonical_at_the_slug(client):
    resp = client.get("/courses/11111111-1111-1111-1111-111111111111")
    assert 'rel="canonical" href="https://myfined.com/courses/basics-of-stock-market"' in resp.text


def test_archived_course_opens_but_is_noindex(client):
    resp = client.get("/courses/old-course")
    assert resp.status_code == 200
    assert '<meta name="robots" content="noindex, follow" />' in resp.text


def test_draft_or_unknown_course_is_a_404(client):
    assert client.get("/courses/secret").status_code == 404
    assert client.get("/courses/nope").status_code == 404


def test_lookup_error_serves_the_plain_shell(client, monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("db down")

    monkeypatch.setattr(course_repo, "get_by_slug", boom)
    resp = client.get("/courses/basics-of-stock-market")
    assert resp.status_code == 200 and resp.text == SHELL


def test_without_a_shell_listing_pages_still_answer(client, monkeypatch):
    async def no_shell():
        return None

    monkeypatch.setattr(page_shell, "_fetch_remote", no_shell)
    resp = client.get("/tags/ipo", follow_redirects=False)
    assert resp.status_code == 200 and "IPO 101" in resp.text
    assert client.get("/tags/crypto", follow_redirects=False).status_code == 404


# ── converter details ──

def test_first_paragraph_becomes_the_description_when_none_is_set():
    article = {"content": "Opening line.\nSecond line."}
    assert cp.article_description(article) == "Opening line."
    assert cp.article_body_html(article) == "<p>Second line.</p>"


def test_title_case_lines_become_headings_only_without_explicit_ones():
    assert cp.article_body_html({"description": "d", "content": "Why It Matters\nText here."}) == \
        "<h2>Why It Matters</h2>\n<p>Text here.</p>"
    assert "<p>Why It Matters</p>" in cp.article_body_html(
        {"description": "d", "content": "## Real Heading\nWhy It Matters"})
