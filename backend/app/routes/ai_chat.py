"""
AI Chat Routes - Powered by Open Router API
Explains infrastructure damage analysis results to users
Supports multiple models: GPT-4, Claude, Gemini, etc.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import logging
import json
import httpx

logger = logging.getLogger(__name__)
router = APIRouter()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
OPENROUTER_API_URL = os.getenv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1/chat/completions")


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    message: str
    analysis_context: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    success: bool


def build_system_prompt(analysis_context: Optional[Dict[str, Any]] = None) -> str:
    """Build a system prompt with analysis context if available."""
    base_prompt = """You are RoadGuard AI Assistant, an expert infrastructure damage analysis assistant built into the RoadGuard Command Center platform. 

Your role is to:
1. Explain infrastructure damage analysis results in clear, actionable language
2. Describe what detected damage types mean (potholes, cracks, structural damage, etc.)
3. Explain severity levels (minor, moderate, severe) and their implications
4. Recommend repair priorities and urgency
5. Help users understand cost estimations and why they matter
6. Provide guidance on traffic and road safety implications
7. Answer questions about the road monitoring system

You are professional yet approachable. Use technical terms but always explain them. 
Format your responses with clear structure when appropriate.
Keep responses concise but comprehensive (2-4 paragraphs max unless more is needed).
"""
    
    if analysis_context:
        context_str = json.dumps(analysis_context, indent=2)
        base_prompt += f"""

CURRENT ANALYSIS CONTEXT (the user just completed this scan):
```json
{context_str}
```

Use this context to provide specific, accurate explanations about what was detected.
"""
    
    return base_prompt


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """
    Chat with AI assistant about damage analysis results.
    Uses Open Router API for intelligent responses.
    Supports multiple AI models via Open Router.
    """
    if not OPENROUTER_API_KEY:
        # Return a helpful fallback if no API key is configured
        return ChatResponse(
            reply=generate_fallback_response(request.message, request.analysis_context),
            success=True
        )
    
    try:
        system_prompt = build_system_prompt(request.analysis_context)
        
        # Build conversation history for OpenRouter (OpenAI format)
        messages = []
        
        # Add system prompt
        messages.append({
            "role": "system",
            "content": system_prompt
        })
        
        # Add conversation history
        for msg in (request.conversation_history or []):
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add the current message
        messages.append({
            "role": "user",
            "content": request.message
        })
        
        # Prepare OpenRouter API request payload
        payload = {
            "model": OPENROUTER_MODEL,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1024,
            "top_p": 0.95
        }
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "RoadGuard Infrastructure Damage Detection",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json=payload,
                headers=headers
            )
            
            if response.status_code != 200:
                logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
                return ChatResponse(
                    reply=generate_fallback_response(request.message, request.analysis_context),
                    success=True
                )
            
            data = response.json()
            
            # Extract the text response from OpenAI-format response
            reply_text = ""
            if "choices" in data and len(data["choices"]) > 0:
                choice = data["choices"][0]
                if "message" in choice and "content" in choice["message"]:
                    reply_text = choice["message"]["content"]
            
            if not reply_text:
                reply_text = generate_fallback_response(request.message, request.analysis_context)
            
            return ChatResponse(reply=reply_text, success=True)
    
    except httpx.TimeoutException:
        logger.error("OpenRouter API timeout")
        return ChatResponse(
            reply=generate_fallback_response(request.message, request.analysis_context),
            success=True
        )
    except Exception as e:
        logger.error(f"Error in AI chat: {str(e)}")
        return ChatResponse(
            reply=generate_fallback_response(request.message, request.analysis_context),
            success=True
        )


def generate_fallback_response(message: str, context: Optional[Dict[str, Any]] = None) -> str:
    """Generate a rule-based fallback response when AI API is unavailable."""
    message_lower = message.lower()
    
    if context and context.get("detections"):
        detections = context["detections"]
        total = len(detections)
        
        if any(word in message_lower for word in ["explain", "what", "mean", "tell me"]):
            severe_count = sum(1 for d in detections if d.get("severity") == "severe")
            moderate_count = sum(1 for d in detections if d.get("severity") == "moderate")
            types = list(set(d.get("damage_type", "unknown") for d in detections))
            
            response = f"**Analysis Summary:** I detected **{total} damage area(s)** in this scan.\n\n"
            
            if severe_count > 0:
                response += f"🔴 **{severe_count} severe** damage zone(s) require immediate repair to prevent further structural deterioration and safety hazards.\n\n"
            if moderate_count > 0:
                response += f"🟡 **{moderate_count} moderate** damage area(s) should be scheduled for repair within 2–4 weeks.\n\n"
            
            if types:
                response += f"**Detected types:** {', '.join(t.replace('_', ' ').title() for t in types)}.\n\n"
                response += "Each damage type requires different repair techniques and materials, which is reflected in the cost breakdown shown above."
            
            return response
        
        if any(word in message_lower for word in ["cost", "price", "repair", "expensive"]):
            total_cost = context.get("summary", {}).get("total_estimated_cost", 0)
            return (
                f"**Cost Breakdown:** The total estimated repair cost is **₹{total_cost:,.0f}**.\n\n"
                "This includes:\n"
                "• **Materials (45%)**: Asphalt, concrete, aggregate, and bonding agents\n"
                "• **Labor (40%)**: Skilled workers, equipment operators, and traffic management\n"
                "• **GST (15%)**: Government tax applicable on repair contracts\n\n"
                "Costs vary by damage severity — severe damage costs significantly more due to deep excavation and structural reinforcement requirements."
            )
    
    if any(word in message_lower for word in ["pothole", "crack", "damage"]):
        return (
            "**Infrastructure Damage Types:**\n\n"
            "• **Potholes**: Bowl-shaped holes from water infiltration and traffic load. Require cold-mix or hot-mix asphalt patching.\n"
            "• **Cracks**: Linear fractures from thermal stress or structural failure. Treated with crack sealant or overlay.\n"
            "• **Surface Wear**: Gradual erosion of the top layer. Addressed with microsurfacing or resurfacing.\n\n"
            "Upload an image or run a detection to get specific analysis for your road section."
        )
    
    return (
        "Hello! I'm **RoadGuard AI Assistant**. I can help you:\n\n"
        "• 📊 **Explain analysis results** — after running a detection, ask me what the findings mean\n"
        "• 💰 **Understand costs** — I can break down repair cost estimates\n"
        "• 🚦 **Assess urgency** — I'll tell you which repairs need immediate attention\n"
        "• 🛣️ **Damage types** — ask about potholes, cracks, structural issues\n\n"
        "Run an AI detection first, then ask me to explain the results!"
    )
