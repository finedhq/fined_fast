"""WinterArc metrics: counting and grouping (definitions live in migration 010)."""
from app.routes.winterarc_metrics import summarize


def person(**kw):
    base = {"name": "P", "activated": False, "returned_7d": False, "has_account": False, "signed_up_ist_day": "2026-11-10"}
    base.update(kw)
    return base


PEOPLE = [
    person(name="Asha", referral_code="AAA111", utm_source="instagram", college="xavier's", activated=True, returned_7d=True, has_account=True),
    person(referral_code="BBB222", utm_source="instagram", referred_by_code="AAA111", activated=True, has_account=True),
    person(referral_code="CCC333", referred_by_code="AAA111", heard_from="friend", signed_up_ist_day="2026-11-11"),
    person(referral_code="DDD444", utm_source="campus", college="xavier's", referred_by_code="ZZZ999"),
]


def test_totals_and_rates():
    t = summarize(PEOPLE, [])["totals"]
    assert t == {"signed_up": 4, "has_account": 2, "activated": 2, "activation_rate": 50.0, "returned_7d": 1, "return_rate": 50.0}


def test_breakdowns_name_empty_groups():
    b = summarize(PEOPLE, [])["breakdowns"]
    src = {r["group"]: r for r in b["utm_source"]["rows"]}
    assert src["instagram"]["signed_up"] == 2 and src["instagram"]["activated"] == 2
    assert src["(no tag)"]["signed_up"] == 1
    assert {r["group"] for r in b["heard_from"]["rows"]} == {"friend", "(not answered)"}
    assert {r["group"]: r["signed_up"] for r in b["referred"]["rows"]} == {"yes": 3, "no": 1}
    assert [r["group"] for r in b["signup_day"]["rows"]] == ["2026-11-10", "2026-11-11"]


def test_referrers_named_without_emails():
    r = summarize(PEOPLE, [])["referrers"]
    assert r[0]["code"] == "AAA111" and r[0]["name"] == "Asha" and r[0]["signed_up"] == 2
    assert next(x for x in r if x["code"] == "ZZZ999")["name"] == "(unknown)"
    assert "email" not in str(summarize(PEOPLE, []))


def test_no_people_no_division_by_zero():
    assert summarize([], [])["totals"]["activation_rate"] == 0.0
