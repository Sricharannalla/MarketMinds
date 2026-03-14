const mongoose = require('mongoose');
const Product = require('../models/products');
const MarketChange = require('../models/marketchange');
const ConsumerAgent = require('../models/consumer_agents');
const axios = require('axios');

// Helper functions
function aggregateProfiles(agents) {
  const n = agents.length;
  if (n === 0) {
    return {
      price_sensitivity: 0.5,
      quality_preference: 0.5,
      brand_loyalty: {},
      substitute_tolerance: 0.5
    };
  }
  const agg = {
    price_sensitivity: agents.reduce((sum, a) => sum + a.preferences.price_sensitivity, 0) / n,
    quality_preference: agents.reduce((sum, a) => sum + a.preferences.quality_preference, 0) / n,
    brand_loyalty: {},
    substitute_tolerance: agents.reduce((sum, a) => sum + a.preferences.substitute_tolerance, 0) / n
  };
  const allBrands = new Set();
  agents.forEach(a => Object.keys(a.preferences.brand_loyalty).forEach(b => allBrands.add(b)));
  allBrands.forEach(brand => {
    agg.brand_loyalty[brand] = agents.reduce((sum, a) => sum + (a.preferences.brand_loyalty[brand] || 0), 0) / n;
  });
  return agg;
}

function rankProducts(products, aggregatedProfile, topN = 10) {
  const maxPrice = Math.max(...products.map(p => p.price), 100);
  const categories = [...new Set(products.map(p => p.category))];
  let rankedProducts = [];
  for (const category of categories) {
    const catProducts = products.filter(p => p.category === category);
    const ranked = catProducts.map(product => {
      let score = (1 - aggregatedProfile.price_sensitivity) * (1 - product.price / maxPrice);
      score += aggregatedProfile.quality_preference * product.quality;
      score += (aggregatedProfile.brand_loyalty[product.brand] || 0) * 0.5;
      score += (product.popularity_score || 0) * 0.3;
      return { product, score };
    });
    ranked.sort((a, b) => b.score - a.score);
    rankedProducts.push(...ranked.slice(0, topN).map(item => ({
      product_id: item.product.product_id,
      brand: item.product.brand,
      price: item.product.price,
      quality: item.product.quality,
      category: item.product.category,
      popularity_score: item.product.popularity_score || 0
    })));
  }
  return rankedProducts;
}

exports.stageChange = async (req, res) => {
  try {
    console.log('[INFO] stageChange - Request received:', req.body);
    const { change_type, details } = req.body;
    
    if (!['price_drop', 'new_product', 'update', 'remove'].includes(change_type)) {
      return res.status(400).json({ error: 'Invalid change_type' });
    }

    let product;
    let originalValues = null;

    if (change_type === 'price_drop' || change_type === 'update') {
      product = await Product.findOne({ product_id: details.product_id, companyId: req.user.id });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      
      originalValues = {
        brand: product.brand,
        price: product.price,
        quality: product.quality,
        category: product.category
      };
      
      await Product.findOneAndUpdate(
        { product_id: details.product_id, companyId: req.user.id },
        { ...details, isStaged: true },
        { new: true }
      );
    } else if (change_type === 'new_product') {
      product = new Product({ ...details, companyId: req.user.id, isStaged: true });
      await product.save();
    } else if (change_type === 'remove') {
      product = await Product.findOne({ product_id: details.product_id, companyId: req.user.id });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      
      originalValues = {
        brand: product.brand,
        price: product.price,
        quality: product.quality,
        category: product.category
      };
      
      await Product.findOneAndUpdate(
        { product_id: details.product_id, companyId: req.user.id },
        { isStaged: true, price: 0 },
        { new: true }
      );
    }

    const marketChange = new MarketChange({
      change_type,
      details,
      originalValues,
      companyId: req.user.id,
      committed: false
    });
    await marketChange.save();
    
    console.log('[INFO] stageChange - Market change created:', marketChange._id);
    res.json({ success: true, change: marketChange });
  } catch (error) {
    console.error('[ERROR] stageChange failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.previewStaged = async (req, res) => {
  try {
    const { change_id, prediction_method = 'fallback' } = req.body;
    console.log(`[INFO] previewStaged - Method: ${prediction_method}, Change ID: ${change_id}`);

    // Validate input
    if (!change_id || !mongoose.Types.ObjectId.isValid(change_id)) {
      return res.status(400).json({ error: 'Invalid change_id' });
    }

    // Fetch change
    const marketChange = await MarketChange.findById(change_id);
    if (!marketChange) {
      console.log(`[ERROR] Market change not found: ${change_id}`);
      return res.status(404).json({ 
        error: 'Change not found',
        change_id: change_id,
        message: 'The specified market change does not exist in the database'
      });
    }

    // Ensure the user owns the change
    if (!marketChange.companyId || marketChange.companyId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this change' });
    }

    console.log(`[INFO] Found market change: ${marketChange.change_type} for company ${marketChange.companyId}`);

    // Fetch data
    const stagedProducts = await Product.find({ isStaged: true, companyId: req.user.id });
    const liveProducts = await Product.find({ isStaged: false, companyId: req.user.id });
    const agents = await ConsumerAgent.find();

    console.log(`[INFO] Data counts - Staged: ${stagedProducts.length}, Live: ${liveProducts.length}, Agents: ${agents.length}`);

    // Create BEFORE scenario (original products)
    let beforeProducts = [...liveProducts];
    if (marketChange.change_type === 'update' && marketChange.originalValues) {
      const originalProduct = {
        product_id: marketChange.details.product_id,
        brand: marketChange.originalValues.brand,
        price: marketChange.originalValues.price,
        quality: marketChange.originalValues.quality,
        category: marketChange.originalValues.category,
        popularity_score: 0.5
      };
      beforeProducts = beforeProducts.filter(p => p.product_id !== marketChange.details.product_id);
      beforeProducts.push(originalProduct);
    } else if (marketChange.change_type === 'new_product') {
      beforeProducts = beforeProducts.filter(p => p.product_id !== marketChange.details.product_id);
    }

    // Get the category of the changed product for filtering
    const changedProductCategory = marketChange.details.category || (marketChange.originalValues && marketChange.originalValues.category);

    // Create AFTER scenario (with changes applied)
    let afterProducts = [...liveProducts];
    if (marketChange.change_type === 'update') {
      afterProducts = afterProducts.filter(p => p.product_id !== marketChange.details.product_id);
      afterProducts.push({
        product_id: marketChange.details.product_id,
        brand: marketChange.details.brand,
        price: marketChange.details.price,
        quality: marketChange.details.quality,
        category: marketChange.details.category,
        popularity_score: 0.5
      });
    } else if (marketChange.change_type === 'new_product') {
      afterProducts.push({
        product_id: marketChange.details.product_id,
        brand: marketChange.details.brand,
        price: marketChange.details.price,
        quality: marketChange.details.quality,
        category: marketChange.details.category,
        popularity_score: 0.5
      });
    } else if (marketChange.change_type === 'remove') {
      afterProducts = afterProducts.filter(p => p.product_id !== marketChange.details.product_id);
    }

    // Filter products to only include those in the same category as the changed product
    // This ensures we only compare within the relevant competitive set
    if (changedProductCategory) {
      console.log(`[INFO] Filtering products to category: ${changedProductCategory}`);
      beforeProducts = beforeProducts.filter(p => p.category === changedProductCategory);
      afterProducts = afterProducts.filter(p => p.category === changedProductCategory);
    }

    // Aggregate profiles and rank products
    const aggregatedProfile = aggregateProfiles(agents);
    const beforeRanked = rankProducts(beforeProducts, aggregatedProfile);
    const afterRanked = rankProducts(afterProducts, aggregatedProfile);

    console.log(`[INFO] Before products: ${beforeRanked.length}, After products: ${afterRanked.length}`);

    // UNBATCHED VERSION - Send all agents in single request (max 2 requests total)
    let beforeSales = 0, afterSales = 0;
    const beforeSatisfaction = [], afterSatisfaction = [];
    const beforeLoyalty = [], afterLoyalty = [];
    const categoryComparisons = {};
    let failedRequests = 0;
    const allAfterDecisions = [];

    // COMMENTED OUT - OLD BATCHED VERSION FOR FUTURE USE WITH FINE-TUNED MODEL
    // const batchSize = 10;  // Reduced from 25 to 10 for better rate limit compliance
    // const batches = [];
    // for (let i = 0; i < agents.length; i += batchSize) {
    //   batches.push(agents.slice(i, i + batchSize));
    // }

    if (prediction_method === 'fallback') {
      console.log('[INFO] Using improved fallback decision maker for both scenarios - UNBATCHED');
      const { makeComprehensiveFallbackDecisions } = require('../utils/improvedFallbackDecisionMaker');
      
      // Process ALL agents at once instead of batching
      const allAgentProfiles = agents.map(agent => ({
        agent_id: agent.agent_id,
        price_sensitivity: agent.preferences.price_sensitivity,
        quality_preference: agent.preferences.quality_preference,
        substitute_tolerance: agent.preferences.substitute_tolerance,
        brand_loyalty: agent.preferences.brand_loyalty,
        current_inventory: agent.current_inventory || {},
        memory: agent.memory || []
      }));

      try {
        console.log(`[INFO] Processing ALL ${allAgentProfiles.length} agents in single fallback request`);
        
        const beforeDecisions = await makeComprehensiveFallbackDecisions(
          allAgentProfiles,
          beforeRanked,
          JSON.stringify({ scenario: 'before_change' })
        );

        const afterDecisions = await makeComprehensiveFallbackDecisions(
          allAgentProfiles,
          afterRanked,
          JSON.stringify(marketChange.details)
        );

        allAfterDecisions.push(...afterDecisions);
        console.log(`[INFO] Fallback completed - Before: ${beforeDecisions.length}, After: ${afterDecisions.length} decisions`);

        // Process BEFORE decisions
        beforeDecisions.forEach(decision => {
          if (decision.action === 'buy') {
            const product = beforeRanked.find(p => p.product_id === decision.product_id);
            if (product) {
              beforeSales += product.price;
              categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
              categoryComparisons[product.category].beforeSales += product.price;
              beforeSatisfaction.push(Math.min(5, Math.max(0, decision.satisfaction || 0)));
            }
          }
          if (decision.product_id) {
            const product = beforeRanked.find(p => p.product_id === decision.product_id);
            if (product) {
              const agent = agents.find(a => a.agent_id === decision.agent_id);
              beforeLoyalty.push(agent?.preferences.brand_loyalty[product.brand] || 0);
            }
          }
        });

        // Process AFTER decisions
        afterDecisions.forEach(decision => {
          if (decision.action === 'buy') {
            const product = afterRanked.find(p => p.product_id === decision.product_id);
            if (product) {
              afterSales += product.price;
              categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
              categoryComparisons[product.category].afterSales += product.price;
              afterSatisfaction.push(Math.min(5, Math.max(0, decision.satisfaction || 0)));
            }
          }
          if (decision.product_id) {
            const product = afterRanked.find(p => p.product_id === decision.product_id);
            if (product) {
              const agent = agents.find(a => a.agent_id === decision.agent_id);
              afterLoyalty.push(agent?.preferences.brand_loyalty[product.brand] || 0);
            }
          }
        });

      } catch (error) {
        console.error(`[ERROR] Fallback prediction failed:`, error.message);
        failedRequests++;
      }

      // COMMENTED OUT - OLD BATCHED FALLBACK VERSION
      // for (let i = 0; i < batches.length; i++) {
      //   const batch = batches[i];
      //   const agentProfiles = batch.map(agent => ({
      //     agent_id: agent.agent_id,
      //     price_sensitivity: agent.preferences.price_sensitivity,
      //     quality_preference: agent.preferences.quality_preference,
      //     substitute_tolerance: agent.preferences.substitute_tolerance,
      //     brand_loyalty: agent.preferences.brand_loyalty,
      //     current_inventory: agent.current_inventory || {}
      //   }));
      //   // ... rest of batched logic
      // }
    } else if (prediction_method === 'model') {
      console.log('[INFO] Using Python model server for AFTER scenario only - UNBATCHED');
      const pythonModelUrl = process.env.PYTHON_URL;
      
      if (!pythonModelUrl) {
        throw new Error('PYTHON_URL not configured for model prediction');
      }
      
      // Calculate BEFORE scenario from existing agent data using same logic as fallback
      console.log('[INFO] Calculating BEFORE scenario from existing agent data');
      const { makeComprehensiveFallbackDecisions } = require('../utils/improvedFallbackDecisionMaker');

      // Process ALL agents at once instead of batching for consistency
      const allAgentProfiles = agents.map(agent => ({
        agent_id: agent.agent_id,
        price_sensitivity: agent.preferences.price_sensitivity,
        quality_preference: agent.preferences.quality_preference,
        substitute_tolerance: agent.preferences.substitute_tolerance,
        brand_loyalty: agent.preferences.brand_loyalty,
        current_inventory: agent.current_inventory || {},
        memory: agent.memory || []
      }));

      try {
        console.log(`[INFO] Processing ALL ${allAgentProfiles.length} agents for BEFORE scenario`);

        const beforeDecisions = await makeComprehensiveFallbackDecisions(
          allAgentProfiles,
          beforeRanked,
          JSON.stringify({ scenario: 'before_change' })
        );

        console.log(`[INFO] BEFORE scenario completed - ${beforeDecisions.length} decisions`);

        // Process BEFORE decisions using same logic as fallback
        beforeDecisions.forEach(decision => {
          if (decision.action === 'buy') {
            const product = beforeRanked.find(p => p.product_id === decision.product_id);
            if (product) {
              beforeSales += product.price;
              categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
              categoryComparisons[product.category].beforeSales += product.price;
              beforeSatisfaction.push(Math.min(5, Math.max(0, decision.satisfaction || 0)));
            }
          }
          if (decision.product_id) {
            const product = beforeRanked.find(p => p.product_id === decision.product_id);
            if (product) {
              const agent = agents.find(a => a.agent_id === decision.agent_id);
              beforeLoyalty.push(agent?.preferences.brand_loyalty[product.brand] || 0);
            }
          }
        });

      } catch (error) {
        console.error(`[ERROR] BEFORE scenario fallback failed:`, error.message);
        // Fall back to old method if fallback fails
        agents.forEach(agent => {
          const existingPurchases = agent.memory.filter(m => m.action === 'buy');
          existingPurchases.forEach(purchase => {
            const product = beforeProducts.find(p => String(p.product_id) === String(purchase.product_id));
            if (product) {
              beforeSales += product.price;
              categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
              categoryComparisons[product.category].beforeSales += product.price;
              beforeSatisfaction.push(Math.min(5, Math.max(0, purchase.satisfaction || 0)));
            }
          });

          Object.entries(agent.current_inventory || {}).forEach(([pid, qty]) => {
            if (qty > 0) {
              const product = beforeProducts.find(p => String(p.product_id) === String(pid));
              if (product) {
                beforeSales += product.price * qty;
                categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
                categoryComparisons[product.category].beforeSales += product.price * qty;
                beforeSatisfaction.push(3.0);
              }
            }
          });

          Object.entries(agent.preferences.brand_loyalty).forEach(([brand, loyalty]) => {
            beforeLoyalty.push(loyalty);
          });
        });
      }
      
      // Use Python model for AFTER scenario - SINGLE REQUEST FOR ALL AGENTS
      const afterAgentProfiles = agents.map(agent => ({
        agent_id: agent.agent_id,
        price_sensitivity: agent.preferences.price_sensitivity,
        quality_preference: agent.preferences.quality_preference,
        substitute_tolerance: agent.preferences.substitute_tolerance,
        brand_loyalty: agent.preferences.brand_loyalty,
        current_inventory: agent.current_inventory || {},
        memory: agent.memory || []
      }));

      try {
        console.log(`[INFO] Calling model for AFTER scenario - ALL ${afterAgentProfiles.length} agents in single request`);
        console.log(`[INFO] Sending to model:`, {
          agent_profiles_count: afterAgentProfiles.length,
          products_count: afterRanked.length,
          market_context: JSON.stringify(marketChange.details)
        });
        
        const afterResponse = await axios.post(`${pythonModelUrl}/predict`, {
          agent_profiles: afterAgentProfiles,
          products: afterRanked,
          market_context: JSON.stringify(marketChange.details)
        }, { timeout: 180000 });  // 3 minutes for v4 model
        
        console.log(`[INFO] Model response received:`, afterResponse.data);

        const afterDecisions = afterResponse.data.decisions || [];
        allAfterDecisions.push(...afterDecisions);
        console.log(`[INFO] Model returned ${afterDecisions.length} decisions for ${afterAgentProfiles.length} agents`);

        // Process AFTER decisions from model
        afterDecisions.forEach(decision => {
          if (decision.action === 'buy') {
            const product = afterRanked.find(p => p.product_id === decision.product_id);
            if (product) {
              afterSales += product.price;
              categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
              categoryComparisons[product.category].afterSales += product.price;
              afterSatisfaction.push(Math.min(5, Math.max(0, decision.satisfaction || 0)));
            }
          }
          if (decision.product_id) {
            const product = afterRanked.find(p => p.product_id === decision.product_id);
            if (product) {
              const agent = agents.find(a => a.agent_id === decision.agent_id);
              afterLoyalty.push(agent?.preferences.brand_loyalty[product.brand] || 0);
            }
          }
        });

      } catch (error) {
        console.error(`[ERROR] Model prediction failed:`, error.message);
        // NO FALLBACK - Return error to frontend
        throw new Error(`Model prediction failed: ${error.message}. Please check your Python model server and API configuration.`);
      }

      // COMMENTED OUT - OLD BATCHED MODEL VERSION FOR FUTURE USE WITH FINE-TUNED MODEL
      // for (let i = 0; i < batches.length; i++) {
      //   const batch = batches[i];
      //   const agentProfiles = batch.map(agent => ({
      //     agent_id: agent.agent_id,
      //     price_sensitivity: agent.preferences.price_sensitivity,
      //     quality_preference: agent.preferences.quality_preference,
      //     substitute_tolerance: agent.preferences.substitute_tolerance,
      //     brand_loyalty: agent.preferences.brand_loyalty,
      //     current_inventory: agent.current_inventory || {}
      //   }));
      //   // ... rest of batched model logic with delays and retries
      // }
    }

    console.log(`[INFO] Final results - Before sales: ${beforeSales}, After sales: ${afterSales}, Sales change: ${afterSales - beforeSales}`);

    // Store decisions in market change for commit
    await MarketChange.findByIdAndUpdate(change_id, {
      simulatedDecisions: allAfterDecisions
    });

    // Compute metrics with null safety
    const avgAfterSatisfaction = afterSatisfaction.length > 0 ? afterSatisfaction.reduce((a, b) => a + b, 0) / afterSatisfaction.length : 0;
    const avgBeforeSatisfaction = beforeSatisfaction.length > 0 ? beforeSatisfaction.reduce((a, b) => a + b, 0) / beforeSatisfaction.length : 0;
    const avgAfterLoyalty = afterLoyalty.length > 0 ? afterLoyalty.reduce((a, b) => a + b, 0) / afterLoyalty.length : 0;
    const avgBeforeLoyalty = beforeLoyalty.length > 0 ? beforeLoyalty.reduce((a, b) => a + b, 0) / beforeLoyalty.length : 0;

    const metrics = {
      salesChange: afterSales - beforeSales,
      satisfactionDiff: avgAfterSatisfaction - avgBeforeSatisfaction,
      loyaltyDiff: avgAfterLoyalty - avgBeforeLoyalty,
      beforeSales,
      afterSales,
      categoryComparisons: Object.entries(categoryComparisons).map(([category, { beforeSales, afterSales }]) => ({
        category,
        beforeSales,
        afterSales,
        change: afterSales - beforeSales
      }))
    };

    res.status(200).json({
      metrics,
      stagedProducts,
      change: marketChange,
      warning: failedRequests > 0 ? `Prediction failed for ${failedRequests} request(s), metrics may be incomplete` : undefined
    });

  } catch (error) {
    console.error('[ERROR] previewStaged failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.commitStaged = async (req, res) => {
  try {
    const { change_id } = req.body;
    console.log('[INFO] commitStaged - Change ID:', change_id);

    if (!change_id || !mongoose.Types.ObjectId.isValid(change_id)) {
      return res.status(400).json({ error: 'Invalid change_id' });
    }

    const marketChange = await MarketChange.findById(change_id);
    if (!marketChange) {
      return res.status(404).json({ error: 'Change not found' });
    }

    if (marketChange.companyId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this change' });
    }

    if (marketChange.committed) {
      return res.status(400).json({ error: 'Change already committed' });
    }

    // Apply the staged changes to live products
    const stagedProducts = await Product.find({ isStaged: true, companyId: req.user.id });
    
    for (const stagedProduct of stagedProducts) {
      await Product.findOneAndUpdate(
        { product_id: stagedProduct.product_id, companyId: req.user.id },
        { isStaged: false },
        { new: true }
      );
    }

    // Update agents with simulated decisions using bulkWrite
    if (marketChange.simulatedDecisions && marketChange.simulatedDecisions.length > 0) {
      const bulkOps = [];
      const timestamp = new Date();
      
      for (const decision of marketChange.simulatedDecisions) {
        const updateDoc = {
          $push: {
            memory: {
              action: decision.action,
              product_id: decision.product_id,
              satisfaction: decision.satisfaction,
              rationale: decision.rationale,
              timestamp: timestamp
            }
          }
        };

        if (decision.action === 'buy' && decision.product_id) {
          updateDoc.$inc = { [`current_inventory.${decision.product_id}`]: 1 };
        }

        bulkOps.push({
          updateOne: {
            filter: { agent_id: decision.agent_id },
            update: updateDoc
          }
        });
      }

      // Execute all updates in a single database roundtrip
      if (bulkOps.length > 0) {
        await ConsumerAgent.bulkWrite(bulkOps);
      }
    }

    await MarketChange.findByIdAndUpdate(change_id, { committed: true });
    console.log('[INFO] commitStaged - Changes committed successfully');

    res.json({ success: true, message: 'Changes committed successfully' });
  } catch (error) {
    console.error('[ERROR] commitStaged failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.rollbackStaged = async (req, res) => {
  try {
    const { change_id } = req.body;
    console.log('[INFO] rollbackStaged - Change ID:', change_id);

    if (!change_id || !mongoose.Types.ObjectId.isValid(change_id)) {
      return res.status(400).json({ error: 'Invalid change_id' });
    }

    const marketChange = await MarketChange.findById(change_id);
    if (!marketChange) {
      return res.status(404).json({ error: 'Change not found' });
    }

    if (marketChange.companyId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this change' });
    }

    if (marketChange.committed) {
      return res.status(400).json({ error: 'Cannot rollback committed change' });
    }

    // Rollback based on change type
    if (marketChange.change_type === 'new_product') {
      await Product.findOneAndDelete({
        product_id: marketChange.details.product_id,
        companyId: req.user.id,
        isStaged: true
      });
    } else if (marketChange.originalValues) {
      await Product.findOneAndUpdate(
        { product_id: marketChange.details.product_id, companyId: req.user.id },
        { ...marketChange.originalValues, isStaged: false },
        { new: true }
      );
    }

    await MarketChange.findByIdAndDelete(change_id);
    console.log('[INFO] rollbackStaged - Changes rolled back successfully');

    res.json({ success: true, message: 'Changes rolled back successfully' });
  } catch (error) {
    console.error('[ERROR] rollbackStaged failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};
