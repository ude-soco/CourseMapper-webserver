#!/usr/bin/env python3
"""
Activity Weight Calculator for CourseMapper Interest Model

This script calculates normalized weights for different activity groups based on their votes.
These weights are used to calculate user interest scores for concepts in the Personal Knowledge Graph (PKG).

"""

import json
from typing import Dict, List, Tuple
from dataclasses import dataclass, asdict


@dataclass
class Activity:
    """Represents a single activity within an activity group."""
    id: str
    name: str
    description: str
    group_id: str
    group_name: str


@dataclass
class ActivityGroup:
    """Represents a group of related activities with their collective vote weight."""
    id: str
    name: str
    votes: int
    activities: List[Activity]


class ActivityWeightCalculator:
    """
    Calculates normalized weights for activity groups based on voting system.
    
    The weighting system uses votes to determine importance:
    - Higher votes = higher weight = more impact on concept interest score
    - Formula: Normalized_Weight = Votes / Total_Votes
    """
    
    def __init__(self):
        """Initialize the activity groups with their definitions and vote counts."""
        self.activity_groups = self._define_activity_groups()
        self.total_votes = self._calculate_total_votes()
        self.weights = self._calculate_normalized_weights()
    
    def _define_activity_groups(self) -> List[ActivityGroup]:
        """
        Define all 10 activity groups (G1-G10) with their activities and votes.
        
        Returns:
            List of ActivityGroup objects with their respective activities
        """
        return [
            ActivityGroup(
                id="G1",
                name="Recommended Material",
                votes=7,
                activities=[
                    Activity(
                        id="G1_A1",
                        name="mark-helpful-recommended-video",
                        description="User marks as helpful on recommended Video",
                        group_id="G1",
                        group_name="Recommended Material"
                    ),
                    Activity(
                        id="G1_A2",
                        name="view-recommended-material",
                        description="User views recommended material",
                        group_id="G1",
                        group_name="Recommended Material"
                    ),
                    Activity(
                        id="G1_A3",
                        name="view-recommended-videos",
                        description="User views recommended videos",
                        group_id="G1",
                        group_name="Recommended Material"
                    )
                ]
            ),
            ActivityGroup(
                id="G2",
                name="Concepts & Article",
                votes=7,
                activities=[
                    Activity(
                        id="G2_A1",
                        name="view-related-concepts-material-kg",
                        description="User views related Concepts in Material KG",
                        group_id="G2",
                        group_name="Concepts & Article"
                    ),
                    Activity(
                        id="G2_A2",
                        name="view-full-article-main-concept-material-kg",
                        description="User views full article of main concept in Material KG",
                        group_id="G2",
                        group_name="Concepts & Article"
                    ),
                    Activity(
                        id="G2_A3",
                        name="view-full-article-related-concept-material-kg",
                        description="User views the full article of related Concept in Material KG",
                        group_id="G2",
                        group_name="Concepts & Article"
                    )
                ]
            ),
            ActivityGroup(
                id="G3",
                name="Mark U/DNU",
                votes=6,
                activities=[
                    Activity(
                        id="G3_A1",
                        name="mark-did-not-understand-main-concept",
                        description="User marks Did not Understand main Concept",
                        group_id="G3",
                        group_name="Mark U/DNU"
                    )
                ]
            ),
            ActivityGroup(
                id="G4",
                name="Full Article",
                votes=5,
                activities=[
                    Activity(
                        id="G4_A1",
                        name="view-full-article-main-concept-slide-kg",
                        description="View the full article of the main concept in slide KG",
                        group_id="G4",
                        group_name="Full Article"
                    )
                ]
            ),
            ActivityGroup(
                id="G5",
                name="Explanation",
                votes=4,
                activities=[
                    Activity(
                        id="G5_A1",
                        name="view-explanation-recommended-concept",
                        description="View Explanation of why a concept is recommended",
                        group_id="G5",
                        group_name="Explanation"
                    )
                ]
            ),
            ActivityGroup(
                id="G6",
                name="Follow Annotation",
                votes=2,
                activities=[
                    Activity(
                        id="G6_A1",
                        name="follow-annotation",
                        description="User follows annotation",
                        group_id="G6",
                        group_name="Follow Annotation"
                    )
                ]
            ),
            ActivityGroup(
                id="G7",
                name="Recommended Concepts",
                votes=2,
                activities=[
                    Activity(
                        id="G7_A1",
                        name="view-recommended-concepts",
                        description="View Recommended Concepts",
                        group_id="G7",
                        group_name="Recommended Concepts"
                    )
                ]
            ),
            ActivityGroup(
                id="G8",
                name="View Slide/s related to Concept",
                votes=1,
                activities=[
                    Activity(
                        id="G8_A1",
                        name="view-slide-in-learning-material",
                        description="User views a slide in Learning Material",
                        group_id="G8",
                        group_name="View Slide/s related to Concept"
                    )
                ]
            ),
            ActivityGroup(
                id="G9",
                name="Mark Recommended DNU",
                votes=1,
                activities=[
                    Activity(
                        id="G9_A1",
                        name="mark-recommended-concept-dnu",
                        description="User marks a recommended Concept as DNU",
                        group_id="G9",
                        group_name="Mark Recommended DNU"
                    )
                ]
            ),
            ActivityGroup(
                id="G10",
                name="Course Access",
                votes=1,
                activities=[
                    Activity(
                        id="G10_A1",
                        name="enroll-in-course",
                        description="User enrolls in a course",
                        group_id="G10",
                        group_name="Course Access"
                    )
                ]
            )
        ]
    
    def _calculate_total_votes(self) -> int:
        """
        Calculate the sum of all votes across all activity groups.
        
        Returns:
            Total number of votes
        """
        return sum(group.votes for group in self.activity_groups)
    
    def _calculate_normalized_weights(self) -> Dict[str, float]:
        """
        Calculate normalized weights for each activity group.
        
        Formula: Normalized_Weight = Votes / Total_Votes
        
        Returns:
            Dictionary mapping group_id to normalized weight
        """
        weights = {}
        for group in self.activity_groups:
            # Use exact division, no rounding to preserve precision
            normalized_weight = group.votes / self.total_votes
            weights[group.id] = normalized_weight
        return weights
    
    def get_activity_list_with_weights(self) -> List[Dict]:
        """
        Generate a list of all activities with their computed weights.
        
        Returns:
            List of dictionaries containing activity details and weights
        """
        result = []
        
        for group in self.activity_groups:
            group_weight = self.weights[group.id]
            
            for activity in group.activities:
                result.append({
                    "activity_id": activity.id,
                    "activity_name": activity.name,
                    "description": activity.description,
                    "group_id": group.id,
                    "group_name": group.name,
                    "group_votes": group.votes,
                    "normalized_weight": group_weight,
                    "weight_percentage": f"{group_weight * 100:.2f}%"
                })
        
        return result
    
    def get_group_weights_summary(self) -> List[Dict]:
        """
        Generate a summary of activity groups with their weights.
        
        Returns:
            List of dictionaries with group summaries
        """
        summary = []
        
        for group in self.activity_groups:
            summary.append({
                "group_id": group.id,
                "group_name": group.name,
                "votes": group.votes,
                "normalized_weight": self.weights[group.id],
                "weight_percentage": f"{self.weights[group.id] * 100:.2f}%",
                "activity_count": len(group.activities)
            })
        
        return sorted(summary, key=lambda x: x['normalized_weight'], reverse=True)
    
    def get_weight_by_group_id(self, group_id: str) -> float:
        """
        Get the normalized weight for a specific activity group.
        
        Args:
            group_id: The ID of the activity group (e.g., 'G1', 'G2')
        
        Returns:
            Normalized weight for the group
        
        Raises:
            KeyError: If group_id doesn't exist
        """
        if group_id not in self.weights:
            raise KeyError(f"Activity group '{group_id}' not found")
        return self.weights[group_id]
    
    def get_weight_by_activity_id(self, activity_id: str) -> float:
        """
        Get the normalized weight for a specific activity.
        
        Args:
            activity_id: The ID of the activity (e.g., 'G1_A1')
        
        Returns:
            Normalized weight for the activity's group
        
        Raises:
            KeyError: If activity_id doesn't exist
        """
        # Extract group_id from activity_id (e.g., 'G1_A1' -> 'G1')
        group_id = activity_id.split('_')[0]
        return self.get_weight_by_group_id(group_id)
    
    def export_to_json(self, filepath: str = "activity-weights.json"):
        """
        Export activity weights to a JSON file.
        
        Args:
            filepath: Path where the JSON file will be saved
        """
        data = {
            "metadata": {
                "total_votes": self.total_votes,
                "total_groups": len(self.activity_groups),
                "total_activities": sum(len(g.activities) for g in self.activity_groups),
                "calculation_method": "Normalized_Weight = Votes / Total_Votes"
            },
            "group_weights": self.get_group_weights_summary(),
            "activities": self.get_activity_list_with_weights()
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Activity weights exported to: {filepath}")
    
    def print_summary(self):
        """Print a formatted summary of activity weights to console."""
        print("\n" + "="*80)
        print("ACTIVITY WEIGHT CALCULATION SUMMARY")
        print("="*80)
        print(f"\nTotal Votes: {self.total_votes}")
        print(f"Total Groups: {len(self.activity_groups)}")
        print(f"Total Activities: {sum(len(g.activities) for g in self.activity_groups)}")
        
        print("\n" + "-"*80)
        print("GROUP WEIGHTS (Sorted by Weight)")
        print("-"*80)
        print(f"{'Group ID':<10} {'Group Name':<35} {'Votes':<8} {'Weight':<12} {'%':<10}")
        print("-"*80)
        
        for group_summary in self.get_group_weights_summary():
            print(f"{group_summary['group_id']:<10} "
                  f"{group_summary['group_name']:<35} "
                  f"{group_summary['votes']:<8} "
                  f"{group_summary['normalized_weight']:<12.6f} "
                  f"{group_summary['weight_percentage']:<10}")
        
        print("\n" + "-"*80)
        print("VALIDATION")
        print("-"*80)
        total_weight = sum(self.weights.values())
        print(f"Sum of all weights: {total_weight:.6f} (should be 1.0)")
        print(f"Validation: {'✅ PASSED' if abs(total_weight - 1.0) < 0.000001 else '❌ FAILED'}")
        print("="*80 + "\n")


def main():
    """Main function to demonstrate the activity weight calculator."""
    
    # Initialize calculator
    calculator = ActivityWeightCalculator()
    
    # Print summary to console
    calculator.print_summary()
    
    # Export to JSON file
    calculator.export_to_json("activity-weights.json")
    
    # Example usage: Get weight for specific activity
    print("\n📌 Example Usage:")
    print("-" * 80)
    try:
        weight_g1 = calculator.get_weight_by_group_id("G1")
        print(f"Weight for Group G1 (Recommended Material): {weight_g1:.6f}")
        
        weight_activity = calculator.get_weight_by_activity_id("G1_A1")
        print(f"Weight for Activity G1_A1: {weight_activity:.6f}")
    except KeyError as e:
        print(f"Error: {e}")
    
    print("-" * 80)
    
    return calculator


if __name__ == "__main__":
    calculator = main()
