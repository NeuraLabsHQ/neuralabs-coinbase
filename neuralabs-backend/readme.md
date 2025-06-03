# NeuraLabs Backend

## Development Setup

1. Configure the database in `config.yaml`
2. Install dependencies:
```bash
pip install -r requirements.txt
```
3. Run in development mode:
```bash
python run.py
```

## Production Deployment

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose-deployment.yaml up -d

# Or build individual service
docker build -t neuralabs-backend .
docker run -p 8000:8000 neuralabs-backend
```

### Using Gunicorn (Production Server)
```bash
# Install dependencies including gunicorn
pip install -r requirements.txt

# Run with gunicorn (production)
gunicorn --bind 0.0.0.0:8000 --workers 4 --worker-class uvicorn.workers.UvicornWorker app:app

# Run with gunicorn and custom config
gunicorn --config gunicorn.conf.py app:app
```

## Configuration Files

- `config.yaml` - Development configuration
- `config_deployment.yaml` - Production configuration (copied as config.yaml in Docker)

## Environment

- **Development**: Uses uvicorn with hot reload
- **Production**: Uses gunicorn with multiple workers for better performance

