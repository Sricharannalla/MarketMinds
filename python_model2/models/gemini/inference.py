import json
import logging
import os
import sys
import time
import traceback
from typing import List, Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables, overriding system ones
load_dotenv(override=True)

# from fallback_decision_maker import make_fallback_decisions  # REMOVED - No fallback in model

from consumer_agent import process_agent_decision
# Import new clustered prediction system
from inference_clustered import predict_consumer_behavior_clustered

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
MODEL_NAME = 'gemini-2.0-flash-lite'  # Updated to flash-lite for better rate limits

model = genai.GenerativeModel(
    model_name=MODEL_NAME,
    generation_config=genai.types.GenerationConfig(
        temperature=0.1,
        top_p=0.95,
        top_k=40,
        max_output_tokens=1024
    ),
    safety_settings=[
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
    ]
)

# Rate limiting variables for flash-lite model
last_request_time = 0
MIN_REQUEST_INTERVAL = 2  # 2 seconds between requests (30 RPM = 2 sec/request)

def rate_limited_generate(prompt: str) -> str:
    """Generate response using Gemini flash-lite model only."""
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

        logger.info("Making Gemini API call (single attempt)")
        response = model.generate_content(
            prompt,
            request_options={"timeout": 300}  # 5-minute timeout for the API call
        )
        logger.info(f"Response received. Candidates: {len(response.candidates)}")

        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            logger.info(f"Candidate finish_reason: {candidate.finish_reason}")

            if candidate.finish_reason == 1:  # STOP
                return candidate.content.parts[0].text
            elif candidate.finish_reason == 2:  # SAFETY
                logger.warning("Gemini blocked by safety filter - using rule-based fallback")
                raise ValueError("Gemini safety filter blocked response")
            else:
                raise ValueError(f"Unexpected finish reason: {candidate.finish_reason}")
        else:
            raise ValueError("No candidates in response")

    except Exception as e:
        logger.error(f"Gemini API call failed: {str(e)}")
        logger.info("Using rule-based fallback due to Gemini failure")
        raise ValueError("Gemini API call failed")

def aggregate_profiles(agents: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Aggregate preferences for a batch of agents."""
    n = len(agents)
    if n == 0:
        logger.warning("No agents provided, returning default profile")
        return {'price_sensitivity': 0.5, 'quality_preference': 0.5, 'brand_loyalty': {}, 'substitute_tolerance': 0.5}
    
    agg = {
        'price_sensitivity': sum(a['price_sensitivity'] for a in agents) / n,
        'quality_preference': sum(a['quality_preference'] for a in agents) / n,
        'brand_loyalty': {},
        'substitute_tolerance': sum(a['substitute_tolerance'] for a in agents) / n
    }
    
    all_brands = set()
    for a in agents:
        all_brands.update(a['brand_loyalty'].keys())
    
    for brand in all_brands:
        agg['brand_loyalty'][brand] = sum(a['brand_loyalty'].get(brand, 0) for a in agents) / n
    
    return agg

def rank_products(products: List[Dict[str, Any]], aggregated_profile: Dict[str, Any], top_n: int = 10) -> List[Dict[str, Any]]:
    """Rank products based on aggregated profile."""
    max_price = max(p['price'] for p in products) if products else 100
    categories = set(p['category'] for p in products)
    ranked_products = []
    
    for category in categories:
        cat_products = [p for p in products if p['category'] == category]
        ranked = []
        for product in cat_products:
            score = (1 - aggregated_profile['price_sensitivity']) * (1 - product['price'] / max_price)
            score += aggregated_profile['quality_preference'] * product.get('quality', product.get('quality_score', 0.5))
            score += aggregated_profile['brand_loyalty'].get(product['brand'], 0) * 0.5
            score += product.get('popularity_score', 0) * 0.3
            ranked.append({'product': product, 'score': score})
        
        ranked.sort(key=lambda x: x['score'], reverse=True)
        ranked_products.extend(item['product'] for item in ranked[:top_n])
    
    return ranked_products

def generate_rule_based_predictions(agent_profiles: List[Dict[str, Any]], products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generate rule-based predictions when Gemini fails."""
    import random
    
    decisions = []
    
    for agent in agent_profiles:
        # Simple rule-based logic
        price_sensitivity = agent.get('price_sensitivity', 0.5)
        quality_preference = agent.get('quality_preference', 0.5)
        substitute_tolerance = agent.get('substitute_tolerance', 0.5)
        
        # Find best product match based on agent preferences
        best_product = None
        best_score = 0
        
        for product in products:
            # Calculate compatibility score
            price = product.get('price', 100)
            quality_score = product.get('quality_score', 0.5)
            
            # Price factor (lower price better for price-sensitive agents)
            price_factor = max(0, 1 - (price / 200) * price_sensitivity)
            
            # Quality factor
            quality_factor = quality_score * quality_preference
            
            # Combined score
            score = (price_factor * 0.6) + (quality_factor * 0.4)
            
            if score > best_score:
                best_score = score
                best_product = product
        
        # Decision logic
        if best_score > 0.6:
            action = "buy"
            product_id = best_product.get('product_id') if best_product else None
            satisfaction = min(0.9, best_score + random.uniform(0, 0.1))
            rationale = "Good value match"
        elif best_score > 0.4:
            # Random decision for borderline cases
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
        
        decisions.append({
            'agent_id': agent.get('agent_id', agent.get('id')),
            'action': action,
            'product_id': product_id,
            'satisfaction': satisfaction,
            'rationale': rationale
        })
    
    return decisions

def predict_consumer_behavior_batched(agent_profiles: List[Dict[str, Any]], products: List[Dict[str, Any]], market_context: str, batch_size: int = 25) -> Dict[str, Any]:
    """
    Predict consumer behavior using Gemini flash-lite - BATCHED VERSION optimized for rate limits.

    Args:
        agent_profiles: List of agent dictionaries
        products: List of product dictionaries
        market_context: Market context string
        batch_size: Number of agents per batch (default 25 for optimal rate limit usage)

    Returns:
        Dict with decisions and fallback status
    """
    logger.info(f"Received {len(agent_profiles)} agents and {len(products)} products - Processing in batches of {batch_size}")

    all_decisions = []
    fallback_used = False
    total_batches = (len(agent_profiles) + batch_size - 1) // batch_size  # Ceiling division

    for i in range(0, len(agent_profiles), batch_size):
        batch_num = i // batch_size + 1
        batch = agent_profiles[i:i + batch_size]

        logger.info(f"Processing batch {batch_num}/{total_batches}: agents {i+1} to {min(i+batch_size, len(agent_profiles))}")

        try:
            result = predict_consumer_behavior_single_batch(batch, products, market_context)
            all_decisions.extend(result['decisions'])
            if result['fallback_used']:
                fallback_used = True
        except Exception as e:
            logger.error(f"Batch {batch_num} failed: {e}")
            # Use rule-based fallback for this batch
            fallback_decisions = generate_rule_based_predictions(batch, products)
            all_decisions.extend(fallback_decisions)
            fallback_used = True

    return {
        'decisions': all_decisions,
        'fallback_used': fallback_used
    }
def predict_consumer_behavior_single_batch(agent_profiles: List[Dict[str, Any]], products: List[Dict[str, Any]], market_context: str) -> Dict[str, Any]:
    """
    Process a single batch of agents using Gemini flash-lite with optimized prompt.
    """
    logger.info(f"Processing {len(agent_profiles)} agents in single batch")

    try:
        # Aggregate and rank for this batch
        aggregated_profile = aggregate_profiles(agent_profiles)
        ranked_products = rank_products(products, aggregated_profile)

        # Build optimized participant contexts for flash-lite
        participant_context = []
        for agent in agent_profiles:
            brand_loyalty = agent.get('brand_loyalty', {})
            top_brands = ", ".join(
                f"{brand}({loyalty:.2f})"
                for brand, loyalty in
                sorted(brand_loyalty.items(), key=lambda x: -x[1])[:2]  # Reduced to top 2 for efficiency
            ) if brand_loyalty else "None"

            context_line = (
                f"ID:{agent.get('agent_id', agent.get('id', 'unknown'))}|"
                f"PS:{agent.get('price_sensitivity', 0.5):.2f}|"
                f"QP:{agent.get('quality_preference', 0.5):.2f}|"
                f"ST:{agent.get('substitute_tolerance', 0.5):.2f}|"
                f"Brands:{top_brands}"
            )
            participant_context.append(context_line)

        # Format products efficiently for flash-lite
        product_strs = []
        for product in ranked_products[:10]:  # Reduced to top 10 for efficiency
            quality_score = float(product.get('quality', product.get('quality_score', 0.5)))
            product_str = (
                f"ID:{product.get('product_id', '?')}|"
                f"Brand:{product.get('brand', 'Unknown')}|"
                f"Price:₹{float(product.get('price', 0)):.0f}|"
                f"Quality:{quality_score:.2f}"
            )
            product_strs.append(product_str)

        # Optimized prompt for flash-lite model
        prompt = f"""Market Simulation Task

Context: {market_context or 'General market conditions'}

Participants ({len(agent_profiles)}):
{chr(10).join(participant_context)}

Products ({len(product_strs)}):
{chr(10).join(product_strs)}

Task: For each participant, predict: buy/not buy, product ID (or none), satisfaction score (0.0-1.0), brief rationale

Format: participant_id,decision,product_id,score,rationale
Example: p001,buy,P001,0.85,Quality matches preference

Output:"""

        logger.debug(f"Prompt length: {len(prompt)} characters")

        # Generate response with rate limiting
        raw_output = rate_limited_generate(prompt)
        logger.info(f"Raw response for {len(agent_profiles)} agents: {raw_output[:100]}...")

        # Process response
        decisions = process_agent_decision(raw_output, agent_profiles, products)

        return {
            'decisions': decisions,
            'fallback_used': False
        }

    except Exception as e:
        logger.error(f"Batch prediction failed: {e}")
        logger.info("Using rule-based fallback for this batch")
        # Final fallback: rule-based predictions
        fallback_decisions = generate_rule_based_predictions(agent_profiles, products)

        return {
            'decisions': fallback_decisions,
            'fallback_used': True
        }

def predict_consumer_behavior(agent_profiles: List[Dict[str, Any]], products: List[Dict[str, Any]], market_context: str) -> Dict[str, Any]:
    """
    Main prediction function - now uses clustered approach for better efficiency and accuracy.
    
    Args:
        agent_profiles: List of agent dictionaries
        products: List of product dictionaries
        market_context: Market context string
        
    Returns:
        Dict with decisions and metadata
    """
    logger.info(f"Using CLUSTERED prediction for {len(agent_profiles)} agents")
    
    try:
        # Use new clustered prediction system
        result = predict_consumer_behavior_clustered(
            agent_profiles=agent_profiles,
            products=products, 
            market_context=market_context
        )
        
        logger.info(f"Clustered prediction completed: {len(result.get('decisions', []))} decisions from {result.get('clusters_processed', 0)} clusters")
        return result
        
    except Exception as e:
        logger.error(f"Clustered prediction failed: {e}")
        logger.info("Falling back to legacy batched processing")
        
        # Fallback to original batched processing if clustering fails
        return predict_consumer_behavior_batched(
            agent_profiles=agent_profiles,
            products=products,
            market_context=market_context,
            batch_size=25
        )

# Legacy function kept for fallback compatibility
