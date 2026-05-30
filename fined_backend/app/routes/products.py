# HTTP endpoints for comparative banking schemes and credit cards
from fastapi import APIRouter, HTTPException, status
from app.repositories.product_repo import product_repo

# --- Routers ---
sbi_router = APIRouter(prefix="/sbi", tags=["SBI Products"])
kotak_router = APIRouter(prefix="/kotak", tags=["Kotak Products"])
hdfc_router = APIRouter(prefix="/hdfc", tags=["HDFC Products"])
icici_router = APIRouter(prefix="/icici", tags=["ICICI Products"])

async def get_bank_product(product_name: str):
    """
    Get banking product data with latency-optimized fallback caching.
    Tries current week first, then falls back to latest record in database.
    """
    try:
        data = product_repo.get_this_week(product_name)
        if data:
            return data
        latest = product_repo.get_latest(product_name)
        if latest:
            return [latest]
        return []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve {product_name}: {str(e)}"
        )

# --- SBI Routes ---

@sbi_router.get("/savings")
async def sbi_savings():
    return await get_bank_product("SBI Savings Account")

@sbi_router.get("/fd")
async def sbi_fd():
    return await get_bank_product("SBI Fixed Deposit")

@sbi_router.get("/taxsaverfd")
async def sbi_taxsaverfd():
    return await get_bank_product("SBI Tax Saver Fixed Deposit")

@sbi_router.get("/rd")
async def sbi_rd():
    return await get_bank_product("SBI Recurring Deposit")

@sbi_router.get("/ppf")
async def sbi_ppf():
    return await get_bank_product("SBI Public Provident Fund")

@sbi_router.get("/nps")
async def sbi_nps():
    return await get_bank_product("SBI National Pension Scheme")

@sbi_router.get("/unnaticard")
async def sbi_unnaticard():
    return await get_bank_product("SBI Unnati Credit Card")

@sbi_router.get("/simplysave")
async def sbi_simplysave():
    return await get_bank_product("SBI SimplySave Credit Card")


# --- Kotak Routes ---

@kotak_router.get("/savings")
async def kotak_savings():
    return await get_bank_product("Kotak Savings Account")

@kotak_router.get("/acesavings")
async def kotak_acesavings():
    return await get_bank_product("Kotak Ace Savings Account")


# --- HDFC Routes ---

@hdfc_router.get("/savings")
async def hdfc_savings():
    return await get_bank_product("HDFC Savings Account")

@hdfc_router.get("/digisave")
async def hdfc_digisave():
    return await get_bank_product("HDFC DigiSave Account")

@hdfc_router.get("/maxsave")
async def hdfc_maxsave():
    return await get_bank_product("HDFC MaxSave Account")

@hdfc_router.get("/fd")
async def hdfc_fd():
    return await get_bank_product("HDFC Fixed Deposit")

@hdfc_router.get("/rd")
async def hdfc_rd():
    return await get_bank_product("HDFC Recurring Deposit")

@hdfc_router.get("/moneyback")
async def hdfc_moneyback():
    return await get_bank_product("HDFC Moneyback Credit Card")


# --- ICICI Routes ---

@icici_router.get("/savings")
async def icici_savings():
    return await get_bank_product("ICICI Savings Account")

@icici_router.get("/basicsavings")
async def icici_basicsavings():
    return await get_bank_product("ICICI Basic Savings Account")

@icici_router.get("/youngsavings")
async def icici_youngsavings():
    return await get_bank_product("ICICI Young Savings Account")

@icici_router.get("/fd")
async def icici_fd():
    return await get_bank_product("ICICI Fixed Deposit")

@icici_router.get("/rd")
async def icici_rd():
    return await get_bank_product("ICICI Recurring Deposit")
