"""
MarketMind Model Server with Gemini Flash-Lite
Optimized for batch processing with enhanced rate limits (30 RPM, 200 requests/day)
"""

import os
import json
import logging
import torch
from flask import Flask, request, jsonify
from pyngrok import ngrok
from typing import List, Dict, Any, Optional
import time
import sys
from pathlib import Path

# Add parent directory to path to allow importing from models.gemini
sys.path.append(str(Path(__file__).parent.parent.parent))

# Import Gemini predictor
from inference import predict_consumer_behavior

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configuration for flash-lite model
CONFIG = {
    "model_name": "gemini-2.0-flash-lite",  # Updated to flash-lite for better rate limits
    "max_agents_per_request": 200,  # Increased for flash-lite capacity
    "batch_size": 25,  # Optimal batch size for 30 RPM limit
    "timeout_seconds": 300,  # API call timeout (5 minutes)
    "max_retries": 2,  # Number of retries for failed predictions
}

@app.route('/predict', methods=['POST'])
def predict():
    """
    Handle prediction requests with optimized batching for flash-lite rate limits
    """
    start_time = time.time()

    try:
        # Parse request data
        data = request.get_json()
        agent_profiles = data.get("agent_profiles", [])
        products = data.get("products", [])
        market_context = data.get("market_context", "")

        logger.info(f"Received prediction request: {len(agent_profiles)} agents, {len(products)} products")

        # Validate input
        if not agent_profiles or not products:
            return jsonify({"error": "Missing agent_profiles or products"}), 400

        # Process using batched approach optimized for flash-lite
        logger.info(f"Processing {len(agent_profiles)} agents in batches of {CONFIG['batch_size']}")

        try:
            # Make prediction using batched Gemini flash-lite
            result = predict_consumer_behavior(
                agent_profiles=agent_profiles,
                products=products,
                market_context=market_context
            )

            if result.get("error"):
                raise Exception(result["error"])

            all_decisions = result.get("decisions", [])
            logger.info(f"Successfully processed {len(all_decisions)} decisions")

        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            # Gemini already has fallback logic built-in, but we'll return error if it fails
            return jsonify({
                "error": f"Gemini prediction failed: {str(e)}",
                "fallback_used": True,
                "model_used": "error"
            }), 500

        # Prepare response
        response = {
            "decisions": all_decisions,
            "fallback_used": result.get("fallback_used", False),
            "model_used": CONFIG["model_name"],
            "batch_size": CONFIG["batch_size"],
            "processing_time": round(time.time() - start_time, 2)
        }

        logger.info(f"Prediction completed in {response['processing_time']}s. "
                   f"Decisions: {len(all_decisions)}/{len(agent_profiles)}")

        return jsonify(response)

    except Exception as e:
        logger.error(f"Request processing failed: {str(e)}")
        return jsonify({
            "error": str(e),
            "fallback_used": True,
            "model_used": "error"
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    status = {
        "status": "healthy",
        "model": CONFIG["model_name"],
        "batch_size": CONFIG["batch_size"],
        "max_agents": CONFIG["max_agents_per_request"]
    }
    return jsonify(status)

def start_ngrok():
    """Start ngrok tunnel"""
    try:
        public_url = ngrok.connect(5000)
        logger.info(f"Public URL: {public_url.public_url}")
        logger.info(f"Update your backend PYTHON_URL to: {public_url.public_url}")
        return public_url
    except Exception as e:
        logger.error(f"Failed to start ngrok: {str(e)}")
        return None

if __name__ == "__main__":
    print("\n" + "="*60)
    print("Starting MarketMind Model Server with Gemini Flash-Lite")
    print("="*60)
    print(f"Model: {CONFIG['model_name']}")
    print(f"Batch Size: {CONFIG['batch_size']} agents per batch")
    print(f"Max Agents: {CONFIG['max_agents_per_request']} per request")
    print("Rate Limits: 30 requests/minute, 200 requests/day")
    print(f"API Timeout: {CONFIG['timeout_seconds']} seconds")
    print("="*60)

    # Start ngrok tunnel
    ngrok_tunnel = start_ngrok()

    print("\nServer is running!")
    print("Endpoints:")
    print("  - POST /predict - Make predictions (batched)")
    print("  - GET  /health  - Health check")

    if ngrok_tunnel:
        print(f"\nPublic URL: {ngrok_tunnel.public_url}")
        print("Update your backend .env with:")
        print(f"PYTHON_URL={ngrok_tunnel.public_url}")

    print("\nPress Ctrl+C to stop\n")

    # Run Flask app
    app.run(host='0.0.0.0', port=5000, threaded=True)
