"""
Database module for the Prediction Service.
Handles MongoDB connection and operations.
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError
from prediction_service.config import Settings

# Initialize settings and logger
settings = Settings()
logger = logging.getLogger(__name__)

# Global MongoDB client and collection
_mongo_client: Optional[MongoClient] = None
_mongo_collection = None


def get_mongo_client() -> Optional[MongoClient]:
    """
    Get MongoDB client, initializing it if necessary.
    
    Returns:
        MongoClient: MongoDB client instance or None if connection failed
    """
    global _mongo_client
    
    if _mongo_client is not None:
        return _mongo_client
    
    try:
        _mongo_client = MongoClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000  # 5 seconds timeout
        )
        # Test the connection
        _mongo_client.admin.command('ping')
        logger.info("MongoDB connection established successfully")
        return _mongo_client
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        _mongo_client = None
        return None
    except Exception as e:
        logger.error(f"Unexpected error when connecting to MongoDB: {str(e)}")
        _mongo_client = None
        return None


def get_collection():
    """
    Get MongoDB collection for prediction logs.
    
    Returns:
        Collection: MongoDB collection or None if connection failed
    """
    global _mongo_collection
    
    if _mongo_collection is not None:
        return _mongo_collection
    
    client = get_mongo_client()
    if client is not None:
        try:
            db = client[settings.MONGODB_DATABASE]
            _mongo_collection = db[settings.MONGODB_COLLECTION]
            return _mongo_collection
        except Exception as e:
            logger.error(f"Failed to get MongoDB collection: {str(e)}")
            return None
    return None


def save_prediction_log(
    input_features: Dict[str, Any],
    prediction_result: float,
    model_version: str = "1.0.0"
) -> bool:
    """
    Save prediction log to MongoDB.
    
    Args:
        input_features: Dictionary of input features
        prediction_result: Prediction result
        model_version: Model version string
        
    Returns:
        bool: True if saved successfully, False otherwise
    """
    collection = get_collection()
    if collection is None:
        logger.warning("MongoDB collection not available, skipping log save")
        return False
    
    try:
        # Prepare log document
        log_document = {
            "features": input_features,
            "result": float(prediction_result),
            "model_version": model_version,
            "created_at": datetime.utcnow()
        }
        
        # Insert document
        result = collection.insert_one(log_document)
        logger.info(f"Prediction log saved with ID: {result.inserted_id}")
        return True
    except PyMongoError as e:
        logger.error(f"Failed to save prediction log to MongoDB: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error when saving prediction log: {str(e)}")
        return False


def close_mongo_connection():
    """
    Close MongoDB connection gracefully.
    """
    global _mongo_client
    
    if _mongo_client is not None:
        try:
            _mongo_client.close()
            logger.info("MongoDB connection closed")
        except Exception as e:
            logger.error(f"Error closing MongoDB connection: {str(e)}")
        finally:
            _mongo_client = None