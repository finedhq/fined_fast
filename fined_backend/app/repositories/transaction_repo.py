# Database queries for transactions and budgets
from app.integrations.supabase_client import supabase


class TransactionRepository:


    def insert(self, email: str, txn: dict) -> dict:
        txn["email"] = email
        res = supabase.from_("transactions").insert([txn]).select().single().execute()
        return res.data

    def insert_bulk(self, email: str, txns: list) -> list:
        for t in txns:
            t["email"] = email
        res = supabase.from_("transactions").insert(txns).select().execute()
        return res.data or []

    def get_by_month(self, email: str, month: str, year: int) -> list:
        res = supabase.from_("transactions").select("*")\
            .eq("email", email).eq("month", month).eq("year", year)\
            .order("date", desc=True).execute()
        return res.data or []

    def get_recent(self, email: str, months_back: int = 3) -> list:
        res = supabase.from_("transactions").select("*")\
            .eq("email", email).order("date", desc=True).execute()
        return res.data or []

    def delete(self, email: str, txn_id: str):
        supabase.from_("transactions").delete()\
            .eq("id", txn_id).eq("email", email).execute()

    def get_message_ids(self, email: str) -> set:
        """Used for Gmail dedup — don't insert already-saved transactions"""
        res = supabase.from_("transactions").select("message_id")\
            .eq("email", email).not_.is_("message_id", "null").execute()
        return {r["message_id"] for r in (res.data or [])}


    def get_summary(self, email: str, month: str, year: int) -> dict | None:
        res = supabase.from_("transaction_summary").select("*")\
            .eq("email", email).eq("month", month).eq("year", year).maybe_single().execute()
        return res.data

    def upsert_summary(self, email: str, month: str, year: int, fields: dict):
        fields.update({"email": email, "month": month, "year": year})
        supabase.from_("transaction_summary").upsert(
            [fields], on_conflict="email,month,year"
        ).execute()


    def get_budgets(self, email: str, month: str, year: int) -> list:
        res = supabase.from_("budgets").select("*")\
            .eq("email", email).eq("month", month).eq("year", year).execute()
        return res.data or []

    def upsert_budget(self, email: str, category: str, month: str, year: int, limit: float):
        supabase.from_("budgets").upsert([{
            "email": email, "category": category,
            "month": month, "year": year, "limit": limit
        }], on_conflict="email,category,month,year").execute()


    def get_user_token(self, email: str) -> dict | None:
        res = supabase.from_("userToken").select("*")\
            .eq("email", email).maybe_single().execute()
        return res.data

    def upsert_token(self, email: str, bank_email: str, tokens: dict, auto_fetch: bool):
        supabase.from_("userToken").upsert([{
            "email": email,
            "bankEmail": bank_email,
            "tokens": tokens,
            "autofetchStatus": auto_fetch
        }], on_conflict="email").execute()

    def update_tokens(self, email: str, tokens: dict):
        supabase.from_("userToken").update({"tokens": tokens}).eq("email", email).execute()

    def delete_token(self, email: str):
        supabase.from_("userToken").delete().eq("email", email).execute()

    def update_autofetch(self, email: str, status: bool):
        supabase.from_("userToken").update({"autofetchStatus": status}).eq("email", email).execute()


    def get_categories(self, email: str) -> list:
        res = supabase.from_("userCategories").select("categories")\
            .eq("email", email).maybe_single().execute()
        return res.data.get("categories", []) if res.data else []

    def upsert_categories(self, email: str, categories: list):
        supabase.from_("userCategories").upsert(
            [{"email": email, "categories": categories}], on_conflict="email"
        ).execute()


transaction_repo = TransactionRepository()
