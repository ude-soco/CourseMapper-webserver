# Open Learner Interest Model - Complete Implementation Guide

**Thesis Title:** "Modeling and Explaining Open Learner Interest Model in CourseMapper"  
**Author:** Belal Elbehairy  
**Date:** December 2025
**Purpose:** Guide for future students working on CourseMapper's Interest Model

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Score Calculation Methodology](#score-calculation-methodology)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Data Flow](#data-flow)
7. [API Documentation](#api-documentation)
8. [NgRx State Management](#ngrx-state-management)
9. [UI Components](#ui-components)
10. [Testing](#testing)
11. [Deployment & Maintenance](#deployment--maintenance)
12. [Future Improvements](#future-improvements)

---

## 1. Overview

### What is the Interest Model?

The **Open Learner Interest Model** calculates and visualizes a student's interest level in different concepts based on their learning activities. Unlike engagement (how much they interact) or knowledge (what they've learned), **interest** measures how motivated or curious a student is about a specific topic.

### Key Features

- **Interest Score (0-1)**: Calculated for each user-concept pair based on weighted activities
- **Personal Knowledge Graph (PKG)**: Visual representation stored in Neo4j with `INTERESTED_IN` relationships
- **Activity Tracking**: 10 activity groups (G1-G10) with different weights based on importance
- **Score Normalization**: Min-Max normalization with linear interpolation for edge cases
- **Visual Explanations**: Interactive dashboards showing activity breakdown
- **Real-time Updates**: Manual score adjustment capability
- **Multi-view Support**: Knowledge, Engagement, and Interest views in PKG

### Technology Stack

**Backend:**
- Python 3.8+ (score calculation)
- Node.js + Express (API server)
- MongoDB (xAPI statement storage)
- Neo4j (Personal Knowledge Graph)

**Frontend:**
- Angular 16+
- NgRx (state management)
- TypeScript
- PrimeNG (UI components)
- Cytoscape.js (graph visualization)
- Chart.js (data visualization)

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Angular)                       │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  PKG Graph     │  │  Interest       │  │   Interest      │  │
│  │  Component     │  │  Dashboard      │  │   Concept       │  │
│  │  (Cytoscape)   │  │  Component      │  │   Details Panel │  │
│  └────────────────┘  └─────────────────┘  └─────────────────┘  │
│           │                    │                      │          │
│           └────────────────────┴──────────────────────┘          │
│                             NgRx Store                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  - Interest State  - Actions  - Reducers  - Effects     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API (Node.js)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  /api/pkg/:userId/interests         (GET)                  │ │
│  │  /api/pkg/:userId/interests/:cid    (PUT)                  │ │
│  │  /api/pkg/:userId/interests/batch   (PUT)                  │ │
│  │  /api/interest-level/user-concept-interest (GET)          │ │
│  │  /api/interest-level/top-concepts   (GET)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
    ┌────────────────────────┐    ┌────────────────────────┐
    │    MongoDB             │    │      Neo4j             │
    │  (xAPI Statements)     │    │  (PKG + Relationships) │
    └────────────────────────┘    └────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│           Python Score Calculation Engine                        │
│  coursemapper-kg/recommendation/level-of-interest/              │
│  └── scripts/                                                    │
│      ├── update_pkg_interest_scores.py                          │
│      ├── calculate_interest_scores.py                           │
│      └── store_scores_to_neo4j.py                               │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Activity Tracking**: User activities stored as xAPI statements in MongoDB
2. **Batch Processing**: Nightly Python job calculates interest scores
3. **PKG Storage**: Scores stored on Neo4j edges: `(User)-[:INTERESTED_IN {score}]->(Concept)`
4. **API Layer**: Node.js serves interest data to frontend
5. **Frontend Display**: Angular components visualize scores with NgRx state management
6. **User Interaction**: Manual score adjustments update Neo4j via API

---

## 3. Score Calculation Methodology

### Activity Groups and Weights

**Activity Groups (G1-G10) with Vote-Based Weights:**

| Group | Activities | Votes | Normalized Weight |
|-------|-----------|-------|-------------------|
| G1 | Recommended Material (marked helpful, viewed) | 7 | 0.1944 |
| G2 | Concepts & Article (viewed related, full article) | 7 | 0.1944 |
| G3 | Mark U/DNU (marked did not understand) | 6 | 0.1667 |
| G4 | Full Article (viewed full article in slide KG) | 5 | 0.1389 |
| G5 | Explanation (viewed why concept recommended) | 4 | 0.1111 |
| G6 | Follow Annotation | 2 | 0.0556 |
| G7 | Recommended Concepts (viewed) | 2 | 0.0556 |
| G8 | View Slides containing concept | 1 | 0.0278 |
| G9 | Mark Recommended DNU | 1 | 0.0278 |
| G10 | Course Access (enrolled in course) | 1 | 0.0278 |

**Total Votes:** 36  
**Weight Formula:** `Normalized_Weight = Votes / Total_Votes`

### Score Calculation Process

**Step 1: Raw Score Calculation**
```
For each concept:
  Raw_Score = Σ(Activity_Count × Normalized_Weight) for all activity groups
```

**Step 2: Min-Max Normalization**
```
Normalized_Score = (Raw_Score - Min_Score) / (Max_Score - Min_Score)
```

Where:
- `Min_Score` = minimum raw score across all concepts for the user
- `Max_Score` = maximum raw score across all concepts for the user

**Step 3: Linear Interpolation (Edge Case Handling)**

When a concept's score equals the minimum (would result in 0):

```
y = y1 × (x / x1)
```

Where:
- `x` = raw score of the concept
- `x0` = minimum raw score (first reference point)
- `x1` = second smallest raw score (second reference point)
- `y0` = 0 (normalized score for minimum)
- `y1` = normalized score corresponding to x1

This ensures concepts with the minimum score don't get 0 but a proportional value.

### Alternative: Z-Score Normalization

For comparison/validation, Z-score normalization is also implemented:

```
Z-Score = (Raw_Score - Mean) / Standard_Deviation
Normalized = (Z-Score + k) / (2k)  // Clipped to [0, 1]
```

Where `k = 2` or `k = 3` (configurable)

---

## 4. Backend Implementation

### Directory Structure

```
coursemapper-kg/recommendation/level-of-interest/
├── scripts/
│   ├── update_pkg_interest_scores.py      # Main entry point
│   ├── calculate_interest_scores.py       # Score calculation logic
│   ├── store_scores_to_neo4j.py          # Neo4j storage
│   └── activity_weights.json              # Activity weight configuration
├── tests/
│   ├── test_calculation.py
│   └── test_neo4j_storage.py
└── README.md

webserver/src/
├── routes/
│   ├── pkg.routes.js                      # Interest PKG endpoints
│   └── interestLevel.routes.js           # Interest dashboard endpoints
├── controllers/
│   ├── pkgController.js
│   └── interestLevelController.js
├── services/
│   ├── neo4jService.js                    # Neo4j queries
│   └── interestLevelService.js
└── jobs/
    └── interestScoreJob.js                # Scheduled batch processing
```

### Python Score Calculation

**Main Script: `update_pkg_interest_scores.py`**

```python
#!/usr/bin/env python3
"""
Update PKG Interest Scores
Calculates interest scores for all user-concept pairs and updates Neo4j PKG
"""

from calculate_interest_scores import InterestScoreCalculator
from store_scores_to_neo4j import Neo4jScoreUpdater
import logging

def main():
    # Initialize calculator
    calculator = InterestScoreCalculator(
        mongodb_uri="mongodb://localhost:27017",
        neo4j_uri="bolt://localhost:7687",
        weights_file="activity_weights.json"
    )
    
    # Calculate scores for all users
    all_scores = calculator.calculate_all_user_scores()
    
    # Store scores in Neo4j
    updater = Neo4jScoreUpdater(neo4j_uri="bolt://localhost:7687")
    updater.batch_update_scores(all_scores)
    
    logging.info(f"Updated {len(all_scores)} user-concept scores")

if __name__ == "__main__":
    main()
```

**Key Functions:**

1. **`extract_user_activities(user_id, concept_id)`**
   - Queries MongoDB for xAPI statements
   - Filters by user and concept
   - Returns activity counts per group

2. **`map_activity_to_group(verb, object_type)`**
   - Maps xAPI verb to activity group (G1-G10)
   - Handles both explicit and implicit concept references

3. **`calculate_raw_score(activity_counts, weights)`**
   - Computes weighted sum: Σ(count × weight)
   - Returns raw score and contribution breakdown

4. **`normalize_scores(user_concept_scores)`**
   - Applies Min-Max normalization
   - Handles linear interpolation for edge cases
   - Returns normalized scores [0, 1]

5. **`update_neo4j_edges(user_id, concept_scores)`**
   - Creates/updates `INTERESTED_IN` relationships
   - Stores score, timestamp, activity breakdown

### Node.js API Endpoints

**Interest PKG Endpoints (`webserver/src/routes/pkg.routes.js`):**

```javascript
// GET /api/pkg/:userId/interests
// Returns all concepts user is interested in with scores
router.get('/:userId/interests', pkgController.getInterestConcepts);

// PUT /api/pkg/:userId/interests/:conceptId
// Update interest score for single concept (manual adjustment)
router.put('/:userId/interests/:conceptId', pkgController.updateInterestScore);

// PUT /api/pkg/:userId/interests/batch
// Batch update for multiple concept IDs (duplicate handling)
router.put('/:userId/interests/batch', pkgController.batchUpdateInterestScores);
```

**Interest Dashboard Endpoints (`webserver/src/routes/interestLevel.routes.js`):**

```javascript
// GET /api/interest-level/user-concept-interest
// Get detailed activity breakdown for a concept
router.get('/user-concept-interest', interestLevelController.getUserConceptInterest);

// GET /api/interest-level/top-concepts
// Get top N concepts by interest score
router.get('/top-concepts', interestLevelController.getTopConceptsByInterest);
```

### Neo4j Query Examples

**Create/Update Interest Relationship:**
```cypher
MATCH (u:User {userId: $userId})
MATCH (c:Concept {conceptId: $conceptId})
MERGE (u)-[r:INTERESTED_IN]->(c)
SET r.score = $score,
    r.updatedAt = datetime(),
    r.method = 'min_max_interpolation',
    r.activityBreakdown = $breakdown
RETURN r
```

**Get User's Interest Concepts:**
```cypher
MATCH (u:User {userId: $userId})-[r:INTERESTED_IN]->(c:Concept)
WHERE r.score >= $minScore
RETURN c.conceptId as conceptId,
       c.name as conceptName,
       r.score as interestScore,
       c.wikipedia as wikipedia,
       c.abstract as abstract
ORDER BY r.score DESC
LIMIT $topN
```

---

## 5. Frontend Implementation

### Angular Project Structure

```
webapp/src/app/
├── pages/components/
│   ├── knowledge-graph/user-pkg/
│   │   ├── user-pkg.component.ts           # Main PKG container
│   │   ├── components/
│   │   │   ├── interest-level-graph/       # Interest graph visualization
│   │   │   │   ├── interest-level-graph.component.ts
│   │   │   │   ├── interest-level-graph.component.html
│   │   │   │   └── interest-level-graph.component.css
│   │   │   └── concept-details-panel/      # Concept occurrence details
│   │   │       ├── concept-details-panel.component.ts
│   │   │       └── concept-details-panel.component.html
│   │   ├── store/
│   │   │   ├── pkg-interest/               # Interest PKG NgRx store
│   │   │   │   ├── pkg-interest.actions.ts
│   │   │   │   ├── pkg-interest.reducer.ts
│   │   │   │   ├── pkg-interest.selectors.ts
│   │   │   │   └── pkg-interest.effects.ts
│   │   │   └── user-pkg.reducer.ts         # Main PKG store
│   │   └── types/
│   │       ├── interest-level.types.ts
│   │       └── user-pkg.types.ts
│   └── Dashboards/
│       └── interest-level-dashboard/       # Interest dashboard
│           ├── interest-level-dashboard.component.ts
│           ├── interest-level-dashboard.component.html
│           └── store/                      # Interest dashboard NgRx store
│               ├── interest-dashboard.actions.ts
│               ├── interest-dashboard.reducer.ts
│               ├── interest-dashboard.selectors.ts
│               └── interest-dashboard.effects.ts
├── services/
│   ├── pkg.service.ts                      # Interest PKG API service
│   ├── interest-level.service.ts           # Interest dashboard API service
│   └── neo4j.service.ts                    # General Neo4j queries
└── models/
    └── User.ts
```

### Key TypeScript Interfaces

**Interest Concept (`interest-level.types.ts`):**
```typescript
export interface InterestConcept {
  conceptId: string;
  conceptName: string;
  interestScore: number | null;
  wikipedia?: string;
  abstract?: string;
  courseName?: string;
  courseShortName?: string;
  allConceptIds?: string[];      // For handling duplicates
  activityCount?: number;
}
```

**Concept Interest Data (`interest-dashboard.state.ts`):**
```typescript
export interface ConceptInterestData {
  concept_name: string;
  concept_id: string;
  course_name: string;
  raw_score: number;
  normalized_scores: {
    min_max_interpolation: number;
    z_score_k2: number;
    z_score_k3: number;
  };
  activities_breakdown: ActivityBreakdown[];
}

export interface ActivityBreakdown {
  activity_id: string;
  activity_name: string;
  count: number;
  weight: number;
  contribution: number;
}
```

---

## 6. Data Flow

### Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER ACTIVITIES                                               │
│    User interacts with learning materials                        │
│    (views slides, marks concepts, follows annotations, etc.)     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. xAPI STATEMENT GENERATION                                     │
│    Frontend creates xAPI statement                               │
│    POST /api/statements                                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. MONGODB STORAGE                                               │
│    xAPI statement stored in statements collection                │
│    {actor, verb, object, timestamp, context, extensions}         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. BATCH PROCESSING (Nightly Cron Job)                          │
│    node webserver/src/jobs/interestScoreJob.js --run-now        │
│    └─> Spawns Python process:                                   │
│        python update_pkg_interest_scores.py                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. SCORE CALCULATION (Python)                                   │
│    a. Query MongoDB for all user activities                     │
│    b. Map activities to concepts (via Neo4j if needed)          │
│    c. Group activities by G1-G10                                │
│    d. Calculate raw scores: Σ(count × weight)                   │
│    e. Apply Min-Max normalization                               │
│    f. Handle edge cases with linear interpolation               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. NEO4J PKG UPDATE                                             │
│    MERGE (User)-[:INTERESTED_IN {score, breakdown}]->(Concept)  │
│    Store: score, updatedAt, method, activityBreakdown           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. FRONTEND REQUEST                                              │
│    User navigates to Interest PKG view                           │
│    Component dispatches: loadInterestGraph({userId, topN})       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. API REQUEST                                                   │
│    GET /api/pkg/:userId/interests?topN=25                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. NEO4J QUERY                                                   │
│    MATCH (u:User)-[r:INTERESTED_IN]->(c:Concept)                │
│    WHERE r.score >= threshold                                    │
│    RETURN c, r ORDER BY r.score DESC LIMIT topN                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. NGRX STATE UPDATE                                           │
│     loadInterestGraphSuccess({concepts})                         │
│     Reducer stores concepts in state                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 11. COMPONENT RENDERING                                          │
│     Selectors provide filtered/sorted concepts                   │
│     Cytoscape renders graph visualization                        │
│     User can:                                                    │
│     - Click nodes to see details                                 │
│     - Adjust scores manually                                     │
│     - Navigate to dashboard                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Activity Tracking Flow (Detailed)

**Scenario: User marks concept as "Understood"**

```
1. User clicks "Mark as Understood" on concept in slide
   ↓
2. Frontend: userConceptsService.markAsUnderstood(conceptId, understood)
   ↓
3. Backend: POST /api/user-concepts/mark-understood
   ↓
4. Neo4j: Update (User)-[r:KNOWS]->(Concept) relationship
   ↓
5. MongoDB: Create xAPI statement:
   {
     verb: "http://www.CourseMapper.de/verb/mark-understood",
     object: {
       type: "slide-kg-main-concept",
       id: conceptId,
       extensions: {
         cid: conceptId,
         materialId: "...",
         courseId: "...",
         materialPage: 44
       }
     }
   }
   ↓
6. Response: 200 OK
   ↓
7. Frontend: UI updated, toast notification shown
   ↓
8. Nightly Job: Activity counted in G3 (Mark U/DNU) for interest calculation
```

---

## 7. API Documentation

### Interest PKG Endpoints

#### GET /api/pkg/:userId/interests

Get all concepts a user is interested in with their scores.

**Query Parameters:**
- `topN` (optional): Limit results (number or "All", default: 25)
- `minScore` (optional): Minimum interest score threshold (0-1, default: 0)

**Response:**
```json
{
  "userId": "682a04555614cda0a1310c04",
  "concepts": [
    {
      "conceptId": "concept_123",
      "conceptName": "Neural Networks",
      "interestScore": 0.87,
      "wikipedia": "https://en.wikipedia.org/wiki/Neural_network",
      "abstract": "A neural network is...",
      "courseName": "Deep Learning",
      "courseShortName": "DL101",
      "activityCount": 15
    }
  ]
}
```

#### PUT /api/pkg/:userId/interests/:conceptId

Manually adjust interest score for a concept.

**Request Body:**
```json
{
  "score": 0.95,
  "reason": "manual_adjustment"
}
```

**Response:**
```json
{
  "success": true,
  "conceptId": "concept_123",
  "oldScore": 0.87,
  "newScore": 0.95,
  "updatedAt": "2026-01-12T10:30:00Z"
}
```

#### PUT /api/pkg/:userId/interests/batch

Update scores for multiple concepts (handles duplicates with same name).

**Request Body:**
```json
{
  "conceptIds": ["concept_123", "concept_456", "concept_789"],
  "score": 0.92,
  "conceptName": "Neural Networks"
}
```

**Response:**
```json
{
  "success": true,
  "updatedCount": 3,
  "conceptIds": ["concept_123", "concept_456", "concept_789"]
}
```

### Interest Dashboard Endpoints

#### GET /api/interest-level/user-concept-interest

Get detailed activity breakdown for a specific concept.

**Query Parameters:**
- `userId` (required): User ID
- `conceptName` (required): Concept name

**Response:**
```json
{
  "concept_name": "Neural Networks",
  "concept_id": "concept_123",
  "course_name": "Deep Learning",
  "raw_score": 2.45,
  "normalized_scores": {
    "min_max_interpolation": 0.87,
    "z_score_k2": 0.85,
    "z_score_k3": 0.82
  },
  "activities_breakdown": [
    {
      "activity_id": "G1_A1",
      "activity_name": "User marks as helpful on recommended Video",
      "count": 3,
      "weight": 0.1944,
      "contribution": 0.5832
    },
    {
      "activity_id": "G2_A1",
      "activity_name": "User views related Concepts in Material KG",
      "count": 5,
      "weight": 0.1944,
      "contribution": 0.972
    }
  ]
}
```

#### GET /api/interest-level/top-concepts

Get top N concepts by interest score for comparison.

**Query Parameters:**
- `userId` (required): User ID
- `limit` (optional): Number of concepts (default: 10)

**Response:**
```json
{
  "userId": "682a04555614cda0a1310c04",
  "concepts": [
    {
      "name": "Neural Networks",
      "score": 0.87,
      "course": "Deep Learning"
    },
    {
      "name": "Backpropagation",
      "score": 0.82,
      "course": "Deep Learning"
    }
  ]
}
```

---

## 8. NgRx State Management

### PKG Interest Store

**Location:** `webapp/src/app/pages/components/knowledge-graph/user-pkg/store/pkg-interest/`

#### State Structure

```typescript
export interface PkgInterestState {
  // Data
  concepts: InterestConcept[];
  
  // Loading states
  loading: boolean;
  loadingRelated: boolean;
  error: string | null;
  
  // Filters
  searchTerm: string;
  topN: number | 'All';
  
  // UI state
  tooltipState: TooltipState;
  scoreEditState: ScoreEditState;
  graphPositions: { [nodeId: string]: { x: number; y: number } };
  panelVisibility: {
    legend: boolean;
    filters: boolean;
  };
  
  // Navigation
  returnViewMode: 'interest' | 'engagement' | 'knowledge' | null;
}
```

#### Key Actions

```typescript
// Data loading
export const loadInterestGraph = createAction(
  '[PKG Interest] Load Interest Graph',
  props<{ userId: string; topN: number | 'All' }>()
);

export const loadInterestGraphSuccess = createAction(
  '[PKG Interest] Load Interest Graph Success',
  props<{ concepts: InterestConcept[] }>()
);

// Score editing
export const showScoreEditTooltip = createAction(
  '[PKG Interest] Show Score Edit Tooltip',
  props<{ conceptIds: string[]; conceptName: string; currentScore: number; position: { x: number; y: number } }>()
);

export const updateInterestScore = createAction(
  '[PKG Interest] Update Interest Score',
  props<{ userId: string; conceptIds: string[]; conceptName: string; newScore: number }>()
);

// Filters
export const setSearchTerm = createAction(
  '[PKG Interest] Set Search Term',
  props<{ searchTerm: string }>()
);

export const setTopN = createAction(
  '[PKG Interest] Set Top N',
  props<{ topN: number | 'All' }>()
);
```

#### Effects

```typescript
@Injectable()
export class PkgInterestEffects {
  // Load interest graph
  loadInterestGraph$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PkgInterestActions.loadInterestGraph),
      switchMap(({ userId, topN }) =>
        this.pkgService.getInterestConcepts(userId, topN).pipe(
          map(concepts => PkgInterestActions.loadInterestGraphSuccess({ concepts })),
          catchError(error => of(PkgInterestActions.loadInterestGraphFailure({ error: error.message })))
        )
      )
    )
  );

  // Update score
  updateScore$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PkgInterestActions.updateInterestScore),
      switchMap(({ userId, conceptIds, conceptName, newScore }) =>
        this.pkgService.updateInterestScoreForMultipleConcepts(userId, conceptIds, newScore, conceptName).pipe(
          map(() => PkgInterestActions.updateInterestScoreSuccess({ conceptIds, newScore })),
          catchError(error => of(PkgInterestActions.updateInterestScoreFailure({ error: error.message })))
        )
      )
    )
  );
}
```

#### Selectors

```typescript
// Basic selectors
export const selectInterestConcepts = createSelector(
  selectPkgInterestState,
  (state) => state.concepts
);

export const selectLoading = createSelector(
  selectPkgInterestState,
  (state) => state.loading
);

// Filtered selectors
export const selectFilteredInterestConcepts = createSelector(
  selectInterestConcepts,
  selectSearchTerm,
  selectTopN,
  (concepts, searchTerm, topN) => {
    let filtered = [...concepts];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.conceptName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply topN limit
    if (topN !== 'All') {
      filtered = filtered.slice(0, topN);
    }
    
    return filtered;
  }
);
```

### Interest Dashboard Store

**Location:** `webapp/src/app/pages/components/Dashboards/interest-level-dashboard/store/`

#### State Structure

```typescript
export interface InterestDashboardState {
  // Route params
  conceptName: string;
  conceptId: string;
  
  // Data
  conceptData: ConceptInterestData | null;
  activityCategories: ActivityCategoryGroup[];
  topConcepts: TopConcept[];
  
  // Loading states
  loading: boolean;
  loadingTopConcepts: boolean;
  error: string | null;
  
  // Charts
  charts: DashboardChartState;
  
  // UI state
  activeTabIndex: number;
  topConceptsLimit: number | 'All';
  returnViewMode: 'interest' | 'engagement' | 'knowledge' | null;
}
```

#### Key Actions

```typescript
// Initialization
export const initializeDashboard = createAction(
  '[Interest Dashboard] Initialize Dashboard',
  props<{ userId: string; conceptName: string }>()
);

// Data loading
export const loadConceptData = createAction(
  '[Interest Dashboard] Load Concept Data',
  props<{ userId: string; conceptName: string }>()
);

export const loadTopConcepts = createAction(
  '[Interest Dashboard] Load Top Concepts',
  props<{ userId: string; limit: number }>()
);

// UI interactions
export const toggleCategoryExpand = createAction(
  '[Interest Dashboard] Toggle Category Expand',
  props<{ categoryKey: string }>()
);

export const setActiveTab = createAction(
  '[Interest Dashboard] Set Active Tab',
  props<{ tabIndex: number }>()
);
```

---

## 9. UI Components

### Interest Level Graph Component

**Purpose:** Visualize user's interest PKG using Cytoscape.js

**Features:**
- **Nodes:**
  - User node (center, blue)
  - Concept nodes (colored by score: red → yellow → green)
  - Size based on interest score
- **Edges:**
  - `INTERESTED_IN` relationships
  - Width based on score
  - Hover tooltip shows score value
- **Interactions:**
  - Click node → show concept details panel
  - Click edge → edit score tooltip
  - Search filter concepts
  - Adjust topN limit
  - Save/restore graph positions

**Score Editing:**
```typescript
// When user clicks edge, show editable tooltip
showScoreEditTooltip(conceptIds, conceptName, currentScore, position) {
  this.store.dispatch(PkgInterestActions.showScoreEditTooltip({
    conceptIds,
    conceptName,
    currentScore,
    position
  }));
}

// User adjusts score (0-100% slider)
onScoreChange(newScore: number) {
  this.adjustedScore = newScore / 100;  // Convert to 0-1
}

// User saves new score
saveScore() {
  this.store.dispatch(PkgInterestActions.updateInterestScore({
    userId: this.currentUser.id,
    conceptIds: this.currentConceptIds,
    conceptName: this.currentConceptName,
    newScore: this.adjustedScore
  }));
}
```

### Interest Level Dashboard Component

**Purpose:** Detailed activity breakdown and comparison for a concept

**Tabs:**
1. **My Activities**: User's activity breakdown by category
2. **Total Activities**: Summary chart of all activities
3. **Concepts with Highest Score**: Comparison with top concepts

**Activity Categories:**
- Knowledge Graph Activities (G2, G3, G4)
- Recommendation Activities (G1, G5, G7, G9)
- Annotation Activities (G6)
- Material Activities (G8)
- Access Activities (G10)

**Charts:**
- **Gauge Chart**: Interest score (0-100%)
- **Category Charts**: Bar charts for each activity category
- **Total Activities**: Horizontal bar chart of all categories
- **Top Concepts**: Comparison bar chart

**Filters:**
- Toggle category visibility
- Expand/collapse categories
- Switch between chart/text view

### Concept Details Panel

**Purpose:** Show where a concept appears in learning materials

**Display Hierarchy:**
```
Course
  └── Material (PDF/Video)
      └── Slide/Page
```

**Features:**
- Tree view of occurrences
- Click to navigate to material/slide
- Handles concepts without occurrences (shows course only)
- Distinguishes between:
  - Slide-level occurrence (specific page)
  - Material-level occurrence (no specific page)
  - Course-level occurrence (concept in curriculum)

**Interest Mode Handling:**
```typescript
// Interest PKG has different data structure than Knowledge PKG
onConceptSelected(conceptData: any): void {
  this.viewMode$.pipe(take(1)).subscribe((viewMode) => {
    if (viewMode === 'interest') {
      // Interest mode: check if rawConceptRecords available
      this.fetchConceptOccurrencesForInterest(conceptData);
    } else {
      // Knowledge mode: use existing rawConceptRecords
      this.conceptDetails = this.extractConceptDetails(conceptData.cid, records);
    }
  });
}
```

---

## 10. Testing

### Backend Testing

**Python Tests (`coursemapper-kg/recommendation/level-of-interest/tests/`):**

```python
# test_calculation.py
def test_raw_score_calculation():
    """Test raw score calculation with sample activities"""
    activities = {
        'G1': {'A1': 3, 'A2': 2},
        'G2': {'A1': 5}
    }
    weights = {
        'G1': {'A1': 0.1944, 'A2': 0.1944},
        'G2': {'A1': 0.1944}
    }
    
    score = calculate_raw_score(activities, weights)
    expected = (3 * 0.1944) + (2 * 0.1944) + (5 * 0.1944)
    assert abs(score - expected) < 0.0001

def test_min_max_normalization():
    """Test Min-Max normalization"""
    raw_scores = [0.5, 1.0, 1.5, 2.0, 2.5]
    normalized = normalize_min_max(raw_scores)
    
    assert normalized[0] == 0.0  # Min
    assert normalized[-1] == 1.0  # Max
    assert normalized[2] == 0.5  # Middle

def test_linear_interpolation():
    """Test linear interpolation for edge case"""
    x0, x1 = 0.5, 1.0
    y0, y1 = 0.0, 0.25
    x = 0.75
    
    y = linear_interpolate(x, x0, x1, y0, y1)
    expected = 0.125  # Halfway between 0 and 0.25
    assert abs(y - expected) < 0.0001
```

**Node.js API Tests (`webserver/tests/`):**

```javascript
// test-interest-api.js
describe('Interest PKG API', () => {
  test('GET /api/pkg/:userId/interests returns concepts', async () => {
    const response = await request(app)
      .get('/api/pkg/test-user-123/interests')
      .query({ topN: 10 });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('concepts');
    expect(Array.isArray(response.body.concepts)).toBe(true);
  });
  
  test('PUT /api/pkg/:userId/interests/:conceptId updates score', async () => {
    const response = await request(app)
      .put('/api/pkg/test-user-123/interests/concept-456')
      .send({ score: 0.95 });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.newScore).toBe(0.95);
  });
});
```

### Frontend Testing

**NgRx Tests (`webapp/src/app/.../store/*.spec.ts`):**

```typescript
// pkg-interest.reducer.spec.ts
describe('PkgInterestReducer', () => {
  it('should handle loadInterestGraphSuccess', () => {
    const concepts: InterestConcept[] = [
      { conceptId: '1', conceptName: 'Test', interestScore: 0.8 }
    ];
    
    const action = PkgInterestActions.loadInterestGraphSuccess({ concepts });
    const state = pkgInterestReducer(initialState, action);
    
    expect(state.concepts).toEqual(concepts);
    expect(state.loading).toBe(false);
  });
  
  it('should handle updateInterestScoreSuccess', () => {
    const initialState = {
      ...defaultState,
      concepts: [
        { conceptId: '1', conceptName: 'Test', interestScore: 0.8 }
      ]
    };
    
    const action = PkgInterestActions.updateInterestScoreSuccess({
      conceptIds: ['1'],
      newScore: 0.95
    });
    
    const state = pkgInterestReducer(initialState, action);
    expect(state.concepts[0].interestScore).toBe(0.95);
  });
});

// pkg-interest.selectors.spec.ts
describe('PKG Interest Selectors', () => {
  it('should select filtered concepts', () => {
    const state = {
      concepts: [
        { conceptName: 'Neural Network', interestScore: 0.9 },
        { conceptName: 'Decision Tree', interestScore: 0.7 }
      ],
      searchTerm: 'neural',
      topN: 25
    };
    
    const result = selectFilteredInterestConcepts.projector(
      state.concepts,
      state.searchTerm,
      state.topN
    );
    
    expect(result).toHaveLength(1);
    expect(result[0].conceptName).toBe('Neural Network');
  });
});
```

**Component Tests:**

```typescript
// interest-level-graph.component.spec.ts
describe('InterestLevelGraphComponent', () => {
  it('should load interest graph on init', () => {
    const store = TestBed.inject(Store);
    spyOn(store, 'dispatch');
    
    component.ngOnInit();
    
    expect(store.dispatch).toHaveBeenCalledWith(
      PkgInterestActions.loadInterestGraph({
        userId: 'test-user',
        topN: 25
      })
    );
  });
  
  it('should show score edit tooltip on edge click', () => {
    const store = TestBed.inject(Store);
    spyOn(store, 'dispatch');
    
    component.showScoreEditTooltip(['concept-1'], 'Test Concept', 0.8, { x: 100, y: 100 });
    
    expect(store.dispatch).toHaveBeenCalledWith(
      PkgInterestActions.showScoreEditTooltip({
        conceptIds: ['concept-1'],
        conceptName: 'Test Concept',
        currentScore: 0.8,
        position: { x: 100, y: 100 }
      })
    );
  });
});
```

### End-to-End Testing

```typescript
// e2e/interest-pkg.spec.ts
describe('Interest PKG E2E', () => {
  it('should display interest graph and allow score editing', () => {
    cy.login('test-user', 'password');
    cy.visit('/pkg?view=interest');
    
    // Wait for graph to load
    cy.get('.cytoscape-graph').should('be.visible');
    cy.get('.concept-node').should('have.length.greaterThan', 0);
    
    // Click on edge to edit score
    cy.get('.interest-edge').first().click();
    cy.get('.score-edit-tooltip').should('be.visible');
    
    // Adjust score
    cy.get('.score-slider').invoke('val', 90).trigger('input');
    cy.get('.save-score-button').click();
    
    // Verify success message
    cy.get('.p-toast-message-success').should('contain', 'Score updated');
  });
});
```

---

## 11. Deployment & Maintenance

### Installation & Setup

**1. Prerequisites:**
```bash
# Install Node.js 16+
node --version

# Install Python 3.8+
python --version

# Install MongoDB
mongod --version

# Install Neo4j
neo4j version
```

**2. Backend Setup:**
```bash
# Clone repository
git clone https://github.com/your-org/CourseMapper.git
cd CourseMapper

# Install Node.js dependencies
cd webserver
npm install

# Install Python dependencies
cd ../coursemapper-kg/recommendation
pipenv install
```

**3. Frontend Setup:**
```bash
cd webapp
npm install

# Build for production
npm run build:prod
```

**4. Configuration:**

**MongoDB Connection (`webserver/.env`):**
```env
MONGODB_URI=mongodb://localhost:27017/coursemapper
```

**Neo4j Connection (`coursemapper-kg/recommendation/.env`):**
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

**Activity Weights (`coursemapper-kg/recommendation/level-of-interest/scripts/activity_weights.json`):**
```json
{
  "G1": {
    "A1": { "name": "User marks as helpful on recommended Video", "weight": 0.1944 },
    "A2": { "name": "User views rec material", "weight": 0.1944 },
    "A3": { "name": "User views Rec Videos", "weight": 0.1944 }
  },
  "G2": { ... },
  ...
}
```

### Running the System

**Development Mode:**
```bash
# Terminal 1: Start MongoDB
mongod --dbpath /path/to/data

# Terminal 2: Start Neo4j
neo4j console

# Terminal 3: Start backend
cd webserver
npm run dev

# Terminal 4: Start frontend
cd webapp
npm start
```

**Production Mode:**
```bash
# Start services with PM2
pm2 start ecosystem.config.js

# Or use Docker Compose
docker-compose up -d
```

### Scheduled Jobs

**Interest Score Calculation (Nightly):**

**Using Cron (Linux/Mac):**
```bash
# Add to crontab
crontab -e

# Run every night at 2 AM
0 2 * * * cd /path/to/webserver && node src/jobs/interestScoreJob.js --run-now
```

**Using Task Scheduler (Windows):**
```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "node" -Argument "C:\path\to\webserver\src\jobs\interestScoreJob.js --run-now"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "InterestScoreCalculation"
```

**Manual Execution:**
```bash
# Run score calculation manually
cd webserver
node src/jobs/interestScoreJob.js --run-now

# Or run Python script directly
cd coursemapper-kg/recommendation
pipenv run python level-of-interest/scripts/update_pkg_interest_scores.py
```

### Monitoring & Logging

**Backend Logs:**
```javascript
// webserver/src/jobs/interestScoreJob.js
console.log(`[${new Date().toISOString()}] Starting interest score calculation`);
console.log(`[${new Date().toISOString()}] Processed ${userCount} users`);
console.log(`[${new Date().toISOString()}] Updated ${conceptCount} concepts`);
```

**Python Logs:**
```python
# coursemapper-kg/recommendation/level-of-interest/scripts/update_pkg_interest_scores.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('interest_scores.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
logger.info(f"Calculated scores for {len(user_concepts)} user-concept pairs")
```

**Check Logs:**
```bash
# View backend logs
tail -f webserver/logs/combined.log

# View Python logs
tail -f coursemapper-kg/recommendation/interest_scores.log

# View PM2 logs
pm2 logs coursemapper-backend
```

### Database Maintenance

**MongoDB:**
```javascript
// Check xAPI statement count
db.statements.count()

// Find activities for user
db.statements.find({ 'statement.actor.account.name': 'user-id' }).count()

// Create index for performance
db.statements.createIndex({ 'statement.actor.account.name': 1 })
db.statements.createIndex({ 'statement.timestamp': 1 })
```

**Neo4j:**
```cypher
// Check interest relationships
MATCH ()-[r:INTERESTED_IN]->() RETURN count(r)

// Find concepts with scores
MATCH (u:User {userId: 'user-id'})-[r:INTERESTED_IN]->(c:Concept)
RETURN c.name, r.score
ORDER BY r.score DESC

// Create index for performance
CREATE INDEX ON :Concept(conceptId)
CREATE INDEX ON :User(userId)
```

### Backup & Recovery

**MongoDB Backup:**
```bash
# Backup
mongodump --db coursemapper --out /backup/mongodb/$(date +%Y%m%d)

# Restore
mongorestore --db coursemapper /backup/mongodb/20260112
```

**Neo4j Backup:**
```bash
# Backup (requires Neo4j Enterprise)
neo4j-admin backup --from=localhost:6362 --backup-dir=/backup/neo4j

# Or export to Cypher
neo4j-shell -c "MATCH (n)-[r]->(m) RETURN n,r,m" > /backup/neo4j/graph.cypher
```

---

## 12. Future Improvements

### Short-Term Enhancements

1. **Real-time Score Updates**
   - WebSocket connection for live score changes
   - Instant PKG updates without page refresh
   - Real-time activity streaming

2. **Advanced Filtering**
   - Filter by course
   - Filter by score range
   - Filter by activity type
   - Time-based filtering (recent activities)

3. **Comparison Features**
   - Compare interest across multiple concepts
   - Compare with peer averages
   - Historical interest trends

4. **Recommendations**
   - Suggest concepts based on interest patterns
   - Recommend learning paths
   - Identify knowledge gaps

### Long-Term Research Directions

1. **Alternative Scoring Methods**
   - TF-IDF based weighting
   - Time-decay factors (recent activities weighted more)
   - Contextual weighting (activity sequences)
   - Machine learning models (predict interest from patterns)

2. **Explainability Enhancements**
   - Natural language explanations ("You're interested in X because...")
   - Visual activity timelines
   - Causal chain visualization
   - Interactive "what-if" scenarios

3. **Personalization**
   - Adaptive activity weights per user
   - Learning style-based adjustments
   - Cultural/linguistic adaptations

4. **Integration with Other Models**
   - Combined interest + knowledge + engagement model
   - Emotional state detection
   - Motivation analysis
   - Learning outcome prediction

### Known Limitations

1. **Data Sparsity**: Users with few activities have unreliable scores
2. **Cold Start**: New users have no interest data
3. **Concept Mapping**: Some activities don't map cleanly to concepts
4. **Weight Subjectivity**: Activity weights based on voting, not empirical validation
5. **Normalization Issues**: Min-Max sensitive to outliers
6. **Temporal Dynamics**: Current model doesn't account for interest decay over time

### Validation Needed

1. **User Studies**: Validate that calculated scores match perceived interest
2. **A/B Testing**: Test different weight configurations
3. **Longitudinal Studies**: Track interest evolution over time
4. **Cross-Cultural Validation**: Test in different educational contexts
5. **Scale Testing**: Performance with 10,000+ users and 100,000+ concepts

---

## Appendix A: File Locations Quick Reference

### Backend Files
```
coursemapper-kg/recommendation/level-of-interest/
├── scripts/
│   ├── update_pkg_interest_scores.py          # Main entry point
│   ├── calculate_interest_scores.py           # Score calculation
│   ├── store_scores_to_neo4j.py              # Neo4j storage
│   └── activity_weights.json                  # Weight configuration
└── tests/
    ├── test_calculation.py
    └── test_neo4j_storage.py

webserver/src/
├── routes/
│   ├── pkg.routes.js                          # /api/pkg/:userId/interests
│   └── interestLevel.routes.js               # /api/interest-level/*
├── controllers/
│   ├── pkgController.js
│   └── interestLevelController.js
├── services/
│   ├── neo4jService.js
│   └── interestLevelService.js
└── jobs/
    └── interestScoreJob.js                    # Scheduled batch processing
```

### Frontend Files
```
webapp/src/app/
├── pages/components/knowledge-graph/user-pkg/
│   ├── user-pkg.component.ts                  # Main PKG container
│   ├── components/
│   │   ├── interest-level-graph/              # Interest graph
│   │   │   ├── interest-level-graph.component.ts
│   │   │   ├── interest-level-graph.component.html
│   │   │   └── interest-level-graph.component.css
│   │   └── concept-details-panel/             # Concept details
│   │       ├── concept-details-panel.component.ts
│   │       └── concept-details-panel.component.html
│   ├── store/
│   │   └── pkg-interest/                      # Interest PKG NgRx
│   │       ├── pkg-interest.actions.ts
│   │       ├── pkg-interest.reducer.ts
│   │       ├── pkg-interest.selectors.ts
│   │       └── pkg-interest.effects.ts
│   └── types/
│       ├── interest-level.types.ts
│       └── user-pkg.types.ts
└── pages/components/Dashboards/
    └── interest-level-dashboard/              # Interest dashboard
        ├── interest-level-dashboard.component.ts
        ├── interest-level-dashboard.component.html
        └── store/                             # Dashboard NgRx
            ├── interest-dashboard.actions.ts
            ├── interest-dashboard.reducer.ts
            ├── interest-dashboard.selectors.ts
            └── interest-dashboard.effects.ts
```

### Configuration Files
```
webserver/.env                                 # Backend environment
coursemapper-kg/recommendation/.env           # Python environment
webapp/src/environments/                       # Frontend config
```

---

## Appendix B: Common Issues & Solutions

### Issue 1: Scores not updating in PKG

**Symptoms:**
- Score calculation runs successfully
- But PKG graph shows old scores

**Solution:**
```bash
# Check Neo4j connection
neo4j status

# Verify scores in Neo4j
neo4j-shell -c "MATCH ()-[r:INTERESTED_IN]->() RETURN r.score, r.updatedAt LIMIT 10"

# Restart backend to clear cache
pm2 restart coursemapper-backend
```

### Issue 2: Frontend shows "Loading..." indefinitely

**Symptoms:**
- Interest PKG view stuck loading
- No concepts displayed

**Solution:**
```typescript
// Check browser console for errors
// Common causes:
// 1. API endpoint unreachable
// 2. NgRx effects not registered
// 3. CORS issues

// Verify API is responding:
fetch('http://localhost:3000/api/pkg/user-id/interests')
  .then(r => r.json())
  .then(console.log);

// Check NgRx Effects are registered in module:
// app.module.ts or knowledge-graph.module.ts
EffectsModule.forFeature([PkgInterestEffects])
```

### Issue 3: Score calculation fails with concept mapping error

**Symptoms:**
- Python script fails with "Concept not found for material/page"
- Many activities not counted

**Solution:**
```python
# Check Neo4j concept-material relationships
# Some materials might not have concepts mapped yet

# Add fallback logic in calculate_interest_scores.py:
def get_concepts_for_material(material_id, page):
    concepts = query_neo4j_concepts(material_id, page)
    if not concepts:
        logging.warning(f"No concepts found for {material_id} page {page}")
        return []  # Skip this activity
    return concepts
```

### Issue 4: Duplicate concepts in graph

**Symptoms:**
- Same concept appears multiple times
- Different concept IDs but same name

**Solution:**
```typescript
// Frontend deduplicates by conceptName in reducer:
const uniqueConcepts = Array.from(
  new Map(concepts.map(c => [c.conceptName, c])).values()
);

// Backend should deduplicate in Neo4j query:
MATCH (u:User)-[r:INTERESTED_IN]->(c:Concept)
WITH c.name as name, collect(c) as concepts, max(r.score) as maxScore
RETURN concepts[0], maxScore
```

---

## Appendix C: Glossary

**Activity Group (G1-G10)**: Category of related user activities with shared importance level

**Concept**: A learning topic or keyword (e.g., "Neural Networks", "Backpropagation")

**Interest Score**: Numerical value (0-1) representing user's interest in a concept

**Min-Max Normalization**: Scaling method that transforms scores to [0, 1] range

**Linear Interpolation**: Method to handle edge case when score equals minimum

**PKG (Personal Knowledge Graph)**: User-specific graph showing relationships between user, concepts, and courses

**xAPI (Experience API)**: Standard format for tracking learning activities

**NgRx**: Redux-inspired state management library for Angular

**Cytoscape.js**: Graph visualization library

**Optimistic Update**: UI updates immediately before server confirms change

**Activity Breakdown**: Detailed list of activities contributing to interest score

---

## Contact & Support

**Thesis Author:** Belal Elbehairy  
**Email:** belalelbehairy3@gmail.com  
**GitHub:** https://github.com/your-username/CourseMapper  

**For Questions:**
1. Check this documentation first
2. Search existing GitHub issues
3. Create new issue with detailed description
4. Tag with `interest-model` label

**For Contributions:**
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request with description

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2026 | Initial implementation |
| 1.1.0 | (Future) | Real-time updates, advanced filtering |

---

**Last Updated:** January 12, 2026  
**Document Version:** 1.0.0  
**Status:** Complete Implementation Guide
