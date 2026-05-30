# HTTP endpoints for course modules
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.services.course_service import course_service

router = APIRouter(prefix="/modules", tags=["Modules"])

class AddModuleRequest(BaseModel):
    title: str
    description: str
    order_index: int

@router.get("/course/{course_id}")
async def get_modules_by_course(course_id: str):
    """Get all modules for a specific course"""
    try:
        from app.repositories.course_repo import course_repo
        modules = course_repo.get_modules(course_id)
        if not modules:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Modules not found"
            )
        return modules
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch modules: {str(e)}"
        )

@router.post("/add/{course_id}", status_code=status.HTTP_201_CREATED)
async def add_module(course_id: str, body: AddModuleRequest):
    """Add a new module to a course"""
    if not body.title or not body.description or body.order_index is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required fields"
        )
    try:
        return course_service.add_module(
            course_id=course_id,
            title=body.title,
            description=body.description,
            order_index=body.order_index
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add module: {str(e)}"
        )

@router.delete("/{id}")
async def delete_module(id: str):
    """Delete a module"""
    try:
        course_service.delete_module(id)
        return {"message": "Module deleted successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting module: {str(e)}"
        )
