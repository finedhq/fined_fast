# Supabase client singleton manager

import threading
from supabase import create_client, Client
from app.config import settings

_thread_local = threading.local()

class SupabaseProxy:
    def __getattr__(self, name):
        if not hasattr(_thread_local, "client"):
            _thread_local.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return getattr(_thread_local.client, name)

supabase = SupabaseProxy()

