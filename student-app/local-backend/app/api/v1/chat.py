"""
Chat API Endpoints - Local Backend
Chỉ xử lý chat (RAG + Ollama) - 100% local
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import json
import time

from app.database import get_db
from app.services.rag_service import get_rag_context, get_loaded_subjects, init_rag_engine
from app.services.cache_service import get_cached_result, set_cached_result
from app.services.chat_service import (
    save_message, get_conversation_history, create_conversation_id,
    get_user_conversations, delete_conversation
)
from app.services.ollama_service import stream_response
from app.config import settings

router = APIRouter(prefix="/chat", tags=["chat"])


class QueryReq(BaseModel):
    question: str
    subject: Optional[str] = None
    user_id: Optional[str] = None  # String user_id (có thể từ remote API)
    conversation_id: Optional[str] = None


@router.post("/stream")
async def query_stream(
    req: QueryReq,
    db: Session = Depends(get_db)
):
    """
    Streaming RAG Query với conversation history
    100% LOCAL - không cần remote API
    """
    start_time = time.time()

    # Xử lý user_id và conversation_id
    user_id = req.user_id or "anonymous"
    conversation_id = req.conversation_id or create_conversation_id()

    # Load conversation history
    conversation_history = []
    if req.conversation_id:
        history_dicts = get_conversation_history(db, user_id, conversation_id, max_messages=10)
        conversation_history = [
            {"role": h["role"], "message": h["message"]}
            for h in history_dicts
        ]
        print(f"📜 Loaded {len(conversation_history)} messages from conversation {conversation_id}")

    # Get RAG context với history (check cache first)
    cached_result = get_cached_result(req.question, req.subject)

    if cached_result and len(cached_result) == 3:
        prompt, detected_subject, used_segments = cached_result
    else:
        prompt, detected_subject, used_segments = None, None, []

    if not prompt:
        # Cache miss, get from RAG
        try:
            rag_result = get_rag_context(
                req.question,
                req.subject,
                conversation_history=conversation_history
            )

            if rag_result and len(rag_result) == 3:
                prompt, detected_subject, used_segments = rag_result
            else:
                prompt, detected_subject, used_segments = None, None, []

            # Cache result (only if successful and no conversation history to avoid stale cache)
            if prompt and not conversation_history:
                set_cached_result(req.question, req.subject, (prompt, detected_subject, used_segments))
        except Exception as e:
            print(f"❌ Error getting RAG context: {e}")
            prompt, detected_subject, used_segments = None, None, []

    if not prompt:
        def error_stream():
            yield f"data: {json.dumps({'error': 'Không tìm thấy thông tin liên quan trong database.'})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    print(f"🤖 Streaming from Ollama (local): {settings.OLLAMA_URL} with model: {settings.OLLAMA_MODEL}")

    def stream():
        full_answer = ""
        user_message_saved = False
        assistant_message_saved = False
        try:
            # Lưu user message trước
            try:
                save_message(db, user_id, conversation_id, "user", req.question)
                user_message_saved = True
            except Exception as save_err:
                print(f"⚠️  Failed to save user message: {save_err}")

            # Stream từ Ollama
            for chunk in stream_response(prompt):
                if 'error' in chunk:
                    # Save partial answer nếu có
                    if full_answer and not assistant_message_saved:
                        try:
                            save_message(db, user_id, conversation_id, "assistant", full_answer)
                            assistant_message_saved = True
                        except Exception as save_err:
                            print(f"⚠️  Failed to save partial assistant message: {save_err}")
                    yield f"data: {json.dumps({'error': chunk['error']})}\n\n"
                    break

                if 'token' in chunk:
                    full_answer += chunk['token']
                    yield f"data: {json.dumps({'token': chunk['token'], 'done': False, 'conversation_id': conversation_id})}\n\n"

                if chunk.get('done', False):
                    # Lưu assistant response
                    if not assistant_message_saved:
                        try:
                            save_message(db, user_id, conversation_id, "assistant", full_answer)
                            assistant_message_saved = True
                        except Exception as save_err:
                            print(f"⚠️  Failed to save assistant message: {save_err}")

                    duration_ms = int((time.time() - start_time) * 1000)
                    yield f"data: {json.dumps({
                        'done': True,
                        'used_segments': used_segments,
                        'duration_ms': duration_ms,
                        'detected_subject': detected_subject,
                        'conversation_id': conversation_id
                    })}\n\n"

                    print(f"✅ Streaming completed in {duration_ms}ms, used {used_segments} segments, conv_id: {conversation_id}")

                    # Gửi telemetry đến remote API (optional, background)
                    if settings.TELEMETRY_ENABLED and settings.REMOTE_API_URL:
                        try:
                            import requests
                            requests.post(
                                f"{settings.REMOTE_API_URL}/api/v1/telemetry",
                                json={
                                    "question": req.question[:100],
                                    "answer_length": len(full_answer),
                                    "used_segments": used_segments,
                                    "duration_ms": duration_ms,
                                    "user_id": user_id,
                                    "conversation_id": conversation_id
                                },
                                timeout=5
                            )
                        except:
                            pass  # Ignore telemetry errors

                    # Auto-feedback: Gửi feedback nếu response quá chậm hoặc có vấn đề
                    if settings.FEEDBACK_ENABLED and settings.REMOTE_API_URL:
                        try:
                            from app.services.feedback_service import get_feedback_service
                            feedback_service = get_feedback_service()

                            # Gửi feedback nếu response time > 10s (performance issue)
                            if duration_ms > 10000:
                                feedback_service.send_auto_feedback(
                                    category="performance",
                                    title=f"Slow response: {duration_ms}ms",
                                    message=f"Response time exceeded 10s for question: {req.question[:100]}",
                                    conversation_id=conversation_id,
                                    priority=3
                                )
                        except:
                            pass  # Ignore feedback errors

                    break
        except Exception as e:
            from app.core.errors import ChatError

            # Save partial answer nếu có (trước khi xử lý error)
            if full_answer and not assistant_message_saved:
                try:
                    save_message(db, user_id, conversation_id, "assistant", full_answer)
                    assistant_message_saved = True
                    print(f"💾 Saved partial assistant message ({len(full_answer)} chars) after error")
                except Exception as save_err:
                    print(f"⚠️  Failed to save partial assistant message after error: {save_err}")

            # Convert to app error if needed
            if not isinstance(e, ChatError):
                e = ChatError(f"Error processing chat: {str(e)}")

            error_msg = e.message if hasattr(e, 'message') else str(e)
            print(f"❌ {error_msg}")

            # Auto-feedback: Gửi error feedback
            if settings.FEEDBACK_ENABLED and settings.REMOTE_API_URL:
                try:
                    from app.services.feedback_service import get_feedback_service
                    feedback_service = get_feedback_service()
                    error_code = e.code if hasattr(e, 'code') else "CHAT_ERROR"
                    feedback_service.send_error_feedback(
                        error_code=error_code,
                        error_message=error_msg,
                        error_details=str(e),
                        category="chat",
                        conversation_id=conversation_id
                    )
                except:
                    pass  # Ignore feedback errors

            # User-friendly error message
            user_message = "Không thể xử lý câu hỏi. Vui lòng thử lại."
            yield f"data: {json.dumps({'error': user_message, 'error_code': getattr(e, 'code', 'CHAT_ERROR')})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.get("/conversations")
async def get_conversations(
    user_id: str = Query("anonymous"),
    db: Session = Depends(get_db)
):
    """Lấy danh sách conversations của user"""
    conversations = get_user_conversations(db, user_id, limit=50)
    return {
        "ok": True,
        "conversations": conversations,
        "count": len(conversations)
    }


@router.get("/conversations/{conversation_id}/history")
async def get_history(
    conversation_id: str,
    user_id: str = Query("anonymous"),
    db: Session = Depends(get_db)
):
    """Lấy lịch sử của một conversation"""
    history = get_conversation_history(db, user_id, conversation_id)
    return {
        "ok": True,
        "conversation_id": conversation_id,
        "messages": history,
        "count": len(history)
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conv(
    conversation_id: str,
    user_id: str = Query("anonymous"),
    db: Session = Depends(get_db)
):
    """Xóa một conversation"""
    deleted = delete_conversation(db, user_id, conversation_id)
    if deleted:
        return {"ok": True, "message": f"Conversation {conversation_id} deleted"}
    else:
        raise HTTPException(status_code=404, detail="Conversation not found")


@router.get("/conversations/new")
async def create_new_conversation(
    user_id: str = Query("anonymous")
):
    """Tạo conversation mới"""
    conversation_id = create_conversation_id()
    return {
        "ok": True,
        "conversation_id": conversation_id,
        "user_id": user_id
    }
