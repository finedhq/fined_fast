# Draft / published / archived rules for courses, and draft / published for
# modules (a live course is released module by module — plan §0.2).
#
# A course or module row with no "status" (e.g. before migration 003 / 005 has
# run) is treated as published, so existing content behaves exactly as before.
#
# Courses:
#   draft     -> not listed; opened only by admins (everyone else: "not found")
#   published -> listed; opened by everyone
#   archived  -> not listed; still opens by direct URL
# Modules (inside a course the viewer can open):
#   draft     -> not released yet: invisible to learners everywhere, admins see it
#   published -> released

COURSE_STATUSES = ("draft", "published", "archived")
MODULE_STATUSES = ("draft", "published")


def is_admin(user) -> bool:
    return user is not None and "Admin" in (getattr(user, "roles", None) or [])


def course_status(course: dict | None) -> str:
    return (course or {}).get("status") or "published"


def is_listed(course: dict | None) -> bool:
    return course_status(course) == "published"


def can_view_course(course: dict | None, user) -> bool:
    if course_status(course) != "draft":
        return True
    return is_admin(user)


def module_status(module: dict | None) -> str:
    return (module or {}).get("status") or "published"


def is_released(module: dict | None) -> bool:
    return module_status(module) == "published"


def can_view_module(module: dict | None, user) -> bool:
    """The module itself (its course is checked separately)."""
    return is_released(module) or is_admin(user)


def visible_modules(modules: list, user) -> list:
    """The modules this viewer may see, in the order given."""
    return [m for m in modules if can_view_module(m, user)]


def course_can_complete(course: dict | None, modules: list) -> bool:
    """
    A course counts as completed only when it is whole: no module is still
    waiting to be released, and — if the course says how many modules it will
    have (planned_modules) — at least that many exist. Stops the completion
    reward from paying out early (and again after each weekly release).
    """
    if any(not is_released(m) for m in modules):
        return False
    planned = (course or {}).get("planned_modules")
    return planned is None or len(modules) >= int(planned)
