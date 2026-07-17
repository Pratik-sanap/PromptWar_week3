import os

import constants
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Initialize API client if key is present
if API_KEY:
    genai.configure(api_key=API_KEY)


def is_configured() -> bool:
    """
    Returns True if the Gemini API key is configured, False otherwise.

    Returns:
        bool: True if configuration is successful, False otherwise.
    """
    return bool(API_KEY)


def get_model(model_name: str = constants.GEMINI_MODEL_NAME) -> genai.GenerativeModel:
    """
    Returns an initialized GenerativeModel instance.

    Args:
        model_name (str): The name of the Gemini model to instantiate.

    Returns:
        genai.GenerativeModel: The initialized GenerativeModel.
    """
    if not is_configured():
        raise ValueError("Gemini API key is not configured.")
    return genai.GenerativeModel(model_name)
