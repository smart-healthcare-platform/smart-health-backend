"""
Configuration module for the Prediction Service.
Handles environment variables and service settings.
"""

import os
from pydantic import BaseSettings


class Settings(BaseSettings):
    """
    Settings class for the Prediction Service.
    Loads configuration from environment variables.
    """
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Model settings
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./models/heat_disease_prediction.h5")
    
    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # MongoDB settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "prediction_service")
    MONGODB_COLLECTION: str = os.getenv("MONGODB_COLLECTION", "prediction_logs")
    
    class Config:
        env_file = ".env"
        case_sensitive = False