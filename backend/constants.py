"""
Constants and configuration values for the FIFA 2026 Smart Stadium Concierge Backend.
"""

# Allowed CORS origins default
DEFAULT_CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"

# Server configuration
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 5000

# Gemini API configurations
GEMINI_MODEL_NAME = "gemini-1.5-flash"

# Valid stadium zones in the system
VALID_ZONES = {"zone_a", "zone_b", "zone_c", "zone_d", "zone_e", "zone_f"}

# Rate limiting settings for endpoint requests
RATE_LIMIT_WINDOW = 10.0  # seconds
RATE_LIMIT_MAX_REQUESTS = 5
