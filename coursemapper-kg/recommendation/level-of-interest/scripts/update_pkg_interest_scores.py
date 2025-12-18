"""
Update Personal Knowledge Graph (PKG) with user interest scores.

This script reads the calculated interest scores from interest_scores.json
and updates the Neo4j graph by creating/updating INTERESTED_IN relationships
between User nodes and Concept nodes.

Usage:
    python update_pkg_interest_scores.py [--user-id USER_ID] [--normalization-method METHOD]
"""

import json
import sys
import os
import argparse
from datetime import datetime
from typing import Optional, Dict, List
from neo4j import GraphDatabase


class PKGInterestScoreUpdater:
    """Manages updates to the Personal Knowledge Graph interest scores."""
    
    def __init__(self, uri: str, username: str, password: str):
        """
        Initialize Neo4j connection.
        
        Args:
            uri: Neo4j connection URI (e.g., bolt://127.0.0.1:7687)
            username: Neo4j username
            password: Neo4j password
        """
        self.driver = GraphDatabase.driver(uri, auth=(username, password))
        
    def close(self):
        """Close the Neo4j driver connection."""
        if self.driver:
            self.driver.close()
    
    def update_pkg_edge(
        self,
        session,
        user_id: str,
        concept_id: str,
        score: float
    ) -> Optional[Dict]:
        """
        Create or update an INTERESTED_IN relationship between a User and a main Concept.
        
        Args:
            session: Neo4j session object
            user_id: User identifier (e.g., MongoDB ObjectId string)
            concept_id: Concept identifier (cid field in Neo4j)
            score: Interest score between 0.0 and 1.0 (inclusive)
        
        Returns:
            Dictionary with updated relationship details, or None if concept not found
            
        Raises:
            ValueError: If score is not in range [0.0, 1.0]
        """
        # Validate score
        if not (0.0 <= score <= 1.0):
            raise ValueError(f"Score must be between 0.0 and 1.0, got {score}")
        
        # Cypher query with MERGE for idempotency
        query = """
        MATCH (u:User {uid: $user_id})
        WITH u
        MATCH (c:Concept {cid: $concept_id})
        WHERE c.type = 'main_concept'
        MERGE (u)-[r:INTERESTED_IN]->(c)
        SET r.interestScore = $score,
            r.updatedAt = datetime()
        RETURN u.uid as user_id, 
               c.cid as concept_id, 
               c.name as concept_name,
               r.interestScore as score,
               r.updatedAt as updated_at
        """
        
        parameters = {
            'user_id': user_id,
            'concept_id': concept_id,
            'score': float(score)
        }
        
        try:
            result = session.run(query, parameters)
            record = result.single()
            
            if record:
                return {
                    'user_id': record['user_id'],
                    'concept_id': record['concept_id'],
                    'concept_name': record['concept_name'],
                    'score': record['score'],
                    'updated_at': record['updated_at']
                }
            else:
                # Concept not found or not a main_concept
                return None
        except Exception as e:
            print(f"Error updating edge for concept {concept_id}: {str(e)}")
            return None
    
    def batch_update_pkg_edges(
        self,
        session,
        user_id: str,
        concept_scores: Dict[str, float]
    ) -> Dict[str, List]:
        """
        Batch update multiple concept interest scores for a user.
        
        Args:
            session: Neo4j session object
            user_id: User identifier
            concept_scores: Dictionary mapping concept_id -> score
            
        Returns:
            Dictionary with 'success', 'failed', and 'not_found' lists
        """
        results = {
            'success': [],
            'failed': [],
            'not_found': []
        }
        
        for concept_id, score in concept_scores.items():
            try:
                result = self.update_pkg_edge(session, user_id, concept_id, score)
                if result:
                    results['success'].append(result)
                else:
                    results['not_found'].append({
                        'concept_id': concept_id,
                        'reason': 'Concept not found or not a main_concept'
                    })
            except ValueError as e:
                results['failed'].append({
                    'concept_id': concept_id,
                    'error': str(e)
                })
            except Exception as e:
                results['failed'].append({
                    'concept_id': concept_id,
                    'error': f"Unexpected error: {str(e)}"
                })
        
        return results
    
    def update_user_interests(
        self,
        user_id: str,
        username: str,
        concepts: Dict,
        normalization_method: str = 'min_max_interpolation'
    ) -> Dict:
        """
        Update all interest scores for a specific user.
        
        Args:
            user_id: User identifier
            username: Username for logging
            concepts: Dictionary of concept data from interest_scores.json
            normalization_method: Which normalization method to use for scores
                Options: 'min_max_interpolation', 'z_score_k2', 'z_score_k3'
        
        Returns:
            Dictionary with update statistics
        """
        print(f"\n{'='*80}")
        print(f"UPDATING PKG FOR USER: {username} ({user_id})")
        print(f"{'='*80}")
        print(f"Normalization method: {normalization_method}")
        print(f"Total concepts: {len(concepts)}\n")
        
        concept_scores = {}
        
        # Collect all concept IDs and their scores
        for concept_name, concept_data in concepts.items():
            score = concept_data['normalized_scores'].get(normalization_method)
            
            if score is None:
                print(f"⚠ Warning: No {normalization_method} score for '{concept_name}'")
                continue
            
            # Add score for each concept_id (handles duplicates)
            for concept_id in concept_data['concept_ids']:
                concept_scores[concept_id] = score
        
        print(f"Processing {len(concept_scores)} concept IDs...")
        
        # Batch update in Neo4j
        with self.driver.session() as session:
            result = self.batch_update_pkg_edges(session, user_id, concept_scores)
        
        # Print results
        print(f"\n{'='*80}")
        print(f"UPDATE RESULTS")
        print(f"{'='*80}")
        print(f"✓ Success:   {len(result['success'])} edges updated")
        print(f"✗ Failed:    {len(result['failed'])} errors")
        print(f"⚠ Not Found: {len(result['not_found'])} concepts not in Neo4j")
        
        if result['failed']:
            print(f"\nFailed updates:")
            for item in result['failed'][:5]:  # Show first 5
                print(f"  - {item['concept_id']}: {item['error']}")
            if len(result['failed']) > 5:
                print(f"  ... and {len(result['failed']) - 5} more")
        
        if result['not_found'] and len(result['not_found']) <= 10:
            print(f"\nConcepts not found in Neo4j:")
            for item in result['not_found']:
                print(f"  - {item['concept_id']}")
        elif result['not_found']:
            print(f"\nNote: {len(result['not_found'])} concepts not found (IDs from duplicate aggregation)")
        
        return {
            'user_id': user_id,
            'username': username,
            'total_concepts': len(concepts),
            'total_concept_ids': len(concept_scores),
            'success': len(result['success']),
            'failed': len(result['failed']),
            'not_found': len(result['not_found'])
        }
    
    def update_all_users(
        self,
        data: Dict,
        normalization_method: str = 'min_max_interpolation'
    ) -> List[Dict]:
        """
        Update interest scores for all users in the data.
        
        Args:
            data: Complete interest_scores.json data
            normalization_method: Which normalization method to use
        
        Returns:
            List of update statistics for each user
        """
        results = []
        
        print(f"\n{'='*80}")
        print(f"UPDATING PKG INTEREST SCORES FOR ALL USERS")
        print(f"{'='*80}")
        print(f"Total users: {len(data)}")
        print(f"Normalization method: {normalization_method}\n")
        
        for i, (user_id, user_data) in enumerate(data.items(), 1):
            print(f"\n[{i}/{len(data)}] Processing user: {user_data['username']}")
            
            result = self.update_user_interests(
                user_id=user_id,
                username=user_data['username'],
                concepts=user_data['concepts'],
                normalization_method=normalization_method
            )
            
            results.append(result)
        
        return results


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description='Update PKG with user interest scores from interest_scores.json'
    )
    parser.add_argument(
        '--user-id',
        type=str,
        help='Update only this specific user ID (default: update all users)'
    )
    parser.add_argument(
        '--normalization-method',
        type=str,
        default='min_max_interpolation',
        choices=['min_max_interpolation', 'z_score_k2', 'z_score_k3'],
        help='Which normalization method to use for scores (default: min_max_interpolation)'
    )
    parser.add_argument(
        '--neo4j-uri',
        type=str,
        default='bolt://127.0.0.1:7687',
        help='Neo4j connection URI (default: bolt://127.0.0.1:7687)'
    )
    parser.add_argument(
        '--neo4j-user',
        type=str,
        default='neo4j',
        help='Neo4j username (default: neo4j)'
    )
    parser.add_argument(
        '--neo4j-password',
        type=str,
        default='1234qwer!',
        help='Neo4j password (default: 1234qwer!)'
    )
    
    args = parser.parse_args()
    
    # Determine the path to interest_scores.json
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, '..', 'data')
    scores_file = os.path.join(data_dir, 'interest_scores.json')
    
    if not os.path.exists(scores_file):
        print(f"Error: interest_scores.json not found at {scores_file}")
        print("Please run the interest scoring pipeline first.")
        sys.exit(1)
    
    # Load interest scores
    print(f"Loading interest scores from: {scores_file}")
    with open(scores_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded data for {len(data)} users")
    
    # Initialize PKG updater
    updater = PKGInterestScoreUpdater(
        uri=args.neo4j_uri,
        username=args.neo4j_user,
        password=args.neo4j_password
    )
    
    try:
        if args.user_id:
            # Update single user
            if args.user_id not in data:
                print(f"Error: User ID '{args.user_id}' not found in interest_scores.json")
                sys.exit(1)
            
            user_data = data[args.user_id]
            result = updater.update_user_interests(
                user_id=args.user_id,
                username=user_data['username'],
                concepts=user_data['concepts'],
                normalization_method=args.normalization_method
            )
            
            print(f"\n{'='*80}")
            print(f"✓ COMPLETE")
            print(f"{'='*80}")
            print(f"Updated {result['success']} concept edges in PKG")
        else:
            # Update all users
            results = updater.update_all_users(data, args.normalization_method)
            
            # Print summary
            print(f"\n{'='*80}")
            print(f"FINAL SUMMARY")
            print(f"{'='*80}")
            
            total_success = sum(r['success'] for r in results)
            total_failed = sum(r['failed'] for r in results)
            total_not_found = sum(r['not_found'] for r in results)
            
            print(f"\nProcessed {len(results)} users")
            print(f"✓ Total edges updated: {total_success}")
            print(f"✗ Total failures: {total_failed}")
            print(f"⚠ Total not found: {total_not_found}")
            
            print(f"\nPer-user breakdown:")
            for r in results:
                print(f"  {r['username']:20s} - Success: {r['success']:4d}, Failed: {r['failed']:2d}, Not Found: {r['not_found']:3d}")
            
            print(f"\n{'='*80}")
            print(f"✓ PKG UPDATE COMPLETE")
            print(f"{'='*80}")
    
    finally:
        updater.close()


if __name__ == '__main__':
    main()
