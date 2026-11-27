"""Helpers to write a WinterArc day as "Import module JSON" for the admin.

Each day file (dayNN.py) builds its cards with these helpers; `python3
scripts/winterarc/build.py` validates every card against the backend's
card_data.py models and writes one JSON file per day.
"""


def g(term, definition):
    return {"term": term, "definition": definition}


def step(step_id, badge, heading, body, *, glossary=(), guess=None, annotation=None, stat=None):
    s = {"step_id": step_id, "badge_label": badge, "heading": heading, "body": body, "glossary_terms": list(glossary)}
    if guess:
        prompt, options = guess
        s["interaction"] = {
            "kind": "tap_guess",
            "prompt": prompt,
            "options": [{"id": i, "label": l, "feedback": f, "correct": bool(ok)} for i, l, f, ok in options],
        }
    if annotation:
        s["annotation"] = {"accent_type": annotation[0], "text": annotation[1]}
    if stat:
        s["stat"] = stat
    return s


def hero(day, slug, title, headline, subhead, read_time, poll_id, prompt, options, ack, chips=(), warmup_chip=None):
    """warmup_chip: (id, prompt, [(id, label, value or None)], ack, skip_ack)"""
    card = {
        "card_type": "hero",
        "title": f"Day {day}: {title}",
        "slug": slug,
        "card_data": {
            "badge": f"WinterArc · Day {day}",
            "short_title": title,
            "headline": headline,
            "subhead": subhead,
            "read_time": read_time,
            "meta_chips": list(chips) or ["3 chapters", "3 quick checks", "30 points"],
            "poll": {"id": poll_id, "prompt": prompt, "options": [{"id": i, "label": l} for i, l in options], "ack": ack},
        },
    }
    if warmup_chip:
        cid, cprompt, copts, cack, cskip = warmup_chip
        card["card_data"]["chip"] = {
            "id": cid, "prompt": cprompt, "ack": cack, "skip_ack": cskip,
            "options": [{"id": i, "label": l, "value": v} for i, l, v in copts],
        }
    return card


def chapter(slug, title, label, figure_kind, figure_title, steps):
    return {
        "card_type": "narrative",
        "title": title,
        "slug": slug,
        "card_data": {"title": title, "chapter_label": label, "figure": {"kind": figure_kind, "title": figure_title}, "steps": steps},
    }


def check(slug, n, question, options, explanation):
    """options: [(id, text, is_correct)]"""
    return {
        "card_type": "quiz",
        "title": f"Quick check {n}",
        "slug": slug,
        "card_data": {
            "badge_label": f"Quick check {n} of 3",
            "title": f"Quick check {n}",
            "question": question,
            "options": [{"id": i, "text": t, "is_correct": bool(ok)} for i, t, ok in options],
            "explanation": explanation,
        },
    }


def completion(slug, day, title, card_label, learnings, poll_replay, teaser, action, arc_kind):
    return {
        "card_type": "completion",
        "title": f"Day {day} complete",
        "slug": slug,
        "card_data": {
            "card_label": card_label,
            "title": title,
            "subtitle": f"Day {day} complete",
            "learnings": learnings,
            "poll_replay_by_choice": poll_replay,
            "next_module_teaser": {"label": "Tomorrow", "title": teaser[0], "description": teaser[1]},
            "winterarc_action": action,
            "arc": {"kind": arc_kind, "label": card_label},
        },
    }


def day(cards):
    for k, c in enumerate(cards, start=1):
        c["order_index"] = k
    return {"cards": cards}
