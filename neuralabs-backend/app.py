"""
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yaml
import os
from application.routes import router as api_router
from application.routes.chat import cors_wrapped_payment_middleware

# Load configuration
def load_config():
    config_path = os.path.join(os.path.dirname(__file__), "config.yaml")
    with open(config_path, "r") as file:
        return yaml.safe_load(file)

config = load_config()

# Create FastAPI application
app = FastAPI(
    title="Neuralabs API",
    description="API for Neuralabs Dashboard and Flow Builder",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.get("cors", {}).get("allow_origins", ["*"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        'x-payment-response',
        'X-Payment-Response',
        'X-Payment-Required',
        'X-Payment-Message',
        'X-Payment-Facilitator',
        'X-Payment-Token',
        'X-Payment-Chain',
        'X-Payment-Receiver',
        'X-Payment-Amount',
        'X-Payment-Nonce',
        'X-Payment-Signature',
        'X-Payment-Domain',
        'X-Payment-Transaction-Hash',
        'X-Payment-Transaction',
        'Content-Type'
    ]
)

# Get payment address from environment
PAYMENT_ADDRESS = os.environ.get('PAYMENT_ADDRESS', '0x7efD1aae7Ff2203eFa02D44c492f9ab95d1feD4e')
print(f"Payment address configured: {PAYMENT_ADDRESS}")

# Apply x402 payment middleware to chat initiate endpoint
# The middleware will match any path that starts with /api/chat/initiate
app.middleware("http")(
    cors_wrapped_payment_middleware(
        price="0.01",
        pay_to_address=PAYMENT_ADDRESS,
        path="/api/chat/initiate",
        network_id="base-sepolia",
        description="AI Chat Access"
    )
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify the API is running
    """