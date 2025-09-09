import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .intent_classifier import Intent, classify_intent
from .rules_engine import get_rule_based_response

# --- Constants ---
EMERGENCY_RESPONSE = "Cảnh báo: Các triệu chứng bạn mô tả có thể là dấu hiệu của một tình trạng y tế khẩn cấp. Vui lòng liên hệ ngay với bác sĩ hoặc gọi 115 để được hỗ trợ kịp thời."
SYSTEM_PROMPT = """Bạn là một nhân viên hỗ trợ y tế chuyên nghiệp, làm việc cho HealthSmart - một nền tảng chăm sóc sức khỏe tim mạch.
Bạn có nhiệm vụ:
1. Cung cấp thông tin y tế chính xác, dễ hiểu và dựa trên bằng chứng về các vấn đề liên quan đến tim mạch.
2. Giải đáp các câu hỏi thường gặp của bệnh nhân và người nhà về bệnh tim, thuốc men, chế độ ăn uống, lối sống và phục hồi chức năng.
3. Hướng dẫn người dùng cách sử dụng các tính năng của nền tảng HealthSmart.
4. Luôn thể hiện sự đồng cảm, kiên nhẫn và tôn trọng trong mọi tương tác.
5. Không bao giờ đưa ra chẩn đoán y tế chính thức hay kê đơn thuốc. Luôn khuyến khích người dùng tham khảo ý kiến bác sĩ chuyên khoa.
6. Nếu gặp câu hỏi vượt quá phạm vi kiến thức của bạn hoặc liên quan đến tình huống khẩn cấp, hãy chuyển hướng người dùng đến nhân viên y tế hoặc dịch vụ khẩn cấp.

Hãy nhớ: Thông tin bạn cung cấp chỉ mang tính chất tham khảo và giáo dục. Người dùng cần được tư vấn trực tiếp bởi bác sĩ để có chẩn đoán và điều trị chính xác.

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
async def forward_to_ollama(message: str):
    """Forwards a message to the Ollama service and returns the LLM's response."""
    ollama_url = "http://localhost:11434/api/generate"
    full_prompt = f"{SYSTEM_PROMPT}\n\nCâu hỏi của người dùng: {message}"
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