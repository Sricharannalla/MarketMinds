// const axios = require('axios');
// const Product = require('../models/products');
// const ConsumerAgent = require('../models/consumer_agents');
// const MarketChange = require('../models/marketchange');

// function aggregateProfiles(agents) {
//   const n = agents.length;
//   if (n === 0) {
//     return {
//       price_sensitivity: 0.5,
//       quality_preference: 0.5,
//       brand_loyalty: {},
//       substitute_tolerance: 0.5
//     };
//   }
//   const agg = {
//     price_sensitivity: agents.reduce((sum, a) => sum + a.preferences.price_sensitivity, 0) / n,
//     quality_preference: agents.reduce((sum, a) => sum + a.preferences.quality_preference, 0) / n,
//     brand_loyalty: {},
//     substitute_tolerance: agents.reduce((sum, a) => sum + a.preferences.substitute_tolerance, 0) / n
//   };
//   const allBrands = new Set();
//   agents.forEach(a => Object.keys(a.preferences.brand_loyalty).forEach(b => allBrands.add(b)));
//   allBrands.forEach(brand => {
//     agg.brand_loyalty[brand] = agents.reduce((sum, a) => sum + (a.preferences.brand_loyalty[brand] || 0), 0) / n;
//   });
//   return agg;
// }

// function rankProducts(products, aggregatedProfile, topN = 10) {
//   const maxPrice = Math.max(...products.map(p => p.price), 100);
//   const categories = [...new Set(products.map(p => p.category))];
//   let rankedProducts = [];
//   for (const category of categories) {
//     const catProducts = products.filter(p => p.category === category);
//     const ranked = catProducts.map(product => {
//       let score = (1 - aggregatedProfile.price_sensitivity) * (1 - product.price / maxPrice);
//       score += aggregatedProfile.quality_preference * product.quality;
//       score += (aggregatedProfile.brand_loyalty[product.brand] || 0) * 0.5;
//       score += (product.popularity_score || 0) * 0.3;
//       return { product, score };
//     });
//     ranked.sort((a, b) => b.score - a.score);
//     rankedProducts.push(...ranked.slice(0, topN).map(item => ({
//       product_id: item.product.product_id,
//       brand: item.product.brand,
//       price: item.product.price,
//       quality: item.product.quality,
//       category: item.product.category,
//       popularity_score: item.product.popularity_score || 0
//     })));
//   }
//   return rankedProducts;
// }

// exports.getDashboardData = async (req, res) => {
//   // console.log("in dashboard controller");
//   try {
//     const { staged } = req.query;
//     const isStaged = staged === 'true';

//     const products = await Product.find({ isStaged, companyId: req.user.id });
//     const agents = await ConsumerAgent.find();
//     const changes = await MarketChange.find({ companyId: req.user.id, committed: !isStaged });
    
//     let totalSales = 0, avgSatisfaction = 0, totalLoyalty = 0;
//     const categorySales = {};

//     // === Process Each Consumer Agent ===
//     agents.forEach(agent => {
//       let agentSales = 0;

//       const countedProducts = new Set();

//       // 1️⃣ Memory-based purchases
//       agent.memory
//         .filter(m => m.action === "buy")
//         .forEach(buy => {
//           const product = products.find(p => String(p.product_id) === String(buy.product_id));
//           if (product) {
//             const qty = agent.current_inventory?.[buy.product_id] || 1;
//             const saleAmount = product.price * qty;

//             totalSales += saleAmount;
//             agentSales += saleAmount;

//             categorySales[product.category] = (categorySales[product.category] || 0) + saleAmount;

//             countedProducts.add(buy.product_id);
//           }
//         });

//       // 2️⃣ Inventory-based products not in memory
//       Object.entries(agent.current_inventory || {}).forEach(([product_id, qty]) => {
//         if (qty > 0 && !countedProducts.has(product_id)) {
//           const product = products.find(p => String(p.product_id) === String(product_id));
//           if (product) {
//             const saleAmount = product.price * qty;

//             totalSales += saleAmount;
//             agentSales += saleAmount;

//             categorySales[product.category] = (categorySales[product.category] || 0) + saleAmount;
//           }
//         }
//       });

//       // 3️⃣ Satisfaction
//       const satisfactions = agent.memory.map(m => m.satisfaction || 0);
//       avgSatisfaction += satisfactions.reduce((a, b) => a + b, 0) / (satisfactions.length || 1);

//       // 4️⃣ Brand loyalty
//       const loyaltyScores = Object.values(agent.preferences?.brand_loyalty || {})
//         .map(v => parseFloat(v))
//         .filter(v => !isNaN(v));

//       const avgAgentLoyalty = loyaltyScores.length > 0
//         ? loyaltyScores.reduce((a, b) => a + b, 0) / loyaltyScores.length
//         : 0;

//       totalLoyalty += avgAgentLoyalty;
//     });

//     // 5️⃣ Aggregate overall metrics
//     avgSatisfaction = agents.length ? avgSatisfaction / agents.length : 0;
//     const avgLoyalty = agents.length ? totalLoyalty / agents.length : 0;

//     // const aggregatedProfile = aggregateProfiles(agents);
//     // const rankedProducts = rankProducts(products, aggregatedProfile);

//     // console.log("so far so good");
//     // const response = await axios.post(`${process.env.python_url}/predict`, {
//     //   agent_profiles: agents.map(agent => ({
//     //     agent_id: agent.agent_id,
//     //     price_sensitivity: agent.preferences.price_sensitivity,
//     //     quality_preference: agent.preferences.quality_preference,
//     //     substitute_tolerance: agent.preferences.substitute_tolerance,
//     //     brand_loyalty: agent.preferences.brand_loyalty,
//     //     current_inventory: agent.current_inventory || {}
//     //   })),
//     //   products: rankedProducts,
//     //   market_context: ''
//     // });

//     // const decisions = response.data.decisions || [];
//     const metrics = {
//       totalSales: totalSales.toFixed(1),
//       avgSatisfaction: avgSatisfaction.toFixed(1),
//       avgLoyalty: avgLoyalty.toFixed(1),
//       categorySales: Object.entries(categorySales).map(([category, sales]) => ({ category, sales })),
//       recentChanges: changes.slice(0, 5).map(change => ({
//         change_type: change.change_type,
//         details: change.details,
//         timestamp: change.timestamp
//       }))
//     };
//     // console.log(metrics);
//     res.json(metrics);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: error.message });
//   }
// };

const Product = require('../models/products');
const ConsumerAgent = require('../models/consumer_agents');
const MarketChange = require('../models/marketchange');

/**
 * Dashboard Controller
 * - Computes total sales, category sales, satisfaction, loyalty
 * - Only includes products belonging to current user company
 */
exports.getDashboardData = async (req, res) => {
  try {
    // Fetch all products for the current company
    const products = await Product.find({ companyId: req.user.id });

    // Fetch all agents with projection to reduce memory overhead and speed up query
    const agents = await ConsumerAgent.find({}, { memory: 1, preferences: 1 });

    // Fetch market changes for history
    const marketChanges = await MarketChange.find({ companyId: req.user.id, committed: true })
      .sort({ timestamp: -1 })
      .limit(10);

    // Initialize metrics
    let totalSales = 0;
    let totalSatisfaction = 0;
    let totalLoyalty = 0;
    const categorySales = {};
    const productSales = {};
    const salesTimeline = [];
    let satisfactionCount = 0;

    // Process each agent - count total transactions and loyalty scores properly
    let totalPurchaseTransactions = 0;
    let totalLoyaltyEntries = 0;

    agents.forEach((agent, agentIndex) => {
      // MEMORY PURCHASES - Only count actual purchase transactions
      const buys = agent.memory.filter(m => m.action === 'buy');
      buys.forEach(buy => {
        const product = products.find(p => String(p.product_id) === String(buy.product_id));
        if (product) {
          // Sales calculation: Only count actual purchases, not inventory value
          totalSales += product.price;
          categorySales[product.category] = (categorySales[product.category] || 0) + product.price;
          productSales[product.product_id] = (productSales[product.product_id] || 0) + product.price;
          totalPurchaseTransactions++;

          // SATISFACTION - get from the actual buy record
          const satisfaction = parseFloat(buy.satisfaction) || 0;
          if (satisfaction > 0) {
            totalSatisfaction += satisfaction;
            satisfactionCount++;
          }
        }
      });

      // LOYALTY - First, let's debug what loyalty data exists
      console.log(`[DEBUG] Agent ${agentIndex} preferences:`, agent.preferences);

      // LOYALTY - Calculate from agent's brand preferences (handle both Map and Object)
      if (agent.preferences?.brand_loyalty) {
        // Handle both Map objects and plain objects
        const loyaltyEntries = agent.preferences.brand_loyalty instanceof Map
          ? Array.from(agent.preferences.brand_loyalty.entries())
          : Object.entries(agent.preferences.brand_loyalty);

        loyaltyEntries.forEach(([brand, loyalty]) => {
          const loyaltyValue = parseFloat(loyalty) || 0;
          console.log(`[DEBUG] Brand ${brand} loyalty: ${loyaltyValue}`);
          if (loyaltyValue > 0) {
            totalLoyalty += loyaltyValue;
            totalLoyaltyEntries++;
          }
        });
      } else {
        // Fallback: Calculate loyalty from purchase patterns
        const brandPurchaseCounts = {};
        buys.forEach(buy => {
          const product = products.find(p => String(p.product_id) === String(buy.product_id));
          if (product) {
            brandPurchaseCounts[product.brand] = (brandPurchaseCounts[product.brand] || 0) + 1;
          }
        });

        // Calculate loyalty score based on repeat purchases
        Object.values(brandPurchaseCounts).forEach(count => {
          if (count > 1) {
            // Give loyalty points for repeat purchases (simple heuristic)
            const loyaltyValue = Math.min(count * 0.2, 1.0); // Scale to 0-1
            totalLoyalty += loyaltyValue;
            totalLoyaltyEntries++;
          }
        });

        console.log(`[DEBUG] Calculated loyalty from purchase patterns for agent ${agentIndex}:`, brandPurchaseCounts);
      }
    });

    console.log(`[DEBUG] Total purchase transactions: ${totalPurchaseTransactions}`);
    console.log(`[DEBUG] Total loyalty entries: ${totalLoyaltyEntries}`);
    console.log(`[DEBUG] Total satisfaction records: ${satisfactionCount}`);

     
    // Create sales timeline from market changes with accurate impact calculation
    marketChanges.forEach((change, index) => {
      let estimatedSalesImpact = 0;
      
      if (change.simulatedDecisions && change.simulatedDecisions.length > 0) {
        // Calculate actual sales impact from simulation decisions
        estimatedSalesImpact = change.simulatedDecisions
          .filter(d => d.action === 'buy')
          .reduce((total, decision) => {
            const product = products.find(p => p.product_id === decision.product_id);
            return total + (product ? product.price : 0);
          }, 0);
      }
      
      salesTimeline.push({
        timestamp: change.timestamp,
        changeType: change.change_type,
        details: change.details,
        estimatedSalesImpact
      });
    });

    // Calculate top products using weighted algorithm (70% sales, 30% satisfaction)
    const topProducts = Object.entries(productSales)
      .map(([productId, sales]) => {
        const product = products.find(p => p.product_id === productId);
        if (!product) return null;

        // Calculate satisfaction for this product from all purchases
        let productSatisfaction = 0;
        let satisfactionCount = 0;

        agents.forEach(agent => {
          const buys = agent.memory.filter(m => m.action === 'buy' && m.product_id === productId);
          buys.forEach(buy => {
            if (buy.satisfaction > 0) {
              productSatisfaction += parseFloat(buy.satisfaction) || 0;
              satisfactionCount++;
            }
          });
        });

        const avgProductSatisfaction = satisfactionCount > 0 ? productSatisfaction / satisfactionCount : 0;
        const normalizedSatisfaction = avgProductSatisfaction <= 1 ? avgProductSatisfaction * 5 : avgProductSatisfaction;

        // Weighted score: 70% sales, 30% satisfaction
        const weightedScore = (sales * 0.7) + (normalizedSatisfaction * 0.3);

        return {
          productId,
          productName: `${product.brand} - ${product.product_id}`,
          brand: product.brand,
          category: product.category,
          price: product.price,
          sales,
          avgSatisfaction: parseFloat(((avgProductSatisfaction <= 1 ? avgProductSatisfaction * 100 : (avgProductSatisfaction / 5) * 100)).toFixed(1))
        };
      })
      .filter(product => product !== null && product.sales > 0)
      .sort((a, b) => b.sales - a.sales)  // Sort by sales since we removed score
      .slice(0, 10);

    console.log('DEBUG: Enhanced topProducts algorithm applied');
    console.log('DEBUG: topProducts with weighted scoring:', topProducts.slice(0, 3));

    // Calculate final averages accurately
    const avgSatisfaction = satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0;
    const avgLoyalty = totalLoyaltyEntries > 0 ? totalLoyalty / totalLoyaltyEntries : 0;

    console.log('DEBUG: Raw avgSatisfaction:', avgSatisfaction);
    console.log('DEBUG: Raw avgLoyalty:', avgLoyalty);

    // Convert both satisfaction and loyalty to percentages for consistency
    let finalSatisfactionPercent, finalLoyaltyPercent;

    // Convert satisfaction to percentage (0-100%)
    if (avgSatisfaction > 0 && avgSatisfaction <= 1) {
      // Values are 0-1 scale, convert to percentage
      finalSatisfactionPercent = avgSatisfaction * 100;
    } else if (avgSatisfaction > 1 && avgSatisfaction <= 5) {
      // Values are 0-5 scale, convert to percentage
      finalSatisfactionPercent = (avgSatisfaction / 5) * 100;
    } else {
      // Fallback for unexpected scale
      finalSatisfactionPercent = Math.min(avgSatisfaction * 20, 100);
    }

    // Convert loyalty to percentage (0-100%)
    if (avgLoyalty <= 1) {
      finalLoyaltyPercent = avgLoyalty * 100;
    } else {
      // If loyalty is on different scale, normalize
      finalLoyaltyPercent = Math.min(avgLoyalty, 100);
    }

    // Format category sales
    const formattedCategorySales = Object.entries(categorySales).map(
      ([category, sales]) => ({ category, sales })
    );

    // const changes = await MarketChange.find({ companyId: req.user.id, committed: !isStaged });

    const metrics = {
      totalSales,
      avgSatisfaction: parseFloat(finalSatisfactionPercent.toFixed(1)),
      avgLoyalty: parseFloat(finalLoyaltyPercent.toFixed(1)),
      categorySales: Object.entries(categorySales).map(([category, sales]) => ({ category, sales })),
      topProducts,
      salesTimeline,
      totalAgents: agents.length,
      totalProducts: products.length,
      recentChanges: marketChanges.slice(0, 5).map(change => ({
        change_type: change.change_type,
        details: change.details,
        timestamp: change.timestamp,
        committed: change.committed
      }))
    };

    console.log(metrics);
    res.json(metrics);
  } catch(error) {
    res.status(500).json({ error: error.message });
  }
};
