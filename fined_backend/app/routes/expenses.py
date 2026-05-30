# HTTP endpoints for transactions, budgets, and Gmail sync
import json
from datetime import date, datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from app.services.expense_service import expense_service
from app.services.gmail_service import gmail_service, _build_flow, SCOPES
from app.integrations.supabase_client import supabase
from app.repositories.transaction_repo import transaction_repo
from app.repositories.user_repo import user_repo
from app.services.score_service import score_service
from app.config import settings
from googleapiclient.discovery import build

router = APIRouter(prefix="/expenses", tags=["Expenses"])

# --- Request Schemas ---

class FetchBankEmailRequest(BaseModel):
    email: str

class BudgetInfo(BaseModel):
    email: str
    category: str
    month: str
    year: int
    limit: float

class BudgetsRequest(BaseModel):
    budgets: List[BudgetInfo]

class FetchCategoryBudgetsRequest(BaseModel):
    email: str
    month: str
    excludeMonthly: Optional[bool] = Field(default=False, alias="excludeMonthly")

    class Config:
        populate_by_name = True

class TransactionInfo(BaseModel):
    id: Optional[str] = None
    email: str
    amount: float
    date: str
    type: str  # expense, income, saving, investment
    category: str
    description: Optional[str] = ""
    messageId: Optional[str] = Field(default=None, alias="messageId")

    class Config:
        populate_by_name = True

class TransactionRequest(BaseModel):
    transaction: TransactionInfo

class TransactionsBulkRequest(BaseModel):
    transactions: List[TransactionInfo]

class FetchExpensesRequest(BaseModel):
    email: str
    monthsRange: Optional[int] = Field(default=3, alias="monthsRange")

    class Config:
        populate_by_name = True

class FetchExpensesPieRequest(BaseModel):
    email: str
    month: str

class FetchExpensesNewRequest(BaseModel):
    email: str
    page: Optional[int] = 0
    limit: Optional[int] = 30

class DeleteTransactionRequest(BaseModel):
    email: str
    transactionId: str = Field(alias="transactionId")

    class Config:
        populate_by_name = True

class StatusChangeRequest(BaseModel):
    email: str
    isAutoFetch: bool = Field(alias="isAutoFetch")

    class Config:
        populate_by_name = True


# --- Route Endpoints ---

@router.get("/bank-auth")
async def bank_auth(state: str):
    """Start Google OAuth process by generating consent URL with user state"""
    try:
        decoded_state = state
        auth_url = gmail_service.get_auth_url(state=decoded_state)
        return RedirectResponse(auth_url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate auth URL: {str(e)}"
        )

@router.get("/bank-callback")
@router.get("/gmail-callback")
async def bank_callback(code: str, state: str):
    """Handle callback from Google, save OAuth tokens and redirect to frontend"""
    try:
        parsed_state = json.loads(state)
        user_email = parsed_state.get("email")
        status_val = parsed_state.get("status")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid state format")

    try:
        flow = _build_flow()
        flow.fetch_token(code=code)
        creds = flow.credentials
        
        # Build Gmail API client to retrieve user email
        service = build("gmail", "v1", credentials=creds)
        profile = service.users().getProfile(userId="me").execute()
        bank_email = profile.get("emailAddress", "")
        
        transaction_repo.upsert_token(
            email=user_email,
            bank_email=bank_email,
            tokens={
                "token": creds.token,
                "refresh_token": creds.refresh_token,
                "token_uri": creds.token_uri,
                "client_id": creds.client_id,
                "client_secret": creds.client_secret,
                "scopes": list(creds.scopes or SCOPES),
            },
            auto_fetch=bool(status_val)
        )
        
        frontend_url = settings.FRONTEND_URL or "https://fined-web.vercel.app"
        return RedirectResponse(f"{frontend_url}/fin-tools/expensetracker?email={user_email}")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Auth callback failed: {str(e)}"
        )

@router.post("/fetchBankEmail")
async def fetch_bank_email(body: FetchBankEmailRequest):
    """Fetch user's Gmail connection status and bank email"""
    try:
        res = supabase.from_("userToken").select("bankEmail, autofetchStatus").eq("email", body.email).execute()
        return {"message": "Bank email fetched successfully", "data": res.data or []}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bank email: {str(e)}"
        )

@router.post("/checkandfetch")
async def check_and_fetch(body: FetchBankEmailRequest):
    """Fetch parsed but uncommitted transaction records from Gmail"""
    res_data = gmail_service.fetch_transactions(body.email)
    if "error" in res_data:
        raise HTTPException(status_code=401, detail=res_data["error"])
    return res_data.get("parsed", [])

@router.post("/budgets")
async def budgets(body: BudgetsRequest):
    """Set budgets, recalculate spent values, and apply gamified scores"""
    try:
        cleaned_budgets = []
        today = date.today()
        curr_month = today.strftime("%B")
        curr_year = today.year
        score = 0
        user_email = body.budgets[0].email if body.budgets else None

        if not user_email:
            raise HTTPException(status_code=400, detail="No budgets provided")

        # 1. Fetch transactions in bulk for unique categories
        unique_categories = list({b.category for b in body.budgets})
        tx_res = supabase.from_("transactions").select("amount, type, date, category, email").in_("category", unique_categories).eq("email", user_email).execute()
        all_tx = tx_res.data or []

        # 2. Fetch existing Monthly budget
        needs_monthly_check = any(b.category == "Monthly" and b.month == curr_month and b.year == curr_year for b in body.budgets)
        existing_monthly_budget = None
        if needs_monthly_check:
            m_res = supabase.from_("budgets").select("limit").match({
                "email": user_email, "category": "Monthly", "month": curr_month, "year": curr_year
            }).maybe_single().execute()
            existing_monthly_budget = m_res.data

        # 3. Prepare cleaned budgets
        for budget in body.budgets:
            spent = 0.0
            for tx in all_tx:
                try:
                    tx_date = date.fromisoformat(tx["date"])
                    tx_month = tx_date.strftime("%B")
                    tx_year = tx_date.year
                    if (tx["email"] == budget.email and
                        tx["category"] == budget.category and
                        tx["type"] == "expense" and
                        tx_year == budget.year and
                        tx_month == budget.month):
                        spent += float(tx["amount"] or 0)
                except Exception:
                    continue

            cleaned_budgets.append({
                "email": budget.email,
                "category": budget.category,
                "month": budget.month,
                "year": budget.year,
                "limit": budget.limit,
                "spent": spent
            })

            # Score logic for Monthly budget
            if budget.category == "Monthly" and budget.month == curr_month and budget.year == curr_year:
                if today.day <= 5:
                    score += 10
                elif not existing_monthly_budget:
                    score -= 10

        # 4. Fetch user score before update
        user = user_repo.get_by_email(user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        old_total = score_service.compute_total(user)
        updated_expense_score = max(0, min(150, (user.get("expense_score") or 0) + score))

        # 5. Upsert budgets & custom categories in parallel
        common_categories = [
            "Food", "Travel", "Rent", "Apparel", "Health", "Education", "Transportation",
            "Bills & Utilities", "Shopping", "Entertainment", "Investments", "Savings", "Salary", "Monthly"
        ]
        
        category_pairs = []
        seen_pairs = set()
        for b in cleaned_budgets:
            if b["category"] not in common_categories:
                pair = (b["email"], b["category"])
                if pair not in seen_pairs:
                    seen_pairs.add(pair)
                    category_pairs.append({"email": b["email"], "category": b["category"]})

        # Upsert budgets
        supabase.from_("budgets").upsert(cleaned_budgets, on_conflict="email,month,year,category").execute()
        
        # Update user expense score
        supabase.from_("users").update({"expense_score": updated_expense_score}).eq("email", user_email).execute()

        # Upsert custom categories
        if category_pairs:
            supabase.from_("userCategories").upsert(category_pairs, on_conflict="email,category").execute()

        # 6. Fetch new score and log if changed
        user_new = user_repo.get_by_email(user_email)
        new_total = score_service.compute_total(user_new)
        delta = new_total - old_total

        if delta != 0:
            description = f"🎯 Monthly budget set on time (+{score})" if score > 0 else f"⚠️ Monthly budget not set in time ({score})"
            user_repo.log_score_change(
                email=user_email,
                old=old_total,
                new=new_total,
                change=delta,
                desc=description
            )

        return {"message": "Budgets, categories, and scores saved successfully", "data": cleaned_budgets}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save budgets: {str(e)}"
        )

@router.post("/fetchcategories")
async def fetch_categories(body: FetchBankEmailRequest):
    """Fetch all user categories"""
    try:
        res = supabase.from_("userCategories").select("category").eq("email", body.email).execute()
        categories = [item["category"] for item in (res.data or [])]
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user categories: {str(e)}"
        )

@router.post("/fetchcategorybudgets")
async def fetch_category_budgets(body: FetchCategoryBudgetsRequest):
    """Fetch budgets for a specific month and alert user if threshold exceeded"""
    try:
        today = date.today()
        year = today.year
        
        query = supabase.from_("budgets").select("*").match({
            "email": body.email,
            "month": body.month,
            "year": year
        })
        if body.excludeMonthly:
            query = query.not_("category", "eq", "Monthly")
            
        res = query.execute()
        data = res.data or []

        monthly_idx = next((i for i, b in enumerate(data) if b["category"] == "Monthly"), -1)
        if monthly_idx != -1:
            sum_res = supabase.from_("transaction_summary").select("expense").match({
                "email": body.email,
                "month": body.month,
                "year": year
            }).maybe_single().execute()
            summary = sum_res.data
            data[monthly_idx]["spent"] = summary.get("expense", 0) if summary else 0

        # Exceeded alert trigger
        from app.services.notification_service import notification_service
        for budget in data:
            limit = float(budget.get("limit") or 0)
            spent = float(budget.get("spent") or 0)
            if limit > 0 and spent > limit:
                content = f"⚠️ You exceeded your {budget['category']} budget for {body.month}!"
                
                # Check duplicate warnings in past week
                seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
                notif_res = supabase.from_("notifications").select("id").match({
                    "email": body.email,
                    "content": content
                }).gte("created_at", seven_days_ago).maybe_single().execute()
                
                if not notif_res.data:
                    notification_service.send(body.email, content)

        return {"message": "Budgets fetched successfully", "data": data}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch budgets: {str(e)}"
        )

@router.post("/fetchmonthlybudget")
async def fetch_monthly_budget(body: FetchBankEmailRequest):
    """Fetch overall Monthly budget limit for current month"""
    try:
        today = date.today()
        month = today.strftime("%B")
        year = today.year
        res = supabase.from_("budgets").select("*").match({
            "email": body.email,
            "month": month,
            "year": year,
            "category": "Monthly"
        }).execute()
        return {"message": "Budgets fetched successfully", "data": res.data or []}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch budget: {str(e)}"
        )

@router.post("/transaction")
async def save_transaction(body: TransactionRequest):
    """Add a transaction manually, apply daily logging scores, and update totals"""
    try:
        txn = body.transaction
        email = txn.email
        txn_date = date.fromisoformat(txn.date)
        today_str = date.today().isoformat()
        month = txn_date.strftime("%B")
        year = txn_date.year
        amount = float(txn.amount)
        category = txn.category

        txn_dict = txn.model_dump(by_alias=True, exclude_none=True)
        
        # 1. Save transaction
        supabase.from_("transactions").upsert([txn_dict]).execute()

        # 2. Score calculations
        user = user_repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        score_delta = 0
        streak = user.get("transaction_streak_count") or 0
        last_date_str = user.get("last_transaction_date")
        last_score_date = user.get("last_transaction_score_date")
        should_score_today = (last_score_date != today_str)
        old_total = score_service.compute_total(user)

        if should_score_today:
            streak = 1
            score_delta = 3
            if last_date_str:
                last_date = date.fromisoformat(last_date_str[:10])
                gap = (date.today() - last_date).days
                if gap == 1:
                    streak = (user.get("transaction_streak_count") or 0) + 1
                    if streak == 7:
                        score_delta += 10
                elif gap > 1:
                    missed = min(gap - 1, 7)
                    score_delta -= missed
                    if gap >= 7:
                        score_delta -= 10
            
            new_expense_score = max(0, min(150, (user.get("expense_score") or 0) + score_delta))
            
            supabase.from_("users").update({
                "transaction_streak_count": streak,
                "last_transaction_date": today_str,
                "last_transaction_score_date": today_str,
                "expense_score": new_expense_score
            }).eq("email", email).execute()

            updated_user = {**user, "expense_score": new_expense_score}
            new_total = score_service.compute_total(updated_user)
            delta = new_total - old_total

            if delta != 0:
                desc_parts = []
                if score_delta > 0 and streak != 7:
                    desc_parts.append(f"+{score_delta} for logging a transaction")
                if score_delta < 0:
                    desc_parts.append(f"{score_delta} penalty for missed days")
                if streak == 7:
                    desc_parts.append("+10 bonus for 7-day streak")
                
                user_repo.log_score_change(
                    email=email,
                    old=old_total,
                    new=new_total,
                    change=delta,
                    desc="; ".join(desc_parts)
                )

        # 3. Budget update
        if txn.type == "expense":
            start_of_month = f"{year}-{txn_date.month:02d}-01"
            next_month = txn_date.month + 1
            next_year = year
            if next_month > 12:
                next_month = 1
                next_year += 1
            start_of_next = f"{next_year}-{next_month:02d}-01"

            spent_res = supabase.from_("transactions").select("amount")\
                .eq("email", email).eq("category", category).eq("type", "expense")\
                .gte("date", start_of_month).lt("date", start_of_next).execute()
            
            total_spent = sum(float(t["amount"] or 0) for t in (spent_res.data or []))
            supabase.from_("budgets").update({"spent": total_spent}).match({
                "email": email, "category": category, "month": month, "year": year
            }).execute()

        # 4. Summary totals update
        sum_res = supabase.from_("transaction_summary").select("*").match({
            "email": email, "month": month, "year": year
        }).maybe_single().execute()
        summary = sum_res.data
        
        updated_summary = {
            "email": email, "month": month, "year": year,
            "expense": summary.get("expense", 0) if summary else 0,
            "income": summary.get("income", 0) if summary else 0,
            "saving": summary.get("saving", 0) if summary else 0,
            "investment": summary.get("investment", 0) if summary else 0
        }
        
        if txn.type in updated_summary:
            updated_summary[txn.type] += amount

        supabase.from_("transaction_summary").upsert([updated_summary], on_conflict="email,month,year").execute()

        # 5. Non-default Category save
        common_categories = [
            "Food", "Travel", "Rent", "Apparel", "Health", "Education", "Transportation",
            "Bills & Utilities", "Shopping", "Entertainment", "Investments", "Savings", "Salary"
        ]
        if category not in common_categories:
            supabase.from_("userCategories").upsert([{"email": email, "category": category}], on_conflict="email,category").execute()

        return {"message": "Transaction saved successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save transaction: {str(e)}"
        )

@router.post("/transactions-bulk")
async def save_transactions_bulk(body: TransactionsBulkRequest):
    """Import multiple transaction records concurrently, re-aggregating month totals"""
    try:
        txns_dict = [t.model_dump(by_alias=True, exclude_none=True) for t in body.transactions]
        
        # 1. Bulk insert
        supabase.from_("transactions").insert(txns_dict).execute()

        unique_user_dates = set()
        today_str = date.today().isoformat()
        yesterday = date.today() - timedelta(days=1)

        for txn in body.transactions:
            try:
                dt = date.fromisoformat(txn.date)
                unique_user_dates.add((txn.email, dt.isoformat()))
            except Exception:
                continue

        for email, date_str in unique_user_dates:
            user = user_repo.get_by_email(email)
            if not user:
                continue
            
            last_score_date = user.get("last_transaction_score_date")
            should_score_today = (last_score_date != today_str)

            if should_score_today:
                streak = 1
                score_delta = 3
                last_date_str = user.get("last_transaction_date")
                last_date = date.fromisoformat(last_date_str[:10]) if last_date_str else None
                
                is_yesterday_tracked = (last_date == yesterday) if last_date else False
                gap = (date.today() - last_date).days if last_date else None

                if gap and gap > 1:
                    missed = min(gap - 1, 7)
                    score_delta -= missed
                    if gap >= 7:
                        score_delta -= 10
                
                if is_yesterday_tracked:
                    streak = (user.get("transaction_streak_count") or 1) + 1
                    if streak == 7:
                        score_delta += 10
                elif last_date and gap > 1:
                    streak = 1

                old_total = score_service.compute_total(user)
                updated_expense = max(0, min(150, (user.get("expense_score") or 0) + score_delta))

                supabase.from_("users").update({
                    "transaction_streak_count": streak,
                    "last_transaction_date": today_str,
                    "last_transaction_score_date": today_str,
                    "transaction_scored": True,
                    "expense_score": updated_expense
                }).eq("email", email).execute()

                updated_user = {**user, "expense_score": updated_expense}
                new_total = score_service.compute_total(updated_user)
                delta = new_total - old_total

                if delta != 0:
                    desc_parts = []
                    if score_delta > 0 and streak != 7:
                        desc_parts.append(f"+{score_delta} points for logging a transaction on {today_str}")
                    if score_delta < 0:
                        desc_parts.append(f"{score_delta} points penalty due to missed days in streak")
                    if streak == 7:
                        desc_parts.append("+10 bonus points for completing a 7-day transaction streak")
                    
                    user_repo.log_score_change(
                        email=email,
                        old=old_total,
                        new=new_total,
                        change=delta,
                        desc="; ".join(desc_parts)
                    )

        # 2. Recalculate Budgets
        expense_txns = [t for t in body.transactions if t.type == "expense"]
        groups = {}
        for txn in expense_txns:
            try:
                txn_date = date.fromisoformat(txn.date)
                month = txn_date.strftime("%B")
                year = txn_date.year
                key = (txn.email, txn.category, month, year)
                if key not in groups:
                    groups[key] = {
                        "email": txn.email,
                        "category": txn.category,
                        "month": month,
                        "year": year,
                        "start": f"{year}-{txn_date.month:02d}-01",
                        "end": f"{year if txn_date.month < 12 else year + 1}-{(txn_date.month % 12) + 1:02d}-01"
                    }
            except Exception:
                continue

        for key, g in groups.items():
            spent_res = supabase.from_("transactions").select("amount")\
                .eq("email", g["email"]).eq("category", g["category"]).eq("type", "expense")\
                .gte("date", g["start"]).lt("date", g["end"]).execute()
            
            total_spent = sum(float(t["amount"] or 0) for t in (spent_res.data or []))
            supabase.from_("budgets").update({"spent": total_spent}).match({
                "email": g["email"], "category": g["category"], "month": g["month"], "year": g["year"]
            }).execute()

        # 3. Recalculate Summaries
        summary_groups = {}
        for txn in body.transactions:
            try:
                txn_date = date.fromisoformat(txn.date)
                month = txn_date.strftime("%B")
                year = txn_date.year
                key = (txn.email, month, year)
                if key not in summary_groups:
                    summary_groups[key] = {"expense": 0.0, "income": 0.0, "saving": 0.0, "investment": 0.0}
                
                if txn.type in summary_groups[key]:
                    summary_groups[key][txn.type] += float(txn.amount)
            except Exception:
                continue

        for (email, month, year), g in summary_groups.items():
            exist_res = supabase.from_("transaction_summary").select("*").match({
                "email": email, "month": month, "year": year
            }).maybe_single().execute()
            existing = exist_res.data
            
            updated = {
                "email": email, "month": month, "year": year,
                "expense": (existing.get("expense", 0) if existing else 0) + g["expense"],
                "income": (existing.get("income", 0) if existing else 0) + g["income"],
                "saving": (existing.get("saving", 0) if existing else 0) + g["saving"],
                "investment": (existing.get("investment", 0) if existing else 0) + g["investment"]
            }
            supabase.from_("transaction_summary").upsert([updated], on_conflict="email,month,year").execute()

        # 4. Custom Categories Save
        common_categories = [
            "Food", "Travel", "Rent", "Apparel", "Health", "Education", "Transportation",
            "Bills & Utilities", "Shopping", "Entertainment", "Investments", "Savings", "Salary"
        ]
        category_pairs = []
        seen = set()
        for txn in body.transactions:
            if txn.category not in common_categories:
                pair = (txn.email, txn.category)
                if pair not in seen:
                    seen.add(pair)
                    category_pairs.append({"email": txn.email, "category": txn.category})
        
        if category_pairs:
            supabase.from_("userCategories").upsert(category_pairs, on_conflict="email,category").execute()

        return {"message": "Transactions inserted, budgets and summaries updated, categories saved, scores applied."}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed bulk transactions import: {str(e)}"
        )

@router.post("/fetchexpenses")
async def fetch_expenses(body: FetchExpensesRequest):
    """Retrieve monthly totals for a given month range back"""
    try:
        now = date.today()
        months_range = body.monthsRange or 3
        summaries = []
        for i in range(months_range):
            m = now.month - i
            y = now.year
            while m <= 0:
                m += 12
                y -= 1
            dt = date(y, m, 1)
            summaries.append({"month": dt.strftime("%B"), "year": dt.year})

        res = supabase.from_("transaction_summary").select("*").eq("email", body.email)\
            .in_("month", [s["month"] for s in summaries])\
            .in_("year", [s["year"] for s in summaries])\
            .order("year", desc=True).execute()

        return {"message": "Summary data fetched successfully", "data": res.data or []}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch summaries: {str(e)}"
        )

@router.post("/fetchexpensesPie")
async def fetch_expenses_pie(body: FetchExpensesPieRequest):
    """Retrieve all transaction details in a month for category distributions"""
    try:
        now = date.today()
        year = now.year
        try:
            target_dt = datetime.strptime(f"1 {body.month} {year}", "%d %B %Y")
            month_idx = target_dt.month
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid month format")

        from_date = date(year, month_idx, 1)
        next_month = month_idx + 1
        next_year = year
        if next_month > 12:
            next_month = 1
            next_year += 1
        to_date = date(next_year, next_month, 1)

        res = supabase.from_("transactions").select("*").eq("email", body.email)\
            .gte("date", from_date.isoformat()).lt("date", to_date.isoformat())\
            .order("date", desc=True).execute()

        return {"message": "Transactions fetched successfully", "data": res.data or []}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transactions: {str(e)}"
        )

@router.post("/fetchexpensesnew")
async def fetch_expenses_new(body: FetchExpensesNewRequest):
    """Paginated transaction lookup reverse-chronologically"""
    try:
        page = body.page or 0
        limit = body.limit or 30
        start = page * limit
        end = start + limit - 1

        res = supabase.from_("transactions").select("*").eq("email", body.email)\
            .order("date", desc=True).range(start, end).execute()

        return {"message": "Transactions fetched successfully", "data": res.data or []}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transactions: {str(e)}"
        )

@router.post("/deletetransaction")
async def delete_transaction(body: DeleteTransactionRequest):
    """Delete a transaction, adjust category spent levels, and recalculate month aggregates"""
    try:
        email = body.email
        txn_id = body.transactionId

        # 1. Fetch details
        res = supabase.from_("transactions").select("*")\
            .eq("id", txn_id).eq("email", email).single().execute()
        txn = res.data
        if not txn:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # 2. Delete transaction
        supabase.from_("transactions").delete().match({"id": txn_id, "email": email}).execute()

        txn_date = date.fromisoformat(txn["date"])
        month = txn_date.strftime("%B")
        year = txn_date.year

        # 3. Update budget
        if txn.get("type") == "expense":
            start_of_month = f"{year}-{txn_date.month:02d}-01"
            next_month = txn_date.month + 1
            next_year = year
            if next_month > 12:
                next_month = 1
                next_year += 1
            start_of_next = f"{next_year}-{next_month:02d}-01"

            spent_res = supabase.from_("transactions").select("amount")\
                .eq("email", email).eq("category", txn["category"]).eq("type", "expense")\
                .gte("date", start_of_month).lt("date", start_of_next).execute()
            
            new_spent = sum(float(t["amount"] or 0) for t in (spent_res.data or []))
            supabase.from_("budgets").update({"spent": new_spent}).match({
                "email": email, "category": txn["category"], "month": month, "year": year
            }).execute()

        # 4. Update transaction summary
        sum_res = supabase.from_("transaction_summary").select("*").match({
            "email": email, "month": month, "year": year
        }).maybe_single().execute()
        summary = sum_res.data

        if summary:
            updated_summary = {**summary}
            amount = float(txn.get("amount") or 0)
            txn_type = txn.get("type")
            if txn_type in updated_summary:
                updated_summary[txn_type] = max(0, updated_summary[txn_type] - amount)

            supabase.from_("transaction_summary").upsert([updated_summary], on_conflict="email,month,year").execute()

        return {"message": "Transaction deleted, summary and budget updated successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete transaction: {str(e)}"
        )

@router.post("/disconnect")
async def disconnect(body: FetchBankEmailRequest):
    """Disconnect user's Gmail integrations and delete saved credentials"""
    try:
        supabase.from_("userToken").delete().match({"email": body.email}).execute()
        return {"message": "Disconnected and deleted token successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disconnect: {str(e)}"
        )

@router.post("/statuschange")
async def status_change(body: StatusChangeRequest):
    """Toggle the autofetch background sync status for Gmail connections"""
    try:
        supabase.from_("userToken").update({"autofetchStatus": body.isAutoFetch}).match({"email": body.email}).execute()
        return {"message": "Auto-fetch status updated successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update status: {str(e)}"
        )
