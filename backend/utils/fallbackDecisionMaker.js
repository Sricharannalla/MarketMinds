const { spawn } = require('child_process');
const path = require('path');

/**
 * Node.js wrapper for the Python fallback decision maker
 */
class FallbackDecisionMaker {
  constructor() {
    // Use 'python' for Windows, 'python3' for Unix-like systems
    this.pythonPath = process.platform === 'win32' ? 'python' : 'python3';
    this.scriptPath = path.join(__dirname, '../../python_model/fallback_decision_maker.py');
  }

  /**
   * Make fallback decisions for a batch of agents
   * @param {Array} agentProfiles - Array of agent profiles
   * @param {Array} products - Array of available products
   * @param {string} marketContext - Market context as JSON string
   * @returns {Promise<Array>} Array of decisions
   */
  async makeDecisions(agentProfiles, products, marketContext) {
    return new Promise((resolve, reject) => {
      const input = {
        agent_profiles: agentProfiles,
        products: products,
        market_context: marketContext
      };

      const python = spawn(this.pythonPath, [this.scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorOutput);
          reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
          return;
        }

        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse Python output:', output);
          reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      // Send input to Python script
      python.stdin.write(JSON.stringify(input));
      python.stdin.end();
    });
  }
}

// Convenience function
async function makeFallbackDecisions(agentProfiles, products, marketContext) {
  const maker = new FallbackDecisionMaker();
  return await maker.makeDecisions(agentProfiles, products, marketContext);
}

module.exports = {
  FallbackDecisionMaker,
  makeFallbackDecisions
};
