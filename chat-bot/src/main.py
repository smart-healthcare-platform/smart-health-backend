import httpx
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .intent_classifier import Intent, classify_intent
from .rules_engine import get_rule_based_response
from .rag_pipeline import query_rag

# --- Constants ---
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
EMERGENCY_RESPONSE = "Cảnh báo: Các triệu chứng bạn mô tả có thể là dấu hiệu của một tình trạng y tế khẩn cấp. Vui lòng liên hệ ngay với bác sĩ hoặc gọi 115 để được hỗ trợ kịp thời."
MEDICAL_DISCLAIMER = "\n\n--- Tuyên bố miễn trừ trách nhiệm ---\nThông tin này chỉ mang tính chất tham khảo và không thay thế cho tư vấn y tế chuyên nghiệp. Luôn tham khảo ý kiến bác sĩ để có chẩn đoán và điều trị chính xác."
MAX_HISTORY_LENGTH = 5 # Số lượng cặp hội thoại gần nhất cần lưu
SYSTEM_PROMPT = """Bạn là một nhân viên hỗ trợ y tế chuyên nghiệp, làm việc cho HealthSmart - một nền tảng chăm sóc sức khỏe tim mạch.
Bạn có nhiệm vụ:
1. Cung cấp thông tin y tế chính xác, dễ hiểu và dựa trên bằng chứng về các vấn đề liên quan đến tim mạch.
2. Giải đáp các câu hỏi thường gặp của bệnh nhân và người nhà về bệnh tim, thuốc men, chế độ ăn uống, lối sống và phục hồi chức năng.
3. Hướng dẫn người dùng cách sử dụng các tính năng của nền tảng HealthSmart.
4. Luôn thể hiện sự đồng cảm, kiên nhẫn và tôn trọng trong mọi tương tác.
5. Không bao giờ đưa ra chẩn đoán y tế chính thức hay kê đơn thuốc. Luôn khuyến khích người dùng tham khảo ý kiến bác sĩ chuyên khoa.
6. Nếu gặp câu hỏi vượt quá phạm vi kiến thức của bạn hoặc liên quan đến tình huống khẩn cấp, hãy chuyển hướng người dùng đến nhân viên y tế hoặc dịch vụ khẩn cấp.

Hãy nhớ: Thông tin bạn cung cấp chỉ mang tính chất tham khảo và giáo dục. Người dùng cần được tư vấn trực tiếp bởi bác sĩ để có chẩn đoán và điều trị chính xác.

--- QUY TẮC SỬ DỤNG NGỮ CẢNH ---
- KHI được cung cấp "Ngữ cảnh từ tài liệu y khoa", bạn BẮT BUỘC phải dựa vào đó để trả lời.
- Nếu ngữ cảnh không đủ thông tin, hãy trả lời rằng "Dựa trên tài liệu hiện có, tôi không tìm thấy thông tin chính xác về vấn đề này. Bạn vui lòng hỏi rõ hơn hoặc tham khảo ý kiến bác sĩ."
- KHÔNG được bịa đặt thông tin không có trong ngữ cảnh.

Khi trả lời, hãy sử dụng định dạng Markdown để làm cho câu trả lời dễ đọc hơn. Ví dụ:
- Sử dụng danh sách không thứ tự với dấu chấm đầu dòng (`-` hoặc `*`) cho các điểm chính.
- Sử dụng danh sách có thứ tự (`1.`, `2.`, ...) khi cần đánh số thứ tự các bước.
- Sử dụng **in đậm** cho các từ khóa hoặc cụm từ quan trọng.
- Sử dụng `mã nội tuyến` cho các thuật ngữ y tế hoặc tên thuốc nếu cần.
- Giữ ngôn ngữ tự nhiên, thân thiện và dễ hiểu.

Ví dụ về format:
**Các dấu hiệu nhận biết nguy cơ bệnh tim mạch:**
1. **Đau ngực**: Nếu bạn experiencing đau ngực, khó thở, hoặc cảm thấy khó chịu ở ngực, hãy tìm kiếm sự giúp đỡ y tế ngay lập tức.
2. **Khó thở**: Nếu bạn gặp phải tình trạng khó thở, đặc biệt là khi tập thể dục hoặc đi bộ, cần tham khảo ý kiến bác sĩ.

**Các biện pháp phòng ngừa:**
- Ăn uống cân đối với nhiều rau xanh, trái cây và thực phẩm ít chất béo
- Tập thể dục thường xuyên (tối thiểu 150 phút mỗi tuần)
- Giảm cân nếu cần thiết
- Không hút thuốc lá"""

# --- In-memory storage ---
conversation_history: list[dict] = []

# --- Models ---
class ChatRequest(BaseModel):
    message: str

# --- FastAPI App ---
app = FastAPI(
    title="Smart Health Chatbot",
    description="A chatbot service with intent classification and a rules engine.",
    version="0.2.0",
)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only. In production, specify exact origins.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper Functions ---
async def forward_to_ollama(message: str, context: list[str] | None = None, history: list[dict] | None = None):
    """Forwards a message to the Ollama service, including RAG context and history if available."""
    ollama_url = f"{OLLAMA_HOST}/api/generate"
    
    context_str = ""
    source = "llm"
    if context:
        context_str = "\n\n--- Ngữ cảnh từ tài liệu y khoa ---\n" + "\n\n".join(context)
        source = "llm_with_rag"

    history_str = ""
    if history:
        history_items = []
        for turn in history:
            history_items.append(f"Người dùng: {turn['user']}\nTrợ lý: {turn['bot']}")
        history_str = "\n\n--- Lịch sử hội thoại gần đây ---\n" + "\n\n".join(history_items)

    full_prompt = f"{SYSTEM_PROMPT}{history_str}{context_str}\n\n--- Câu hỏi của người dùng ---\n{message}"
    
    payload = {
        "model": "llama3.2:latest",
        "prompt": full_prompt,
        "stream": False
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(ollama_url, json=payload)
            response.raise_for_status()
            ollama_response = response.json()
            
            # Append disclaimer to LLM responses
            final_response = ollama_response.get("response", "No response content.") + MEDICAL_DISCLAIMER
            
            return {
                "response": final_response,
                "source": source,
                "context": context
            }
    except httpx.RequestError as e:
        return {"error": f"Could not connect to Ollama service: {e}"}
    except Exception as e:
        return {"error": f"An unexpected error occurred: {e}"}

# --- API Endpoints ---
@app.post("/chat")
async def handle_chat(request: ChatRequest):
    """
    Receives a message, classifies the intent, and routes it accordingly.
    Manages conversation history.
    """
    global conversation_history
    intent = classify_intent(request.message)
    
    response_data = {}

    if intent == Intent.EMERGENCY:
        response_data = {"response": EMERGENCY_RESPONSE, "source": "emergency_alert"}
        
    elif intent == Intent.RULE_BASED:
        response = get_rule_based_response(request.message)
        if response:
            response_data = {"response": response, "source": "rules_engine"}
            
    # If no rule-based or emergency response, proceed to LLM
    if not response_data:
        context = query_rag(request.message)
        response_data = await forward_to_ollama(request.message, context=context, history=conversation_history)

    # Save history if the response was successful
    if "error" not in response_data:
        conversation_history.append({
            "user": request.message,
            "bot": response_data.get("response")
        })
        # Trim history if it exceeds the max length
        if len(conversation_history) > MAX_HISTORY_LENGTH:
            conversation_history.pop(0)

    return response_data

@app.get("/")
def read_root():
    return {"message": "Welcome to the Smart Health Chatbot API v0.2.0"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("CHATBOT_PORT", 8087))
    uvicorn.run(app, host="0.0.0.0", port=port) 