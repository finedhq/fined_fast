import logging
from datetime import datetime, timezone
from app.integrations.supabase_client import supabase

logger = logging.getLogger(__name__)

def publish_scheduled_articles():
    try:
        logger.info("Scheduler started")
        now = datetime.now(timezone.utc)
        current_time_iso = now.isoformat()
        logger.info(f"Current UTC time: {current_time_iso}")
        
        res = supabase.from_("articles").select("id")\
            .eq("status", "scheduled")\
            .lte("scheduled_at", current_time_iso).execute()
        
        articles = res.data or []
        logger.info(f"Number of scheduled articles found: {len(articles)}")
        
        if not articles:
            logger.info("No scheduled articles ready.")
            logger.info("Scheduler finished")
            return
        
        published_ids = []
        for article in articles:
            article_id = article["id"]
            try:
                supabase.from_("articles").update({
                    "status": "published",
                    "published_at": current_time_iso
                }).eq("id", article_id).execute()
                published_ids.append(article_id)
            except Exception as e:
                logger.error(f"Failed to publish article {article_id}: {str(e)}")
                
        if published_ids:
            logger.info(f"Article IDs published: {published_ids}")
            
        logger.info("Scheduler finished")
    except Exception as e:
        logger.error(f"Scheduler failed: {str(e)}")
