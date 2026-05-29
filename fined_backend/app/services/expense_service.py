# Business logic for expense tracking, budgets, and Gmail transaction sync
from datetime import date

from app.repositories.transaction_repo import transaction_repo
from app.repositories.user_repo import user_repo
from app.services.score_service import score_service
from app.services.gmail_service import gmail_service


class ExpenseService:

    # ── Transactions ──────────────────────────────────────────

    def add_transaction(self, email: str, txn_data: dict) -> dict:
        """
        Save a transaction and update the monthly summary.
        Also triggers daily expense score (+3 base, streak bonuses).
        Equivalent to transaction() in expenseTrackerController.js
        """
        today = date.today()

        # Parse month/year from transaction date for summary
        try:
            txn_date  = date.fromisoformat(txn_data["date"])
            month_str = txn_date.strftime("%B")   # e.g. "May"
            year      = txn_date.year
        except Exception:
            month_str = today.strftime("%B")
            year      = today.year

        # Save transaction
        saved = transaction_repo.insert(email, txn_data)

        # Update monthly summary
        self._update_summary(email, month_str, year, txn_data["type"], txn_data["amount"], delta=1)

        # Update expense score (once per day only — score_service handles dedup)
        user = user_repo.get_by_email(email)
        result = score_service.update_expense_transaction(user, today)
        if result.get("updated"):
            score_service.apply_and_log(
                user    = user,
                updates = result["updates"],
                reasons = ["+3 for logging a transaction today"]
            )

        return saved

    def delete_transaction(self, email: str, txn_id: str, txn_data: dict):
        """
        Delete a transaction and reverse its impact on the monthly summary.
        Equivalent to deleteTransaction in expenseTrackerController.js
        """
        txn_date  = date.fromisoformat(txn_data.get("date", date.today().isoformat()))
        month_str = txn_date.strftime("%B")
        year      = txn_date.year

        transaction_repo.delete(email, txn_id)
        self._update_summary(email, month_str, year, txn_data["type"], txn_data["amount"], delta=-1)

    def get_transactions(self, email: str, month: str, year: int) -> list:
        """Transactions for a specific month — equivalent to getTransactions"""
        return transaction_repo.get_by_month(email, month, year)

    def get_recent(self, email: str) -> list:
        """Recent transactions across all months — equivalent to getRecentTransactions"""
        return transaction_repo.get_recent(email)

    # ── Gmail Sync ────────────────────────────────────────────

    def sync_gmail(self, email: str) -> dict:
        """
        Fetch bank emails from Gmail and save new transactions.
        Equivalent to fetchGmailTransactions + saveGmailTransactions combined.

        Flow:
        1. Fetch parsed transactions from Gmail
        2. Filter out already-saved ones (by message_id)
        3. Bulk insert new ones
        4. Update summaries for each affected month
        5. Trigger expense score
        """
        fetch_result = gmail_service.fetch_transactions(email)

        if "error" in fetch_result:
            return fetch_result

        parsed = fetch_result.get("parsed", [])
        if not parsed:
            return {"saved": 0, "message": "No new transactions found"}

        # Bulk insert
        saved = transaction_repo.insert_bulk(email, parsed)

        # Update summaries per month
        affected_months: dict[tuple, dict] = {}
        for txn in parsed:
            try:
                d   = date.fromisoformat(txn["date"])
                key = (d.strftime("%B"), d.year)
                if key not in affected_months:
                    affected_months[key] = {}
                txn_type = txn.get("type", "expense")
                affected_months[key][txn_type] = (
                    affected_months[key].get(txn_type, 0) + txn.get("amount", 0)
                )
            except Exception:
                continue

        for (month_str, year), type_totals in affected_months.items():
            existing = transaction_repo.get_summary(email, month_str, year) or {}
            updates  = {}
            for txn_type, amount in type_totals.items():
                updates[txn_type] = (existing.get(txn_type) or 0) + amount
            if updates:
                transaction_repo.upsert_summary(email, month_str, year, updates)

        # Expense score for today
        today = date.today()
        user  = user_repo.get_by_email(email)
        result = score_service.update_expense_transaction(user, today)
        if result.get("updated"):
            score_service.apply_and_log(
                user    = user,
                updates = result["updates"],
                reasons = ["+3 for syncing Gmail transactions"]
            )

        return {"saved": len(saved), "message": f"{len(saved)} transactions imported"}

    # ── Budgets ───────────────────────────────────────────────

    def set_budget(self, email: str, category: str, month: str, year: int, limit: float) -> dict:
        """
        Set a spending limit for a category.
        Triggers budget score (+10 if set early, -10 if set late).
        Equivalent to setBudget in expenseTrackerController.js
        """
        today = date.today()

        transaction_repo.upsert_budget(email, category, month, year, limit)

        # Budget score — only apply if setting for the CURRENT month
        current_month = today.strftime("%B")
        if month == current_month and year == today.year:
            user   = user_repo.get_by_email(email)
            result = score_service.update_expense_budget(user, today)
            score_service.apply_and_log(
                user    = user,
                updates = result["updates"],
                reasons = result["reasons"]
            )

        return {"set": True, "category": category, "limit": limit}

    def get_budgets(self, email: str, month: str, year: int) -> list:
        """Get all budgets for a month — equivalent to getBudgets"""
        return transaction_repo.get_budgets(email, month, year)

    # ── Summary ───────────────────────────────────────────────

    def get_summary(self, email: str, month: str, year: int) -> dict:
        """Monthly totals — equivalent to getMonthlyExpense"""
        summary = transaction_repo.get_summary(email, month, year)
        if not summary:
            return {
                "email": email, "month": month, "year": year,
                "expense": 0, "income": 0, "saving": 0, "investment": 0
            }
        return summary

    # ── Categories ────────────────────────────────────────────

    def get_categories(self, email: str) -> list:
        """User's custom categories — equivalent to getCategories"""
        return transaction_repo.get_categories(email)

    def update_categories(self, email: str, categories: list):
        """Save updated categories — equivalent to updateCategories"""
        transaction_repo.upsert_categories(email, categories)

    # ── Gmail Status ──────────────────────────────────────────

    def get_gmail_status(self, email: str) -> dict:
        return gmail_service.get_status(email)

    def toggle_autofetch(self, email: str, status: bool):
        gmail_service.toggle_autofetch(email, status)

    # ── Internal ──────────────────────────────────────────────

    def _update_summary(self, email: str, month: str, year: int, txn_type: str, amount: float, delta: int):
        """
        Add or subtract from the monthly type total.
        delta=1 for add, delta=-1 for delete.
        """
        existing = transaction_repo.get_summary(email, month, year) or {}
        current  = existing.get(txn_type) or 0
        new_val  = max(0, current + (amount * delta))
        transaction_repo.upsert_summary(email, month, year, {txn_type: new_val})


expense_service = ExpenseService()
