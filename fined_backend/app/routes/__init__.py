# Main API router grouping all routes
from fastapi import APIRouter
from app.routes.home import router as home_router
from app.routes.articles import router as articles_router
from app.routes.courses import router as courses_router
from app.routes.admin import router as admin_router
from app.routes.contact import router as contact_router
from app.routes.expenses import router as expenses_router
from app.routes.products import sbi_router, kotak_router, hdfc_router, icici_router
from app.routes.modules import router as modules_router
from app.routes.cards import router as cards_router
from app.routes.auth import router as auth_router

api_router = APIRouter()

api_router.include_router(home_router)
api_router.include_router(articles_router)
api_router.include_router(courses_router)
api_router.include_router(admin_router)
api_router.include_router(contact_router)
api_router.include_router(expenses_router)
api_router.include_router(sbi_router)
api_router.include_router(kotak_router)
api_router.include_router(hdfc_router)
api_router.include_router(icici_router)
api_router.include_router(auth_router)
api_router.include_router(modules_router)
api_router.include_router(cards_router)


