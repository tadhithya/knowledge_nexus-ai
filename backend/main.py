import os
import json
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import init_db, get_db, Message, UserMemory, SessionLocal

import google.generativeai as genai
from google.generativeai.types import ContentDict
from duckduckgo_search import DDGS
import shutil
from rag import add_document, query_knowledge_base

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = "gemini-2.5-flash"

app = FastAPI(title="Knowledge Nexus AI", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, you may restrict this to your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

# ─── Tools ────────────────────────────────────────────────
def web_search(query: str) -> str:
    """
    Search the web for real-time information. Useful for time, weather, news, etc.
    """
    print(f"[Tool] Executing web_search for: {query}")
    try:
        results = DDGS().text(query, max_results=3)
        if not results:
            return "No results found."
        formatted_results = [f"Source: {r.get('title')}\nInfo: {r.get('body')}" for r in results]
        return "\n\n".join(formatted_results)
    except Exception as e:
        print(f"[Tool Error] {e}")
        return f"Error performing web search: {str(e)}"

def save_memory(fact: str) -> str:
    """
    Save an important fact or user preference to long-term memory.
    Use this when the user explicitly tells you something you should remember for future conversations.
    """
    print(f"[Tool] Saving memory: {fact}")
    try:
        db = SessionLocal()
        new_memory = UserMemory(fact=fact)
        db.add(new_memory)
        db.commit()
        db.close()
        return "Memory successfully saved."
    except Exception as e:
        return f"Failed to save memory: {str(e)}"

def calculate_math(expression: str) -> str:
    """
    Safely evaluate a mathematical expression.
    Use this for any complex math instead of calculating it yourself.
    Example expressions: '25 * 4', '100 / 3', '5**2'
    """
    print(f"[Tool] Calculating math: {expression}")
    try:
        allowed_names = {"abs": abs, "round": round, "max": max, "min": min, "pow": pow}
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return str(result)
    except Exception as e:
        return f"Error evaluating math expression: {str(e)}"

# ─── Models ────────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    role: str = "assistant"

# ─── Routes ────────────────────────────────────────────────
@app.post("/api/v1/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_path = f"./{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        chunks_added = add_document(file_path, file.filename)
        os.remove(file_path)
        return {"filename": file.filename, "chunks_added": chunks_added, "message": "Document successfully added to Knowledge Base."}
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME, "provider": "Google GenAI (Cloud)"}

@app.post("/api/v1/chat/", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable is not set. Please configure it to use the cloud deployment.")

    # Build chat history BEFORE saving the current request
    history_rows = (
        db.query(Message)
        .order_by(Message.created_at.desc())
        .limit(10)
        .all()
    )
    history_rows.reverse()

    # Save user message
    user_msg = Message(role="user", content=request.query)
    db.add(user_msg)
    db.commit()

    # Retrieve user memories
    memories = db.query(UserMemory).order_by(UserMemory.created_at.desc()).all()
    memory_context = ""
    if memories:
        memory_list = "\n".join([f"- {m.fact}" for m in memories])
        memory_context = f"\n\nHere are some things you know about the user:\n{memory_list}"

    system_instruction_text = (
        "You are Knowledge Nexus AI — a brilliant, friendly enterprise AI assistant. "
        "You give clear, accurate, and helpful answers. "
        "If you are provided with search results from a tool, you MUST use that exact information to answer the user directly. "
        "Do NOT apologize for being an AI. Just provide the answer."
        f"{memory_context}"
    )

    history = []
    for row in history_rows:
        role = "user" if row.role == "user" else "model"
        history.append({"role": role, "parts": [row.content]})

    try:
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            tools=[web_search, save_memory, calculate_math, query_knowledge_base],
            system_instruction=system_instruction_text
        )
        
        chat_session = model.start_chat(enable_automatic_function_calling=True, history=history)
        response = chat_session.send_message(request.query)
        answer = response.text
        
    except Exception as e:
        print(f"Chat generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

    # Save assistant reply
    assistant_msg = Message(role="assistant", content=answer)
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(answer=answer)

@app.get("/api/v1/chat/history")
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    msgs = db.query(Message).order_by(Message.created_at.asc()).limit(limit).all()
    return [
        {"id": m.id, "role": m.role, "content": m.content, "created_at": str(m.created_at)}
        for m in msgs
    ]

@app.get("/api/v1/models")
def list_models():
    """List available models"""
    return {"models": [{"name": MODEL_NAME}]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
