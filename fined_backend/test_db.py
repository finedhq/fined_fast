import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from app.repositories.user_repo import user_repo

def test_insert():
    print("Testing get_by_sub...")
    user = user_repo.get_by_sub("auth0|test1234")
    print("User:", user)

    if not user:
        print("Creating user...")
        try:
            new_user = user_repo.create("auth0|test1234", "test@example.com")
            print("Created:", new_user)
        except Exception as e:
            print("Error creating user:", e)

if __name__ == "__main__":
    test_insert()
