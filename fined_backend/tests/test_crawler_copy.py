# The crawler versions of the home, About and Contact pages repeat those pages'
# fixed wording in Python (crawler_pages.py, crawler_static_pages.py). Crawlers
# must read what people see, so every copied line has to still be on the React
# page. If one of these fails, the page's text changed in fined_frontend: copy
# the new wording into the Python file named in the failure.

import html
import re
from pathlib import Path

import pytest

from app.services import crawler_pages as cp
from app.services import crawler_static_pages as csp

FRONTEND = Path(__file__).resolve().parents[2] / "fined_frontend" / "src"
pytestmark = pytest.mark.skipif(not FRONTEND.is_dir(), reason="fined_frontend is not checked out next to the backend")


def visible_text(*relative_paths: str) -> str:
    """The JSX files' text with tags and {" "} removed and spaces collapsed, roughly what a reader sees."""
    source = " ".join((FRONTEND / p).read_text(encoding="utf-8") for p in relative_paths)
    source = source.replace('{" "}', " ")
    source = re.sub(r"<[^<>]*>", "", source)
    return re.sub(r"\s+", " ", html.unescape(source))


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


HOME = (
    "pages/Home/sections/HeroSection.jsx", "pages/Home/sections/StorySection.jsx",
    "pages/Home/sections/FeaturesSection.jsx", "pages/Home/sections/CoursesSection.jsx",
    "pages/Home/sections/ArticlesSection.jsx", "pages/Home/sections/ExpertsSection.jsx",
    "pages/Home/sections/TestimonialsSection.jsx", "pages/Home/sections/FinalCta.jsx",
    "pages/Home/sections/LearnersStrip.jsx",
)
ABOUT = ("pages/AboutPage/AboutPage.jsx",)
CONTACT = ("pages/ContactPage/ContactPage.jsx",)
COURSES = ("pages/CoursesPage/Courses.jsx",)


def home_lines():
    yield from [cp._HOME_STORY_LEAD, cp._HOME_STORY_FOLLOW, cp._HOME_COURSE_FALLBACK, *cp._HOME_TOPICS]
    for heading, points in cp._HOME_FEATURES:
        yield heading
        yield from points
    yield from (quote for quote, _name, _age in cp._HOME_QUOTES)
    yield from [
        "Learn money skills in 10 minutes a day",
        "Bite-sized interactive personal finance courses built for the youth. No jargon, no fees, no excuses.",
        "Start with the right course", "Insights to grow your money", "Short reads. Big takeaways.",
        "More courses coming soon...", "Stay tuned for new financial lessons", "Explore all courses",
        "Explore all articles", "The experts behind FinEd", "Every path leads somewhere",
        "See what learners achieved after taking their first step.", "Your financial journey starts here.",
        "Small steps today. Bigger opportunities tomorrow.", "Try Module 1",
    ]


def about_lines():
    yield from [
        csp.ABOUT_H1, csp.ABOUT_SUB, csp.ABOUT_EXPERTS_FACT, csp.ABOUT_STORY_SUB, csp.ABOUT_STORY_CLOSE_LEAD,
        csp.ABOUT_STORY_CLOSE, csp.ABOUT_MISSION, csp.ABOUT_LEARN_SUB, csp.ABOUT_FOUNDERS_SUB,
        csp.ABOUT_EXPERTS_SUB, csp.ABOUT_ADVICE, csp.ABOUT_PARTNER_SUB, csp.CONTACT_EMAIL,
        *csp.SCHOOL_TAUGHT, *csp.NOBODY_TAUGHT,
        "Why we built FinEd", "What school taught us", "What nobody taught us", "Our mission",
        "How you learn on FinEd", "Meet the founders", "Education, not advice", "For institutional partnerships",
        "Read our terms", "Read articles", "Partner with us", "Co-founder",
    ]
    for big, text in csp.ABOUT_FACTS:
        yield big
        yield text
    for word, text in csp.ABOUT_PILLARS:
        yield word
        yield text
    for _path, title, text in csp.ABOUT_TILES:
        yield title
        yield text
    for _slug, name, role, bio in csp.FOUNDERS:
        yield from (name, role, bio)


def contact_lines():
    yield from [
        "Get in Touch with FinEd", csp.CONTACT_SUB, "Direct Support", "Replies within 24 hours", csp.CONTACT_DIRECT,
        csp.CONTACT_EMAIL, *csp.CONTACT_PHONES, csp.CONTACT_HOURS, "Send us a Message", csp.CONTACT_FORM_SUB,
        "Select Inquiry Topic", *csp.CONTACT_TOPICS,
    ]


def courses_lines():
    yield from [
        "Master Finance in 15-Minute Lessons",
        "Visual, gamified, and practical courses on investing, market mechanics, budgeting, and wealth building "
        "designed for everyday investors.",
        "100% Free & Interactive", "Gamified Scenarios", "Earn Certificates", "Available Courses",
        "No courses available yet", "New interactive finance modules are being crafted. Check back shortly!",
        cp._COURSE_CARD_FALLBACK,
    ]


@pytest.mark.parametrize(
    "name, files, lines, python_file",
    [
        ("home", HOME, home_lines, "crawler_pages.py"),
        ("courses", COURSES, courses_lines, "crawler_pages.py"),
        ("about", ABOUT, about_lines, "crawler_static_pages.py"),
        ("contact", CONTACT, contact_lines, "crawler_static_pages.py"),
    ],
)
def test_crawler_copy_is_still_on_the_page(name, files, lines, python_file):
    page = visible_text(*files)
    missing = [line for line in lines() if norm(line) not in page]
    assert not missing, (
        f"The {name} page no longer shows this text, but app/services/{python_file} still sends it to "
        f"crawlers. Update it to match {', '.join(files)}: {missing}"
    )


def test_author_titles_match_the_frontend():
    source = (FRONTEND / "lib" / "authorTitles.js").read_text(encoding="utf-8")
    for slug, title in cp.AUTHOR_TITLES.items():
        assert title in source and slug in source, f"{slug}: update AUTHOR_TITLES in crawler_pages.py"
    for slug in cp.FOUNDER_SLUGS:
        assert f'"{slug}"' in source, f"{slug}: update FOUNDER_SLUGS in crawler_pages.py"
