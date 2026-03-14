const axios = require('axios');
const { makeFallbackDecisions } = require('../utils/fallbackDecisionMaker');

/**
 * Consumer behavior prediction endpoint
 * This can work in two modes:
 * 1. Forward to Python model server if PYTHON_MODEL_URL is set
 * 2. Use local fallback decision maker
 */
exports.predict = async (req, res) => {
  try {
    const { agent_profiles, products, market_context } = req.body;

    // Validate input
    if (!agent_profiles || !Array.isArray(agent_profiles)) {
      return res.status(400).json({ error: 'Missing or invalid agent_profiles' });
    }
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Missing or invalid products' });
    }

    console.log(`[INFO] Prediction request for ${agent_profiles.length} agents and ${products.length} products`);

    // Try to use Python model server first if URL is configured
    const pythonModelUrl = process.env.PYTHON_URL;
    if (pythonModelUrl) {
      try {
        console.log(`[INFO] Forwarding to Python model server: ${pythonModelUrl}/predict`);
        const response = await axios.post(`${pythonModelUrl}/predict`, {
          agent_profiles,
          products,
          market_context: market_context || '{}'
        }, {
          timeout: 30000 // 30 second timeout
        });

        console.log('[INFO] Python model server responded successfully');
        return res.json(response.data);
      } catch (error) {
        console.warn(`[WARNING] Python model server failed: ${error.message}`);
        console.log('[INFO] Falling back to local decision maker');
      }
    } else {
      console.log('[INFO] No Python model server configured, using fallback decision maker');
    }

    // Use fallback decision maker
    try {
      const decisions = await makeFallbackDecisions(
        agent_profiles,
        products,
        market_context || '{}'
      );

      console.log(`[INFO] Fallback decision maker generated ${decisions.length} decisions`);
      
      return res.json({
        decisions,
        fallback_used: true,
        message: 'Used fallback decision maker'
      });
    } catch (fallbackError) {
      console.error('[ERROR] Fallback decision maker failed:', fallbackError.message);
      
      // Ultimate fallback - simple rule-based decisions
      const simpleFallbackDecisions = agent_profiles.map(agent => ({
        agent_id: agent.agent_id || agent.id || 'unknown',
        action: 'not buy',
        product_id: null,
        satisfaction: 0.0,
        rationale: 'System error - no decision could be made'
      }));

      return res.json({
        decisions: simpleFallbackDecisions,
        fallback_used: true,
        error: 'Fallback decision maker failed, using simple fallback',
        message: 'System error occurred during prediction'
      });
    }

  } catch (error) {
    console.error('[ERROR] Prediction endpoint failed:', error.message);
    res.status(500).json({ 
      error: 'Internal server error during prediction',
      message: error.message 
    });
  }
};
