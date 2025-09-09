import httpx
from fastapi import FastAPI
from pydantic import BaseModel

from .intent_classifier import Intent, classify_intent
from .rules_engine import get_rule_based_response

# --- Constants ---
EMERGENCY_RESPONSE = "Cảnh báo: Các triệu chứng bạn mô tả có thể là dấu hiệu của một tình trạng y tế khẩn cấp. Vui lòng liên hệ ngay với bác sĩ hoặc gọi 115 để được hỗ trợ kịp thời."

# --- Models ---
class ChatRequest(BaseModel):
    message: str

# --- FastAPI App ---
app = FastAPI(
    title="Smart Health Chatbot",
    description="A chatbot service with intent classification and a rules engine.",
    version="0.2.0",
)

# --- Helper Functions ---
async def forward_to_ollama(message: str):
    """Forwards a message to the Ollama service and returns the LLM's response."""
    ollama_url = "http://localhost:11434/api/generate"
    payload = {
        "model": "llama3",
        "prompt": message,
        "stream": False
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(ollama_url, json=payload)
            response.raise_for_status()
            ollama_response = response.json()
            return {"response": ollama_response.get("response", "No response content."), "source": "llm"}
    except httpx.RequestError as e:
        return {"error": f"Could not connect to Ollama service: {e}"}
    except Exception as e:
        return {"error": f"An unexpected error occurred: {e}"}

# --- API Endpoints ---
@app.post("/chat")
async def handle_chat(request: ChatRequest):
    """
    Receives a message, classifies the intent, and routes it accordingly.
    """
    intent = classify_intent(request.message)
    
    if intent == Intent.EMERGENCY:
        return {"response": EMERGENCY_RESPONSE, "source": "emergency_alert"}
        
    if intent == Intent.RULE_BASED:
        response = get_rule_based_response(request.message)
        if response:
            return {"response": response, "source": "rules_engine"}
            
    # Default to LLM
    return await forward_to_ollama(request.message)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Smart Health Chatbot API v0.2.0"}