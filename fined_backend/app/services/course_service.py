# Business logic for course pathways and quizzes
from app.repositories.course_repo import course_repo
from app.repositories.progress_repo import progress_repo
from app.repositories.user_repo import user_repo
from app.services.score_service import score_service


class CourseService:


    def get_all(self) -> list:
        """All courses — equivalent to getCourses"""
        return course_repo.get_all()
    

    def get_with_progress(self, email: str) -> list:
        """
        Courses with user's progress attached.
        """
        courses  = course_repo.get_all()
        progress = progress_repo.get_all_progress(email)
        progress_map = {p["course_id"]: p for p in progress}
        for course in courses:
            cid = course["id"]
            p   = progress_map.get(cid, {})
            course["started"]         = cid in progress_map
            course["completed"]       = p.get("completed", False)
            course["completed_cards"] = p.get("completed_cards", [])
        return courses


    def get_single(self, email: str, course_id: str) -> dict | None:
        """
        Single course detail with modules, cards, and user progress.
        """
        course = course_repo.get_by_id(course_id)
        if not course:
            return None
        modules  = course_repo.get_modules(course_id)
        progress = progress_repo.get_course_progress(email, course_id)
        completed_cards = progress.get("completed_cards", []) if progress else []
        for module in modules:
            cards = course_repo.get_cards(module["id"])
            for card in cards:
                card["is_completed"] = card["card_id"] in completed_cards
            module["cards"] = cards
        course["modules"]         = modules
        course["completed_cards"] = completed_cards
        course["progress"]        = progress
        return course

    def update_card(
        self,
        email: str,
        course_id: str,
        card_id: str,
        module_id: str,
        status: str,
        user_answer: str | None,
        fin_stars: int,
        user_index: int | None
    ) -> dict:
        """
        Core progress update — called every time user taps Next/Submit on a card.
        Flow:
        1. Mark card completed in userCourses
        2. Check if full module is done → +20 course score
        3. Check if full course is done → quiz bonus/penalty
        4. Award fin_stars if applicable
        """
        progress = progress_repo.get_course_progress(email, course_id)
        completed_cards = list(progress.get("completed_cards", [])) if progress else []
        if card_id not in completed_cards and status == "completed":
            completed_cards.append(card_id)
        progress_repo.upsert_progress(email, course_id, {
            "completed_cards": completed_cards,
            "last_card_index": user_index,
            "completed": False,
        })
        user = user_repo.get_by_email(email)
        reasons = []
        score_updates = {}

        module_cards     = course_repo.get_cards(module_id)
        module_card_ids  = [c["card_id"] for c in module_cards]
        module_done      = all(cid in completed_cards for cid in module_card_ids)
        if module_done:
            module_result  = score_service.update_course_module(user)
            score_updates.update(module_result.get("updates", {}))
            if module_result.get("points"):
                reasons.append(f"+{module_result['points']} for completing a module")

        all_modules      = course_repo.get_modules(course_id)
        all_course_cards = []
        question_cards   = []

        for m in all_modules:
            cards = course_repo.get_cards(m["id"])
            for c in cards:
                all_course_cards.append(c["card_id"])
                if c.get("content_type") == "question" and c.get("correct_answer"):
                    question_cards.append(c)

        course_done = all(cid in completed_cards for cid in all_course_cards)
        if course_done:
            quiz_percent = 75.0
            quiz_result  = score_service.update_course_quiz(user, quiz_percent)
            score_updates.update(quiz_result.get("updates", {}))
            reasons.extend(quiz_result.get("reasons", []))
            progress_repo.upsert_progress(email, course_id, {"completed": True})
        if fin_stars and fin_stars > 0:
            current_stars = user.get("fin_stars") or 0
            score_updates["fin_stars"] = current_stars + fin_stars
        if score_updates:
            score_service.apply_and_log(user, score_updates, reasons)
        return {
            "completed_cards": completed_cards,
            "module_done":     module_done,
            "course_done":     course_done,
        }

    def _generate_slug(self, title: str) -> str:
        import re
        slug = title.lower().strip()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[\s_-]+', '-', slug)
        return slug

    def get_ongoing(self, email: str) -> dict | None:
        """Most recent in-progress course — equivalent to getOngoingCourse"""
        return progress_repo.get_ongoing(email)

    def create_course(self, title: str, description: str, thumbnail_url: str = "") -> dict:
        slug = self._generate_slug(title)
        return course_repo.insert(title, description, thumbnail_url, slug)

    def delete_course(self, course_id: str):
        course_repo.delete(course_id)

    def add_module(self, course_id: str, title: str, description: str, order_index: int) -> dict:
        slug = self._generate_slug(title)
        return course_repo.insert_module(course_id, title, description, order_index, slug)

    def delete_module(self, module_id: str):
        course_repo.delete_module(module_id)

    def get_cards(self, module_id: str) -> list:
        return course_repo.get_cards(module_id)

    def add_card(self, module_id: str, card_data: dict) -> dict:
        if "title" in card_data and card_data["title"]:
            card_data["slug"] = self._generate_slug(card_data["title"])
        return course_repo.insert_card(module_id, card_data)

    def delete_card(self, card_id: str):
        course_repo.delete_card(card_id)

course_service = CourseService()

