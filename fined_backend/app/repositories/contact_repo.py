# Database queries for contact support queries
from app.integrations.supabase_client import supabase

class ContactRepository:
    def save_query(self, name: str, email: str, message: str):
        supabase.from_("contact_us").insert([{
            "name": name,
            "email": email,
            "message": message
        }]).execute()

contact_repo = ContactRepository()
