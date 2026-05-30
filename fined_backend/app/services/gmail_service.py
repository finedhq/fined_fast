# Business logic for Google OAuth and Gmail integration
import re
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from app.config import settings
from app.repositories.transaction_repo import transaction_repo


SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def _build_flow() -> Flow:
    """Build the Google OAuth Flow from config"""
    return Flow.from_client_config(
        client_config={
            "web": {
                "client_id":     settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
                "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
                "token_uri":     "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )


class GmailService:
    #oauth
    def get_auth_url(self, state: str = None)->str:
        """
        Generate Google consent screen URL.
        Frontend redirects user to this URL.
        """
        flow = _build_flow()
        kwargs = {
            "access_type": "offline",
            "include_granted_scopes": "true",
            "prompt": "consent",
        }
        if state:
            kwargs["state"] = state
        auth_url, _ = flow.authorization_url(**kwargs)

        return auth_url
    
    def handle_callback(self,email:str,code:str)->dict:
        """
        Exchange auth code for tokens and save to DB.
        Called after Google redirects back with ?code...
        """
        flow = _build_flow()
        flow.fetch_token(code=code)
        creds      = flow.credentials
        bank_email = self._get_user_email(creds)
        transaction_repo.upsert_token(
            email      = email,
            bank_email = bank_email,
            tokens     = {
                "token":         creds.token,
                "refresh_token": creds.refresh_token,
                "token_uri":     creds.token_uri,
                "client_id":     creds.client_id,
                "client_secret": creds.client_secret,
                "scopes":        list(creds.scopes or SCOPES),
            },
            auto_fetch = False,
        )
        return {"connected": True, "bank_email": bank_email}
    

    def disconnect(self, email: str):
        """Remove stored Gmail tokens — equivalent to old disconnectGmail"""
        transaction_repo.delete_token(email)
    def get_status(self, email: str) -> dict:
        """Check if user has Gmail connected"""
        token_row = transaction_repo.get_user_token(email)
        if not token_row:
            return {"connected": False}
        return {
            "connected":   True,
            "bank_email":  token_row.get("bankEmail"),
            "auto_fetch":  token_row.get("autofetchStatus", False),
        }
    def toggle_autofetch(self, email: str, status: bool):
        """Enable/disable automatic Gmail fetch"""
        transaction_repo.update_autofetch(email, status)
    
    #gmail fetching
    def fetch_transactions(self, email: str) -> dict:
        """
        Fetch bank transaction emails from Gmail and return parsed transactions.
        Flow:
        1. Load + refresh tokens
        2. Build Gmail API client
        3. Search for bank transaction emails (last 90 days)
        4. Parse each email subject for amount/category
        5. Deduplicate against already-saved message IDs
        6. Return parsed list (caller saves them)
        """
        token_row = transaction_repo.get_user_token(email)
        if not token_row:
            return {"error": "Gmail not connected"}
        creds = self._load_credentials(email, token_row)
        if not creds:
            return {"error": "Invalid or expired credentials"}
        service = build("gmail", "v1", credentials=creds)

        query   = "from:(alerts@hdfcbank.net OR alerts@sbi.co.in OR alerts@icicibank.com OR noreply@kotak.com) newer_than:90d"
        results = service.users().messages().list(userId="me", q=query, maxResults=100).execute()
        messages = results.get("messages", [])
        if not messages:
            return {"parsed": [], "count": 0}

        saved_ids = transaction_repo.get_message_ids(email)
        parsed = []
        for msg in messages:
            msg_id = msg["id"]
            if msg_id in saved_ids:
                continue
            try:
                full_msg = service.users().messages().get(
                    userId="me", id=msg_id, format="metadata",
                    metadataHeaders=["Subject", "From", "Date"]
                ).execute()
                headers  = {h["name"]: h["value"] for h in full_msg.get("payload", {}).get("headers", [])}
                subject  = headers.get("Subject", "")
                date_str = headers.get("Date", "")
                txn = self._parse_subject(subject, msg_id, date_str)
                if txn:
                    parsed.append(txn)
            except Exception:
                continue
        return {"parsed": parsed, "count": len(parsed)}

    def _load_credentials(self, email: str, token_row: dict) -> Credentials | None:
        """Load credentials from DB, refresh if expired"""
        tokens = token_row.get("tokens") or {}
        creds = Credentials(
            token         = tokens.get("token"),
            refresh_token = tokens.get("refresh_token"),
            token_uri     = tokens.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id     = tokens.get("client_id", settings.GOOGLE_CLIENT_ID),
            client_secret = tokens.get("client_secret", settings.GOOGLE_CLIENT_SECRET),
            scopes        = tokens.get("scopes", SCOPES),
        )
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                tokens["token"] = creds.token
                transaction_repo.update_tokens(email, tokens)
            except Exception:
                return None
        return creds
    def _get_user_email(self, creds: Credentials) -> str:
        """Get the Gmail address from the OAuth token"""
        try:
            service = build("gmail", "v1", credentials=creds)
            profile = service.users().getProfile(userId="me").execute()
            return profile.get("emailAddress", "")
        except Exception:
            return ""

    def _parse_subject(self, subject: str, msg_id: str, date_str: str) -> dict | None:
        """
        Parse bank email subject to extract transaction data.
        Handles patterns like:
        - 'Rs.5000 debited from your HDFC account'
        - 'INR 2,500.00 credited to your account'
        - 'Alert: Transaction of Rs 1200 on your SBI Card'
        """
        subject_lower = subject.lower()
        if any(w in subject_lower for w in ["debited", "debit", "spent", "payment"]):
            txn_type = "expense"
        elif any(w in subject_lower for w in ["credited", "credit", "received"]):
            txn_type = "income"
        else:
            return None
        # Extract amount — handles Rs., INR, commas
        amount_match = re.search(
            r"(?:rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)", subject_lower
        )
        if not amount_match:
            return None
        amount_str = amount_match.group(1).replace(",", "")
        try:
            amount = float(amount_str)
        except ValueError:
            return None
        if amount <= 0:
            return None
        try:
            from email.utils import parsedate_to_datetime
            parsed_date = parsedate_to_datetime(date_str)
            date_iso    = parsed_date.strftime("%Y-%m-%d")
        except Exception:
            from datetime import date
            date_iso = date.today().isoformat()
        return {
            "amount":      amount,
            "type":        txn_type,
            "category":    "Auto-detected",
            "description": subject[:200],
            "date":        date_iso,
            "message_id":  msg_id,
        }
gmail_service = GmailService()
        



