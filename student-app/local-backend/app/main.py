"""
Local Backend - Main Application
FastAPI app chạy LOCAL trên máy sinh viên
Chỉ xử lý: Chat, RAG, Ollama
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_database
from app.api.v1 import chat, packages
from app.services.rag_service import init_rag_engine, get_loaded_subjects

app = FastAPI(title="Student App - Local Backend")

# CORS Middleware
origins = settings.ALLOWED_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/v1")
app.include_router(packages.router, prefix="/api/v1")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Khởi tạo database và RAG engine"""
    # Initialize database
    init_database()

    # Initialize RAG engine
    init_rag_engine()

    print("🚀 Local Backend started successfully!")
    print(f"   RAG Engine: {len(get_loaded_subjects())} subjects loaded")
    print(f"   Ollama: {settings.OLLAMA_URL} ({settings.OLLAMA_MODEL})")


@app.get("/")
async def root():
    return {
        "message": "Student App - Local Backend",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "subjects": get_loaded_subjects(),
        "rag_ready": len(get_loaded_subjects()) > 0,
        "ollama_url": settings.OLLAMA_URL,
        "ollama_model": settings.OLLAMA_MODEL
    }
