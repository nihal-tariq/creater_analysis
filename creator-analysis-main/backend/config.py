import os
import logging
from dotenv import load_dotenv


load_dotenv()

def setup_logging():
    logging.basicConfig(level=logging.INFO)
    return logging.getLogger("creator_analytics")

logger = setup_logging()
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")