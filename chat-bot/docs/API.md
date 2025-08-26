# API Documentation - Chatbot Service

## 📋 Overview

This document provides comprehensive API documentation for the Chatbot Service using OpenAPI 3.0 specification. The service provides intelligent healthcare chatbot capabilities with AI integration and rule-based processing.

## 🔐 Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer {jwt_token}
```

## OpenAPI 3.0 Specification

```yaml
openapi: 3.0.0
info:
  title: Chatbot Service API
  description: AI-powered healthcare chatbot service for cardiovascular patients
  version: 1.0.0
  contact:
    name: Development Team
    email: dev@healthcare.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: http://localhost:3001
    description: Development server
  - url: https://api.healthcare.com/chatbot
    description: Production server

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    ChatMessage:
      type: object
      required:
        - message
        - userId
      properties:
        message:
          type: string
          description: User message content
          example: "Tôi bị đau ngực và khó thở"
        userId:
          type: string
          description: Unique user identifier
          example: "user_001"
        sessionId:
          type: string
          description: Session identifier for context maintenance
          example: "session_abc123"
        language:
          type: string
          description: Language preference
          enum: [vi, en, fr, es]
          default: "vi"
          example: "vi"

    ChatResponse:
      type: object
      properties:
        response:
          type: string
          description: AI-generated response
          example: "Đau ngực có thể là dấu hiệu của vấn đề tim mạch. Bạn nên mô tả thêm về triệu chứng."
        sessionId:
          type: string
          description: Session identifier
          example: "session_abc123"
        timestamp:
          type: string
          format: date-time
          description: Response timestamp
          example: "2024-01-15T10:30:00Z"
        urgencyLevel:
          type: string
          enum: [NORMAL, URGENT, CRITICAL]
          description: Urgency level of the response
          example: "URGENT"

    ErrorResponse:
      type: object
      properties:
        error:
          type: string
          description: Error message
          example: "Authentication failed"
        code:
          type: string
          description: Error code
          example: "AUTH_001"
        details:
          type: string
          description: Additional error details
          example: "Invalid JWT token"

    ConversationHistory:
      type: object
      properties:
        userId:
          type: string
          example: "user_001"
        conversations:
          type: array
          items:
            $ref: '#/components/schemas/Conversation'

    Conversation:
      type: object
      properties:
        sessionId:
          type: string
          example: "session_abc123"
        startTime:
          type: string
          format: date-time
          example: "2024-01-15T10:00:00Z"
        endTime:
          type: string
          format: date-time
          example: "2024-01-15T10:30:00Z"
        messages:
          type: array
          items:
            $ref: '#/components/schemas/Message'

    Message:
      type: object
      properties:
        id:
          type: string
          example: "msg_001"
        timestamp:
          type: string
          format: date-time
          example: "2024-01-15T10:05:00Z"
        type:
          type: string
          enum: [USER, BOT]
          example: "USER"
        content:
          type: string
          example: "Tôi bị đau ngực"

  responses:
    UnauthorizedError:
      description: Authentication failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error: "Invalid authentication token"
            code: "AUTH_001"
            details: "Token expired"

    ValidationError:
      description: Invalid request parameters
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error: "Validation failed"
            code: "VAL_001"
            details: "Message field is required"

    ServerError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error: "Internal server error"
            code: "SRV_001"
            details: "Database connection failed"

security:
  - BearerAuth: []

paths:
  /api/chat:
    post:
      summary: Send message to chatbot
      description: Process user message and return AI-generated response with healthcare context
      tags:
        - Chat
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChatMessage'
            examples:
              BasicMessage:
                value:
                  message: "Tôi bị đau ngực"
                  userId: "user_001"
                  sessionId: "session_abc123"
                  language: "vi"
              EmergencyMessage:
                value:
                  message: "Tôi đau ngực dữ dội và khó thở"
                  userId: "user_002"
                  language: "vi"
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatResponse'
              examples:
                NormalResponse:
                  value:
                    response: "Đau ngực có thể là dấu hiệu của nhiều vấn đề. Bạn nên mô tả thêm về triệu chứng."
                    sessionId: "session_abc123"
                    timestamp: "2024-01-15T10:30:00Z"
                    urgencyLevel: "NORMAL"
                UrgentResponse:
                  value:
                    response: "Triệu chứng của bạn nghe có vẻ nghiêm trọng. Tôi đã thông báo cho bác sĩ trực. Vui lòng gọi 115 ngay lập tức."
                    sessionId: "session_def456"
                    timestamp: "2024-01-15T10:35:00Z"
                    urgencyLevel: "URGENT"
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '500':
          $ref: '#/components/responses/ServerError'

  /api/history/{userId}:
    get:
      summary: Get conversation history
      description: Retrieve complete conversation history for a specific user
      tags:
        - History
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
          description: User identifier
          example: "user_001"
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            default: 10
          description: Number of conversations to return
        - name: offset
          in: query
          required: false
          schema:
            type: integer
            default: 0
          description: Pagination offset
      responses:
        '200':
          description: Conversation history retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ConversationHistory'
              example:
                userId: "user_001"
                conversations:
                  - sessionId: "session_abc123"
                    startTime: "2024-01-15T10:00:00Z"
                    endTime: "2024-01-15T10:30:00Z"
                    messages:
                      - id: "msg_001"
                        timestamp: "2024-01-15T10:05:00Z"
                        type: "USER"
                        content: "Tôi bị đau ngực"
                      - id: "msg_002"
                        timestamp: "2024-01-15T10:06:00Z"
                        type: "BOT"
                        content: "Đau ngực có thể là dấu hiệu của vấn đề tim mạch"
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          description: User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: "User not found"
                code: "USR_001"
                details: "User with ID user_999 does not exist"

  /api/session/{sessionId}:
    delete:
      summary: Delete session
      description: Remove a specific conversation session
      tags:
        - Session
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
          description: Session identifier to delete
          example: "session_abc123"
      responses:
        '200':
          description: Session deleted successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Session deleted successfully"
                  sessionId:
                    type: string
                    example: "session_abc123"
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          description: Session not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: "Session not found"
                code: "SES_001"
                details: "Session with ID session_xyz does not exist"

  /health:
    get:
      summary: Health check
      description: Check service health status
      tags:
        - Monitoring
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "OK"
                  timestamp:
                    type: string
                    format: date-time
                    example: "2024-01-15T10:00:00Z"
                  version:
                    type: string
                    example: "1.0.0"
                  services:
                    type: object
                    properties:
                      database:
                        type: boolean
                        example: true
                      redis:
                        type: boolean
                        example: true
                      ollama:
                        type: boolean
                        example: true
        '503':
          description: Service unavailable
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "ERROR"
                  timestamp:
                    type: string
                    format: date-time
                    example: "2024-01-15T10:00:00Z"
                  errors:
                    type: array
                    items:
                      type: object
                      properties:
                        service:
                          type: string
                          example: "database"
                        status:
                          type: string
                          example: "DOWN"
                        message:
                          type: string
                          example: "Connection timeout"

  /api/rules:
    get:
      summary: Get active rules
      description: Retrieve currently active rule definitions
      tags:
        - Rules
      responses:
        '200':
          description: Rules retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  rules:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                          example: "rule_001"
                        condition:
                          type: string
                          example: "contains('triệu chứng đau ngực')"
                        response:
                          type: string
                          example: "Đau ngực có thể là dấu hiệu của vấn đề tim mạch"
                        active:
                          type: boolean
                          example: true
              example:
                rules:
                  - id: "rule_001"
                    condition: "contains('triệu chứng đau ngực')"
                    response: "Đau ngực có thể là dấu hiệu của vấn đề tim mạch"
                    active: true
                  - id: "rule_002"
                    condition: "contains('huyết áp') and contains('cao')"
                    response: "Huyết áp cao là yếu tố nguy cơ tim mạch"
                    active: true

  /api/rag/query:
    post:
      summary: Query RAG system
      description: Direct query to the Retrieval-Augmented Generation system
      tags:
        - RAG
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                query:
                  type: string
                  description: Search query
                  example: "triệu chứng đau tim"
                maxResults:
                  type: integer
                  default: 5
                  description: Maximum number of results to return
            example:
              query: "triệu chứng đau tim"
              maxResults: 3
      responses:
        '200':
          description: RAG query results
          content:
            application/json:
              schema:
                type: object
                properties:
                  results:
                    type: array
                    items:
                      type: object
                      properties:
                        documentId:
                          type: string
                          example: "doc_001"
                        title:
                          type: string
                          example: "Hướng dẫn chẩn đoán đau tim"
                        content:
                          type: string
                          example: "Đau tim thường biểu hiện bằng cơn đau ngực..."
                        similarity:
                          type: number
                          format: float
                          example: 0.87
                        source:
                          type: string
                          example: "Tài liệu y tế quốc gia"
              example:
                results:
                  - documentId: "doc_001"
                    title: "Hướng dẫn chẩn đoán đau tim"
                    content: "Đau tim thường biểu hiện bằng cơn đau ngực kéo dài hơn 15 phút..."
                    similarity: 0.87
                    source: "Tài liệu y tế quốc gia"
```

## 🚀 API Usage Examples

### Example 1: Send Chat Message
```bash
curl -X POST "http://localhost:3001/api/chat" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tôi bị đau ngực và chóng mặt",
    "userId": "user_001",
    "language": "vi"
  }'
```

### Example 2: Get Conversation History
```bash
curl -X GET "http://localhost:3001/api/history/user_001?limit=5&offset=0" \
  -H "Authorization: Bearer your_jwt_token"
```

### Example 3: Health Check
```bash
curl -X GET "http://localhost:3001/health"
```

## 📋 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| AUTH_001 | Invalid authentication token | 401 |
| AUTH_002 | Token expired | 401 |
| VAL_001 | Validation failed | 400 |
| USR_001 | User not found | 404 |
| SES_001 | Session not found | 404 |
| SRV_001 | Internal server error | 500 |
| DB_001 | Database connection error | 500 |
| AI_001 | AI service unavailable | 503 |

## 🔄 Rate Limiting

API endpoints are rate limited to prevent abuse:

- `POST /api/chat`: 60 requests per minute per user
- `GET /api/history/{userId}`: 30 requests per minute per user
- Other endpoints: 120 requests per minute per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

## 📊 Monitoring Endpoints

- `GET /health`: Service health status
- `GET /metrics`: Prometheus metrics (if enabled)
- `GET /debug/pprof`: Go profiling endpoints (if applicable)

## 🔧 Integration Guidelines

### Frontend Integration
```javascript
// Example frontend integration
class ChatbotClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async sendMessage(message, userId, sessionId = null) {
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, userId, sessionId })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
}
```

### Backend Integration
```python
# Python integration example
import requests

class ChatbotService:
    def __init__(self, base_url, api_token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }
    
    def send_message(self, message, user_id, session_id=None):
        payload = {
            'message': message,
            'userId': user_id,
            'sessionId': session_id
        }
        
        response = requests.post(
            f'{self.base_url}/api/chat',
            json=payload,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
```

## 📝 Versioning

API versioning is managed through the URL path:
- Current version: `v1` (default)
- Version specification: `/api/v1/chat`

Backward compatibility is maintained for at least 6 months after new version release.

## 🛡️ Security Considerations

- Always use HTTPS in production
- Validate and sanitize all input data
- Implement proper CORS policies
- Regularly rotate JWT secrets
- Monitor for unusual API usage patterns

## 📞 Support

For API-related issues and support:
- Email: api-support@healthcare.com
- Documentation: https://docs.healthcare.com/chatbot-api
- Issue tracker: GitHub Issues

---
*Last updated: January 2024*
*API Version: 1.0.0*