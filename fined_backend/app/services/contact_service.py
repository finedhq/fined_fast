# Business logic for contact support messages
from app.repositories.contact_repo import contact_repo

class ContactService:
    def save_query(self, name: str, email: str, message: str):
        contact_repo.save_query(name=name, email=email, message=message)

contact_service = ContactService()
