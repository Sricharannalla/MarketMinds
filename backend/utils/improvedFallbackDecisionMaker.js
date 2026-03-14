/**
 * Comprehensive Fallback Decision Maker for Consumer Behavior Prediction
 *
 * This enhanced module provides a sophisticated rule-based decision maker that considers:
 * 1. Purchase frequency and recency patterns
 * 2. Enhanced loyalty calculations based on historical behavior
 * 3. Sophisticated inventory management and usage patterns
 * 4. Time-based factors and seasonal preferences
 * 5. Cross-product relationships and substitution effects
 * 6. Psychological factors and behavioral economics
 */

class ComprehensiveFallbackDecisionMaker {
  constructor() {
    // Enhanced weights for more sophisticated decision making
    this.weights = {
      price_weight: 0.25,              // Reduced - not the only factor
      quality_weight: 0.20,            // Maintained
      brand_loyalty_weight: 0.18,      // Increased - loyalty matters more
      purchase_frequency_weight: 0.12, // NEW - frequency of purchases
      inventory_weight: 0.10,          // Enhanced inventory management
      recency_weight: 0.08,           // NEW - recency of purchases
      category_preference_weight: 0.05, // Maintained
      popularity_weight: 0.02          // Reduced - less emphasis on popularity
    };

    // Thresholds for decision making
    this.thresholds = {
      buy_threshold: 0.45,
      high_satisfaction_threshold: 0.75,
      medium_satisfaction_threshold: 0.45,
      low_satisfaction_threshold: 0.25
    };

    // Category preferences learned from data
    this.categoryPreferences = {
      'Electronics': 0.8,
      'Clothing': 0.7,
      'Home': 0.6,
      'Sports': 0.5,
      'Beauty': 0.4,
      'Books': 0.3
    };

    // Brand strength multipliers based on typical patterns
    this.brandStrengthMultipliers = {
      'BrandX': 1.2,
      'BrandY': 1.1,
      'BrandZ': 1.0,
      'BrandA': 1.15,
      'BrandB': 1.05,
      'BrandC': 0.95
    };

    // Time decay factors for recency (in days)
    this.recencyDecayFactors = {
      very_recent: 30,    // Purchases within 30 days get full weight
      recent: 90,         // Purchases within 90 days get moderate weight
      older: 180,         // Purchases within 180 days get reduced weight
      very_old: 365       // Purchases older than 365 days get minimal weight
    };
  }

  /**
   * Calculate purchase frequency score based on historical buying patterns
   */
  calculatePurchaseFrequencyScore(agent, product) {
    const memory = agent.memory || [];
    const productId = product.product_id || '';
    const productBrand = product.brand || '';
    const productCategory = product.category || '';

    if (memory.length === 0) {
      return 0.5; // Neutral score for new customers
    }

    // Filter relevant purchase history
    const relevantPurchases = memory.filter(m =>
      m.action === 'buy' &&
      (m.product_id === productId ||
       (m.product_id && m.product_id.startsWith(productBrand.slice(0, 5))))
    );

    if (relevantPurchases.length === 0) {
      // Check for category-level frequency
      const categoryPurchases = memory.filter(m =>
        m.action === 'buy' &&
        m.product_id && // Assuming product_id contains category info
        m.product_id.includes(productCategory.slice(0, 3))
      );

      if (categoryPurchases.length === 0) {
        return 0.3; // Low frequency for unfamiliar categories
      }

      // Calculate category frequency score
      const avgDaysBetweenPurchases = this.calculateAveragePurchaseInterval(categoryPurchases);
      return Math.max(0.2, Math.min(0.8, 1.0 / (1.0 + avgDaysBetweenPurchases / 30)));
    }

    // Calculate product/brand specific frequency
    const avgDaysBetweenPurchases = this.calculateAveragePurchaseInterval(relevantPurchases);

    // More frequent purchases = higher score (up to 0.9)
    const frequencyScore = Math.max(0.2, Math.min(0.9, 1.0 / (1.0 + avgDaysBetweenPurchases / 15)));

    return frequencyScore;
  }

  /**
   * Calculate average days between purchases
   */
  calculateAveragePurchaseInterval(purchases) {
    if (purchases.length < 2) {
      return 90; // Default to 90 days if insufficient data
    }

    const sortedPurchases = purchases.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const intervals = [];

    for (let i = 1; i < sortedPurchases.length; i++) {
      const prevDate = new Date(sortedPurchases[i-1].timestamp);
      const currDate = new Date(sortedPurchases[i].timestamp);
      const daysDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  /**
   * Calculate recency score based on how recently the agent purchased similar products
   */
  calculateRecencyScore(agent, product) {
    const memory = agent.memory || [];
    const productBrand = product.brand || '';
    const productCategory = product.category || '';

    if (memory.length === 0) {
      return 0.5; // Neutral score for new customers
    }

    // Find most recent relevant purchase
    const relevantPurchases = memory.filter(m =>
      m.action === 'buy' &&
      (m.product_id === product.product_id ||
       (m.product_id && m.product_id.startsWith(productBrand.slice(0, 5))))
    );

    if (relevantPurchases.length === 0) {
      return 0.3; // Lower score for no recent relevant purchases
    }

    const mostRecentPurchase = relevantPurchases.reduce((latest, purchase) => {
      return new Date(purchase.timestamp) > new Date(latest.timestamp) ? purchase : latest;
    }, relevantPurchases[0]);

    const daysSincePurchase = (new Date() - new Date(mostRecentPurchase.timestamp)) / (1000 * 60 * 60 * 24);

    // Apply time decay - more recent = higher score
    let recencyScore;
    if (daysSincePurchase <= this.recencyDecayFactors.very_recent) {
      recencyScore = 0.9; // Very recent purchase
    } else if (daysSincePurchase <= this.recencyDecayFactors.recent) {
      recencyScore = 0.7; // Recent purchase
    } else if (daysSincePurchase <= this.recencyDecayFactors.older) {
      recencyScore = 0.4; // Older purchase
    } else {
      recencyScore = 0.2; // Very old purchase
    }

    return recencyScore;
  }

  /**
   * Enhanced brand loyalty calculation considering purchase history and satisfaction
   */
  calculateEnhancedBrandLoyaltyScore(agent, product) {
    const baseLoyalty = agent.brand_loyalty || {};
    const productBrand = product.brand || '';

    // Get base loyalty score
    const loyaltyScore = baseLoyalty[productBrand] || 0.0;

    // Enhance with purchase history analysis
    const memory = agent.memory || [];
    const brandPurchases = memory.filter(m =>
      m.action === 'buy' &&
      m.product_id &&
      m.product_id.startsWith(productBrand.slice(0, 5))
    );

    if (brandPurchases.length === 0) {
      return loyaltyScore * this.brandStrengthMultipliers[productBrand] || 1.0;
    }

    // Calculate loyalty enhancement based on satisfaction history
    const satisfactionHistory = brandPurchases.map(p => p.satisfaction || 0.5);
    const avgSatisfaction = satisfactionHistory.reduce((sum, sat) => sum + sat, 0) / satisfactionHistory.length;

    // Boost loyalty for high satisfaction, reduce for low satisfaction
    const satisfactionMultiplier = 0.8 + (avgSatisfaction * 0.4); // 0.8 to 1.2 range

    // Consider purchase frequency for this brand
    const avgInterval = this.calculateAveragePurchaseInterval(brandPurchases);
    const frequencyMultiplier = Math.max(0.8, Math.min(1.2, 1.0 / (1.0 + avgInterval / 60))); // More frequent = higher loyalty

    const enhancedLoyalty = loyaltyScore * satisfactionMultiplier * frequencyMultiplier;
    const brandMultiplier = this.brandStrengthMultipliers[productBrand] || 1.0;

    return enhancedLoyalty * brandMultiplier;
  }

  /**
   * Enhanced inventory score considering usage patterns and replenishment needs
   */
  calculateEnhancedInventoryScore(agent, product) {
    const currentInventory = agent.current_inventory || {};
    const productId = product.product_id || '';
    const productCategory = product.category || '';

    // Get current inventory count for this product
    const currentCount = currentInventory[productId] || 0;

    // Analyze inventory patterns across all products
    const inventoryEntries = Object.entries(currentInventory).filter(([_, qty]) => qty > 0);
    const totalInventoryValue = inventoryEntries.reduce((sum, [_, qty]) => sum + qty, 0);

    // Calculate category saturation
    const categoryItems = inventoryEntries.filter(([pid, _]) => {
      // This is a simplified check - in reality you'd want to map product IDs to categories
      return pid.includes(productCategory.slice(0, 3));
    });
    const categoryCount = categoryItems.length;

    // Enhanced inventory logic
    let inventoryScore = 0;

    // Product-specific inventory logic
    if (currentCount === 0) {
      // No inventory - strong positive for replenishment
      inventoryScore += 0.3;
    } else if (currentCount === 1) {
      // One item - might want backup or replacement
      inventoryScore += 0.1;
    } else if (currentCount === 2) {
      // Two items - moderate replenishment need
      inventoryScore += 0.05;
    } else if (currentCount >= 3) {
      // Many items - negative for overstocking
      inventoryScore -= 0.2 * Math.min(currentCount / 5, 1);
    }

    // Category saturation logic
    if (categoryCount === 0) {
      // New category - positive for exploration
      inventoryScore += 0.2;
    } else if (categoryCount <= 2) {
      // Low category diversity - moderate positive
      inventoryScore += 0.1;
    } else if (categoryCount >= 5) {
      // High category saturation - negative
      inventoryScore -= 0.15;
    }

    // Overall inventory pressure
    if (totalInventoryValue > 20) {
      // High overall inventory - more selective
      inventoryScore -= 0.1;
    } else if (totalInventoryValue < 5) {
      // Low overall inventory - more open to purchases
      inventoryScore += 0.1;
    }

    return Math.max(-0.5, Math.min(0.5, inventoryScore));
  }

  /**
   * Calculate price-based score considering agent's price sensitivity and price anchoring
   */
  calculatePriceScore(agent, product) {
    const priceSensitivity = agent.price_sensitivity || 0.5;
    const productPrice = product.price || 0;

    // Normalize price (assuming max price of 100 for normalization)
    const normalizedPrice = Math.min(productPrice / 100.0, 1.0);

    // Debug price calculation
    // console.log(`[DEBUG] Price calc for ${product.product_id}: price=$${productPrice}, normalized=${normalizedPrice.toFixed(3)}, sensitivity=${priceSensitivity.toFixed(3)}`);

    // Simplified pricing - focus on core price sensitivity logic
    let priceMultiplier = 1.0;

    // Minor psychological pricing effects (reduced impact)
    if (productPrice.toString().endsWith('9')) {
      priceMultiplier *= 0.98; // Small 2% psychological discount
    }

    // Price-sensitive agents prefer lower prices with stronger reactions
    let baseScore;
    if (priceSensitivity > 0.7) { // Highly price-sensitive
      baseScore = Math.max(0, 1.0 - normalizedPrice * 2.0); // More aggressive price sensitivity
    } else if (priceSensitivity > 0.4) { // Moderately price-sensitive
      baseScore = Math.max(0, 1.0 - normalizedPrice * 1.4);
    } else { // Less price-sensitive
      baseScore = Math.max(0, 1.0 - normalizedPrice * 0.6); // Less sensitive to price
    }

    return baseScore * priceMultiplier;
  }

  /**
   * Calculate quality-based score considering agent's quality preference
   */
  calculateQualityScore(agent, product) {
    const qualityPreference = agent.quality_preference || 0.5;
    const productQuality = product.quality || 0.5;

    // Quality-focused agents get higher scores for high-quality products
    if (qualityPreference > 0.7) { // High quality preference
      return productQuality * 1.3;
    } else if (qualityPreference > 0.4) { // Moderate quality preference
      return productQuality * 1.1;
    } else { // Low quality preference
      return productQuality * 0.9;
    }
  }

  /**
   * Calculate popularity-based score
   */
  calculatePopularityScore(product) {
    return product.popularity_score || 0.5;
  }

  /**
   * Calculate category preference score
   */
  calculateCategoryScore(product) {
    const category = product.category || '';
    return this.categoryPreferences[category] || 0.5;
  }

  /**
   * Calculate substitute tolerance factor
   */
  calculateSubstituteToleranceFactor(agent, products, currentProduct) {
    const substituteTolerance = agent.substitute_tolerance || 0.5;

    // Find similar products (same category, different brand)
    const currentCategory = currentProduct.category || '';
    const currentBrand = currentProduct.brand || '';

    const similarProducts = products.filter(p =>
      p.category === currentCategory && p.brand !== currentBrand
    );

    if (similarProducts.length === 0) {
      return 1.0; // No substitutes available
    }

    // Calculate average quality of substitutes
    const avgSubstituteQuality = similarProducts.reduce((sum, p) => sum + (p.quality || 0.5), 0) / similarProducts.length;
    const currentQuality = currentProduct.quality || 0.5;

    // If current product is much better than substitutes, high tolerance helps
    const qualityDiff = currentQuality - avgSubstituteQuality;

    if (qualityDiff > 0.2) { // Current product is much better
      return 1.0 + substituteTolerance * 0.3;
    } else if (qualityDiff < -0.2) { // Substitutes are much better
      return 1.0 - substituteTolerance * 0.4;
    } else { // Similar quality
      return 1.0;
    }
  }

  /**
   * Calculate bonus based on market context
   */
  calculateMarketContextBonus(marketContext, product) {
    let context;
    try {
      context = typeof marketContext === 'string' ? JSON.parse(marketContext) : marketContext;
    } catch {
      return 0.0;
    }

    let bonus = 0.0;

    // Price drop bonus
    if (context.price && product.price) {
      const contextPrice = context.price;
      const currentPrice = product.price;
      if (currentPrice < contextPrice) {
        bonus += 0.2; // 20% bonus for price drops
      }
    }

    // Brand match bonus
    if (context.brand && context.brand === product.brand) {
      bonus += 0.15; // 15% bonus for brand match
    }

    // Category match bonus
    if (context.category && context.category === product.category) {
      bonus += 0.1; // 10% bonus for category match
    }

    return Math.min(bonus, 0.5); // Cap at 50% bonus
  }

  /**
   * Calculate impulse buying factor based on human psychology (deterministic)
   */
  calculateImpulseFactor(agent, product) {
    // Base impulse factor (use agent_id for consistent "personality")
    const agentId = agent.agent_id || 'default';
    const agentHash = agentId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const personalityFactor = 0.95 + (agentHash % 100) / 1000; // 0.95-1.05 based on agent ID

    // Price-sensitive people are less impulsive with expensive items
    const priceSensitivity = agent.price_sensitivity || 0.5;
    const productPrice = product.price || 0;

    let baseImpulse = personalityFactor;

    if (priceSensitivity > 0.6 && productPrice > 50) {
      baseImpulse *= 0.9; // More deliberate with expensive purchases
    } else if (priceSensitivity < 0.4 && productPrice < 30) {
      baseImpulse *= 1.05; // More impulsive with cheap items
    }

    // Popular products trigger more impulse buying (FOMO)
    const popularity = product.popularity_score || 0.5;
    if (popularity > 0.8) {
      baseImpulse *= 1.05; // Fear of missing out
    }

    // Recent purchase of similar items reduces impulse
    const recencyScore = this.calculateRecencyScore(agent, product);
    if (recencyScore > 0.7) {
      baseImpulse *= 0.95; // Recently purchased similar items - less impulsive
    }

    return baseImpulse;
  }

  /**
   * Simulate mood effects on purchasing decisions (deterministic)
   */
  calculateMoodFactor(agent) {
    // Use agent characteristics for consistent "mood"
    const priceSensitivity = agent.price_sensitivity || 0.5;
    const qualityPreference = agent.quality_preference || 0.5;

    // Consider recent purchase satisfaction for mood
    const memory = agent.memory || [];
    const recentPurchases = memory.filter(m =>
      m.action === 'buy' &&
      (new Date() - new Date(m.timestamp)) / (1000 * 60 * 60 * 24) <= 7 // Last 7 days
    );

    let moodAdjustment = 1.0;
    if (recentPurchases.length > 0) {
      const avgRecentSatisfaction = recentPurchases.reduce((sum, p) => sum + (p.satisfaction || 0.5), 0) / recentPurchases.length;
      moodAdjustment = 0.9 + (avgRecentSatisfaction * 0.2); // 0.9 to 1.1 range based on recent satisfaction
    }

    // Create a consistent mood based on agent personality
    let moodFactor = 0.95 + (priceSensitivity + qualityPreference) * 0.1; // 0.95-1.15 range

    // Quality-focused people are more consistent (less mood-dependent)
    if (qualityPreference > 0.7) {
      moodFactor = 0.8 * moodFactor + 0.2 * 1.0; // Pull towards 1.0
    }

    return moodFactor * moodAdjustment;
  }

  /**
   * Calculate expected satisfaction based on score and agent preferences
   */
  calculateSatisfaction(totalScore, agent, product) {
    let baseSatisfaction = Math.min(Math.max(totalScore, 0.0), 1.0);

    // Adjust based on agent preferences
    const qualityPreference = agent.quality_preference || 0.5;
    const priceSensitivity = agent.price_sensitivity || 0.5;

    // Quality-focused agents get higher satisfaction for high-quality products
    if (qualityPreference > 0.7 && (product.quality || 0.5) > 0.8) {
      baseSatisfaction *= 1.2;
    }

    // Price-sensitive agents get higher satisfaction for good deals
    if (priceSensitivity > 0.7 && totalScore > 0.7) {
      baseSatisfaction *= 1.1;
    }

    // Consider historical satisfaction with similar products
    const memory = agent.memory || [];
    const similarPurchases = memory.filter(m =>
      m.action === 'buy' &&
      m.product_id &&
      m.product_id.startsWith(product.brand?.slice(0, 5) || '')
    );

    if (similarPurchases.length > 0) {
      const avgHistoricalSatisfaction = similarPurchases.reduce((sum, p) => sum + (p.satisfaction || 0.5), 0) / similarPurchases.length;
      baseSatisfaction = (baseSatisfaction * 0.7) + (avgHistoricalSatisfaction * 0.3); // Weighted average
    }

    return Math.min(Math.max(baseSatisfaction, 0.0), 1.0);
  }

  /**
   * Generate a human-readable rationale for the decision
   */
  generateRationale(agent, product, action, satisfaction, totalScore) {
    const priceSensitivity = agent.price_sensitivity || 0.5;
    const qualityPreference = agent.quality_preference || 0.5;
    const brandLoyalty = agent.brand_loyalty || {};
    const productBrand = product.brand || '';

    if (action === 'buy') {
      const reasons = [];

      // Price reasons
      if (priceSensitivity > 0.6) {
        reasons.push("good price");
      } else if (priceSensitivity < 0.4) {
        reasons.push("premium pricing acceptable");
      }

      // Quality reasons
      if (qualityPreference > 0.6 && (product.quality || 0.5) > 0.7) {
        reasons.push("high quality");
      } else if (qualityPreference < 0.4) {
        reasons.push("adequate quality");
      }

      // Brand loyalty reasons
      const brandLoyaltyScore = brandLoyalty[productBrand] || 0;
      if (brandLoyaltyScore > 0.6) {
        reasons.push(`strong ${productBrand} loyalty`);
      } else if (brandLoyaltyScore > 0.3) {
        reasons.push(`moderate ${productBrand} preference`);
      }

      // Purchase frequency reasons
      const frequencyScore = this.calculatePurchaseFrequencyScore(agent, product);
      if (frequencyScore > 0.7) {
        reasons.push("frequent purchase pattern");
      }

      // Inventory reasons
      const inventoryScore = this.calculateEnhancedInventoryScore(agent, product);
      if (inventoryScore > 0.1) {
        reasons.push("replenishment needed");
      }

      // Popularity reasons
      if ((product.popularity_score || 0.5) > 0.8) {
        reasons.push("popular choice");
      }

      if (reasons.length > 0) {
        return `Chose ${product.product_id || 'product'} due to ${reasons.join(', ')}`;
      } else {
        return `Chose ${product.product_id || 'product'} based on overall appeal`;
      }
    } else {
      const reasons = [];

      if (priceSensitivity > 0.6 && (product.price || 0) > 50) {
        reasons.push("price too high");
      }
      if (qualityPreference > 0.6 && (product.quality || 0.5) < 0.6) {
        reasons.push("insufficient quality");
      }
      if ((brandLoyalty[productBrand] || 0) < 0.2) {
        reasons.push(`low ${productBrand} preference`);
      }

      // Check inventory saturation
      const inventoryScore = this.calculateEnhancedInventoryScore(agent, product);
      if (inventoryScore < -0.1) {
        reasons.push("already have sufficient stock");
      }

      if (reasons.length > 0) {
        return `Passed on ${product.product_id || 'product'} due to ${reasons.join(', ')}`;
      } else {
        return `Passed on ${product.product_id || 'product'} - not appealing`;
      }
    }
  }

  /**
   * Make a decision for a single agent with comprehensive analysis
   */
  makeDecision(agent, products, marketContext = "{}") {
    if (!products || products.length === 0) {
      return {
        agent_id: agent.agent_id || 'unknown',
        action: 'not buy',
        product_id: null,
        satisfaction: 0.0,
        rationale: 'No products available'
      };
    }

    // Debug logging
    const agentId = agent.agent_id || 'unknown';
    // console.log(`[DEBUG] Agent ${agentId} evaluating ${products.length} products with comprehensive analysis`);

    const allScores = [];

    // Calculate scores for all products
    for (const product of products) {
      // Calculate individual component scores
      const priceScore = this.calculatePriceScore(agent, product);
      const qualityScore = this.calculateQualityScore(agent, product);
      const brandScore = this.calculateEnhancedBrandLoyaltyScore(agent, product);
      const frequencyScore = this.calculatePurchaseFrequencyScore(agent, product);
      const inventoryScore = this.calculateEnhancedInventoryScore(agent, product);
      const recencyScore = this.calculateRecencyScore(agent, product);
      const popularityScore = this.calculatePopularityScore(product);
      const categoryScore = this.calculateCategoryScore(product);

      // Calculate substitute tolerance factor
      const substituteFactor = this.calculateSubstituteToleranceFactor(agent, products, product);

      // Calculate market context bonus
      const contextBonus = this.calculateMarketContextBonus(marketContext, product);

      // Calculate weighted total score
      const baseScore = (
        priceScore * this.weights.price_weight +
        qualityScore * this.weights.quality_weight +
        brandScore * this.weights.brand_loyalty_weight +
        frequencyScore * this.weights.purchase_frequency_weight +
        inventoryScore * this.weights.inventory_weight +
        recencyScore * this.weights.recency_weight +
        popularityScore * this.weights.popularity_weight +
        categoryScore * this.weights.category_preference_weight
      ) * substituteFactor + contextBonus;

      // Apply human behavior factors
      const impulseFactor = this.calculateImpulseFactor(agent, product);
      const moodFactor = this.calculateMoodFactor(agent);

      const totalScore = baseScore * impulseFactor * moodFactor;

      // Enhanced debug logging
      // console.log(`[DEBUG] Product ${product.product_id} (${product.category}, $${product.price}): score=${totalScore.toFixed(3)} (price=${priceScore.toFixed(3)}, quality=${qualityScore.toFixed(3)}, loyalty=${brandScore.toFixed(3)}, freq=${frequencyScore.toFixed(3)}, inv=${inventoryScore.toFixed(3)})`);

      allScores.push({ product, score: totalScore });
    }

    // Sort by score - always choose the best option for predictable behavior
    allScores.sort((a, b) => b.score - a.score);

    // Choose the best scoring product (most logical choice)
    const { product: chosenProduct, score: chosenScore } = allScores[0];

    // Make decision based on fixed threshold (no randomness for predictability)
    const decisionThreshold = this.thresholds.buy_threshold;

    let action, productId, satisfaction;

    if (chosenScore >= decisionThreshold) {
      action = 'buy';
      productId = chosenProduct.product_id;
      satisfaction = this.calculateSatisfaction(chosenScore, agent, chosenProduct);
    } else {
      action = 'not buy';
      productId = null;
      satisfaction = 0.0;
    }

    // Generate rationale
    const rationale = this.generateRationale(agent, chosenProduct || {}, action, satisfaction, chosenScore);

    // Debug final decision
    // console.log(`[DEBUG] Agent ${agentId} decision: ${action} ${productId || 'nothing'} (score=${chosenScore.toFixed(3)}, threshold=${decisionThreshold})`);

    return {
      agent_id: agent.agent_id || 'unknown',
      action: action,
      product_id: productId,
      satisfaction: satisfaction,
      rationale: rationale
    };
  }

  /**
   * Make decisions for a batch of agents
   */
  makeBatchDecisions(agentProfiles, products, marketContext = "{}") {
    const decisions = [];

    for (const agent of agentProfiles) {
      try {
        const decision = this.makeDecision(agent, products, marketContext);
        decisions.push(decision);
      } catch (error) {
        console.error(`Error making decision for agent ${agent.agent_id || 'unknown'}:`, error);
        // Fallback decision
        decisions.push({
          agent_id: agent.agent_id || 'unknown',
          action: 'not buy',
          product_id: null,
          satisfaction: 0.0,
          rationale: 'Error in decision making'
        });
      }
    }

    return decisions;
  }
}

// Convenience function for easy integration
async function makeComprehensiveFallbackDecisions(agentProfiles, products, marketContext = "{}") {
  const decisionMaker = new ComprehensiveFallbackDecisionMaker();
  return decisionMaker.makeBatchDecisions(agentProfiles, products, marketContext);
}

module.exports = {
  ComprehensiveFallbackDecisionMaker,
  makeComprehensiveFallbackDecisions
};
