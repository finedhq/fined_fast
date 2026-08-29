import uuid
import re
from app.integrations.supabase_client import supabase
from app.config import settings

def _slugify_filename(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'^-+|-+$', '', s)
    return s[:60] if s else "image"

def upload_to_supabase(file_bytes: bytes, filename: str, mime_type: str, folder: str, title: str = "") -> str:
    """
    Uploads file bytes directly to the designated Supabase storage bucket and returns the public CDN URL.
    Generates SEO-descriptive filenames using the article title or base filename.
    """
    # Parse file extension
    ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
    
    # Generate descriptive base name
    base_name = _slugify_filename(title) if title else _slugify_filename(filename.rsplit(".", 1)[0])
    unique_suffix = uuid.uuid4().hex[:8]
    
    # Create unique SEO-friendly path (e.g. articles/visa-four-party-payment-model-a8f1b2c3.jpg)
    unique_path = f"{folder}/{base_name}-{unique_suffix}.{ext}"
    
    # Get bucket name from settings
    bucket_name = settings.SUPABASE_BUCKET or "fined-bucket"
    
    # Upload file
    supabase.storage.from_(bucket_name).upload(
        path=unique_path,
        file=file_bytes,
        file_options={"content-type": mime_type}
    )
    
    # Retrieve public CDN link
    public_url = supabase.storage.from_(bucket_name).get_public_url(unique_path)
    return public_url
