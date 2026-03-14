import logging
import re
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def process_agent_decision(raw_output: str, agent_profiles: List[Dict[str, Any]], products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw Gemini output for agent decisions.

    Args:
        raw_output: Raw string output from Gemini
        agent_profiles: List of agent dictionaries
        products: List of product dictionaries

    Returns:
        List of decision dictionaries
    """
    decisions = []
    lines = raw_output.strip().split('\n')

    # Create a mapping of agent IDs to their indices
    agent_id_to_index = {agent.get('agent_id', agent.get('id')): i for i, agent in enumerate(agent_profiles)}

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Expected format: participant_id,decision,product_id,score,rationale
        parts = [p.strip() for p in line.split(',')]
        if len(parts) < 4:
            logger.warning(f"Skipping malformed line: {line}")
            continue

        participant_id = parts[0]
        decision = parts[1].lower()
        product_id = parts[2] if len(parts) > 2 else None
        score = float(parts[3]) if len(parts) > 3 else 0.5
        rationale = parts[4] if len(parts) > 4 else "No rationale provided"

        # Find the corresponding agent
        if participant_id in agent_id_to_index:
            agent = agent_profiles[agent_id_to_index[participant_id]]
            decisions.append({
                'agent_id': participant_id,
                'action': decision,
                'product_id': product_id,
                'satisfaction': min(1.0, max(0.0, score)),  # Clamp to 0-1
                'rationale': rationale
            })
        else:
            logger.warning(f"Agent ID {participant_id} not found in agent_profiles")

    logger.info(f"Processed {len(decisions)} decisions from {len(lines)} lines")
    return decisions

def process_cluster_decisions(raw_output: str, cluster_agents: List[Dict[str, Any]], products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw Gemini output for cluster decisions.

    Args:
        raw_output: Raw string output from Gemini
        cluster_agents: List of agent dictionaries in the cluster
        products: List of product dictionaries

    Returns:
        List of decision dictionaries
    """
    decisions = []
    lines = raw_output.strip().split('\n')

    # Create a mapping of agent IDs to their indices
    agent_id_to_index = {agent.get('agent_id', agent.get('id')): i for i, agent in enumerate(cluster_agents)}

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Expected format: action,product_id,score (no rationale for clusters)
        parts = [p.strip() for p in line.split(',')]
        if len(parts) < 3:
            logger.warning(f"Skipping malformed line: {line}")
            continue

        action = parts[0].lower()
        product_id = parts[1] if len(parts) > 1 else None
        score = float(parts[2]) if len(parts) > 2 else 0.5

        # For clusters, we need to assign to agents in order since IDs might not match
        if decisions and len(decisions) < len(cluster_agents):
            # Continue assigning to next agent if not enough IDs
            last_agent_index = len(decisions)
            if last_agent_index < len(cluster_agents):
                agent = cluster_agents[last_agent_index]
                decisions.append({
                    'agent_id': agent.get('agent_id', agent.get('id')),
                    'action': action,
                    'product_id': product_id,
                    'satisfaction': min(1.0, max(0.0, score)),
                    'rationale': f'Cluster decision for {action}'
                })
        else:
            # Fallback: assign to first available agent or find by some logic
            for agent in cluster_agents:
                if not any(d['agent_id'] == agent.get('agent_id', agent.get('id')) for d in decisions):
                    decisions.append({
                        'agent_id': agent.get('agent_id', agent.get('id')),
                        'action': action,
                        'product_id': product_id,
                        'satisfaction': min(1.0, max(0.0, score)),
                        'rationale': f'Cluster decision for {action}'
                    })
                    break

    logger.info(f"Processed {len(decisions)} cluster decisions from {len(lines)} lines")
    return decisions
