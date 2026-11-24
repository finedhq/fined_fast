# Visible text of the About and Contact pages for crawlers that don't run
# JavaScript, as crawler_pages.py does for the home page.
#
# The wording is copied from fined_frontend/src/pages/AboutPage/AboutPage.jsx
# and fined_frontend/src/pages/ContactPage/ContactPage.jsx. If it changes there,
# change it here too: tests/test_crawler_copy.py fails until both match.

from app.services.crawler_pages import (
    AUTHOR_TITLES,
    DEFAULT_AUTHOR_TITLE,
    FOUNDER_SLUGS,
    SITE,
    _safe_href,
    author_blurb,
    esc,
)

CONTACT_EMAIL = "support@myfined.com"

# ── About (AboutPage.jsx, top to bottom) ──

ABOUT_H1 = "Making financial education simple, practical and accessible."
ABOUT_SUB = "FinEd is a free learning platform that helps young Indians understand money, one short lesson at a time."
ABOUT_FACTS = [
    ("2,000+", "learners building their financial future"),
    ("₹0", "to learn. Every course and article is free"),
    ("12", "modules in Basics of Stock Market, a new one every Monday"),
]
ABOUT_EXPERTS_FACT = "finance experts writing for FinEd"
ABOUT_STORY_SUB = (
    "Most of us finished school without ever learning how money works. Then the first salary arrives, "
    "and we are left to figure it out by trial and error."
)
SCHOOL_TAUGHT = ["Trigonometry", "Photosynthesis", "The dates of the Battle of Plassey", "How to write a formal letter"]
NOBODY_TAUGHT = [
    "How a credit score works", "What a mutual fund actually is",
    "How to budget a month's salary", "Why tax is cut from your salary",
]
ABOUT_STORY_CLOSE_LEAD = "We built FinEd to fix that gap."
ABOUT_STORY_CLOSE = (
    "Our goal is to make finance intuitive, without long, dry textbooks. Our lessons are stories where the "
    "charts move as you read and you make a guess before every answer, so you learn by doing."
)
ABOUT_MISSION = (
    "Bridge the gap traditional education left, and help you build a foundation for lifelong financial independence."
)
ABOUT_PILLARS = [
    ("Simple", "Complex financial topics broken into simple, engaging, bite-sized lessons that fit into a busy life."),
    ("Practical", "Skills and confidence for real money decisions, taught with Indian examples like UPI, EMIs, "
                  "IPOs and your salary slip."),
    ("Accessible", "Free to learn and built for your phone, so anyone who wants to understand money can start today."),
]
ABOUT_LEARN_SUB = "Short, hands-on and made for your phone. No 45-minute lectures."
ABOUT_TILES = [
    ("/courses", "Story-led courses", "Basics of Stock Market walks you through how markets work, one story at a "
                                      "time. Charts move as you scroll and quick checks keep you thinking."),
    ("/articles", "Articles by people in finance", "Clear explainers on taxes, credit, investing and the economy."),
    ("/articles", "Personal Lens", "Answer a few quick questions on an article and get a takeaway written for "
                                   "your situation."),
    (None, "Rewards and leaderboards", "Every lesson earns you points. Keep your streak going and see where you stand."),
    (None, "A certificate you can share", "Finish a course and get a certificate with a QR code that anyone can "
                                          "scan to verify it."),
]
ABOUT_FOUNDERS_SUB = "Two engineering students who wanted the money lessons school never taught."
FOUNDERS = [
    ("shravan-mutha", "Shravan Mutha", "Product, technology and content",
     "Shravan is passionate about making financial education simple and accessible. He leads the product, "
     "technology, and content at FinEd, working on everything from building the platform to creating "
     "easy-to-understand courses and articles. His goal is to help young people develop the financial knowledge "
     "needed to make better money decisions throughout their lives."),
    ("anish-pujari", "Anish Pujari", "Design, branding and marketing",
     "Anish leads the design, branding, and marketing. He focuses on creating an engaging user experience while "
     "growing FinEd's reach through creative campaigns and storytelling. His goal is to make learning about "
     "finance feel approachable, enjoyable, and relevant for the next generation."),
]
ABOUT_EXPERTS_SUB = "Learn from industry experts with years of experience in finance."
ABOUT_ADVICE = (
    "FinEd teaches how money works. We are not SEBI-registered investment advisers, so we never tell you which "
    "stock or fund to buy, and we don't push financial products. The numbers in our lessons explain an idea; "
    "they are not forecasts."
)
ABOUT_PARTNER_SUB = (
    "Want FinEd for your college, student club or organisation? Tell us what you have in mind and our team "
    "will get back to you."
)


def _link(path: str, text: str) -> str:
    return f'<a href="{SITE}{path}">{esc(text)}</a>'


def about_page_body(authors: list) -> str:
    named = [a for a in authors or [] if a.get("name") and a.get("slug")]
    by_slug = {a["slug"]: a for a in named}
    experts = [a for a in named if a["slug"] not in FOUNDER_SLUGS]

    facts = list(ABOUT_FACTS)
    if experts:
        facts.append((str(len(experts)), ABOUT_EXPERTS_FACT))
    fact_items = "".join(f"<li><strong>{esc(big)}</strong> {esc(text)}</li>" for big, text in facts)

    parts = [
        "<main>",
        f"<section><h1>{esc(ABOUT_H1)}</h1><p>{esc(ABOUT_SUB)}</p>",
        f"<p>{_link('/try', 'Try Module 1')}</p></section>",
        f"<ul>{fact_items}</ul>",
        f"<section><h2>Why we built FinEd</h2><p>{esc(ABOUT_STORY_SUB)}</p>",
        "<h3>What school taught us</h3><ul>" + "".join(f"<li>{esc(t)}</li>" for t in SCHOOL_TAUGHT) + "</ul>",
        "<h3>What nobody taught us</h3><ul>" + "".join(f"<li>{esc(t)}</li>" for t in NOBODY_TAUGHT) + "</ul>",
        f"<p><strong>{esc(ABOUT_STORY_CLOSE_LEAD)}</strong> {esc(ABOUT_STORY_CLOSE)}</p></section>",
        f"<section><h2>Our mission</h2><p>{esc(ABOUT_MISSION)}</p><ul>",
    ]
    parts += [f"<li><h3>{esc(word)}</h3><p>{esc(text)}</p></li>" for word, text in ABOUT_PILLARS]
    parts.append(f"</ul></section><section><h2>How you learn on FinEd</h2><p>{esc(ABOUT_LEARN_SUB)}</p><ul>")
    for path, title, text in ABOUT_TILES:
        heading = _link(path, title) if path else esc(title)
        parts.append(f"<li><h3>{heading}</h3><p>{esc(text)}</p></li>")
    parts.append(f"</ul></section><section id=\"team\"><h2>Meet the founders</h2><p>{esc(ABOUT_FOUNDERS_SUB)}</p>")
    for slug, name, role, bio in FOUNDERS:
        linkedin = _safe_href((by_slug.get(slug) or {}).get("linkedin_url") or "")
        parts.append(
            f"<article><p>Co-founder</p><h3>{esc(name)}</h3><p>{esc(role)}</p><p>{esc(bio)}</p>"
            f"<p>{_link(f'/authors/{slug}', 'Read articles')}"
            + (f' · <a href="{esc(linkedin)}" rel="noopener">{esc(name)} on LinkedIn</a>' if linkedin else "")
            + "</p></article>"
        )
    parts.append("</section>")
    if experts:
        parts.append(f"<section><h2>The experts behind FinEd</h2><p>{esc(ABOUT_EXPERTS_SUB)}</p><ul>")
        for a in experts:
            title = AUTHOR_TITLES.get(a["slug"], DEFAULT_AUTHOR_TITLE)
            blurb = author_blurb(a, title)
            parts.append(
                f"<li><h3>{_link('/authors/' + a['slug'], a['name'])}</h3><p>{esc(title)}</p>"
                + (f"<p>{esc(blurb)}</p>" if blurb else "") + "</li>"
            )
        parts.append("</ul></section>")
    parts.append(
        f"<section><h2>Education, not advice</h2><p>{esc(ABOUT_ADVICE)}</p>"
        f"<p>{_link('/termsofservice', 'Read our terms')}</p></section>"
    )
    parts.append(
        f"<section><h2>For institutional partnerships</h2><p>{esc(ABOUT_PARTNER_SUB)}</p>"
        f"<p>{_link('/contact', 'Partner with us')} · "
        f'<a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a></p></section>'
    )
    parts.append("</main>")
    return "\n".join(parts)


# ── Contact (ContactPage.jsx) ──

CONTACT_SUB = (
    "Have questions about our financial courses, explainers, or need research support? "
    "Reach out directly or send us a message below."
)
CONTACT_DIRECT = "For urgent help, institutional partnerships, or general inquiries, reach out directly to our team."
CONTACT_PHONES = ["7507972411", "9325586658"]
CONTACT_HOURS = "Mon – Sat: 9:00 AM – 7:00 PM IST"
CONTACT_FORM_SUB = "Fill out the form below and we'll get back to you promptly."
CONTACT_TOPICS = ["General Inquiry", "Course Support", "Editorial Feedback", "Partnerships & Press"]


def contact_page_body() -> str:
    phones = " / ".join(f'<a href="tel:{p}">{p}</a>' for p in CONTACT_PHONES)
    topics = "".join(f"<li>{esc(t)}</li>" for t in CONTACT_TOPICS)
    return "\n".join([
        "<main>",
        f"<section><h1>Get in Touch with FinEd</h1><p>{esc(CONTACT_SUB)}</p></section>",
        "<section><h2>Direct Support</h2><p>Replies within 24 hours</p>",
        f"<p>{esc(CONTACT_DIRECT)}</p>",
        f'<p>Email: <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a></p>',
        f"<p>Phone Support: {phones}</p>",
        f"<p>Working Hours: {esc(CONTACT_HOURS)}</p></section>",
        f"<section><h2>Send us a Message</h2><p>{esc(CONTACT_FORM_SUB)}</p>",
        f"<p>Select Inquiry Topic</p><ul>{topics}</ul></section>",
        "</main>",
    ])
