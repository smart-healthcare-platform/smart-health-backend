"""
Pydantic models for request/response validation in the Prediction Service.
"""

from pydantic import BaseModel, conlist, validator
from typing import List, Optional, Dict, Any
from datetime import datetime


class PredictionRequest(BaseModel):
    """
    Request model for making predictions.
    input_data must contain exactly 13 float values corresponding to heart disease features.
    """
    input_data: conlist(float, min_items=13, max_items=13)
    # Add other fields as needed for your specific use case
    # For example:
    # patient_id: Optional[str] = None
    # timestamp: Optional[str] = None

    @validator('input_data')
    def validate_input_data(cls, v):
        """
        Validate each feature in the input_data list.
        Features order: [age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal]
        """
        if len(v) != 13:
            raise ValueError("input_data must contain exactly 13 features")

        # Define ranges for each feature
        ranges = [
            (0, 120),      # age
            (0, 1),        # sex
            (0, 3),        # cp
            (80, 200),     # trestbps
            (100, 600),    # chol
            (0, 1),        # fbs
            (0, 2),        # restecg
            (60, 220),     # thalach
            (0, 1),        # exang
            (0, 6.2),      # oldpeak
            (0, 2),        # slope
            (0, 3),        # ca
            (0, 3),        # thal
        ]

        feature_names = [
            "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
            "thalach", "exang", "oldpeak", "slope", "ca", "thal"
        ]

        for i, (value, (min_val, max_val), name) in enumerate(zip(v, ranges, feature_names)):
            if not (min_val <= value <= max_val):
                raise ValueError(f"Feature '{name}' (index {i}) must be between {min_val} and {max_val}, got {value}")

        return v


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