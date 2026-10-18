# The course test (Module 12): a module whose completion card sets `pass_mark`.
# The course certificate needs at least that many of the module's quiz
# questions right. Below it the learner may retake the test: their answers are
# cleared and the rows marked "retake", so stars and bonuses never pay twice
# (see updateCard in routes/courses.py).
from typing import Optional

from app.models.card_data import quiz_is_right

RETAKE = "retake"


def pass_mark_of(cards: list[dict]) -> Optional[int]:
    """The pass mark of a module (its completion card's `pass_mark`), or None."""
    for c in cards:
        cd = c.get("card_data") or {}
        if (c.get("card_template") or cd.get("card_type")) == "completion" and cd.get("pass_mark"):
            return int(cd["pass_mark"])
    return None


def test_score(cards: list[dict], answers: dict) -> Optional[dict]:
    """{right, total, answered, pass_mark, passed} for a test module, or None if
    the module isn't a test. `answers` = card_id -> saved answer of COMPLETED rows."""
    mark = pass_mark_of(cards)
    if mark is None:
        return None
    quizzes = [c for c in cards if (c.get("card_template") or (c.get("card_data") or {}).get("card_type")) == "quiz"]
    right = sum(1 for c in quizzes if c["card_id"] in answers and quiz_is_right(c.get("card_data") or {}, answers[c["card_id"]]))
    answered = sum(1 for c in quizzes if c["card_id"] in answers)
    return {"right": right, "total": len(quizzes), "answered": answered, "pass_mark": mark, "passed": right >= mark}
