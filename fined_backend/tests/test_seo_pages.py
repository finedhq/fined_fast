import pytest
from fastapi.testclient import TestClient

import app.services.page_shell as page_shell
from app.main import app
from app.services import article_service as article_service_module
from app.services.article_service import article_service

SHELL = (
    '<html><head><title>FinEd</title><meta name="description" content="generic" />'
    '<meta property="og:title" content="FinEd" /></head><body><div id="root"></div></body></html>'
)
GOOD_ARTICLE = {"title": "Hello", "slug": "good", "tag": "IPO", "content": "x", "authors": {"name": "A", "slug": "a"}}


@pytest.fixture
def client(monkeypatch):
    # Simulate the API host: no frontend on disk, shell fetched from the frontend and cached.
    fetches = {"n": 0}

    async def fake_fetch():
        fetches["n"] += 1
        return SHELL

    monkeypatch.setattr(page_shell, "_read_local", lambda: None)
    monkeypatch.setattr(page_shell, "_fetch_remote", fake_fetch)
    monkeypatch.setattr(page_shell, "_cache", {"html": None, "fetched_at": 0.0, "retry_at": 0.0})

    def get_by_slug(slug):
        if slug == "good":
            return GOOD_ARTICLE
        if slug == "boom":
            raise RuntimeError("db down")
        return None

    monkeypatch.setattr(article_service, "get_by_slug", get_by_slug)
    test_client = TestClient(app)
    test_client.fetches = fetches
    return test_client


def test_article_page_has_one_set_of_tags_and_never_redirects(client):
    resp = client.get("/articles/good", follow_redirects=False)
    assert resp.status_code == 200
    assert resp.text.count("<title>") == 1
    assert resp.text.count('rel="canonical"') == 1
    assert resp.text.count('name="description"') == 1
    assert "generic" not in resp.text


def test_head_is_allowed(client):
    assert client.head("/articles/good").status_code == 200


def test_unknown_article_is_a_real_404_with_the_app_shell(client):
    resp = client.get("/articles/missing", follow_redirects=False)
    assert resp.status_code == 404
    assert resp.text == SHELL


def test_lookup_error_still_serves_the_shell(client):
    resp = client.get("/articles/boom", follow_redirects=False)
    assert resp.status_code == 200
    assert resp.text == SHELL


def test_shell_is_fetched_once_and_cached(client):
    client.get("/about", follow_redirects=False)
    client.get("/articles/good", follow_redirects=False)
    assert client.fetches["n"] == 1


def test_without_a_shell_article_urls_do_not_redirect(client, monkeypatch):
    async def no_shell():
        return None

    monkeypatch.setattr(page_shell, "_fetch_remote", no_shell)
    good = client.get("/articles/good", follow_redirects=False)
    assert good.status_code == 200 and "location" not in good.headers
    assert client.get("/articles/missing", follow_redirects=False).status_code == 404
    boom = client.get("/articles/boom", follow_redirects=False)
    assert boom.status_code == 503 and boom.headers["retry-after"] == "60"


def test_new_article_slug_drops_apostrophes():
    assert article_service._slug_for_new_article("Why the Stock Market Doesn't Trade 24/7") == "why-the-stock-market-doesnt-trade-24-7"
    assert article_service._slug_for_new_article("India’s First Ethical Index") == "indias-first-ethical-index"


def test_legacy_slug_is_unchanged_so_old_titles_still_resolve():
    assert article_service._generate_slug("Why the Stock Market Doesn't Trade 24/7") == "why-the-stock-market-doesn-t-trade-24-7"


def test_sitemap_lastmod_only_on_pages_that_follow_the_articles(monkeypatch):
    monkeypatch.setattr(
        article_service_module.article_repo,
        "get_all_for_sitemap",
        lambda: [
            {"title": "Old", "slug": "old", "published_at": "2026-09-01T00:00:00+00:00"},
            {"title": "New", "slug": "new", "published_at": "2026-10-05T03:30:13+00:00"},
        ],
    )
    monkeypatch.setattr(article_service_module.article_repo, "get_all_authors", lambda: [])
    monkeypatch.setattr(article_service_module.course_repo, "get_listed", lambda: [])
    xml = article_service.build_sitemap_xml()
    assert "<loc>https://myfined.com/</loc><lastmod>2026-10-05</lastmod>" in xml
    assert "<loc>https://myfined.com/articles</loc><lastmod>2026-10-05</lastmod>" in xml
    assert "<loc>https://myfined.com/about</loc><changefreq>" in xml
