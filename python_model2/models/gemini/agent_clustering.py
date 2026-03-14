import json
import logging
import os
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

def load_clusters(cluster_file: str) -> Tuple[Dict[int, List[Dict[str, Any]]], Dict[int, Dict[str, Any]]]:
    """
    Load agent clusters from JSON file.

    Args:
        cluster_file: Path to the cluster JSON file

    Returns:
        Tuple of (clustered_agents, cluster_profiles)
    """
    try:
        with open(cluster_file, 'r') as f:
            data = json.load(f)

        clustered_agents = data.get('clustered_agents', {})
        cluster_profiles = data.get('cluster_profiles', {})

        logger.info(f"Loaded {len(clustered_agents)} clusters with {len(cluster_profiles)} profiles")
        return clustered_agents, cluster_profiles

    except Exception as e:
        logger.error(f"Failed to load clusters from {cluster_file}: {e}")
        # Return empty defaults
        return {}, {}

def rank_products_for_cluster(products: List[Dict[str, Any]], cluster_profile: Dict[str, Any], top_n: int = 8) -> List[Dict[str, Any]]:
    """
    Rank products based on cluster profile preferences.

    Args:
        products: List of product dictionaries
        cluster_profile: Dictionary with cluster preferences
        top_n: Number of top products to return

    Returns:
        List of ranked products
    """
    if not products:
        return []

    # Get cluster preferences
    price_sensitivity = cluster_profile.get('avg_price_sensitivity', 0.5)
    quality_preference = cluster_profile.get('avg_quality_preference', 0.5)
    substitute_tolerance = cluster_profile.get('avg_substitute_tolerance', 0.5)

    # Get max price for normalization
    max_price = max(p.get('price', 0) for p in products) if products else 1

    # Score products
    scored_products = []
    for product in products:
        price = product.get('price', 0)
        quality = product.get('quality', product.get('quality_score', 0.5))
        brand = product.get('brand', 'Unknown')

        # Price factor: lower price better for price-sensitive clusters
        price_factor = max(0, 1 - (price / max_price) * price_sensitivity)

        # Quality factor
        quality_factor = quality * quality_preference

        # Brand loyalty (simplified)
        brand_loyalty = cluster_profile.get('cluster_brand_loyalty', {}).get(brand, 0)

        # Combined score
        score = (price_factor * 0.4) + (quality_factor * 0.4) + (brand_loyalty * 0.2)

        scored_products.append({
            'product': product,
            'score': score
        })

    # Sort by score and return top N
    scored_products.sort(key=lambda x: x['score'], reverse=True)
    ranked_products = [item['product'] for item in scored_products[:top_n]]

    logger.info(f"Ranked {len(ranked_products)} products for cluster")
    return ranked_products
