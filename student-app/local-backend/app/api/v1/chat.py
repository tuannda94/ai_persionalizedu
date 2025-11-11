"""
Chat API Endpoints - Local Backend
Chỉ xử lý chat (RAG + Ollama) - 100% local
Hỗ trợ file uploads (images, documents)
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
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
from app.services.file_processor import get_file_processor
from app.config import settings

router = APIRouter(prefix="/chat", tags=["chat"])


class QueryReq(BaseModel):
    question: str
    subject: Optional[str] = None
    user_id: Optional[str] = None  # String user_id (có thể từ remote API)
    conversation_id: Optional[str] = None
    file_contents: Optional[List[dict]] = None  # Processed file contents


@router.post("/stream")
async def query_stream(
    request: Request,
    question: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
    conversation_id: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    """
    Streaming RAG Query với conversation history và file uploads
    100% LOCAL - không cần remote API

    Supports both JSON (text-only) and FormData (with files)
    """
    # Handle JSON request (backward compatibility)
    if not question and not files:
        # Try to get from request body as JSON
        try:
            content_type = request.headers.get("content-type", "")
            if "application/json" in content_type:
                body = await request.json()
                question = body.get('question', '')
                user_id = body.get('user_id') or "anonymous"
                conversation_id = body.get('conversation_id')
                files = None
        except Exception as e:
            print(f"⚠️  Failed to parse JSON request: {e}")
            pass

    start_time = time.time()

    # Process files if any
    file_contents_text = ""
    if files:
        file_processor = get_file_processor()
        files_data = []
        for file in files:
            if file.filename:
                content = await file.read()
                files_data.append((content, file.filename, file.content_type or 'application/octet-stream'))

        if files_data:
            processed_files = file_processor.process_files(files_data)

            # Build text description of files
            file_descriptions = []
            for pf in processed_files:
                if pf.get('extracted_text'):
                    file_descriptions.append(
                        f"\n[File: {pf['filename']} ({pf['type']})]\n{pf['extracted_text']}\n"
                    )
                else:
                    file_descriptions.append(
                        f"\n[File: {pf['filename']} ({pf['type']}) - Không thể trích xuất nội dung]\n"
                    )

            file_contents_text = "\n".join(file_descriptions)
            print(f"📎 Processed {len(processed_files)} files")

    # Combine question with file contents
    full_question = question or ""
    if file_contents_text:
        if full_question:
            full_question = f"{full_question}\n\nNội dung từ file đính kèm:\n{file_contents_text}"
        else:
            full_question = f"Nội dung từ file đính kèm:\n{file_contents_text}"

    if not full_question.strip():
        def error_stream():
            yield f"data: {json.dumps({'error': 'Vui lòng nhập câu hỏi hoặc đính kèm file.'})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    # Xử lý user_id và conversation_id
    user_id = user_id or "anonymous"
    conversation_id = conversation_id or create_conversation_id()

    # Load conversation history
    conversation_history = []
    if conversation_id:
        history_dicts = get_conversation_history(db, user_id, conversation_id, max_messages=10)
        conversation_history = [
            {"role": h["role"], "message": h["message"]}
            for h in history_dicts
        ]
        print(f"📜 Loaded {len(conversation_history)} messages from conversation {conversation_id}")

    # Get RAG context với history (check cache first)
    # Note: Don't cache when files are included
    cached_result = None if files else get_cached_result(full_question, None)

    if cached_result and len(cached_result) == 3:
        prompt, detected_subject, used_segments = cached_result
    else:
        prompt, detected_subject, used_segments = None, None, []

    if not prompt:
        # Cache miss, get from RAG
        try:
            rag_result = get_rag_context(
                full_question,
                None,  # subject - let RAG auto-detect
                conversation_history=conversation_history
            )

            if rag_result and len(rag_result) == 3:
                prompt, detected_subject, used_segments = rag_result
            else:
                prompt, detected_subject, used_segments = None, None, []

            # Cache result (only if successful, no conversation history, and no files to avoid stale cache)
            if prompt and not conversation_history and not files:
                set_cached_result(full_question, None, (prompt, detected_subject, used_segments))
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
            # Lưu user message trước (bao gồm file info nếu có)
            try:
                user_message_to_save = question or ""
                if files:
                    file_info = f"\n[Đã đính kèm {len(files)} file(s)]"
                    user_message_to_save = user_message_to_save + file_info if user_message_to_save else file_info
                save_message(db, user_id, conversation_id, "user", user_message_to_save or full_question)
                user_message_saved = True
            except Exception as save_err:
                print(f"⚠️  Failed to save user message: {save_err}")

            # Stream từ Ollama - Tối ưu: yield ngay lập tức không đợi accumulate
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
                    # Tối ưu: Yield ngay lập tức, không format lại JSON nhiều lần
                    # Sử dụng f-string thay vì json.dumps cho performance tốt hơn
                    token = chunk['token']
                    yield f"data: {{\"token\":{json.dumps(token)},\"done\":false,\"conversation_id\":{json.dumps(conversation_id)}}}\n\n"

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
