import uuid
import logging
from typing import Optional, Dict, Any, List
from app.integrations.supabase_client import supabase

logger = logging.getLogger(__name__)


def is_valid_uuid(val: Any) -> bool:
    if not val:
        return False
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError, TypeError):
        return False


class PersonalLensRepository:

    def get_cached_lens(self, article_id: str, profile_key: str) -> Optional[Dict[str, Any]]:
        """Look up generated lens in personal_lens_cache by article_id and profile_key"""
        try:
            res = (
                supabase.from_("personal_lens_cache")
                .select("response, created_at")
                .eq("article_id", article_id)
                .eq("profile_key", profile_key)
                .limit(1)
                .execute()
            )
            if res and res.data and len(res.data) > 0:
                return res.data[0].get("response")
            return None
        except Exception as e:
            logger.warning(f"Failed to query personal_lens_cache: {e}")
            return None

    def save_cached_lens(self, article_id: str, profile_key: str, lens_data: Dict[str, Any]) -> bool:
        """Non-blocking upsert of generated lens to personal_lens_cache"""
        try:
            payload = {
                "article_id": article_id,
                "profile_key": profile_key,
                "response": lens_data
            }
            supabase.from_("personal_lens_cache").upsert(
                [payload],
                on_conflict="article_id,profile_key"
            ).execute()
            return True
        except Exception as e:
            logger.warning(f"Failed to save to personal_lens_cache (non-fatal): {e}")
            return False

    def get_article_metadata(self, article_id: str) -> Optional[Dict[str, Any]]:
        """Fetch article metadata, title, and editor summary without downloading full markdown"""
        try:
            query = supabase.from_("articles").select("id, title, slug, metadata, editor_summary")
            if is_valid_uuid(article_id):
                res = query.eq("id", article_id).limit(1).execute()
            else:
                res = query.eq("slug", article_id).limit(1).execute()

            if res and res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning(f"Failed to fetch article metadata: {e}")
            return None

    def get_article_questions(self, article_id: str) -> List[Dict[str, Any]]:
        """
        Fetch questionnaire definitions for an article from Supabase.
        Supports:
        1. Embedded questions inside `articles.metadata->'questions'` JSONB.
        2. Rows in `article_questions` table linked by article UUID.
        """
        try:
            # 1. Resolve article by UUID or slug
            article = self.get_article_metadata(article_id)
            uuid_id = str(article.get("id")) if article and article.get("id") else None

            # 2. Check if questions are stored directly in articles.metadata JSON
            if article and article.get("metadata") and isinstance(article["metadata"], dict):
                meta_questions = article["metadata"].get("questions")
                if meta_questions and isinstance(meta_questions, list) and len(meta_questions) > 0:
                    return meta_questions

            # 3. Query article_questions table using the resolved UUID
            target_id = uuid_id if is_valid_uuid(uuid_id) else (article_id if is_valid_uuid(article_id) else None)
            if not target_id:
                return []

            res = (
                supabase.from_("article_questions")
                .select("id, question, options, display_order")
                .eq("article_id", target_id)
                .order("display_order", desc=False)
                .execute()
            )
            return res.data or []
        except Exception as e:
            logger.warning(f"Failed to fetch article questions: {e}")
            return []

    def save_article_questions(self, article_id: str, questions: List[Dict[str, Any]]) -> bool:
        """
        Insert or replace questions for an article in `article_questions` table.
        """
        if not is_valid_uuid(article_id) or not questions:
            return False
        try:
            import json
            # Delete existing questions if replacing
            supabase.from_("article_questions").delete().eq("article_id", article_id).execute()
            
            rows = []
            for i, q in enumerate(questions):
                q_text = (q.get("question") or "").strip()
                if not q_text:
                    continue
                options_val = q.get("options")
                if isinstance(options_val, str):
                    try:
                        options_val = json.loads(options_val)
                    except Exception:
                        options_val = [opt.strip() for opt in options_val.split("\n") if opt.strip()]
                if not isinstance(options_val, list):
                    options_val = []
                    
                display_order = q.get("display_order", i + 1)
                try:
                    display_order = int(display_order)
                except (ValueError, TypeError):
                    display_order = i + 1

                rows.append({
                    "article_id": article_id,
                    "question": q_text,
                    "options": options_val,
                    "display_order": display_order
                })
            
            if rows:
                supabase.from_("article_questions").insert(rows).execute()
            return True
        except Exception as e:
            logger.warning(f"Failed to save article questions: {e}")
            return False


personal_lens_repo = PersonalLensRepository()

