# Database queries for scraped banking products
from app.integrations.supabase_client import supabase


class ProductRepository:

    def get_latest(self, product_name: str) -> dict | None:
        """
        Get most recent entry for a product.
        Products are stored with exact name strings e.g. 'SBI Fixed Deposit'
        """
        res = supabase.from_("allSchemesData").select("*")\
            .eq("product_name", product_name)\
            .order("created_at", desc=True)\
            .limit(1).execute()
        return res.data[0] if res.data else None

    def get_this_week(self, product_name: str) -> list:
        """Check if this product was already scraped this week — mirrors old controller logic"""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        week_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = week_start.replace(day=now.day - now.weekday())
        res = supabase.from_("allSchemesData").select("*")\
            .eq("product_name", product_name)\
            .gte("created_at", week_start.isoformat()).execute()
        return res.data or []

    def insert(self, product: dict) -> dict:
        res = supabase.from_("allSchemesData").insert([product]).select().execute()
        return res.data[0] if res.data else {}

    def get_all_latest(self) -> list:
        """Get one latest record per product — for listing all available products"""
        res = supabase.from_("allSchemesData").select("*")\
            .order("created_at", desc=True).execute()
        seen = set()
        unique = []
        for item in (res.data or []):
            if item["product_name"] not in seen:
                seen.add(item["product_name"])
                unique.append(item)
        return unique


product_repo = ProductRepository()
