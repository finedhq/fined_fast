# HTTP endpoints for educational courses and quiz submissions
import asyncio
import re
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

from app.integrations.storage import upload_to_supabase
from app.integrations.supabase_client import supabase
from app.dependencies import get_current_user, require_admin, AuthUser

router = APIRouter(prefix="/courses", tags=["Courses"])

# --- Request Schemas ---

class GetOngoingCourseRequest(BaseModel):
    email: str

class GetCourseRequest(BaseModel):
    email: str

class GetCardRequest(BaseModel):
    email: str

class UpdateCardRequest(BaseModel):
    status: str
    userAnswer: Optional[str] = None
    email: str
    finStars: Optional[int] = None
    userIndex: Optional[int] = None


# --- Route Endpoints ---

@router.post("/add")
async def add_course(
    title: str = Form(...),
    description: str = Form(...),
    modules_count: str = Form(...),
    duration: str = Form(...),
    thumbnail_file: Optional[UploadFile] = File(None)
):
    """Admin: Adds a new course pathway with optional thumbnail upload"""
    try:
        thumbnail_url = ""
        if thumbnail_file:
            file_bytes = await thumbnail_file.read()
            thumbnail_url = upload_to_supabase(
                file_bytes=file_bytes,
                filename=thumbnail_file.filename,
                mime_type=thumbnail_file.content_type,
                folder="thumbnails",
                title=title
            )
        
        # Insert course row
        res = await asyncio.to_thread(lambda: supabase.from_("courses").insert([{
            "title": title,
            "description": description,
            "modules_count": int(modules_count),
            "duration": int(duration),
            "thumbnail_url": thumbnail_url
        }]).execute())
        
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add course: {str(e)}"
        )


@router.get("/getall")
async def get_all_courses():
    """Fetch all courses — public"""
    try:
        res = await asyncio.to_thread(lambda: supabase.from_("courses").select("*").order("created_at", desc=True).execute())
        return res.data or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch courses: {str(e)}"
        )


@router.delete("/{id}")
async def delete_course(id: str):
    """Admin: Delete a course"""
    try:
        await asyncio.to_thread(lambda: supabase.from_("courses").delete().eq("id", id).execute())
        return {"message": "Course deleted successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete course: {str(e)}"
        )


@router.post("/getongoingcourse")
async def get_ongoing_course(body: GetOngoingCourseRequest):
    """Fetch user's current in-progress course"""
    try:
        # Get user's ongoing course ID
        user_res = await asyncio.to_thread(lambda: supabase.from_("users").select("ongoing_course_id").eq("email", body.email).limit(1).execute())
        user_data = user_res.data[0] if user_res and user_res.data else None
        course_id = user_data.get("ongoing_course_id") if user_data else None
        
        if not course_id:
            return {"error": "No ongoing course found for this user."}
            
        course_res = await asyncio.to_thread(lambda: supabase.from_("courses").select("*").eq("id", course_id).limit(1).execute())
        return course_res.data[0] if course_res and course_res.data else {}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch ongoing course: {str(e)}"
        )


@router.post("/course/{course_id}")
async def get_a_course(course_id: str, body: GetCourseRequest):
    """
    Fetch course overview with modules and card completion progress.
    Optimized: consolidated card lookups and executed in parallel.
    """
    try:
        # Parallel database requests (Latency Win 2)
        course_future = asyncio.to_thread(lambda: supabase.from_("courses").select("title").eq("id", course_id).single().execute())
        modules_future = asyncio.to_thread(lambda: supabase.from_("modules").select("id, title").eq("course_id", course_id).execute())
        progress_future = asyncio.to_thread(lambda: supabase.from_("userCourses").select("card_id, status").eq("email", body.email).eq("progress_type", "card").execute())
        
        course_res, modules_res, progress_res = await asyncio.gather(
            course_future, modules_future, progress_future
        )
        
        modules = modules_res.data or []
        if not modules:
            return {"title": course_res.data.get("title") if course_res.data else "", "data": []}
            
        # Optimization: Fetch only cards belonging to the modules in this course (Latency Win 1)
        module_ids = [m["id"] for m in modules]
        cards_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id, module_id, title, content_text, content_type, order_index, image_url").in_("module_id", module_ids).execute())
        cards = cards_res.data or []
        
        # Build user progress map
        progress_map = {item["card_id"]: item["status"] for item in (progress_res.data or [])}
        
        # Group cards by module in memory
        cards_by_module = {}
        for card in cards:
            mod_id = card["module_id"]
            if mod_id not in cards_by_module:
                cards_by_module[mod_id] = []
            
            cards_by_module[mod_id].append({
                "card_id": card["card_id"],
                "module_id": card["module_id"],
                "title": card["title"],
                "content_text": card["content_text"],
                "content_type": card["content_type"],
                "order_index": card["order_index"],
                "image_url": card["image_url"],
                "status": progress_map.get(card["card_id"], "incompleted")
            })
            
        # Combine modules with sorted cards
        formatted_data = []
        for module in modules:
            mod_id = module["id"]
            module_cards = cards_by_module.get(mod_id, [])
            module_cards.sort(key=lambda x: x["order_index"])
            formatted_data.append({
                "moduleTitle": module["title"],
                "moduleId": mod_id,
                "cards": module_cards
            })
            
        return {"title": course_res.data.get("title"), "data": formatted_data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch course detail: {str(e)}"
        )


@router.post("/course/{course_id}/module/{module_id}/card/{card_id}")
async def get_a_card(course_id: str, module_id: str, card_id: str, body: GetCardRequest):
    """
    Fetch card metadata and adjacent navigation indicators.
    Optimized: Released event loop and parallelized I/O lookups.
    """
    try:
        # 1. Fetch current cards, user progress, and update active state in parallel
        cards_future = asyncio.to_thread(lambda: supabase.from_("cards").select("*").eq("module_id", module_id).order("order_index").execute())
        progress_future = asyncio.to_thread(lambda: supabase.from_("userCourses").select("status, user_answer").match({
            "email": body.email,
            "module_id": module_id,
            "card_id": card_id,
            "progress_type": "card"
        }).limit(1).execute())
        update_user_future = asyncio.to_thread(lambda: supabase.from_("users").update({
            "ongoing_module_id": module_id,
            "ongoing_course_id": course_id
        }).eq("email", body.email).execute())
        modules_list_future = asyncio.to_thread(lambda: supabase.from_("modules").select("id").eq("course_id", course_id).order("order_index").execute())
        
        cards_res, progress_res, _, modules_res = await asyncio.gather(
            cards_future, progress_future, update_user_future, modules_list_future
        )
        
        all_cards = cards_res.data or []
        current_index = next((i for i, c in enumerate(all_cards) if c["card_id"] == card_id), -1)
        if current_index == -1:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
            
        current_card = all_cards[current_index]
        user_progress = progress_res.data[0] if progress_res and progress_res.data else {}
        
        # 2. Adjacent modules navigation lookup
        modules = modules_res.data or []
        module_index = next((i for i, m in enumerate(modules) if m["id"] == module_id), -1)
        
        prev_module = modules[module_index - 1] if module_index > 0 else None
        next_module = modules[module_index + 1] if module_index < len(modules) - 1 else None
        
        prev_module_first_card = None
        next_module_first_card = None
        
        nav_futures = []
        if prev_module:
            nav_futures.append(asyncio.to_thread(lambda: supabase.from_("cards").select("card_id").eq("module_id", prev_module["id"]).order("order_index").limit(1).execute()))
        if next_module:
            nav_futures.append(asyncio.to_thread(lambda: supabase.from_("cards").select("card_id").eq("module_id", next_module["id"]).order("order_index").limit(1).execute()))
            
        nav_results = await asyncio.gather(*nav_futures) if nav_futures else []
        
        nav_idx = 0
        if prev_module:
            prev_cards = nav_results[nav_idx].data
            if prev_cards:
                prev_module_first_card = {"moduleId": prev_module["id"], "cardId": prev_cards[0]["card_id"]}
            nav_idx += 1
            
        if next_module:
            next_cards = nav_results[nav_idx].data
            if next_cards:
                next_module_first_card = {"moduleId": next_module["id"], "cardId": next_cards[0]["card_id"]}
                
        return {
            **current_card,
            "status": user_progress.get("status", "incompleted"),
            "userAnswer": user_progress.get("user_answer"),
            "prevCardId": all_cards[current_index - 1]["card_id"] if current_index > 0 else None,
            "nextCardId": all_cards[current_index + 1]["card_id"] if current_index < len(all_cards) - 1 else None,
            "module_total_cards": len(all_cards),
            "module_progress": current_card.get("order_index", 0) + 1,
            "isFirstCardInModule": current_index == 0,
            "isLastCardInModule": current_index == len(all_cards) - 1,
            "prevModuleFirstCard": prev_module_first_card,
            "nextModuleFirstCard": next_module_first_card
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch card detail: {str(e)}"
        )


@router.post("/course/{course_id}/module/{module_id}/card/{card_id}/updateCard")
async def update_a_card(course_id: str, module_id: str, card_id: str, body: UpdateCardRequest):
    """
    Updates the completion status of a card. 
    Triggers consistency rewards, module completion scores, and course quiz evaluation.
    """
    try:
        today_iso = datetime.utcnow().isoformat() + "Z"
        
        # 1. Fetch card details and user scoring metrics concurrently
        card_future = asyncio.to_thread(lambda: supabase.from_("cards").select("*").eq("card_id", card_id).single().execute())
        user_future = asyncio.to_thread(lambda: supabase.from_("users").select("fin_stars, course_count, course_score, consistency_score, article_score, expense_score").eq("email", body.email).limit(1).execute())
        existing_progress_future = asyncio.to_thread(lambda: supabase.from_("userCourses").select("id").match({
            "email": body.email,
            "module_id": module_id,
            "card_id": card_id,
            "progress_type": "card"
        }).limit(1).execute())
        
        card_res, user_res, existing_res = await asyncio.gather(card_future, user_future, existing_progress_future)
        
        card_data = card_res.data
        user = user_res.data[0] if user_res and user_res.data else {}
        existing_progress = existing_res.data[0] if existing_res and existing_res.data else None
        
        # Parse answer tag if a valid option index is provided
        options_tags = []
        if isinstance(card_data.get("options_tags"), str):
            try:
                import json
                options_tags = json.loads(card_data["options_tags"])
            except:
                pass
        elif isinstance(card_data.get("options_tags"), list):
            options_tags = card_data["options_tags"]
            
        answer_tags = options_tags[body.userIndex] if (body.userIndex is not None and body.userIndex < len(options_tags)) else None
        
        # 2. Insert or update card completion log
        payload = {
            "status": body.status,
            "user_answer": body.userAnswer,
            "answer_tags": answer_tags,
            "completion_date": today_iso if body.status == "completed" else None
        }
        
        if existing_progress:
            await asyncio.to_thread(lambda: supabase.from_("userCourses").update(payload).eq("id", existing_progress["id"]).execute())
        else:
            payload_insert = {
                "email": body.email,
                "course_id": course_id,
                "module_id": module_id,
                "card_id": card_id,
                "progress_type": "card",
                **payload
            }
            await asyncio.to_thread(lambda: supabase.from_("userCourses").insert([payload_insert]).execute())
            
        # 3. Update stars if earned
        current_stars = user.get("fin_stars") or 0
        if body.finStars:
            current_stars += body.finStars
            await asyncio.to_thread(lambda: supabase.from_("users").update({"fin_stars": current_stars}).eq("email", body.email).execute())
            
        # 4. Fetch module details to calculate module completion progress
        all_cards_future = asyncio.to_thread(lambda: supabase.from_("cards").select("card_id").eq("module_id", module_id).order("order_index").execute())
        completed_cards_future = asyncio.to_thread(lambda: supabase.from_("userCourses").select("card_id").match({
            "email": body.email,
            "module_id": module_id,
            "progress_type": "card",
            "status": "completed"
        }).execute())
        
        all_cards_res, completed_cards_res = await asyncio.gather(all_cards_future, completed_cards_future)
        all_cards = all_cards_res.data or []
        completed_cards = completed_cards_res.data or []
        
        current_index = next((i for i, c in enumerate(all_cards) if c["card_id"] == card_id), -1)
        prev_card_id = all_cards[current_index - 1]["card_id"] if current_index > 0 else None
        next_card_id = all_cards[current_index + 1]["card_id"] if current_index < len(all_cards) - 1 else None
        
        module_progress = len(completed_cards)
        module_total_cards = len(all_cards)
        
        logs = []
        
        # 5. Award Module completion bonus
        course_count = user.get("course_count") or 0
        course_score = user.get("course_score") or 0
        consistency_score = user.get("consistency_score") or 0
        article_score = user.get("article_score") or 0
        expense_score = user.get("expense_score") or 0
        
        if module_progress == module_total_cards and course_count < 5:
            old_score = course_score + consistency_score + article_score + expense_score
            new_course_score = min(course_score + 20, 500)
            new_total = new_course_score + consistency_score + article_score + expense_score
            delta = new_total - old_score
            
            await asyncio.to_thread(lambda: supabase.from_("users").update({"course_score": new_course_score}).eq("email", body.email).execute())
            course_score = new_course_score  # Update reference
            
            if delta != 0:
                logs.append({
                    "email": body.email,
                    "old_score": old_score,
                    "new_score": new_total,
                    "change": delta,
                    "description": "+20 for completing module"
                })
                
        # 6. Check full Course completion & evaluate quiz score
        modules_res = await asyncio.to_thread(lambda: supabase.from_("modules").select("id").eq("course_id", course_id).order("order_index").execute())
        modules = modules_res.data or []
        module_ids = [m["id"] for m in modules]
        
        all_course_cards_future = asyncio.to_thread(lambda: supabase.from_("cards").select("card_id").in_("module_id", module_ids).execute())
        completed_course_cards_future = asyncio.to_thread(lambda: supabase.from_("userCourses").select("card_id").match({
            "email": body.email,
            "course_id": course_id,
            "progress_type": "card",
            "status": "completed"
        }).execute())
        
        all_course_res, completed_course_res = await asyncio.gather(all_course_cards_future, completed_course_cards_future)
        
        if len(all_course_res.data or []) == len(completed_course_res.data or []) and course_count < 5:
            # Course completed! Fetch answers and correct keys to compute score
            answers_future = asyncio.to_thread(lambda: supabase.from_("userCourses").select("user_answer, card_id").match({"email": body.email, "course_id": course_id, "progress_type": "card"}).execute())
            keys_future = asyncio.to_thread(lambda: supabase.from_("cards").select("card_id, correct_answer").in_("module_id", module_ids).execute())
            
            answers_res, keys_res = await asyncio.gather(answers_future, keys_future)
            
            correct_map = {c["card_id"]: c["correct_answer"].strip().lower() for c in (keys_res.data or []) if c.get("correct_answer")}
            
            correct = 0
            total = 0
            for row in (answers_res.data or []):
                card_id_ref = row["card_id"]
                user_ans = (row.get("user_answer") or "").strip().lower()
                if card_id_ref in correct_map:
                    total += 1
                    if user_ans == correct_map[card_id_ref]:
                        correct += 1
                        
            percent = (correct / total) * 100 if total > 0 else 100
            
            quiz_bonus = 0
            reason = ""
            if percent >= 80:
                quiz_bonus = 10
                reason = "+10 for >=80% in course quiz"
            elif percent >= 60:
                quiz_bonus = 5
                reason = "+5 for 60-79% in course quiz"
            else:
                quiz_bonus = -5
                reason = "-5 for <60% in course quiz"
                
            old_score = course_score + consistency_score + article_score + expense_score
            new_course_score = max(0, min(course_score + quiz_bonus, 500))
            new_total = new_course_score + consistency_score + article_score + expense_score
            delta = new_total - old_score
            
            await asyncio.to_thread(lambda: supabase.from_("users").update({
                "course_score": new_course_score,
                "course_count": course_count + 1
            }).eq("email", body.email).execute())
            
            if delta != 0:
                logs.append({
                    "email": body.email,
                    "old_score": old_score,
                    "new_score": new_total,
                    "change": delta,
                    "description": reason
                })
                
        # Bulk insert logs if any
        if logs:
            await asyncio.to_thread(lambda: supabase.from_("finScoreLogs").insert(logs).execute())
            
        return {
            **card_data,
            "status": "completed",
            "userAnswer": body.userAnswer,
            "prevCardId": prev_card_id,
            "nextCardId": next_card_id,
            "module_progress": module_progress,
            "module_total_cards": module_total_cards
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update progress: {str(e)}"
        )
