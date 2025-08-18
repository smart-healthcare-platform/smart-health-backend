"""
API routes for the Prediction Service.
Defines all the endpoints for making predictions and health checks.
"""

import logging
from fastapi import APIRouter, HTTPException, status
from typing import List

from prediction_service.schemas import (
    PredictionRequest,
    PredictionResponse,
    HealthResponse,
    RootResponse
)
from prediction_service.model import ModelLoader, TENSORFLOW_AVAILABLE

# Initialize router and logger
router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize model loader
model_loader = ModelLoader()

@router.on_event("startup")
async def startup_event():
    """
    Event handler for application startup.
    Loads the model when the application starts.
    """
    try:
        model_loader.load_model()
        logger.info("Model loaded successfully on startup")
    except FileNotFoundError as e:
        logger.error(f"Model file not found: {str(e)}")
        # Depending on your requirements, you might want to exit here
        # or continue running but return errors for prediction requests
    except Exception as e:
        logger.error(f"Failed to load model on startup: {str(e)}")
        # Handle appropriately based on your requirements

@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    tags=["Prediction"],
    summary="Make a prediction",
    description="Make a prediction using the loaded Keras/TensorFlow model"
)
async def make_prediction(request: PredictionRequest):
    """
    Endpoint to make predictions using the loaded model.
    
    Args:
        request: PredictionRequest with input data
        
    Returns:
        PredictionResponse with prediction results
        
    Raises:
        HTTPException: If prediction fails or model is not loaded
    """
    # Check if TensorFlow is available
    if not TENSORFLOW_AVAILABLE:
        logger.error("TensorFlow not available for prediction")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TensorFlow not available for prediction"
        )
    
    try:
        logger.info(f"Making prediction with input data of length {len(request.input_data)}")
        prediction = model_loader.predict(request.input_data)
        logger.info("Prediction completed successfully")
        
        return PredictionResponse(prediction=prediction)
        
    except RuntimeError as e:
        logger.error(f"Model not loaded: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded"
        )
    except ValueError as e:
        logger.error(f"Invalid input data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input data: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed"
        )

@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["Health"],
    summary="Health check",
    description="Check if the service is running and model is loaded"
)
async def health_check():
    """
    Health check endpoint to verify service and model status.
    
    Returns:
        HealthResponse with service status
    """
    model_status = "loaded" if model_loader.model is not None else "not loaded"
    tensorflow_status = "available" if TENSORFLOW_AVAILABLE else "not available"
    logger.info(f"Health check - Service status: healthy, Model status: {model_status}, TensorFlow: {tensorflow_status}")
    
    return HealthResponse(
        status="healthy",
        service="prediction-service"
    )

@router.get(
    "/",
    response_model=RootResponse,
    status_code=status.HTTP_200_OK,
    tags=["Root"],
    summary="Root endpoint",
    description="Welcome message and service information"
)
async def root():
    """
    Root endpoint with service information.
    
    Returns:
        RootResponse with service information
    """
    logger.info("Root endpoint accessed")
    
    return RootResponse(
        message="Welcome to the Prediction Service",
        service="prediction-service",
        version="1.0.0"
    )