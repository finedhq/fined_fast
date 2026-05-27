# Pydantic models for transactions and budgets
from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class TransactionCreate(BaseModel):
    """Single transaction — used in /transaction and /transactions-bulk"""
    amount: float = Field(gt=0, le=10_000_000)
    date: str
    type: Literal["expense", "income", "saving", "investment"]
    category: str = Field(min_length=1, max_length=50)
    description: str = Field(default="", max_length=500)
    message_id: Optional[str] = None


class BulkTransactionsCreate(BaseModel):
    """Bulk transaction insert — from Gmail parsing"""
    transactions: List[TransactionCreate]


class BudgetCreate(BaseModel):
    """Set a budget for a category/month"""
    category: str = Field(min_length=1, max_length=50)
    month: str
    year: int = Field(ge=2020, le=2030)
    limit: float = Field(ge=0)


class BudgetOut(BaseModel):
    """Budget as returned from DB"""
    email: str
    category: str
    month: str
    year: int
    limit: float
    spent: float = 0.0


class TransactionSummaryOut(BaseModel):
    """Monthly transaction summary"""
    email: str
    month: str
    year: int
    expense: float = 0.0
    income: float = 0.0
    saving: float = 0.0
    investment: float = 0.0


class TransactionOut(BaseModel):
    """Transaction as returned from DB"""
    id: str
    email: str
    amount: float
    date: str
    type: str
    category: str
    description: Optional[str] = None
    message_id: Optional[str] = None


class GmailStatusOut(BaseModel):
    """Gmail connection status"""
    connected: bool
    bank_email: Optional[str] = None
    auto_fetch: Optional[bool] = None
