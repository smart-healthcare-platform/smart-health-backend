"""
Pydantic models for request/response validation in the Prediction Service.
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class PredictionRequest(BaseModel):
    """
    Request model for making predictions.
    """
    input_data: List[float]
    # Add other fields as needed for your specific use case
    # For example:
    # patient_id: Optional[str] = None
    # timestamp: Optional[str] = None


class PredictionResponse(BaseModel):
    """
    Response model for prediction results.
    """
    prediction: List[float]
    # Add other fields as needed for your specific use case
    # For example:
    # confidence: Optional[float] = None
    # model_version: Optional[str] = None


class HealthResponse(BaseModel):
    """
    Response model for health check endpoint.
    """
    status: str
    service: str


class RootResponse(BaseModel):
    """
    Response model for root endpoint.
    """
    message: str
    service: str
    version: str


class PredictionLog(BaseModel):
    """
    Model for prediction log entries stored in MongoDB.
    """
    features: Dict[str, Any]
    result: float
    model_version: str
    created_at: datetime