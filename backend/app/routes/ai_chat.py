"""
AI Chat Routes - Powered by Google Gemini
Explains infrastructure damage analysis results to users
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

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


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
    Uses Google Gemini API for intelligent responses.
    """
    if not GEMINI_API_KEY:
        # Return a helpful fallback if no API key is configured
        return ChatResponse(
            reply=generate_fallback_response(request.message, request.analysis_context),
            success=True
        )
    
    try:
        system_prompt = build_system_prompt(request.analysis_context)
        
        # Build conversation history for Gemini
        contents = []
        
        # Add conversation history
        for msg in (request.conversation_history or []):
            contents.append({
                "role": "user" if msg.role == "user" else "model",
                "parts": [{"text": msg.content}]
            })
        
        # Add the current message
        contents.append({
            "role": "user",
            "parts": [{"text": request.message}]
        })
        
        payload = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1024,
                "topP": 0.95
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
            ]
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                return ChatResponse(
                    reply=generate_fallback_response(request.message, request.analysis_context),
                    success=True
                )
            
            data = response.json()
            
            # Extract the text response
            reply_text = ""
            if "candidates" in data and len(data["candidates"]) > 0:
                candidate = data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    reply_text = candidate["content"]["parts"][0].get("text", "")
            
            if not reply_text:
                reply_text = generate_fallback_response(request.message, request.analysis_context)
            
            return ChatResponse(reply=reply_text, success=True)
    
    except httpx.TimeoutException:
        logger.error("Gemini API timeout")
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
