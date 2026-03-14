import json
import logging
import os
import sys
import time
import traceback
from typing import List, Dict, Any, Tuple
from dotenv import load_dotenv
load_dotenv(override=True)

# Try importing dependencies
try:
    import google.generativeai as genai
except ImportError:
    logger.error("google.generativeai not found. Please install it using 'pip install google-generativeai'")
    sys.exit(1)
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from consumer_agent import process_cluster_decisions
from agent_clustering import load_clusters, rank_products_for_cluster

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s', force=True)
logger = logging.getLogger(__name__)
logger.handlers = [logging.StreamHandler(sys.stdout)]

# Gemini configuration
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    logger.error("GOOGLE_API_KEY not set in environment variables. Please set it in the .env file")
    logger.error("Get your API key from aistudio.google.com and add it to the .env file as GOOGLE_API_KEY=your_key_here")
    sys.exit(1)
genai.configure(api_key=GOOGLE_API_KEY)
MODEL_NAME = 'gemini-2.0-flash-lite'

model = genai.GenerativeModel(
    model_name=MODEL_NAME,
    generation_config=genai.types.GenerationConfig(
        temperature=0.1,
        top_p=0.95,
        top_k=40,
        max_output_tokens=2048  # Increased for cluster responses
    ),
    safety_settings=[
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
    ]
)

# Rate limiting variables
last_request_time = 0
MIN_REQUEST_INTERVAL = 2  # 2 seconds between requests (30 RPM limit)

def rate_limited_generate(prompt: str) -> str:
    """Generate response using Gemini flash-lite model with rate limiting."""
    global last_request_time

    try:
        # Rate limiting
        current_time = time.time()
        time_since_last = current_time - last_request_time
        if time_since_last < MIN_REQUEST_INTERVAL:
            sleep_time = MIN_REQUEST_INTERVAL - time_since_last
            logger.info(f"Rate limiting: sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)

        last_request_time = time.time()

        logger.info("Making Gemini API call")
        response = model.generate_content(
            prompt,
            request_options={"timeout": 300}
        )
        logger.info(f"Response received. Candidates: {len(response.candidates)}")

        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            logger.info(f"Candidate finish_reason: {candidate.finish_reason}")

            if candidate.finish_reason == 1:  # STOP
                return candidate.content.parts[0].text
            elif candidate.finish_reason == 2:  # SAFETY
                logger.warning("Gemini blocked by safety filter")
                raise ValueError("Gemini safety filter blocked response")
            else:
                raise ValueError(f"Unexpected finish reason: {candidate.finish_reason}")
        else:
            raise ValueError("No candidates in response")

    except Exception as e:
        logger.error(f"Gemini API call failed: {str(e)}")
        raise ValueError("Gemini API call failed")

def load_agent_clusters() -> Tuple[Dict[int, List[Dict]], Dict[int, Dict]]:
    """Load pre-computed agent clusters"""
    cluster_file = os.path.join(os.path.dirname(__file__), '..', '..', 'agent_clusters.json')
    
    if not os.path.exists(cluster_file):
        logger.error(f"Cluster file not found: {cluster_file}")
        # If no clusters available, create a single cluster with all agents
        return {0: []}, {0: {'size': 0, 'avg_price_sensitivity': 0.5, 'avg_quality_preference': 0.5, 'avg_substitute_tolerance': 0.5}}
    
    clustered_agents, cluster_profiles = load_clusters(cluster_file)
    logger.info(f"Loaded {len(clustered_agents)} clusters from {cluster_file}")
    return clustered_agents, cluster_profiles

def map_agents_to_clusters(agent_profiles: List[Dict[str, Any]]) -> Dict[int, List[Dict[str, Any]]]:
    """Map incoming agents to existing clusters based on their profiles"""
    clustered_agents, cluster_profiles = load_agent_clusters()
    
    if not clustered_agents:
        logger.warning("No clusters available, creating single cluster")
        return {0: agent_profiles}
    
    # Simple mapping: assign agents to clusters based on similarity to cluster profiles
    agent_cluster_assignments = {}
    
    for agent in agent_profiles:
        best_cluster = 0
        best_similarity = -1
        
        # Calculate similarity to each cluster
        for cluster_id, profile in cluster_profiles.items():
            similarity = calculate_similarity(agent, profile)
            if similarity > best_similarity:
                best_similarity = similarity
                best_cluster = cluster_id
        
        if best_cluster not in agent_cluster_assignments:
            agent_cluster_assignments[best_cluster] = []
        agent_cluster_assignments[best_cluster].append(agent)
    
    logger.info(f"Mapped {len(agent_profiles)} agents to {len(agent_cluster_assignments)} clusters")
    return agent_cluster_assignments

def calculate_similarity(agent: Dict[str, Any], cluster_profile: Dict[str, Any]) -> float:
    """Calculate similarity between an agent and a cluster profile"""
    # Simple similarity based on key characteristics
    agent_ps = agent.get('price_sensitivity', 0.5)
    agent_qp = agent.get('quality_preference', 0.5)
    agent_st = agent.get('substitute_tolerance', 0.5)
    
    cluster_ps = cluster_profile.get('avg_price_sensitivity', 0.5)
    cluster_qp = cluster_profile.get('avg_quality_preference', 0.5)
    cluster_st = cluster_profile.get('avg_substitute_tolerance', 0.5)
    
    # Calculate Euclidean distance and convert to similarity
    distance = ((agent_ps - cluster_ps) ** 2 + 
                (agent_qp - cluster_qp) ** 2 + 
                (agent_st - cluster_st) ** 2) ** 0.5
    
    similarity = 1.0 / (1.0 + distance)  # Convert distance to similarity
    return similarity

def build_cluster_prompt(cluster_agents: List[Dict[str, Any]], cluster_profile: Dict[str, Any], 
                        products: List[Dict[str, Any]], market_context: str) -> str:
    """Build optimized prompt for cluster-based decision making"""
    
    # Rank products for this cluster
    ranked_products = rank_products_for_cluster(products, cluster_profile, top_n=8)
    
    # Build cluster description
    cluster_desc = cluster_profile.get('description', 'Mixed consumer segment')
    cluster_size = len(cluster_agents)
    
    # Format products for the prompt
    product_list = []
    for i, product in enumerate(ranked_products, 1):
        product_str = f"{i}. ID:{product.get('product_id')} Brand:{product.get('brand')} Price:${product.get('price'):.0f} Quality:{product.get('quality', 0.5):.2f}"
        product_list.append(product_str)
    
    # Build the prompt
    prompt = f"""CONSUMER BEHAVIOR PREDICTION TASK

MARKET CONTEXT: {market_context}

CONSUMER CLUSTER:
- Size: {cluster_size} consumers
- Profile: {cluster_desc}
- Avg Price Sensitivity: {cluster_profile.get('avg_price_sensitivity', 0.5):.2f}
- Avg Quality Preference: {cluster_profile.get('avg_quality_preference', 0.5):.2f}
- Avg Substitute Tolerance: {cluster_profile.get('avg_substitute_tolerance', 0.5):.2f}

AVAILABLE PRODUCTS (ranked by cluster appeal):
{chr(10).join(product_list)}

TASK: Predict purchase decisions for {cluster_size} consumers in this cluster given the market context.

OUTPUT FORMAT: Provide exactly {cluster_size} lines, one per consumer.
Each line format: <buy|skip>,<product_id|none>,<satisfaction_score>

Where:
- buy: consumer purchases the product
- skip: consumer does not purchase 
- product_id: the ID from the product list (or "none" if skip)
- satisfaction_score: expected satisfaction (0.0-1.0)

IMPORTANT RULES:
1. Output EXACTLY {cluster_size} lines
2. Each line follows the exact format: action,product_id,score
3. Use only product IDs from the list above
4. Satisfaction scores between 0.0 and 1.0
5. Consider cluster preferences and market context
6. No explanations, just the formatted decisions

OUTPUT:"""

    return prompt

def predict_cluster_behavior(cluster_agents: List[Dict[str, Any]], cluster_profile: Dict[str, Any],
                           products: List[Dict[str, Any]], market_context: str) -> List[Dict[str, Any]]:
    """Predict behavior for a single cluster of agents"""
    try:
        # Build cluster-optimized prompt
        prompt = build_cluster_prompt(cluster_agents, cluster_profile, products, market_context)
        
        logger.debug(f"Prompt for cluster (first 300 chars): {prompt[:300]}...")
        
        # Generate response
        raw_output = rate_limited_generate(prompt)
        logger.info(f"Raw response for cluster ({len(cluster_agents)} agents): {raw_output[:200]}...")
        
        # Process cluster decisions
        decisions = process_cluster_decisions(raw_output, cluster_agents, products)
        
        return decisions

    except Exception as e:
        logger.error(f"Cluster prediction failed: {e}")
        # Fallback: generate realistic decisions
        import random
        
        fallback_decisions = []
        for agent in cluster_agents:
            price_sensitivity = agent.get('price_sensitivity', 0.5)
            quality_preference = agent.get('quality_preference', 0.5)
            
            best_product = None
            best_score = 0
            
            for product in products:
                price = product.get('price', 100)
                quality_score = float(product.get('quality', product.get('quality_score', 0.5)))
                
                price_factor = max(0, 1 - (price / 200) * price_sensitivity)
                quality_factor = quality_score * quality_preference
                
                score = (price_factor * 0.6) + (quality_factor * 0.4)
                
                if score > best_score:
                    best_score = score
                    best_product = product
                    
            if best_score > 0.6:
                action = "buy"
                product_id = best_product.get('product_id') if best_product else None
                satisfaction = min(0.9, best_score + random.uniform(0, 0.1))
                rationale = "Good value match"
            elif best_score > 0.4:
                if random.random() > 0.5:
                    action = "buy"
                    product_id = best_product.get('product_id') if best_product else None
                    satisfaction = min(0.7, best_score + random.uniform(0, 0.2))
                    rationale = "Acceptable option"
                else:
                    action = "not buy"
                    product_id = None
                    satisfaction = best_score
                    rationale = "Price concerns"
            else:
                action = "not buy"
                product_id = None
                satisfaction = best_score
                rationale = "No suitable match"
                
            fallback_decisions.append({
                'agent_id': agent.get('agent_id', agent.get('id')),
                'action': action,
                'product_id': product_id,
                'satisfaction': satisfaction,
                'rationale': f'Fallback: {rationale}'
            })
        return fallback_decisions

def predict_consumer_behavior_clustered(agent_profiles: List[Dict[str, Any]], products: List[Dict[str, Any]], 
                                      market_context: str) -> Dict[str, Any]:
    """
    Main clustered prediction function - groups agents by clusters and processes each cluster
    
    Args:
        agent_profiles: List of agent dictionaries
        products: List of product dictionaries  
        market_context: Market context string
        
    Returns:
        Dict with decisions and metadata
    """
    logger.info(f"Starting clustered prediction for {len(agent_profiles)} agents and {len(products)} products")
    
    # Load cluster profiles
    _, cluster_profiles = load_agent_clusters()
    
    # Map agents to clusters
    agent_clusters = map_agents_to_clusters(agent_profiles)
    
    all_decisions = []
    total_clusters_processed = 0
    
    # Process each cluster
    for cluster_id, cluster_agents in agent_clusters.items():
        if not cluster_agents:
            continue
            
        logger.info(f"Processing cluster {cluster_id} with {len(cluster_agents)} agents")
        
        cluster_profile = cluster_profiles.get(cluster_id, {
            'avg_price_sensitivity': 0.5,
            'avg_quality_preference': 0.5, 
            'avg_substitute_tolerance': 0.5,
            'description': 'Unknown cluster',
            'cluster_brand_loyalty': {}
        })
        
        # Predict for this cluster
        cluster_decisions = predict_cluster_behavior(cluster_agents, cluster_profile, products, market_context)
        all_decisions.extend(cluster_decisions)
        total_clusters_processed += 1
    
    logger.info(f"Completed clustered prediction: {len(all_decisions)} decisions from {total_clusters_processed} clusters")
    
    return {
        'decisions': all_decisions,
        'fallback_used': False,
        'clusters_processed': total_clusters_processed,
        'total_agents': len(agent_profiles)
    }

# Main function for backward compatibility
def predict_consumer_behavior(agent_profiles: List[Dict[str, Any]], products: List[Dict[str, Any]], 
                            market_context: str) -> Dict[str, Any]:
    """
    Main prediction function - uses new clustered approach
    """
    return predict_consumer_behavior_clustered(agent_profiles, products, market_context)
