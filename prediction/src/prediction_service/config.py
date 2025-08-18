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
    MODEL_PATH: str = os.getenv("MODEL_PATH", "heat_disease_prediction.h5")
    
    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    class Config:
        env_file = ".env"
        case_sensitive = False