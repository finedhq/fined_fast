# Pydantic models for scraped banking products
from pydantic import BaseModel
from typing import Optional, List


class BankProductOut(BaseModel):
    """
    Maps to allSchemesData table.
    Returned by GET /api/products/{slug}
    """
    id: Optional[str] = None
    bank_name: str
    product_name: str
    category: str
    description: str
    features: List[str] = []
    eligibility: List[str] = []
    fees_and_charges: List[str] = []
    interest_rate: Optional[str] = None
    source_url: Optional[str] = None
    income_type: Optional[str] = None
    goal: Optional[str] = None
    risk_profile: Optional[str] = None
    created_at: Optional[str] = None
