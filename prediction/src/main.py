"""
Main application file for the Prediction Service.
This module initializes the FastAPI application and sets up the core configuration.
"""

import os
from fastapi import FastAPI
from dotenv import load_dotenv

from prediction_service.config import Settings
from prediction_service.routes import router as prediction_router
from prediction_service.database import close_mongo_connection

# Load environment variables
load_dotenv()

# Initialize settings
settings = Settings()

# Initialize FastAPI app
app = FastAPI(
    title="Prediction Service",
    description="A microservice for making predictions using a Keras/TensorFlow model",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Include routers
app.include_router(prediction_router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify service status."""
    return {
        "status": "healthy",
        "service": "prediction-service"
    }

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with service information."""
    return {
        "message": "Welcome to the Prediction Service",
        "service": "prediction-service",
        "version": "1.0.0"
    }

@app.on_event("shutdown")
async def shutdown_event():
    """Event handler for application shutdown."""
    close_mongo_connection()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )