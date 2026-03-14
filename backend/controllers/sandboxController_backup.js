// // const axios = require('axios');
// // const mongoose = require('mongoose');
// // const Product = require('../models/products');
// // const ConsumerAgent = require('../models/consumer_agents');
// // const MarketChange = require('../models/marketchange');


// // function aggregateProfiles(agents) {
// //   const n = agents.length;
// //   if (n === 0) {
// //     return {
// //       price_sensitivity: 0.5,
// //       quality_preference: 0.5,
// //       brand_loyalty: {},
// //       substitute_tolerance: 0.5
// //     };
// //   }
// //   const agg = {
// //     price_sensitivity: agents.reduce((sum, a) => sum + a.preferences.price_sensitivity, 0) / n,
// //     quality_preference: agents.reduce((sum, a) => sum + a.preferences.quality_preference, 0) / n,
// //     brand_loyalty: {},
// //     substitute_tolerance: agents.reduce((sum, a) => sum + a.preferences.substitute_tolerance, 0) / n
// //   };
// //   const allBrands = new Set();
// //   agents.forEach(a => Object.keys(a.preferences.brand_loyalty).forEach(b => allBrands.add(b)));
// //   allBrands.forEach(brand => {
// //     agg.brand_loyalty[brand] = agents.reduce((sum, a) => sum + (a.preferences.brand_loyalty[brand] || 0), 0) / n;
// //   });
// //   return agg;
// // }

// // function rankProducts(products, aggregatedProfile, topN = 10) {
// //   const maxPrice = Math.max(...products.map(p => p.price), 100);
// //   const categories = [...new Set(products.map(p => p.category))];
// //   let rankedProducts = [];
// //   for (const category of categories) {
// //     const catProducts = products.filter(p => p.category === category);
// //     const ranked = catProducts.map(product => {
// //       let score = (1 - aggregatedProfile.price_sensitivity) * (1 - product.price / maxPrice);
// //       score += aggregatedProfile.quality_preference * product.quality;
// //       score += (aggregatedProfile.brand_loyalty[product.brand] || 0) * 0.5;
// //       score += (product.popularity_score || 0) * 0.3;
// //       return { product, score };
// //     });
// //     ranked.sort((a, b) => b.score - a.score);
// //     rankedProducts.push(...ranked.slice(0, topN).map(item => ({
// //       product_id: item.product.product_id,
// //       brand: item.product.brand,
// //       price: item.product.price,
// //       quality: item.product.quality,
// //       category: item.product.category,
// //       popularity_score: item.product.popularity_score || 0
// //     })));
// //   }
// //   return rankedProducts;
// // }

// // exports.stageChange = async (req, res) => {
// //   try {
// //     const { change_type, details } = req.body;
// //     if (!['price_drop', 'new_product', 'update', 'remove'].includes(change_type)) {
// //       return res.status(400).json({ error: 'Invalid change_type' });
// //     }

// //     let product;
// //     if (change_type === 'price_drop' || change_type === 'update') {
// //       product = await Product.findOne({ product_id: details.product_id, companyId: req.user.id });
// //       if (!product) return res.status(404).json({ error: 'Product not found' });
// //       await Product.findOneAndUpdate(
// //         { product_id: details.product_id, companyId: req.user.id },
// //         { ...details, isStaged: true },
// //         { new: true }
// //       );
// //     } else if (change_type === 'new_product') {
// //       product = new Product({ ...details, companyId: req.user.id, isStaged: true });
// //       await product.save();
// //     } else if (change_type === 'remove') {
// //       product = await Product.findOne({ product_id: details.product_id, companyId: req.user.id });
// //       if (!product) return res.status(404).json({ error: 'Product not found' });
// //       await Product.findOneAndUpdate(
// //         { product_id: details.product_id, companyId: req.user.id },
// //         { isStaged: true, price: 0 },
// //         { new: true }
// //       );
// //     }

// //     const marketChange = new MarketChange({
// //       change_type,
// //       details,
// //       companyId: req.user.id,
// //       committed: false
// //     });
// //     await marketChange.save();
// //     res.json({ success: true, change: marketChange });
// //   } catch (error) {
// //     res.status(400).json({ error: error.message });
// //   }
// // };

// // // exports.previewStaged = async (req, res) => {
// // //   try {
// // //     const { change_id } = req.body;

// // //     if (!mongoose.Types.ObjectId.isValid(change_id)) {
// // //       return res.status(400).json({ error: 'Invalid change_id' });
// // //     }


// // //     const marketChange = await MarketChange.findById(change_id);
// // //     console.log('MarketChange companyId:', marketChange.companyId);
// // //     console.log('req.user.id:', req.user.id);

// // //     if (!marketChange || marketChange.companyId.toString() !== req.user.id) {
// // //       return res.status(404).json({ error: 'Change not found' });
// // //     }

// // //     // proceed with preview logic
// // //     res.status(200).json({ success: true, change: marketChange });

// // //     // const marketChange = await MarketChange.findById(change_id);
// // //     // if (marketChange === "none"|| marketChange.companyId.toString() !== req.user.id) {
// // //     //   return res.status(404).json({ error: 'Change not found' });
// // //     // }

// // //     // const products = await Product.find({ isStaged: true, companyId: req.user.id });
// // //     // const liveProducts = await Product.find({ isStaged: false, companyId: req.user.id });
// // //     // const agents = await ConsumerAgent.find();
// // //     // const aggregatedProfile = aggregateProfiles(agents);
// // //     // const rankedProducts = rankProducts(products, aggregatedProfile);

// // //     // const batchSize = 50;
// // //     // const batches = [];
// // //     // for (let i = 0; i < agents.length; i += batchSize) {
// // //     //   batches.push(agents.slice(i, i + batchSize));
// // //     // }

// // //     // let beforeSales = 0, afterSales = 0;
// // //     // const beforeSatisfaction = [], afterSatisfaction = [];
// // //     // const beforeLoyalty = [], afterLoyalty = [];
// // //     // const categoryComparisons = {};

// // //     // for (const batch of batches) {
// // //     //   const agentProfiles = batch.map(agent => ({
// // //     //     agent_id: agent.agent_id,
// // //     //     price_sensitivity: agent.preferences.price_sensitivity,
// // //     //     quality_preference: agent.preferences.quality_preference,
// // //     //     substitute_tolerance: agent.preferences.substitute_tolerance,
// // //     //     brand_loyalty: agent.preferences.brand_loyalty,
// // //     //     current_inventory: agent.current_inventory || {}
// // //     //   }));

// // //     //   const response = await axios.post(`${process.env.python_url}/predict`, {
// // //     //     agent_profiles: agentProfiles,
// // //     //     products: rankedProducts,
// // //     //     market_context: JSON.stringify(marketChange.details)
// // //     //   });

// // //     //   const decisions = response.data.decisions || [];
// // //     //   decisions.forEach(decision => {
// // //     //     if (decision.action === 'buy') {
// // //     //       const product = rankedProducts.find(p => p.product_id === decision.product_id);
// // //     //       if (product) {
// // //     //         beforeSales += product.price;
// // //     //         categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
// // //     //         categoryComparisons[product.category].beforeSales += product.price;
// // //     //         beforeSatisfaction.push(decision.satisfaction || 0);
// // //     //       }
// // //     //     }
// // //     //     if (decision.product_id) {
// // //     //       const brand = rankedProducts.find(p => p.product_id === decision.product_id)?.brand;
// // //     //       if (brand) {
// // //     //         const agent = batch.find(a => a.agent_id === decision.agent_id);
// // //     //         beforeLoyalty.push(agent?.preferences.brand_loyalty[brand] || 0);
// // //     //       }
// // //     //     }
// // //     //   });
// // //     // }

// // //     // for (const agent of agents) {
// // //     //   if (agent.stagedUpdates && agent.stagedUpdates.new_action === 'buy') {
// // //     //     const product = products.find(p => p.product_id === agent.stagedUpdates.new_product_id);
// // //     //     if (product) {
// // //     //       afterSales += product.price;
// // //     //       categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
// // //     //       categoryComparisons[product.category].afterSales += product.price;
// // //     //       afterSatisfaction.push(agent.stagedUpdates.new_satisfaction || 0);
// // //     //     }
// // //     //     if (agent.stagedUpdates.new_product_id) {
// // //     //       const brand = products.find(p => p.product_id === agent.stagedUpdates.new_product_id)?.brand;
// // //     //       if (brand) {
// // //     //         const currentLoyalty = agent.preferences.brand_loyalty[brand] || 0;
// // //     //         afterLoyalty.push(currentLoyalty + (agent.stagedUpdates.loyalty_adjust || 0));
// // //     //       }
// // //     //     }
// // //     //   }
// // //     // }

// // //     // const metrics = {
// // //     //   salesChange: afterSales - beforeSales,
// // //     //   satisfactionDiff: (afterSatisfaction.reduce((a, b) => a + b, 0) / (afterSatisfaction.length || 1)) -
// // //     //                     (beforeSatisfaction.reduce((a, b) => a + b, 0) / (beforeSatisfaction.length || 1)),
// // //     //   loyaltyDiff: (afterLoyalty.reduce((a, b) => a + b, 0) / (afterLoyalty.length || 1)) -
// // //     //                (beforeLoyalty.reduce((a, b) => a + b, 0) / (beforeLoyalty.length || 1)),
// // //     //   beforeSales,
// // //     //   afterSales,
// // //     //   categoryComparisons: Object.entries(categoryComparisons).map(([category, { beforeSales, afterSales }]) => ({
// // //     //     category,
// // //     //     beforeSales,
// // //     //     afterSales,
// // //     //     change: afterSales - beforeSales
// // //     //   }))
// // //     // };

// // //     // res.json({ metrics, stagedProducts: products, change: marketChange });
// // //   } catch (error) {
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };
// // exports.previewStaged = async (req, res) => {
// //   try {
// //     const { change_id } = req.body;

// //     // Validate input
// //     if (!change_id || !mongoose.Types.ObjectId.isValid(change_id)) {
// //       return res.status(400).json({ error: 'Invalid change_id' });
// //     }

// //     // Fetch change
// //     const marketChange = await MarketChange.findById(change_id);
// //     if (!marketChange) {
// //       return res.status(404).json({ error: 'Change not found' });
// //     }

// //     // Ensure the user owns the change
// //     if (!marketChange.companyId || marketChange.companyId.toString() !== req.user.id) {
// //       return res.status(403).json({ error: 'Not authorized for this change' });
// //     }

// //     // Fetch staged products
// //     const products = await Product.find({ isStaged: true, companyId: req.user.id });

// //     // Dummy metrics for now so frontend works (you can expand later)
// //     const metrics = {
// //       salesChange: 0,
// //       loyaltyDiff: 0,
// //       satisfactionDiff: 0,
// //       beforeSales: 0,
// //       afterSales: 0,
// //       categoryComparisons: [],
// //     };

// //     // Return sandbox preview
// //     res.status(200).json({
// //       metrics,
// //       stagedProducts: products,
// //       change: marketChange,
// //     });

// //   } catch (error) {
// //     console.error('previewStaged error:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // };

// // exports.commitChanges = async (req, res) => {
// //   try {
// //     const { change_id } = req.body;
// //     const marketChange = await MarketChange.findById(change_id);
// //     if (marketChange === "none"|| marketChange.companyId.toString() !== req.user.id) {
// //       return res.status(404).json({ error: 'Change not found' });
// //     }

// //     const stagedProducts = await Product.find({ isStaged: true, companyId: req.user.id });
// //     for (const product of stagedProducts) {
// //       if (marketChange.change_type === 'remove' && product.price === 0) {
// //         await Product.deleteOne({ _id: product._id });
// //       } else {
// //         await Product.findByIdAndUpdate(product._id, { isStaged: false });
// //       }
// //     }

// //     const agents = await ConsumerAgent.find();
// //     for (const agent of agents) {
// //       if (agent.stagedUpdates && agent.stagedUpdates.new_satisfaction) {
// //         agent.memory.push({
// //           action: agent.stagedUpdates.new_action,
// //           product_id: agent.stagedUpdates.new_product_id,
// //           satisfaction: agent.stagedUpdates.new_satisfaction,
// //           rationale: agent.stagedUpdates.new_rationale,
// //           timestamp: new Date()
// //         });
// //         if (agent.stagedUpdates.loyalty_adjust) {
// //           const brand = stagedProducts.find(p => p.product_id === agent.stagedUpdates.new_product_id)?.brand;
// //           if (brand) {
// //             const currentLoyalty = agent.preferences.brand_loyalty[brand] || 0;
// //             agent.preferences.brand_loyalty[brand] = Math.min(1, Math.max(0, currentLoyalty + agent.stagedUpdates.loyalty_adjust));
// //           }
// //         }
// //         agent.stagedUpdates = {};
// //         await agent.save();
// //       }
// //     }

// //     marketChange.committed = true;
// //     await marketChange.save();

// //     res.json({ success: true });
// //   } catch (error) {
// //     res.status(500).json({ error: error.message });
// //   }
// // };

// // exports.discardChanges = async (req, res) => {
// //   try {
// //     const { change_id } = req.body;
// //     const marketChange = await MarketChange.findById(change_id);
// //     if (marketChange === "none"|| marketChange.companyId.toString() !== req.user.id) {
// //       return res.status(404).json({ error: 'Change not found' });
// //     }

// //     await Product.deleteMany({ isStaged: true, companyId: req.user.id });
// //     const agents = await ConsumerAgent.find();
// //     for (const agent of agents) {
// //       if (agent.stagedUpdates) {
// //         agent.stagedUpdates = {};
// //         await agent.save();
// //       }
// //     }
// //     await MarketChange.deleteOne({ _id: change_id });

// //     res.json({ success: true });
// //   } catch (error) {
// //     res.status(500).json({ error: error.message });
// //   }
// // };


// const axios = require('axios');
// const mongoose = require('mongoose');
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

// exports.stageChange = async (req, res) => {
//   try {
//     const { change_type, details } = req.body;
//     if (!['price_drop', 'new_product', 'update', 'remove'].includes(change_type)) {
//       return res.status(400).json({ error: 'Invalid change_type' });
//     }

//     let product;
//     if (change_type === 'price_drop' || change_type === 'update') {
//       product = await Product.findOne({ product_id: details.product_id, companyId: req.user.id });
//       if (!product) return res.status(404).json({ error: 'Product not found' });
//       await Product.findOneAndUpdate(
//         { product_id: details.product_id, companyId: req.user.id },
//         { ...details, isStaged: true },
//         { new: true }
//       );
//     } else if (change_type === 'new_product') {
//       product = new Product({ ...details, companyId: req.user.id, isStaged: true });
//       await product.save();
//     } else if (change_type === 'remove') {
//       product = await Product.findOne({ product_id: details.product_id, companyId: req.user.id });
//       if (!product) return res.status(404).json({ error: 'Product not found' });
//       await Product.findOneAndUpdate(
//         { product_id: details.product_id, companyId: req.user.id },
//         { isStaged: true, price: 0 },
//         { new: true }
//       );
//     }

//     const marketChange = new MarketChange({
//       change_type,
//       details,
//       companyId: req.user.id,
//       committed: false
//     });
//     await marketChange.save();
//     res.json({ success: true, change: marketChange });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// exports.previewStaged = async (req, res) => {
//   try {
//     const { change_id } = req.body;

//     // Validate input
//     if (!change_id || !mongoose.Types.ObjectId.isValid(change_id)) {
//       return res.status(400).json({ error: 'Invalid change_id' });
//     }

//     // Fetch change
//     const marketChange = await MarketChange.findById(change_id);
//     if (!marketChange) {
//       return res.status(404).json({ error: 'Change not found' });
//     }

//     // Ensure the user owns the change
//     if (!marketChange.companyId || marketChange.companyId.toString() !== req.user.id) {
//       return res.status(403).json({ error: 'Not authorized for this change' });
//     }

//     // Fetch products
//     const products = await Product.find({ isStaged: true, companyId: req.user.id });
//     const liveProducts = await Product.find({ isStaged: false, companyId: req.user.id });
//     const agents = await ConsumerAgent.find();

//     // Aggregate agent profiles and rank products
//     const aggregatedProfile = aggregateProfiles(agents);
//     const rankedProducts = rankProducts(products, aggregatedProfile);

//     // Batch agents for prediction
//     const batchSize = 50;
//     const batches = [];
//     for (let i = 0; i < agents.length; i += batchSize) {
//       batches.push(agents.slice(i, i + batchSize));
//     }

//     let beforeSales = 0, afterSales = 0;
//     const beforeSatisfaction = [], afterSatisfaction = [];
//     const beforeLoyalty = [], afterLoyalty = [];
//     const categoryComparisons = {};

//     // Process each batch for predictions
//     for (const batch of batches) {
//       const agentProfiles = batch.map(agent => ({
//         agent_id: agent.agent_id,
//         price_sensitivity: agent.preferences.price_sensitivity,
//         quality_preference: agent.preferences.quality_preference,
//         substitute_tolerance: agent.preferences.substitute_tolerance,
//         brand_loyalty: agent.preferences.brand_loyalty,
//         current_inventory: agent.current_inventory || {}
//       }));

//       try {
//         const response = await axios.post(`${process.env.python_url}/predict`, {
//           agent_profiles: agentProfiles,
//           products: rankedProducts,
//           market_context: JSON.stringify(marketChange.details)
//         });

//         const decisions = response.data.decisions || [];
//         decisions.forEach(decision => {
//           if (decision.action === 'buy') {
//             const product = rankedProducts.find(p => p.product_id === decision.product_id);
//             if (product) {
//               beforeSales += product.price;
//               categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
//               categoryComparisons[product.category].beforeSales += product.price;
//               beforeSatisfaction.push(decision.satisfaction || 0);
//             }
//           }
//           if (decision.product_id) {
//             const brand = rankedProducts.find(p => p.product_id === decision.product_id)?.brand;
//             if (brand) {
//               const agent = batch.find(a => a.agent_id === decision.agent_id);
//               beforeLoyalty.push(agent?.preferences.brand_loyalty[brand] || 0);
//             }
//           }
//         });
//       } catch (error) {
//         console.error('Prediction error:', error.message);
//         // Fallback to zero metrics for this batch
//       }
//     }

//     // Process staged updates for after metrics
//     for (const agent of agents) {
//       if (agent.stagedUpdates && agent.stagedUpdates.new_action === 'buy') {
//         const product = products.find(p => p.product_id === agent.stagedUpdates.new_product_id);
//         if (product) {
//           afterSales += product.price;
//           categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
//           categoryComparisons[product.category].afterSales += product.price;
//           afterSatisfaction.push(agent.stagedUpdates.new_satisfaction || 0);
//         }
//         if (agent.stagedUpdates.new_product_id) {
//           const brand = products.find(p => p.product_id === agent.stagedUpdates.new_product_id)?.brand;
//           if (brand) {
//             const currentLoyalty = agent.preferences.brand_loyalty[brand] || 0;
//             afterLoyalty.push(currentLoyalty + (agent.stagedUpdates.loyalty_adjust || 0));
//           }
//         }
//       }
//     }

//     // Compute metrics
//     const metrics = {
//       salesChange: afterSales - beforeSales,
//       satisfactionDiff: (afterSatisfaction.reduce((a, b) => a + b, 0) / (afterSatisfaction.length || 1)) -
//                         (beforeSatisfaction.reduce((a, b) => a + b, 0) / (beforeSatisfaction.length || 1)),
//       loyaltyDiff: (afterLoyalty.reduce((a, b) => a + b, 0) / (afterLoyalty.length || 1)) -
//                    (beforeLoyalty.reduce((a, b) => a + b, 0) / (beforeLoyalty.length || 1)),
//       beforeSales,
//       afterSales,
//       categoryComparisons: Object.entries(categoryComparisons).map(([category, { beforeSales, afterSales }]) => ({
//         category,
//         beforeSales,
//         afterSales,
//         change: afterSales - beforeSales
//       }))
//     };

//     // Return sandbox preview
//     res.status(200).json({
//       metrics,
//       stagedProducts: products,
//       change: marketChange,
//     });
//   } catch (error) {
//     console.error('previewStaged error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.commitChanges = async (req, res) => {
//   try {
//     const { change_id } = req.body;
//     const marketChange = await MarketChange.findById(change_id);
//     if (!marketChange || marketChange.companyId.toString() !== req.user.id) {
//       return res.status(404).json({ error: 'Change not found' });
//     }

//     const stagedProducts = await Product.find({ isStaged: true, companyId: req.user.id });
//     for (const product of stagedProducts) {
//       if (marketChange.change_type === 'remove' && product.price === 0) {
//         await Product.deleteOne({ _id: product._id });
//       } else {
//         await Product.findByIdAndUpdate(product._id, { isStaged: false });
//       }
//     }

//     const agents = await ConsumerAgent.find();
//     for (const agent of agents) {
//       if (agent.stagedUpdates && agent.stagedUpdates.new_satisfaction) {
//         agent.memory.push({
//           action: agent.stagedUpdates.new_action,
//           product_id: agent.stagedUpdates.new_product_id,
//           satisfaction: agent.stagedUpdates.new_satisfaction,
//           rationale: agent.stagedUpdates.new_rationale,
//           timestamp: new Date()
//         });
//         if (agent.stagedUpdates.loyalty_adjust) {
//           const brand = stagedProducts.find(p => p.product_id === agent.stagedUpdates.new_product_id)?.brand;
//           if (brand) {
//             const currentLoyalty = agent.preferences.brand_loyalty[brand] || 0;
//             agent.preferences.brand_loyalty[brand] = Math.min(1, Math.max(0, currentLoyalty + agent.stagedUpdates.loyalty_adjust));
//           }
//         }
//         agent.stagedUpdates = {};
//         await agent.save();
//       }
//     }

//     marketChange.committed = true;
//     await marketChange.save();

//     res.json({ success: true });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.discardChanges = async (req, res) => {
//   try {
//     const { change_id } = req.body;
//     const marketChange = await MarketChange.findById(change_id);
//     if (!marketChange || marketChange.companyId.toString() !== req.user.id) {
//       return res.status(404).json({ error: 'Change not found' });
//     }

//     await Product.deleteMany({ isStaged: true, companyId: req.user.id });
//     const agents = await ConsumerAgent.find();
//     for (const agent of agents) {
//       if (agent.stagedUpdates) {
//         agent.stagedUpdates = {};
//         await agent.save();
//       }
//     }
//     await MarketChange.deleteOne({ _id: change_id });

//     res.json({ success: true });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

const axios = require('axios');
const mongoose = require('mongoose');
const Product = require('../models/products');
const ConsumerAgent = require('../models/consumer_agents');
const MarketChange = require('../models/marketchange');

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
    const { change_type, details } = req.body;
    if (!['price_drop', 'new_product', 'update', 'remove'].includes(change_type)) {
      return res.status(400).json({ error: 'Invalid change_type' });
    }

    let product;
    let originalValues = null;

    if (change_type === 'price_drop' || change_type === 'update') {
      product = await Product.findOne({ product_id: details.product_id, companyId: req.user.id });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      
      // Store original values for potential rollback
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
      
      // Store original values for potential rollback
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
      originalValues, // Store original values for rollback
      companyId: req.user.id,
      committed: false
    });
    await marketChange.save();
    res.json({ success: true, change: marketChange });
  } catch (error) {
    console.error('[ERROR] stageChange failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.previewStaged = async (req, res) => {
  try {
    const { change_id, prediction_method = 'model' } = req.body;

    // Validate input
    if (!change_id || !mongoose.Types.ObjectId.isValid(change_id)) {
      return res.status(400).json({ error: 'Invalid change_id' });
    }

    console.log(`[INFO] Preview request - Method: ${prediction_method}, Change ID: ${change_id}`);

    // Fetch change
    console.log(`[INFO] Looking for market change with ID: ${change_id}`);
    const marketChange = await MarketChange.findById(change_id);
    if (!marketChange) {
      console.log(`[ERROR] Market change not found: ${change_id}`);
      return res.status(404).json({ 
        error: 'Change not found',
        change_id: change_id,
        message: 'The specified market change does not exist in the database'
      });
    }
    console.log(`[INFO] Found market change: ${marketChange.change_type} for company ${marketChange.companyId}`);

    // Ensure the user owns the change
    if (!marketChange.companyId || marketChange.companyId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this change' });
    }

    // Fetch products
    const products = await Product.find({ companyId: req.user.id, isStaged: true,category: marketChange.details.category});
    const liveProducts = await Product.find({ companyId: req.user.id, isStaged: false,category: marketChange.details.category});
    const agents = await ConsumerAgent.find();

    // Aggregate agent profiles and rank products
    const aggregatedProfile = aggregateProfiles(agents);
    const rankedProducts = rankProducts(products, aggregatedProfile);

    // Batch agents for prediction
    const batchSize = 25; // Reduced for Colab stability
    const batches = [];
    for (let i = 0; i < agents.length; i += batchSize) {
      batches.push(agents.slice(i, i + batchSize));
    }

    let beforeSales = 0, afterSales = 0;
    const beforeSatisfaction = [], afterSatisfaction = [];
    const beforeLoyalty = [], afterLoyalty = [];
    const categoryComparisons = {};
    let failedBatches = 0;

    // Process each batch for predictions
    if (prediction_method === 'fallback') {
      console.log('[INFO] Using fallback decision maker');
      console.log(`[INFO] Processing ${batches.length} batches with ${agents.length} total agents`);
      console.log(`[INFO] Ranked products: ${rankedProducts.length} products`);
      
      // Use fallback decision maker via Node.js wrapper
      const { makeFallbackDecisions } = require('../utils/fallbackDecisionMaker');
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`[INFO] Processing batch ${i + 1}/${batches.length} with ${batch.length} agents`);
        
        const agentProfiles = batch.map(agent => ({
          agent_id: agent.agent_id,
          price_sensitivity: agent.preferences.price_sensitivity,
          quality_preference: agent.preferences.quality_preference,
          substitute_tolerance: agent.preferences.substitute_tolerance,
          brand_loyalty: agent.preferences.brand_loyalty,
          current_inventory: agent.current_inventory || {}
        }));

        console.log(`[INFO] Agent profiles for batch ${i + 1}:`, agentProfiles.length);
        console.log(`[INFO] Market change details:`, JSON.stringify(marketChange.details));

        try {
          const decisions = await makeFallbackDecisions(
            agentProfiles,
            rankedProducts+liveProducts,
            JSON.stringify(marketChange.details)
          );

          console.log(`[INFO] Batch ${i + 1} generated ${decisions.length} decisions`);

          decisions.forEach(decision => {
            if (decision.action === 'buy') {
              const product = rankedProducts.find(p => p.product_id === decision.product_id);
              if (product) {
                beforeSales += product.price;
                categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
                categoryComparisons[product.category].beforeSales += product.price;
                beforeSatisfaction.push(Math.min(5, Math.max(0, decision.satisfaction || 0)));
              }
            }
            if (decision.product_id) {
              const brand = rankedProducts.find(p => p.product_id === decision.product_id)?.brand;
              if (brand) {
                const agent = batch.find(a => a.agent_id === decision.agent_id);
                beforeLoyalty.push(agent?.preferences.brand_loyalty[brand] || 0);
              }
            }
          });
        } catch (error) {
          console.error(`[ERROR] Fallback decision maker error for batch ${i + 1}:`, error.message);
          console.error(`[ERROR] Stack trace:`, error.stack);
          failedBatches++;
        }
      }
      
      console.log(`[INFO] Fallback processing complete. Failed batches: ${failedBatches}/${batches.length}`);
      console.log(`[INFO] Before sales: ${beforeSales}, Before satisfaction count: ${beforeSatisfaction.length}`);
    } else {
      console.log('[INFO] Calling local prediction service');
      for (const batch of batches) {
        const agentProfiles = batch.map(agent => ({
          agent_id: agent.agent_id,
          price_sensitivity: agent.preferences.price_sensitivity,
          quality_preference: agent.preferences.quality_preference,
          substitute_tolerance: agent.preferences.substitute_tolerance,
          brand_loyalty: agent.preferences.brand_loyalty,
          current_inventory: agent.current_inventory || {}
        }));

        try {
          const response = await axios.post(`http://localhost:${process.env.port || 8000}/api/predict`, {
            agent_profiles: agentProfiles,
            products: rankedProducts,
            market_context: JSON.stringify(marketChange.details)
          });

          if (response.data.fallback_used) {
            console.warn('[WARNING] Rule-based fallback used for batch');
          }

          const decisions = response.data.decisions || [];
          decisions.forEach(decision => {
            if (decision.action === 'buy') {
              const product = rankedProducts.find(p => p.product_id === decision.product_id);
              if (product) {
                beforeSales += product.price;
                categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
                categoryComparisons[product.category].beforeSales += product.price;
                beforeSatisfaction.push(Math.min(5, Math.max(0, decision.satisfaction || 0)));
              }
            }
            if (decision.product_id) {
              const brand = rankedProducts.find(p => p.product_id === decision.product_id)?.brand;
              if (brand) {
                const agent = batch.find(a => a.agent_id === decision.agent_id);
                beforeLoyalty.push(agent?.preferences.brand_loyalty[brand] || 0);
              }
            }
          });
        } catch (error) {
          console.error('[ERROR] Prediction error for batch:', error.message);
          failedBatches++;
        }
      }
    }

    // Process staged updates for after metrics
    for (const agent of agents) {
      if (agent.stagedUpdates && agent.stagedUpdates.new_action === 'buy') {
        const product = products.find(p => p.product_id === agent.stagedUpdates.new_product_id);
        if (product) {
          afterSales += product.price;
          categoryComparisons[product.category] = categoryComparisons[product.category] || { beforeSales: 0, afterSales: 0 };
          categoryComparisons[product.category].afterSales += product.price;
          afterSatisfaction.push(Math.min(5, Math.max(0, agent.stagedUpdates.new_satisfaction || 0)));
        }
        if (agent.stagedUpdates.new_product_id) {
          const brand = products.find(p => p.product_id === agent.stagedUpdates.new_product_id)?.brand;
          if (brand) {
            const currentLoyalty = agent.preferences.brand_loyalty[brand] || 0;
            afterLoyalty.push(currentLoyalty + (agent.stagedUpdates.loyalty_adjust || 0));
          }
        }
      }
    }

    // Compute metrics
    const metrics = {
      salesChange: afterSales - beforeSales,
      satisfactionDiff: (afterSatisfaction.reduce((a, b) => a + b, 0) / (afterSatisfaction.length || 1)) -
                        (beforeSatisfaction.reduce((a, b) => a + b, 0) / (beforeSatisfaction.length || 1)),
      loyaltyDiff: (afterLoyalty.reduce((a, b) => a + b, 0) / (afterLoyalty.length || 1)) -
                   (beforeLoyalty.reduce((a, b) => a + b, 0) / (beforeLoyalty.length || 1)),
      beforeSales,
      afterSales,
      categoryComparisons: Object.entries(categoryComparisons).map(([category, { beforeSales, afterSales }]) => ({
        category,
        beforeSales,
        afterSales,
        change: afterSales - beforeSales
      }))
    };

    // Return sandbox preview
    res.status(200).json({
      metrics,
      stagedProducts: products,
      change: marketChange,
      warning: failedBatches > 0 ? `Prediction failed for ${failedBatches} batch(es), metrics may be incomplete` : undefined
    });
  } catch (error) {
    console.error('[ERROR] previewStaged failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.commitChanges = async (req, res) => {
  try {
    const { change_id } = req.body;
    const marketChange = await MarketChange.findById(change_id);
    if (!marketChange || marketChange.companyId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Change not found' });
    }

    const stagedProducts = await Product.find({ isStaged: true, companyId: req.user.id });
    for (const product of stagedProducts) {
      if (marketChange.change_type === 'remove' && product.price === 0) {
        await Product.deleteOne({ _id: product._id });
      } else {
        await Product.findByIdAndUpdate(product._id, { isStaged: false });
      }
    }

    const agents = await ConsumerAgent.find();
    for (const agent of agents) {
      if (agent.stagedUpdates && agent.stagedUpdates.new_satisfaction) {
        agent.memory.push({
          action: agent.stagedUpdates.new_action,
          product_id: agent.stagedUpdates.new_product_id,
          satisfaction: agent.stagedUpdates.new_satisfaction,
          rationale: agent.stagedUpdates.new_rationale,
          timestamp: new Date()
        });
        if (agent.stagedUpdates.loyalty_adjust) {
          const brand = stagedProducts.find(p => p.product_id === agent.stagedUpdates.new_product_id)?.brand;
          if (brand) {
            const currentLoyalty = agent.preferences.brand_loyalty[brand] || 0;
            agent.preferences.brand_loyalty[brand] = Math.min(1, Math.max(0, currentLoyalty + agent.stagedUpdates.loyalty_adjust));
          }
        }
        agent.stagedUpdates = {};
        await agent.save();
      }
    }

    marketChange.committed = true;
    await marketChange.save();

    res.json({ success: true });
  } catch (error) {
    console.error('[ERROR] commitChanges failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.discardChanges = async (req, res) => {
  try {
    const { change_id } = req.body;
    const marketChange = await MarketChange.findById(change_id);
    if (!marketChange || marketChange.companyId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Change not found' });
    }

    const changeType = marketChange.change_type;
    const changeDetails = marketChange.details;
    const originalValues = marketChange.originalValues;

    // Handle different change types when discarding
    if (changeType === 'new_product') {
      // For new products, just delete the staged product
      await Product.deleteMany({ 
        product_id: changeDetails.product_id, 
        isStaged: true, 
        companyId: req.user.id 
      });
    } else if (changeType === 'update') {
      // For updates, restore the original values and set isStaged: false
      if (originalValues) {
        await Product.findOneAndUpdate(
          { product_id: changeDetails.product_id, companyId: req.user.id },
          { 
            ...originalValues, 
            isStaged: false 
          },
          { new: true }
        );
      }
    } else if (changeType === 'remove') {
      // For removals, restore the original values and set isStaged: false
      if (originalValues) {
        await Product.findOneAndUpdate(
          { product_id: changeDetails.product_id, companyId: req.user.id },
          { 
            ...originalValues, 
            isStaged: false 
          },
          { new: true }
        );
      }
    }

    // Clear agent staged updates
    const agents = await ConsumerAgent.find();
    for (const agent of agents) {
      if (agent.stagedUpdates) {
        agent.stagedUpdates = {};
        await agent.save();
      }
    }

    // Delete the market change record
    await MarketChange.deleteOne({ _id: change_id });

    res.json({ success: true });
  } catch (error) {
    console.error('[ERROR] discardChanges failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};
