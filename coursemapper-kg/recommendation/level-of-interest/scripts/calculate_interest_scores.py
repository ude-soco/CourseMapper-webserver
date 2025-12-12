"""
Interest Score Calculator
Calculates raw scores and normalized scores for user-concept pairs.

Process:
1. Load concept-based activities from JSON
2. Load activity weights from JSON
3. Calculate raw scores: Score = Σ(Count × Normalized_Weight)
4. Normalize using 3 methods:
   - Min-Max with Linear Interpolation
   - Z-Score with k=2 clipping
   - Z-Score with k=3 clipping
5. Save results to JSON file
"""

import json
import numpy as np
from pathlib import Path
from datetime import datetime


def load_json(file_path):
    """Load JSON file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def aggregate_by_concept_name(concepts_data):
    """
    Aggregate concepts by concept_name (merge duplicates).
    Preserves course information (course_id, course_name, course_ids, course_names).
    
    Args:
        concepts_data: Dictionary where key=concept_name, value=concept data (includes real concept_id field)
        
    Returns:
        Dictionary of concept_name -> aggregated concept data
    """
    aggregated = {}
    
    for concept_name_key, concept_data in concepts_data.items():
        concept_name = concept_data.get('concept_name')
        
        # Get concept IDs - prefer the array if it exists (from Node.js aggregation)
        if 'concept_ids' in concept_data and concept_data['concept_ids']:
            concept_ids_list = concept_data['concept_ids']
        elif 'concept_id' in concept_data:
            concept_ids_list = [concept_data['concept_id']]
        else:
            concept_ids_list = [concept_name_key]  # Fallback to key
        
        if concept_name not in aggregated:
            aggregated[concept_name] = {
                'concept_name': concept_name,
                'concept_ids': concept_ids_list[:],  # Copy the list
                'activities': {},
                'courses': set()  # Track unique courses
            }
            
            # Copy course information from first occurrence
            if 'course_id' in concept_data:
                aggregated[concept_name]['course_id'] = concept_data['course_id']
                aggregated[concept_name]['course_name'] = concept_data.get('course_name')
                if concept_data['course_id']:
                    aggregated[concept_name]['courses'].add((concept_data['course_id'], concept_data.get('course_name')))
            
            if 'course_ids' in concept_data:
                aggregated[concept_name]['course_ids'] = concept_data['course_ids'][:]
                aggregated[concept_name]['course_names'] = concept_data.get('course_names', [])[:]
                for cid, cname in zip(concept_data['course_ids'], concept_data.get('course_names', [])):
                    if cid:
                        aggregated[concept_name]['courses'].add((cid, cname))
        else:
            # Merge concept IDs from this instance
            for cid in concept_ids_list:
                if cid not in aggregated[concept_name]['concept_ids']:
                    aggregated[concept_name]['concept_ids'].append(cid)
            
            # Merge course information
            if 'course_id' in concept_data and concept_data['course_id']:
                aggregated[concept_name]['courses'].add((concept_data['course_id'], concept_data.get('course_name')))
            
            if 'course_ids' in concept_data:
                for cid, cname in zip(concept_data['course_ids'], concept_data.get('course_names', [])):
                    if cid:
                        aggregated[concept_name]['courses'].add((cid, cname))
        
        # Aggregate activities
        for activity in concept_data.get('activities', []):
            activity_id = activity.get('activity_id')
            count = activity.get('count', 0)
            activity_name = activity.get('activity_name')
            
            if activity_id not in aggregated[concept_name]['activities']:
                aggregated[concept_name]['activities'][activity_id] = {
                    'activity_id': activity_id,
                    'activity_name': activity_name,
                    'count': 0
                }
            
            aggregated[concept_name]['activities'][activity_id]['count'] += count
    
    # Finalize course information
    for concept_name in aggregated:
        courses_list = list(aggregated[concept_name]['courses'])
        del aggregated[concept_name]['courses']  # Remove temporary set
        
        if len(courses_list) == 1:
            aggregated[concept_name]['course_id'] = courses_list[0][0]
            aggregated[concept_name]['course_name'] = courses_list[0][1]
        elif len(courses_list) > 1:
            aggregated[concept_name]['course_ids'] = [c[0] for c in courses_list]
            aggregated[concept_name]['course_names'] = [c[1] for c in courses_list]
    
    return aggregated


def calculate_raw_scores(aggregated_concepts, activity_weights):
    """
    Calculate raw score for each concept.
    Formula: Score = Σ(Count × Normalized_Weight) for all activities
    
    Args:
        aggregated_concepts: Dictionary of concept_name -> aggregated concept data
        activity_weights: Dictionary mapping activity_id to weight
        
    Returns:
        Dictionary of concept_name -> raw_score
    """
    raw_scores = {}
    
    for concept_name, concept_data in aggregated_concepts.items():
        total_score = 0.0
        
        for activity in concept_data['activities'].values():
            activity_id = activity['activity_id']
            count = activity['count']
            
            # Get weight for this activity
            weight = activity_weights.get(activity_id, 0.0)
            
            # Calculate contribution: count × weight
            contribution = count * weight
            total_score += contribution
        
        raw_scores[concept_name] = total_score
    
    return raw_scores


def min_max_normalize_with_interpolation(raw_scores):
    """
    Min-Max normalization with linear interpolation for minimum score.
    Following Prompt.txt formula exactly.
    """
    if not raw_scores:
        return {}
    
    scores_list = list(raw_scores.values())
    min_score = min(scores_list)
    max_score = max(scores_list)
    
    if max_score == min_score:
        num_concepts = len(raw_scores)
        normalized_value = min_score / num_concepts
        return {concept_id: normalized_value for concept_id in raw_scores}
    
    # Find second smallest score for interpolation
    sorted_unique_scores = sorted(set(scores_list))
    if len(sorted_unique_scores) > 1:
        second_smallest = sorted_unique_scores[1]
    else:
        second_smallest = max_score
    
    # Calculate y1: normalized score for second smallest
    y1 = (second_smallest - min_score) / (max_score - min_score)
    x1 = second_smallest
    
    normalized = {}
    
    for concept_id, score in raw_scores.items():
        if score == min_score:
            # Apply linear interpolation: y = y1 * (x / x1)
            normalized[concept_id] = y1 * (score / x1)
        else:
            # Standard min-max normalization
            normalized[concept_id] = (score - min_score) / (max_score - min_score)
    
    return normalized


def z_score_normalize(raw_scores, k):
    """
    Z-Score normalization with clipping.
    
    Steps:
    1. Calculate Z-scores: Z = (Score - mean) / std
    2. Clip to [-k, k] range
    3. Scale from [-k, k] to [0, 1]
    """
    if not raw_scores:
        return {}
    
    scores_list = list(raw_scores.values())
    mean = np.mean(scores_list)
    std = np.std(scores_list, ddof=0)  # Population standard deviation
    
    if std == 0:
        return {concept_id: 0.5 for concept_id in raw_scores}
    
    normalized = {}
    
    for concept_id, score in raw_scores.items():
        # Calculate Z-score
        z_score = (score - mean) / std
        
        # Clip to [-k, k]
        z_clipped = np.clip(z_score, -k, k)
        
        # Scale from [-k, k] to [0, 1]
        normalized_score = (z_clipped + k) / (2 * k)
        
        normalized[concept_id] = normalized_score
    
    return normalized


def main(user_name="khaled"):
    print("=" * 80)
    print("INTEREST SCORE CALCULATION")
    print("=" * 80)
    print()
    
    # Define paths
    base_path = Path(__file__).parent
    # Go up from scripts/ -> level-of-interest/ -> recommendation/ -> coursemapper-kg/ -> CourseMapper-webserver/ -> webserver/
    webserver_path = base_path.parent.parent.parent.parent / "webserver"
    activities_path = webserver_path / "test" / "jsonFiles" / f"concept_based_activities_{user_name}.json"
    weights_path = base_path.parent / "data" / "activity-weights.json"
    output_path = webserver_path / "test" / "jsonFiles" / f"interest_scores_{user_name}.json"
    
    print(f"Loading data...")
    print(f"  Activities: {activities_path}")
    print(f"  Weights: {weights_path}")
    print()
    
    # Load data
    activities_data = load_json(activities_path)
    weights_data = load_json(weights_path)
    
    # Extract user data and concepts
    # Handle both old format (user_id, concepts) and new format (userid: {concept_name: {activities}})
    if 'user_id' in activities_data and 'concepts' in activities_data:
        # Old format
        user_id = activities_data.get('user_id')
        username = activities_data.get('username', 'Unknown')
        concepts_data = activities_data.get('concepts', {})
    else:
        # New format: {user_id: {username: "...", concept_name: {activities: [...]}}}
        user_id = list(activities_data.keys())[0]
        user_data = activities_data[user_id]
        username = user_data.get('username', 'Unknown')
        
        # Convert to old format structure (skip username field, preserve all concept metadata)
        concepts_data = {}
        for key, value in user_data.items():
            if key == 'username':
                continue
            concept_name = key
            concept_info = value
            concepts_data[concept_name] = {
                'concept_name': concept_name,
                'activities': concept_info['activities']
            }
            
            # Preserve concept_id and concept_ids (CRITICAL - these are the actual IDs, not names!)
            if 'concept_id' in concept_info:
                concepts_data[concept_name]['concept_id'] = concept_info['concept_id']
            if 'concept_ids' in concept_info:
                concepts_data[concept_name]['concept_ids'] = concept_info['concept_ids']
            
            # Preserve course information
            if 'course_id' in concept_info:
                concepts_data[concept_name]['course_id'] = concept_info['course_id']
            if 'course_name' in concept_info:
                concepts_data[concept_name]['course_name'] = concept_info['course_name']
            if 'course_ids' in concept_info:
                concepts_data[concept_name]['course_ids'] = concept_info['course_ids']
            if 'course_names' in concept_info:
                concepts_data[concept_name]['course_names'] = concept_info['course_names']
    
    # Create activity_id -> weight mapping
    activity_weights = {}
    for activity in weights_data['activities']:
        activity_weights[activity['activity_id']] = activity['normalized_weight']
    
    print(f"User ID: {user_id}")
    print(f"Total Concepts (before aggregation): {len(concepts_data)}")
    print(f"Total Activity Types: {len(activity_weights)}")
    print()
    
    # Step 1: Aggregate by concept name
    print("=" * 80)
    print("AGGREGATING BY CONCEPT NAME")
    print("=" * 80)
    print()
    
    aggregated_concepts = aggregate_by_concept_name(concepts_data)
    print(f"Total unique concept names: {len(aggregated_concepts)}")
    
    # Show duplicates
    duplicates = {name: data for name, data in aggregated_concepts.items() if len(data['concept_ids']) > 1}
    if duplicates:
        print(f"Found {len(duplicates)} concepts with duplicate IDs:")
        for name, data in list(duplicates.items())[:5]:
            print(f"  '{name}': {len(data['concept_ids'])} instances")
    print()
    
    # Step 2: Calculate raw scores
    print("=" * 80)
    print("CALCULATING RAW SCORES")
    print("=" * 80)
    print()
    
    raw_scores = calculate_raw_scores(aggregated_concepts, activity_weights)
    
    print(f"Raw scores calculated for {len(raw_scores)} unique concepts")
    print(f"  Min raw score: {min(raw_scores.values()):.10f}")
    print(f"  Max raw score: {max(raw_scores.values()):.10f}")
    print(f"  Mean raw score: {np.mean(list(raw_scores.values())):.10f}")
    print()
    
    # Step 3: Normalize using all methods
    print("=" * 80)
    print("NORMALIZING SCORES")
    print("=" * 80)
    print()
    
    print("Method 1: Min-Max with Linear Interpolation...")
    minmax_scores = min_max_normalize_with_interpolation(raw_scores)
    print(f"  Min: {min(minmax_scores.values()):.10f}")
    print(f"  Max: {max(minmax_scores.values()):.10f}")
    print()
    
    print("Method 2: Z-Score (k=2)...")
    zscore_k2_scores = z_score_normalize(raw_scores, k=2)
    print(f"  Min: {min(zscore_k2_scores.values()):.10f}")
    print(f"  Max: {max(zscore_k2_scores.values()):.10f}")
    print()
    
    print("Method 3: Z-Score (k=3)...")
    zscore_k3_scores = z_score_normalize(raw_scores, k=3)
    print(f"  Min: {min(zscore_k3_scores.values()):.10f}")
    print(f"  Max: {max(zscore_k3_scores.values()):.10f}")
    print()
    
    # Step 4: Build comprehensive output
    print("=" * 80)
    print("BUILDING OUTPUT")
    print("=" * 80)
    print()
    
    results = {
        "metadata": {
            "user_id": user_id,
            "username": username,
            "timestamp": datetime.now().isoformat(),
            "total_concepts": len(aggregated_concepts),
            "original_concept_count": len(concepts_data),
            "normalization_methods": [
                "min_max_interpolation",
                "z_score_k2",
                "z_score_k3"
            ]
        },
        "concepts": {}
    }
    
    # Add concept-level data (aggregated by name)
    for concept_name, concept_data in aggregated_concepts.items():
        activities_breakdown = []
        
        for activity in concept_data['activities'].values():
            activity_id = activity['activity_id']
            count = activity['count']
            weight = activity_weights.get(activity_id, 0.0)
            contribution = count * weight
            
            activities_breakdown.append({
                "activity_id": activity_id,
                "activity_name": activity['activity_name'],
                "count": count,
                "weight": weight,
                "contribution": contribution
            })
        
        concept_output = {
            "concept_ids": concept_data['concept_ids'],
            "raw_score": raw_scores[concept_name],
            "normalized_scores": {
                "min_max_interpolation": minmax_scores[concept_name],
                "z_score_k2": zscore_k2_scores[concept_name],
                "z_score_k3": zscore_k3_scores[concept_name]
            },
            "activities_breakdown": activities_breakdown,
            "total_activity_count": sum(a['count'] for a in activities_breakdown)
        }
        
        # Add course information
        if 'course_id' in concept_data:
            concept_output['course_id'] = concept_data['course_id']
            if 'course_name' in concept_data:
                concept_output['course_name'] = concept_data['course_name']
        
        if 'course_ids' in concept_data:
            concept_output['course_ids'] = concept_data['course_ids']
            if 'course_names' in concept_data:
                concept_output['course_names'] = concept_data['course_names']
        
        results["concepts"][concept_name] = concept_output
    
    # Step 4: Save results
    print(f"Saving results to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print()
    print(f"✓ Processed {len(concepts_data)} original concepts")
    print(f"✓ Aggregated to {len(aggregated_concepts)} unique concept names")
    print(f"✓ Calculated raw scores")
    print(f"✓ Applied 3 normalization methods:")
    print(f"    - Min-Max with Linear Interpolation")
    print(f"    - Z-Score (k=2)")
    print(f"    - Z-Score (k=3)")
    print(f"✓ Results saved to: {output_path}")
    print()
    
    # Display top 10 concepts by raw score
    print("=" * 80)
    print("TOP 10 CONCEPTS BY RAW SCORE")
    print("=" * 80)
    print()
    
    sorted_concepts = sorted(
        results["concepts"].items(),
        key=lambda x: x[1]["raw_score"],
        reverse=True
    )[:10]
    
    for i, (concept_name, data) in enumerate(sorted_concepts, 1):
        print(f"{i}. {concept_name}")
        print(f"   Raw Score: {data['raw_score']:.6f}")
        print(f"   Min-Max: {data['normalized_scores']['min_max_interpolation']:.6f}")
        print(f"   Z-Score (k=2): {data['normalized_scores']['z_score_k2']:.6f}")
        print(f"   Z-Score (k=3): {data['normalized_scores']['z_score_k3']:.6f}")
        print(f"   Activities: {data['total_activity_count']}")
        print(f"   Concept IDs: {len(data['concept_ids'])} instances")
        print()


if __name__ == "__main__":
    import sys
    
    # Determine which user to process
    if len(sys.argv) > 1:
        user_name = sys.argv[1].lower()
    else:
        user_name = "khaled"  # Default to khaled if no argument
    
    print(f"Processing user: {user_name}")
    print()
    
    main(user_name)
