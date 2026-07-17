import logging
import os
from typing import Any, Dict, List, Optional, Tuple

import constants
import google.generativeai as genai
from ai import client
from ai.tools import (
    find_nearest_gate,
    get_accessibility_route,
    get_crowd_density,
    get_transport_options,
)
from google.generativeai.types import content_types

logger = logging.getLogger(__name__)

# Cache for the system prompt
_SYSTEM_PROMPT: Optional[str] = None


def get_system_prompt() -> str:
    """
    Loads the system prompt from system_prompt.md or returns a default if it doesn't exist.

    Returns:
        str: The content of the system prompt.
    """
    global _SYSTEM_PROMPT
    if _SYSTEM_PROMPT is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(current_dir, "system_prompt.md")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                _SYSTEM_PROMPT = f.read()
        else:
            _SYSTEM_PROMPT = "You are the FIFA World Cup 2026 Smart Stadium Concierge."
    return _SYSTEM_PROMPT


def get_offline_fallback(
    message: str, language: str, zone: str, wheelchair: bool
) -> Dict[str, Any]:
    """
    Generates a deterministic response when Gemini is not configured or fails.

    Args:
        message (str): The user's query message.
        language (str): Preferred language.
        zone (str): The user's stadium zone.
        wheelchair (bool): Accessibility needs flag.

    Returns:
        Dict[str, Any]: Dict containing the reply string and structuredData if relevant.
    """
    clean_msg = message.lower()

    # Offline fallbacks matching core queries
    if any(k in clean_msg for k in ("gate", "entrance", "puerta", "porte", "بوابة")):
        if wheelchair:
            reply = (
                f"Offline Mode: Based on accessibility needs in {zone.upper()}, "
                "please proceed to Gate A1. It has ramp and flat pathway access. "
                "Queue times are currently Low."
            )
            structured = {
                "type": "gate_recommendation",
                "data": {
                    "gateName": "Gate A1",
                    "distance": "75m",
                    "queueStatus": "Low",
                    "accessible": True,
                },
            }
        else:
            reply = (
                f"Offline Mode: The closest gate to your location in {zone.upper()} is Gate B3. "
                "Note: queue wait times are Medium (approx 10 mins)."
            )
            structured = {
                "type": "gate_recommendation",
                "data": {
                    "gateName": "Gate B3",
                    "distance": "130m",
                    "queueStatus": "Medium",
                    "accessible": False,
                },
            }
    elif any(
        k in clean_msg
        for k in ("transport", "bus", "train", "metro", "shuttle", "قطار", "حافلة")
    ):
        reply = (
            f"Offline Mode: Available transit lines from {zone.upper()} include Metro Line 1 (Stadium South) "
            "and Express Shuttle 501. ADA shuttle services are available on demand."
        )
        structured = {
            "type": "transport_options",
            "data": {
                "options": [
                    {
                        "mode": "train",
                        "line": "Metro Line 1 (Stadium South)",
                        "eta": "3 mins",
                    },
                    {"mode": "bus", "line": "Express Shuttle 501", "eta": "7 mins"},
                ]
            },
        }
    elif any(k in clean_msg for k in ("crowd", "density", "busy", "people", "زدحام")):
        is_busy = zone in ("zone_b", "zone_c")
        reply = (
            f"Offline Mode: Crowd density in {zone.upper()} is estimated at "
            f"{'85% (Busy)' if is_busy else '40% (Normal)'}."
        )
        structured = {
            "type": "crowd_density",
            "data": {
                "zone": zone.upper(),
                "density": "85%" if is_busy else "40%",
                "status": "Busy" if is_busy else "Normal",
            },
        }
    else:
        # Default welcome/fallback message based on language
        if language == "es":
            reply = "Offline Mode: Hola. Soy el Asistente del Estadio. No puedo conectarme a los datos en vivo en este momento, pero puedo informarle sobre rutas accesibles, transporte local y puertas generales."
        elif language == "fr":
            reply = "Offline Mode: Bonjour. Je suis le concierge du stade. Je ne peux pas me connecter aux données en direct pour le moment, mais je peux vous guider sur les navettes et les entrées."
        elif language == "ar":
            reply = "Offline Mode: مرحباً. أنا مساعد الملعب الذكي. لا يمكنني الاتصال بالبيانات المباشرة حالياً، ولكن يمكنني مساعدتك بالمعلومات العامة للبوابات والنقل."
        else:
            reply = "Offline Mode: Hello. I am the Stadium Concierge. I am currently unable to fetch live cloud data, but I can help you with general gates, transportation routes, and accessibility info."
        structured = None

    return {"reply": reply, "structuredData": structured}


def build_history_payload(history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Builds the Gemini chat history payload, capping at the last 6 turns to keep context small.

    Args:
        history (List[Dict[str, Any]]): The raw list of past message objects.

    Returns:
        List[Dict[str, Any]]: The formatted history payload for the Gemini API.
    """
    history_parts = []
    for turn in history[-6:]:
        role = "user" if turn["sender"] == "user" else "model"
        history_parts.append({"role": role, "parts": [turn["text"]]})
    return history_parts


def handle_tool_calls(
    chat: genai.ChatSession, response: Any, default_zone: str, wheelchair_flag: bool
) -> Tuple[Any, Optional[Dict[str, Any]]]:
    """
    Recursively executes tool calls initiated by the Gemini model and feeds the results back.

    Args:
        chat (genai.ChatSession): The active chat session.
        response (Any): The initial generative response.
        default_zone (str): The default zone ID to fallback on.
        wheelchair_flag (bool): Default accessibility option.

    Returns:
        Tuple[Any, Optional[Dict[str, Any]]]: (final response after resolving tool calls, resolved structured data card or None)
    """
    structured_data = None

    if response.function_calls:
        for call in response.function_calls:
            name = call.name
            args = call.args

            result = None
            if name == "find_nearest_gate":
                acc_arg = bool(args.get("accessible", wheelchair_flag))
                result = find_nearest_gate(
                    zone=args.get("zone", default_zone), accessible=acc_arg
                )
                structured_data = {"type": "gate_recommendation", "data": result}
            elif name == "get_transport_options":
                result = get_transport_options(zone=args.get("zone", default_zone))
                structured_data = {"type": "transport_options", "data": result}
            elif name == "get_crowd_density":
                result = get_crowd_density(zone=args.get("zone", default_zone))
                structured_data = {"type": "crowd_density", "data": result}
            elif name == "get_accessibility_route":
                result = get_accessibility_route(
                    from_zone=args.get("from_zone", default_zone),
                    to_gate=args.get("to_gate", ""),
                )

            if result:
                response = chat.send_message(
                    content_types.to_content(
                        {
                            "role": "function",
                            "parts": [
                                {
                                    "function_response": {
                                        "name": name,
                                        "response": result,
                                    }
                                }
                            ],
                        }
                    )
                )
    return response, structured_data


def orchestrate_chat(
    message: str,
    language: str,
    session_id: str,
    zone: str,
    accessibility_needs: Dict[str, bool],
    history: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Orchestrates the GenAI conversation loop using Gemini.
    Injects context, calls tools if appropriate, and returns safe replies.

    Args:
        message (str): The user message.
        language (str): User's language preference.
        session_id (str): Unique identifier for the user session.
        zone (str): The user's current zone.
        accessibility_needs (Dict[str, bool]): Accessibility options.
        history (List[Dict[str, Any]]): Prior message history.

    Returns:
        Dict[str, Any]: The concierge's reply and any structured card data.
    """
    wheelchair = accessibility_needs.get("wheelchair", False)
    visual = accessibility_needs.get("visual", False)

    # 1. Fallback if API key is missing
    if not client.is_configured():
        return get_offline_fallback(message, language, zone, wheelchair)

    try:
        # Load system instructions
        system_instruction = get_system_prompt()

        # Configure model with tools
        tools_list = [
            find_nearest_gate,
            get_transport_options,
            get_crowd_density,
            get_accessibility_route,
        ]

        model = genai.GenerativeModel(
            model_name=constants.GEMINI_MODEL_NAME,
            system_instruction=system_instruction,
            tools=tools_list,
        )

        # 2. Build history payload and cap at last 6 turns to keep context small
        history_parts = build_history_payload(history)

        # Start chat session
        chat = model.start_chat(history=history_parts)

        # 3. Add current turn context as a prefix to the user message
        context_header = (
            f"[User Context - Zone: {zone}, Preferred Language: {language}, "
            f"Wheelchair Accessibility Required: {wheelchair}, "
            f"Visual Assistance Required: {visual}]\n"
            f"User Prompt: "
        )

        response = chat.send_message(context_header + message)

        # 4. Handle tool calls recursively
        response, structured_data = handle_tool_calls(chat, response, zone, wheelchair)

        return {"reply": response.text, "structuredData": structured_data}

    except Exception as e:
        logger.exception("Gemini API Exception: %s", e)
        # Gracefully degrade to offline fallback on any exception
        return get_offline_fallback(message, language, zone, wheelchair)
