from typing import List, Dict, Any, Optional
import json
import logging
import random

logger = logging.getLogger(__name__)

def make_fallback_decisions(agent_profiles: List[Dict[str, Any]], products: List[Dict[str, Any]], market_context: str) -> List[Dict[str, Any]]:
    """Generate fallback decisions for agents."""
    decisions = []
    for agent in agent_profiles:
        agent_id = agent.get('agent_id', 'unknown')
        # Simple rule: buy if price sensitivity low, else not buy
        action = 'buy' if agent.get('price_sensitivity', 0.5) < 0.5 else 'not buy'
        product_id = products[0]['product_id'] if products and action == 'buy' else None
        satisfaction = random.uniform(0.5, 0.8)
        rationale = "Fallback decision based on price sensitivity"
        decisions.append({
            'agent_id': agent_id,
            'action': action,
            'product_id': product_id,
            'satisfaction': satisfaction,
            'rationale': rationale
        })
    return decisions

if __name__ == "__main__":
    # Test fallback
    test_agents = [
        {
            'agent_id': 'test_agent_1',
            'price_sensitivity': 0.7,
            'quality_preference': 0.4,
            'brand_loyalty': {'BrandX': 0.6, 'BrandY': 0.3},
            'substitute_tolerance': 0.5,
            'current_inventory': {}
        }
    ]
    
    test_products = [
        {
            'product_id': 'P001',
            'brand': 'BrandX',
            'price': 20.0,
            'quality': 0.8,
            'category': 'Electronics',
            'popularity_score': 0.9
        }
    ]
    
    test_context = json.dumps({
        'product_id': 'P001',
        'price': 20,
        'brand': 'BrandX',
        'quality': 0.8,
        'category': 'Electronics'
    })
    
    decisions = make_fallback_decisions(test_agents, test_products, test_context)
    print(json.dumps(decisions, indent=2))