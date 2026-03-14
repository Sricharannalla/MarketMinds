# MarketMind - Consumer Behavior Simulation Platform

A comprehensive AI-powered platform for simulating and analyzing consumer behavior in market scenarios. Built with modern web technologies and machine learning models to help businesses understand how market changes affect consumer decisions.

## 🎯 Overview

MarketMind enables companies to:
- **Simulate Market Changes**: Test pricing, product, and marketing strategies before implementation
- **Predict Consumer Behavior**: Use AI models to forecast how consumers will react to changes
- **Analyze Impact**: Visualize before/after metrics with detailed analytics
- **Make Data-Driven Decisions**: Base business decisions on AI-powered insights

## 🏗️ Architecture

The platform consists of four main components working together:

### 1. Backend API (`/backend`)
**Technology Stack**: Node.js, Express.js, MongoDB, JWT Authentication

- **Purpose**: RESTful API server handling authentication, data management, and business logic
- **Key Features**:
  - User authentication and authorization
  - Product catalog management (CRUD operations)
  - Sandbox system for testing changes before deployment
  - Dashboard metrics and analytics
  - Integration with Python ML services

**Key Files**:
- `server.js` - Main application entry point
- `routes/` - API endpoint definitions
- `controllers/` - Business logic handlers
- `models/` - Database schemas
- `middleware/` - Authentication and validation middleware

### 2. Frontend Dashboard (`/insight-simulator-suite`)
**Technology Stack**: React 18, TypeScript, Tailwind CSS, Vite, Recharts

- **Purpose**: Modern web interface for interacting with the simulation platform
- **Key Features**:
  - Interactive dashboard with real-time metrics
  - Product management with visual cards
  - Sandbox preview system with before/after comparisons
  - Rich data visualizations and charts
  - Responsive design with professional UI

**Key Files**:
- `src/pages/` - Main application pages (Dashboard, Products, Sandbox, Login)
- `src/components/` - Reusable UI components
- `src/contexts/` - React context for state management

### 3. Machine Learning Models (`/python_model2`)
**Technology Stack**: Python, Google Gemini API, Flask, Scikit-learn

- **Purpose**: AI-powered prediction engine for consumer behavior simulation
- **Key Features**:
  - Consumer agent simulation with realistic behavior patterns
  - Market scenario prediction using advanced AI models
  - Clustering algorithms for consumer segmentation
  - Fallback decision-making systems
  - RESTful API for backend integration

**Model Variants**:
- **Gemini Models** (`/models/gemini/`) - Google Gemini API integration
- **Clustering Models** (`/models/flan_t5/`, `/models/llama/`) - Alternative ML approaches
- **Rule-based Models** (`/models/rule_based/`) - Fallback decision systems

**Key Files**:
- `model_server.py` - Flask API server
- `inference.py` - Core prediction logic
- `consumer_agent.py` - Agent behavior simulation
- `agent_clustering.py` - Consumer segmentation algorithms

### 4. Data and Assets
- **Market Data** (`*.jsonl`) - Consumer behavior datasets and training data
- **Agent Clusters** (`agent_clusters.json`) - Pre-computed consumer segments
- **Configuration Files** - Environment variables and settings

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v14+) for backend and frontend
- **Python** (3.8+) for ML services
- **MongoDB** for data persistence
- **Google AI Studio API Key** for ML predictions

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MarketMind
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure your environment variables
   npm start
   ```

3. **Setup Frontend**
   ```bash
   cd ../insight-simulator-suite
   npm install
   npm run dev
   ```

4. **Setup ML Service**
   ```bash
   cd ../python_model2/models/gemini
   pip install -r requirements.txt
   export GOOGLE_API_KEY="your-api-key"
   python model_server.py
   ```

### Environment Configuration

**Backend (.env)**:
```env
MONGO_URI=mongodb://localhost:27017/marketmind
JWT_SECRET=your-secret-key
PYTHON_MODEL_URL=http://localhost:5000/predict
PORT=8000
```

**ML Service**:
```env
GOOGLE_API_KEY=your-google-ai-api-key
FLASK_PORT=5000
```

## 🔧 Key Features

### Consumer Behavior Simulation
- **Agent-Based Modeling**: Realistic consumer agents with individual preferences
- **Market Scenarios**: Test pricing, product launches, and marketing campaigns
- **Behavioral Clustering**: Automatic segmentation of consumer types
- **Dynamic Responses**: Agents react differently based on personality traits

### Business Intelligence Dashboard
- **Real-time Metrics**: Live sales, satisfaction, and loyalty tracking
- **Comparative Analysis**: Before/after impact visualization
- **Category Insights**: Performance breakdown by product categories
- **Trend Analysis**: Historical data and forecasting

### Sandbox Testing Environment
- **Safe Testing**: Experiment without affecting live data
- **AI Predictions**: See potential outcomes before committing
- **Instant Feedback**: Real-time preview of market changes
- **Rollback Capability**: Discard changes if results are unsatisfactory

### Advanced Analytics
- **Consumer Segmentation**: K-means clustering for behavior groups
- **Sentiment Analysis**: Understanding consumer satisfaction drivers
- **Price Sensitivity Modeling**: Elasticity and demand forecasting
- **Brand Loyalty Tracking**: Long-term consumer relationship metrics

## 📊 Data Flow

1. **User Input** → Frontend captures market changes
2. **Staging** → Changes stored in sandbox environment
3. **AI Prediction** → Python ML service processes scenarios
4. **Analysis** → Results compared with current metrics
5. **Visualization** → Frontend displays impact analysis
6. **Decision** → User commits or discards changes
7. **Live Update** → Committed changes affect live dashboard

## 🔐 Security

- **JWT Authentication** for all API endpoints
- **Environment Variables** for sensitive configuration
- **Input Validation** on all user inputs
- **Rate Limiting** on ML service endpoints
- **Error Logging** without exposing sensitive data

## 🛠️ Development

### Project Structure
```
MarketMind/
├── backend/                    # Node.js API server
│   ├── controllers/           # Request handlers
│   ├── models/               # Database schemas
│   ├── routes/               # API endpoints
│   └── middleware/           # Auth & validation
├── insight-simulator-suite/   # React frontend
│   ├── src/components/       # UI components
│   ├── src/pages/           # Application pages
│   └── src/contexts/        # State management
├── python_model2/            # ML services
│   └── models/
│       ├── gemini/          # Google Gemini models
│       ├── llama/           # Llama models
│       └── rule_based/      # Fallback systems
├── *.jsonl                  # Market data files
└── agent_clusters.json      # Consumer segments
```

### Available Scripts

**Backend:**
- `npm start` - Production server
- `npm run dev` - Development with auto-reload

**Frontend:**
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build

**ML Service:**
- `python model_server.py` - Start prediction service
- `python test_clustering_system.py` - Test clustering algorithms

## 🤖 AI Models

### Gemini Integration
- **Model**: Google Gemini 2.0 Flash Lite
- **Purpose**: Natural language processing for consumer rationale
- **Features**: Contextual understanding, behavioral prediction
- **Fallback**: Rule-based system when API unavailable

### Clustering System
- **Algorithm**: K-means clustering
- **Features**: Price sensitivity, quality preference, brand loyalty
- **Segments**: 7 consumer behavior clusters
- **Updates**: Continuous learning from new data

## 📈 Performance Metrics

- **Consumer Agents**: 439 simulated agents
- **Response Time**: <2 seconds for predictions
- **Uptime**: 99.5% target availability
- **Concurrent Users**: Support for 100+ simultaneous sessions

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - List all products
- `POST /api/products/add` - Add new product
- `PUT /api/products/update` - Update product
- `DELETE /api/products/remove` - Remove product

### Sandbox
- `POST /api/sandbox/stage` - Stage market changes
- `POST /api/sandbox/preview` - Preview AI predictions
- `POST /api/sandbox/commit` - Commit changes to live
- `POST /api/sandbox/discard` - Discard staged changes

### Dashboard
- `GET /api/dashboard` - Get live metrics
- `GET /api/dashboard/comparisons` - Get before/after comparisons

## 🧪 Testing

- **Frontend**: React Testing Library for component tests
- **Backend**: Unit tests for API endpoints
- **ML Models**: Validation against historical data
- **Integration**: End-to-end workflow testing

## 🚀 Deployment

### Production Setup
1. Configure production environment variables
2. Build frontend: `npm run build`
3. Start backend: `npm start`
4. Deploy ML service with API key
5. Configure reverse proxy (nginx recommended)

### Docker Support
- Backend containerization ready
- ML service containerization ready
- Docker Compose configuration available

## 📚 Documentation

- **API Documentation**: Available in `/insight-simulator-suite/README.md`
- **ML Model Details**: Available in `/python_model2/README.md`
- **Setup Guides**: Detailed in component-specific README files
- **Clustering Implementation**: See `CLUSTERING_IMPLEMENTATION_SUMMARY.md`

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use conventional commit messages
5. Ensure all components work together

## 📄 License

This project is proprietary software for business intelligence and market simulation.

## 🆘 Support

For technical support or questions:
- Check component-specific README files
- Review API documentation
- Examine error logs in respective services
- Ensure all services are running and accessible

---

**Built with ❤️ using React, Node.js, Python, and Google Gemini AI**

*Empowering businesses with AI-driven market insights*
