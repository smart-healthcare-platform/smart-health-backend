"""
Model loading and prediction module for the Prediction Service.
Handles loading the Keras/TensorFlow model and making predictions.
"""

import os
import logging
from typing import List, Optional
from prediction_service.config import Settings

# Initialize settings and logger
settings = Settings()
logger = logging.getLogger(__name__)

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
# Try to import TensorFlow dependencies
try:
    import numpy as np
    import tensorflow as tf
    from tensorflow import keras
    # Try to import joblib for loading scaler
    try:
        import joblib
        SCIKIT_LEARN_AVAILABLE = True
    except ImportError:
        logger.warning("scikit-learn not available. Feature scaling will be disabled.")
        SCIKIT_LEARN_AVAILABLE = False
        joblib = None
    TENSORFLOW_AVAILABLE = True
except ImportError:
    logger.warning("TensorFlow not available. Model loading will be disabled.")
    TENSORFLOW_AVAILABLE = False
    keras = None
    np = None
    SCIKIT_LEARN_AVAILABLE = False
    joblib = None

class ModelLoader:
    """
    Class for loading and using the Keras/TensorFlow model.
    Implements singleton pattern to load model only once.
    """
    
    _instance: Optional['ModelLoader'] = None
    _model: Optional['keras.Model'] = None
    _scaler = None
    _scaling_cols_indices = [0, 3, 4, 7, 9]  # Indices of columns to scale: age, trestbps, chol, thalach, oldpeak
    
    def __new__(cls) -> 'ModelLoader':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def load_scaler(self) -> None:
        """
        Load the StandardScaler from file.
        """
        if not SCIKIT_LEARN_AVAILABLE:
            logger.warning("scikit-learn not available. Skipping scaler loading.")
            return
            
        scaler_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "standard_scaler.pkl")
        if os.path.exists(scaler_path):
            try:
                self._scaler = joblib.load(scaler_path)
                logger.info("StandardScaler loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load scaler: {str(e)}")
        else:
            logger.warning(f"Scaler file not found at {scaler_path}. Using default preprocessing.")
    
    def load_model(self) -> None:
        """
        Load the Keras/TensorFlow model from the specified path.
        Raises FileNotFoundError if model file doesn't exist.
        """
        if not TENSORFLOW_AVAILABLE:
            logger.warning("TensorFlow not available. Skipping model loading.")
            return
            
        if self._model is not None:
            return  # Model already loaded
            
        # Load scaler first
        self.load_scaler()
            
        model_path = settings.MODEL_PATH
        
        if not os.path.exists(model_path):
            logger.error(f"Model file not found at {model_path}")
            raise FileNotFoundError(f"Model file not found at {model_path}")
            
        try:
            logger.info(f"Loading model from {model_path}")
            self._model = keras.models.load_model(model_path)
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise
    
    def _preprocess_input(self, input_array: np.ndarray) -> np.ndarray:
        """
        Preprocess input data by scaling selected features.
        
        Args:
            input_array: Input array of shape (1, 13) or (13,)
            
        Returns:
            Preprocessed array with scaled features
        """
        # Ensure input is 2D
        if len(input_array.shape) == 1:
            input_array = input_array.reshape(1, -1)
        
        # If scaler is available, use it
        if self._scaler is not None:
            # Scale only the specified columns
            input_array_scaled = input_array.copy()
            input_array_scaled[:, self._scaling_cols_indices] = self._scaler.transform(
                input_array[:, self._scaling_cols_indices]
            )
            return input_array_scaled
        else:
            # Manual scaling based on parameters from the notebook training
            # These values should be computed from the training data
            # Mean values for scaling columns: age, trestbps, chol, thalach, oldpeak
            scaling_means = np.array([54.434146, 131.611707, 246.0, 149.114146, 1.071512])
            # Std values for scaling columns: age, trestbps, chol, thalach, oldpeak
            scaling_stds = np.array([9.072290, 17.516718, 51.59251, 23.005724, 1.175053])
            
            # Apply standard scaling: (x - mean) / std
            input_array_scaled = input_array.copy()
            input_array_scaled[:, self._scaling_cols_indices] = (
                input_array[:, self._scaling_cols_indices] - scaling_means
            ) / scaling_stds
            
            return input_array_scaled
    
    def predict(self, input_data: List[float]) -> List[float]:
        """
        Make a prediction using the loaded model.
        
        Args:
            input_data: List of input features for prediction (13 features)
            
        Returns:
            List of prediction results
            
        Raises:
            RuntimeError: If model is not loaded or TensorFlow is not available
            ValueError: If input data is invalid
        """
        if not TENSORFLOW_AVAILABLE:
            logger.error("TensorFlow not available for prediction")
            raise RuntimeError("TensorFlow not available for prediction")
            
        if self._model is None:
            logger.error("Model not loaded")
            raise RuntimeError("Model not loaded. Call load_model() first.")
            
        try:
            # Validate input length
            if len(input_data) != 13:
                raise ValueError(f"Expected 13 input features, got {len(input_data)}")
            
            # Convert input to numpy array
            input_array = np.array(input_data, dtype=np.float32)
            
            # Preprocess input (scaling)
            input_array = self._preprocess_input(input_array)
            
            # Make prediction
            prediction = self._model.predict(input_array)
            
            # Convert to list for JSON serialization and ensure float type
            # Model may return numpy arrays with different structures
            prediction_list = prediction.tolist()
            
            # Flatten the list in case it's nested (e.g., [[0.85]] -> [0.85])
            # This handles different model output shapes
            if isinstance(prediction_list, list):
                # If it's a nested list, flatten it
                if len(prediction_list) > 0 and isinstance(prediction_list[0], list):
                    # Flatten nested list
                    flattened = []
                    for sublist in prediction_list:
                        if isinstance(sublist, list):
                            flattened.extend(sublist)
                        else:
                            flattened.append(sublist)
                    prediction_list = flattened
                
                # Ensure all values are Python float type for Pydantic validation
                return [float(x) for x in prediction_list]
            else:
                # For scalar values
                return [float(prediction_list)]
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            raise ValueError(f"Prediction failed: {str(e)}")
    
    @property
    def model(self) -> Optional['keras.Model']:
        """Get the loaded model."""
        return self._model