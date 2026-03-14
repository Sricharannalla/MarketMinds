require("dotenv").config();
const mongoose = require('mongoose');
const fs = require('fs');
const readline = require('readline');
const ConsumerAgent = require('./models/consumer_agents');
const connectDB = require('./config/db');

async function importAgents() {
  await connectDB();

  const fileStream = fs.createReadStream('marketmind.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      const { consumer_profile, label } = entry;

      // Generate unique name: anonymous_<agent_id>
      const agent_id = `agent_${Math.random().toString(36).substr(2, 9)}`;
      const name = `anonymous_${agent_id}`;

      // Calculate budget based on price_sensitivity (0-1)
      // Lower price_sensitivity -> higher budget (500 to 2000 range)
      const priceSensitivity = consumer_profile.price_sensitivity || 0.5;
      const budget = Math.round(500 + (1 - priceSensitivity) * 1500);

      // Map action: "skip" or "no" to "not buy", others to "buy" or "not buy"
      const action = label.action === 'skip' || label.action === 'no' ? 'not buy' : label.action;

      const agent = new ConsumerAgent({
        agent_id,
        name,
        preferences: {
          price_sensitivity: consumer_profile.price_sensitivity || 0.5,
          quality_preference: consumer_profile.quality_preference || 0.5,
          brand_loyalty: consumer_profile.brand_loyalty || {},
          substitute_tolerance: consumer_profile.substitute_tolerance || 0.5
        },
        budget,
        current_inventory: consumer_profile.current_inventory || {},
        memory: [{
          action,
          product_id: label.selected_product_id || 'none',
          satisfaction: label.expected_satisfaction || 0,
          rationale: label.rationale || 'No rationale provided',
          timestamp: new Date()
        }],
        category_preferences: {}
      });

      await agent.save();
      console.log(`Imported agent: ${agent_id}`);
    } catch (error) {
      console.error('Error processing line:', error.message);
    }
  }

  console.log('Import complete');
  mongoose.connection.close();
}

importAgents().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});