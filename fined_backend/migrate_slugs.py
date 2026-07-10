import os
import sys

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.integrations.supabase_client import supabase
from app.services.article_service import article_service

def migrate():
    print("Starting slug migration...")
    
    # Fetch all articles
    res = supabase.from_("articles").select("id, title").execute()
    articles = res.data or []
    print(f"Found {len(articles)} articles to migrate.")

    success_count = 0
    for article in articles:
        try:
            slug = article_service._generate_slug(article["title"])
            supabase.from_("articles").update({"slug": slug}).eq("id", article["id"]).execute()
            print(f"Updated '{article['title']}' -> '{slug}'")
            success_count += 1
        except Exception as e:
            print(f"Failed to update '{article['title']}': {e}")
            
    print(f"Migration complete. Successfully updated {success_count}/{len(articles)} articles.")

if __name__ == "__main__":
    migrate()
