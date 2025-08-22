# Prediction Service

A microservice for making predictions using a Keras/TensorFlow model for heat disease prediction.

## Features

- FastAPI-based REST API
- TensorFlow/Keras model loading and prediction
- Health check endpoints
- Docker containerization
- Environment-based configuration
- Comprehensive logging
- Input validation with Pydantic
- Prediction logging to MongoDB

## Project Structure

```
prediction/
├── src/
│   ├── main.py              # Application entry point
│   ├── prediction_service/  # Main service package
│   │   ├── __init__.py      # Package initialization
│   │   ├── config.py        # Configuration management
│   │   ├── database.py      # MongoDB connection and operations
│   │   ├── model.py         # Model loading and prediction
│   │   ├── schemas.py       # Request/response schemas
│   │   └── routes.py        # API routes
├── requirements.txt         # Python dependencies
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── .env.example            # Environment variables example
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## Prerequisites

- Python 3.9+
- pip (Python package manager)
- Docker (optional, for containerization)
- MongoDB (for prediction logging)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd prediction
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

5. Place your model file:
   - Put your `heat_disease_prediction.h5` file in the project root directory

6. Set up MongoDB:
   - Install MongoDB locally or use a cloud service
   - Update the MongoDB connection settings in your `.env` file

## Usage

### Running Locally

```bash
python src/main.py
```

The service will be available at `http://localhost:8000`

### Running with Docker

```bash
docker-compose up --build
```

### API Endpoints

- `GET /` - Root endpoint with service information
- `GET /health` - Health check endpoint
- `POST /api/v1/predict` - Make a prediction
- `GET /docs` - Swagger UI documentation
- `GET /redoc` - ReDoc documentation

### Making Predictions

To make a prediction, send a POST request to `/api/v1/predict` with a JSON body:

```json
{
  "input_data": [52,1,0,125,212,0,1,168,0,1.0,2,2,3]
}
```

The response will be:

```json
{
  "prediction": [0.85]
}
```

## Configuration

Environment variables can be set in a `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| HOST | Server host | 0.0.0.0 |
| PORT | Server port | 8000 |
| DEBUG | Debug mode | False |
| MODEL_PATH | Path to model file | heat_disease_prediction.h5 |
| LOG_LEVEL | Logging level | INFO |
| MONGODB_URL | MongoDB connection URL | mongodb://localhost:27017 |
| MONGODB_DATABASE | MongoDB database name | prediction_service |
| MONGODB_COLLECTION | MongoDB collection name | prediction_logs |

## Development

### Running Tests

(Add test commands when tests are implemented)

### Linting

```bash
# Install development dependencies (if added to requirements)
# Run linter
```

## Deployment

### Using Docker

1. Build the image:
   ```bash
   docker build -t prediction-service .
   ```

2. Run the container:
   ```bash
   docker run -p 8000:8000 -v ./models:/app/models prediction-service
   ```

### Using Docker Compose

```bash
docker-compose up --build
```

## API Documentation

Once the service is running, you can access:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Contributing

(Add contribution guidelines)

## License

(Add license information)