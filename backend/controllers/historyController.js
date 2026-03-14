const MarketChange = require('../models/marketchange');
const Product = require('../models/products');

/**
 * History Controller
 * - Provides decision history and market change analytics
 */

exports.getDecisionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, changeType } = req.query;
    
    // Build query
    const query = { companyId: req.user.id, committed: true };
    if (changeType && changeType !== 'all') {
      query.change_type = changeType;
    }

    // Fetch market changes with pagination
    const marketChanges = await MarketChange.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalChanges = await MarketChange.countDocuments(query);

    // Process changes to add impact analysis
    const processedChanges = await Promise.all(marketChanges.map(async (change) => {
      // Calculate impact from simulated decisions
      let salesImpact = 0;
      let buyersCount = 0;
      let avgSatisfaction = 0;
      
      if (change.simulatedDecisions && change.simulatedDecisions.length > 0) {
        const buyers = change.simulatedDecisions.filter(d => d.action === 'buy');
        buyersCount = buyers.length;
        
        // Estimate sales impact
        const product = await Product.findOne({ 
          product_id: change.details.product_id,
          companyId: req.user.id 
        });
        
        if (product) {
          salesImpact = buyers.length * product.price;
        }
        
        // Calculate average satisfaction
        const satisfactions = buyers
          .map(b => parseFloat(b.satisfaction) || 0)
          .filter(s => s > 0);
        
        avgSatisfaction = satisfactions.length > 0 
          ? satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length 
          : 0;
      }

      return {
        _id: change._id,
        change_type: change.change_type,
        details: change.details,
        originalValues: change.originalValues,
        timestamp: change.timestamp,
        committed: change.committed,
        impact: {
          salesImpact,
          buyersCount,
          avgSatisfaction: parseFloat(avgSatisfaction.toFixed(2)),
          totalDecisions: change.simulatedDecisions ? change.simulatedDecisions.length : 0
        }
      };
    }));

    res.json({
      changes: processedChanges,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalChanges / limit),
        totalChanges,
        hasNext: page * limit < totalChanges,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('[ERROR] getDecisionHistory failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getChangeAnalytics = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query; // days
    
    // Build query for date filtering
    const query = {
      companyId: req.user.id,
      committed: true
    };
    
    if (timeframe !== 'all') {
      const daysBack = parseInt(timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      query.timestamp = { $gte: startDate };
    }

    // Fetch changes within timeframe
    const changes = await MarketChange.find(query).sort({ timestamp: 1 });

    // Analytics calculations
    const changeTypeStats = {};
    const dailyImpact = {};
    let totalSalesImpact = 0;
    let totalDecisions = 0;

    for (const change of changes) {
      // Change type stats
      changeTypeStats[change.change_type] = (changeTypeStats[change.change_type] || 0) + 1;

      // Daily impact
      const dateKey = change.timestamp.toISOString().split('T')[0];
      if (!dailyImpact[dateKey]) {
        dailyImpact[dateKey] = { changes: 0, decisions: 0, estimatedSales: 0 };
      }
      dailyImpact[dateKey].changes++;

      // Calculate impact
      if (change.simulatedDecisions) {
        const buyers = change.simulatedDecisions.filter(d => d.action === 'buy');
        const decisionCount = change.simulatedDecisions.length;
        
        totalDecisions += decisionCount;
        dailyImpact[dateKey].decisions += decisionCount;

        // Estimate sales impact
        const product = await Product.findOne({ 
          product_id: change.details.product_id,
          companyId: req.user.id 
        });
        
        if (product) {
          const salesImpact = buyers.length * product.price;
          totalSalesImpact += salesImpact;
          dailyImpact[dateKey].estimatedSales += salesImpact;
        }
      }
    }

    // Convert daily impact to array format for charts
    const timelineData = Object.entries(dailyImpact).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      summary: {
        totalChanges: changes.length,
        totalSalesImpact,
        totalDecisions,
        avgImpactPerChange: changes.length > 0 ? totalSalesImpact / changes.length : 0
      },
      changeTypeStats,
      timelineData,
      timeframe: timeframe
    });

  } catch (error) {
    console.error('[ERROR] getChangeAnalytics failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getChangeDetails = async (req, res) => {
  try {
    const { changeId } = req.params;

    const change = await MarketChange.findOne({
      _id: changeId,
      companyId: req.user.id
    });

    if (!change) {
      return res.status(404).json({ error: 'Change not found' });
    }

    // Get affected product details
    const product = await Product.findOne({
      product_id: change.details.product_id,
      companyId: req.user.id
    });

    // Process decision details
    let decisionAnalysis = null;
    if (change.simulatedDecisions && change.simulatedDecisions.length > 0) {
      const decisions = change.simulatedDecisions;
      const buyers = decisions.filter(d => d.action === 'buy');
      const nonBuyers = decisions.filter(d => d.action !== 'buy');

      // Product choice distribution among buyers
      const productChoices = {};
      buyers.forEach(buyer => {
        if (buyer.product_id) {
          productChoices[buyer.product_id] = (productChoices[buyer.product_id] || 0) + 1;
        }
      });

      // Satisfaction distribution
      const satisfactionRanges = { low: 0, medium: 0, high: 0 };
      buyers.forEach(buyer => {
        const satisfaction = parseFloat(buyer.satisfaction) || 0;
        if (satisfaction < 0.4) satisfactionRanges.low++;
        else if (satisfaction < 0.7) satisfactionRanges.medium++;
        else satisfactionRanges.high++;
      });

      decisionAnalysis = {
        totalDecisions: decisions.length,
        buyersCount: buyers.length,
        nonBuyersCount: nonBuyers.length,
        conversionRate: parseFloat((buyers.length / decisions.length * 100).toFixed(2)),
        productChoices,
        satisfactionRanges,
        avgSatisfaction: buyers.length > 0 
          ? parseFloat((buyers.reduce((sum, b) => sum + (parseFloat(b.satisfaction) || 0), 0) / buyers.length).toFixed(2))
          : 0
      };
    }

    res.json({
      change: {
        _id: change._id,
        change_type: change.change_type,
        details: change.details,
        originalValues: change.originalValues,
        timestamp: change.timestamp,
        committed: change.committed
      },
      product,
      decisionAnalysis
    });

  } catch (error) {
    console.error('[ERROR] getChangeDetails failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};
