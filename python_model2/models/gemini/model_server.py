"""
MarketMind Model Server with Gemini
Optimized for batch processing with error handling and fallback
"""

import os
import json
import logging
import torch
from flask import Flask, request, jsonify
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

# Configuration
CONFIG = {
    "model_name": "gemini-2.5-pro",
    "max_agents_per_request": 100,  # Maximum agents per batch
    "timeout_seconds": 120,  # Request timeout in seconds
    "max_retries": 2,  # Number of retries for failed predictions
    "device": "cuda" if torch.cuda.is_available() else "cpu",
    "host": "0.0.0.0",  # Listen on all interfaces
    "port": 5000,  # Default port
}

@app.route('/predict', methods=['POST'])
def predict():
    """
    Handle prediction requests with batching and error handling
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

        # Process all agents in a single batch (Gemini handles batching internally)
        logger.info(f"Processing {len(agent_profiles)} agents in a single batch")

        try:
            # Make prediction using Gemini
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
        "device": CONFIG["device"],
        "batch_size": CONFIG["max_agents_per_request"]
    }
    return jsonify(status)

def main():
    """Main function to start the server"""
    print("\n" + "="*50)
    print("Starting MarketMind Model Server with Gemini")
    print("="*50)

    print("Server is running!")
    print("Endpoints:")
    print("  - POST /predict - Make predictions")
    print("  - GET  /health  - Health check")

    print(f"\nLocal URL: http://{CONFIG['host']}:{CONFIG['port']}")
    print("Update your backend .env with:")
    print(f"PYTHON_URL=http://localhost:{CONFIG['port']}")

    print("\nPress Ctrl+C to stop\n")

    # Run Flask app
    app.run(host=CONFIG['host'], port=CONFIG['port'], threaded=True)

if __name__ == "__main__":
    main()
