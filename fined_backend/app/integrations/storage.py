# Storage client integration for Supabase Buckets
import uuid
from app.integrations.supabase_client import supabase
from app.config import settings

def upload_to_supabase(file_bytes: bytes, filename: str, mime_type: str, folder: str, title: str = "") -> str:
    """
    Uploads file bytes directly to the designated Supabase storage bucket and returns the public CDN URL.
    """
    # Parse file extension
    ext = filename.split(".")[-1] if "." in filename else "bin"
    
    # Create unique safe path
    unique_path = f"{folder}/{uuid.uuid4()}.{ext}"
    
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
