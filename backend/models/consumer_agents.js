const mongoose = require("mongoose")
const consumer_agentSchema = mongoose.Schema({
    agent_id: { type: String, unique: true, required: true },
    name: { type: String },
    preferences: {
        price_sensitivity: { type: Number, min: 0, max: 1, required: true },
        quality_preference: { type: Number, min: 0, max: 1, required: true },
        brand_loyalty: { type: Map, of: Number },
        substitute_tolerance: { type: Number, min: 0, max: 1, required: true }
    },
    budget: { type: Number, default: 1000 },
    current_inventory: { type: Map, of: Number },
    memory: [{
        action: { type: String, enum: ['buy', 'not buy'] },
        product_id: String,
        satisfaction: Number,
        rationale: String,
        timestamp: { type: Date, default: Date.now }
    }],
    category_preferences: { type: Map, of: Number },
    stagedUpdates: {
        new_action: { type: String, enum: ['buy', 'not buy', null], default: null },
        new_product_id: { type: String, default: null },
        new_satisfaction: { type: Number, min: 0, max: 1, default: null },
        new_rationale: { type: String, default: null },
        loyalty_adjust: { type: Number, default: null }
    }
})

module.exports = mongoose.model('consumer_agents', consumer_agentSchema)