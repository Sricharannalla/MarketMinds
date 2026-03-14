# MarketMind Model Server

A Flask-based server that provides Gemini AI predictions for consumer behavior simulation using clustering.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure API Key:**
   - Ensure your `GOOGLE_API_KEY` is set in the environment or hardcoded in `inference.py`
   - Current key: `YOUR_GOOGLE_API_KEY_HERE` (replace with your actual key)

3. **Start the server:**
   ```bash
   python model_server.py
   ```

## Usage

The server will start on `http://localhost:5000` and provides two endpoints:

### POST `/predict`
Make predictions for consumer behavior:
```json
{
  "agent_profiles": [...],
  "products": [...],
  "market_context": "Market change description"
}
```

### GET `/health`
Check server status and configuration.

## Configuration

- **Port**: 5000 (default)
- **Host**: 0.0.0.0 (listens on all interfaces)
- **Model**: Gemini 2.0 Flash Lite
- **Rate Limiting**: 2 seconds between requests

## Backend Integration

Update your backend `.env` file:
```
PYTHON_URL=http://localhost:5000
```

The backend will make requests to this server for AI-powered predictions.
