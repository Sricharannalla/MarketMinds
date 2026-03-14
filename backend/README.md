# Backend Setup

## Prerequisites
- Node.js (v14+)
- MongoDB running locally or remotely
- Python model service running (see python_model folder)

## Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PYTHON_MODEL_URL`: URL where the Python prediction model is running (default: http://localhost:5000/predict)

## Running the Backend

```bash
npm start
```

Server will run on `http://localhost:8000`

## Python Model Setup

The `python_model` folder contains the fine-tuned Llama model that needs to be running separately.

1. Navigate to the python_model directory (locally on your machine)
2. Install Python dependencies (requirements.txt should be in that folder)
3. Run the model service:
```bash
python app.py  # or whatever the entry point is
```

The Python service should expose a POST endpoint at `/predict` that accepts:
```json
{
  "consumer_profile": {
    "price_sensitivity": 0.7,
    "quality_preference": 0.8,
    "brand_loyalty": {"BrandA": 0.9},
    "substitute_tolerance": 0.5,
    "current_inventory": {},
    "budget": 1000
  },
  "products": [...],
  "market_context": "..."
}
```

And returns:
```json
{
  "decision": {
    "action": "buy",
    "product_id": "P001",
    "satisfaction": 0.85,
    "rationale": "..."
  }
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new company user
- `POST /api/auth/login` - Login and get JWT token

### Dashboard
- `GET /api/dashboard?staged=false` - Get live dashboard metrics
- `GET /api/dashboard/comparisons?change_id=xxx` - Get comparison metrics

### Products
- `POST /api/products/add` - Add new product
- `GET /api/products?staged=false` - Get products
- `PUT /api/products/update/:id` - Update product
- `DELETE /api/products/remove/:id` - Remove product

### Sandbox
- `POST /api/sandbox/stage` - Stage a market change
- `POST /api/sandbox/preview` - Preview staged changes
- `POST /api/sandbox/commit` - Commit changes to live
- `POST /api/sandbox/discard` - Discard staged changes

All protected routes require `Authorization: Bearer <token>` header.
