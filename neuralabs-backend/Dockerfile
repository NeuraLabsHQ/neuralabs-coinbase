FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt


# Temporary fix for missing dependencies
RUN pip install x402==0.1.2
RUN pip install cdp-sdk

# Copy application code
COPY . .

# Copy deployment config as config.yaml
COPY config_deployment.yaml config.yaml

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8000

# No CMD - will be defined in docker-compose