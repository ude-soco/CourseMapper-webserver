// import { graphDb } from "../graph/neo4j"

const neo4j = require('neo4j-driver');
const graphDb = {};

export async function connect(url, user, password) {
  try {
    graphDb.driver = neo4j.driver(url, neo4j.auth.basic(user, password), { disableLosslessIntegers: true });
    await graphDb.driver.verifyConnectivity();
    console.log(`Connected to Neo4j`);
  } catch (error) {
    console.error('Failed to connect to Neo4j', error);
  }
}


export async function userSavesOrRemovesResource(data) {
    /*
        User saves or removes Resource(s)
        data: {
            "user_id": "vhf",
            "rid": "2gdsg",
            "status": true (create) | false (remove) => (to create or remove a resource saved from the user list)
        }
    */
    console.log("Saving or Removing from Resource Saved List");
    const result = { msg: "" };

    if (data.status === true) {
        // Save resource
        await graphDb.driver.executeQuery(
            `
                MATCH (a:User {uid: $user_id}), (b:Resource {rid: $rid})
                MERGE (a)-[r:HAS_SAVED {user_id: $user_id, rid: $rid}]->(b)
            `,
            { user_id: data.user_id, rid: data.rid }
        );
        result.msg = "saved";
    } else {
        // Remove resource
        await graphDb.driver.executeQuery(
            `
                MATCH (a:User {uid: $user_id})-[r:HAS_SAVED {user_id: $user_id, rid: $rid}]->(b:Resource {rid: $rid})
                DELETE r
            `,
            { user_id: data.user_id, rid: data.rid }
        );
        result.msg = "removed";
    }

    // Update resource's saves_count
    await graphDb.driver.executeQuery(
        `
            MATCH (a:Resource {rid: $rid})
            OPTIONAL MATCH (a)<-[r:HAS_SAVED {rid: $rid}]-()
            WITH a, COUNT(r) AS saves_counter
            SET a.saves_count = saves_counter
        `,
        { rid: data.rid }
    );

    console.log("Saving or Removing from Resource Saved List: Done");
    return result;
}


export async function userRatesResource(rating) {
    /*
        User rates Resource(s)
        rating: {
            "user_id": "43dukl8",
            "rid": "bnm565j",
            "value": "HELPFUL" | "NOT_HELPFUL",
            "reset": true // to undo any rating
        }
    */
    console.log("User Rates Resource");
    let resetStatus = false;
    let result = {};

    if (rating.reset === true) {
        // Reset (Remove Rating)
        await graphDb.driver.executeQuery(
            `
                MATCH (a:User)-[r:HAS_RATED]->(b:Resource)
                WHERE r.user_id = $user_id AND r.rid = $rid AND r.value = $value
                DELETE r
            `,
            {
                user_id: rating.user_id,
                rid: rating.rid,
                value: rating.value,
            }
        );
        resetStatus = true;
    } else if (rating.value !== "HELPFUL") {
        // Add or Update Rating (for non-HELPFUL)
        await graphDb.driver.executeQuery(
            `
                MATCH (a:User {uid: $user_id}), (b:Resource {rid: $rid})
                MERGE (a)-[r:HAS_RATED {user_id: $user_id, rid: $rid}]->(b)
                ON CREATE SET r.cids = [], r.value = $value
                ON MATCH SET r.value = $value
            `,
            {
                user_id: rating.user_id,
                rid: rating.rid,
                value: rating.value,
            }
        );
    } else {
        // Add or Update Rating (HELPFUL with merging `cids`)
        await graphDb.driver.executeQuery(
            `
                MATCH (a:User {uid: $user_id}), (b:Resource {rid: $rid})
                MERGE (a)-[r:HAS_RATED {user_id: $user_id, rid: $rid}]->(b)
                ON CREATE SET r.cids = $cids, r.value = $value
                ON MATCH SET r.cids = r.cids + [x IN $cids WHERE NOT x IN r.cids], r.value = $value
            `,
            {
                user_id: rating.user_id,
                rid: rating.rid,
                value: rating.value,
                cids: [...new Set(rating.cids || [])],
            }
        );
    }

    // Update Resource helpful and not helpful counts
    const helpfulCount = (
        await graphDb.driver.executeQuery(
            `
                MATCH (a:User)-[r:HAS_RATED {value: 'HELPFUL'}]->(b:Resource {rid: $rid})
                RETURN COUNT(r) AS count
            `,
            { rid: rating.rid }
        )
    ).records[0].get("count");

    const notHelpfulCount = (
        await graphDb.driver.executeQuery(
            `
                MATCH (a:User)-[r:HAS_RATED {value: 'NOT_HELPFUL'}]->(b:Resource {rid: $rid})
                RETURN COUNT(r) AS count
            `,
            { rid: rating.rid }
        )
    ).records[0].get("count");

    const resourceDetails = (
        await graphDb.driver.executeQuery(
            `
                MATCH (a:Resource {rid: $rid})
                SET a.helpful_count = $helpfulCount, a.not_helpful_count = $notHelpfulCount
                RETURN a.helpful_count AS helpful_count, a.not_helpful_count AS not_helpful_count
            `,
            {
                rid: rating.rid,
                helpfulCount: helpfulCount,
                notHelpfulCount: notHelpfulCount,
            }
        )
    ).records[0];

    result = {
        voted: rating.value,
        helpful_count: resourceDetails.get("helpful_count"),
        not_helpful_count: resourceDetails.get("not_helpful_count"),
        reset_status: resetStatus,
    };

    return result;
}




// recs user_resources db

export async function getRidsFromUserResourcesSaved(userId) {
    /*
        Getting rids from User Resources Saved
    */
  console.log("Getting rids from User Resources Saved");
  let nodes = [];
  const result = await graphDb.driver.executeQuery(
      `
          MATCH (b:User)-[r:HAS_SAVED {user_id: $userId}]->(a:Resource)
          RETURN a.rid as rid
      `,
      { userId: userId }
  );

  nodes = result.records.map(record => record.get('rid'));
  return nodes;
}

export async function filterUserResourcesSavedBy(data) {
    /*
        Getting User Resources Saved
        Filtering by: user_id, cids, content_type, text
    */
    console.log("Filtering User Resources Saved");

    const result = { articles: [], videos: [] };
    const userId = data.user_id;
    const searchText = data.text || '';
    const contentType = data.content_type === 'video' ? 'Video' : 'Article';

    let queryWhere = `
        toLower(a.text) CONTAINS toLower('${searchText}') OR
        ANY(keyphrase IN a.keyphrases WHERE keyphrase CONTAINS toLower('${searchText}'))
    `;

    if (data.cids && data.cids.length > 0) {
        queryWhere = `
            c.cid IN $cids AND (
                toLower(a.text) CONTAINS toLower('${searchText}') OR
                ANY(keyphrase IN a.keyphrases WHERE keyphrase CONTAINS toLower('${searchText}'))
            )
        `;
    }

    const query = `
        MATCH (c:Concept_modified)<-[m:HAS_MODIFIED]-(b:User)-[r:HAS_SAVED]->(a:Resource)
        WHERE r.user_id = '${userId}' AND '${contentType}' IN LABELS(a) AND (${queryWhere})
        RETURN DISTINCT LABELS(a) as labels, ID(a) as id, a.rid as rid, a.title as title, a.text as text,
            a.thumbnail as thumbnail, a.abstract as abstract, a.post_date as post_date,
            a.author_image_url as author_image_url, a.author_name as author_name,
            a.keyphrases as keyphrases, a.description as description, a.description_full as description_full,
            a.publish_time as publish_time, a.uri as uri, a.duration as duration,
            COALESCE(toInteger(a.views), 0) AS views,
            COALESCE(toFloat(a.similarity_score), 0.0) AS similarity_score,
            COALESCE(toInteger(a.helpful_count), 0) AS helpful_count,
            COALESCE(toInteger(a.not_helpful_count), 0) AS not_helpful_count,
            COALESCE(toInteger(a.bookmarked_count), 0) AS bookmarked_count,
            COALESCE(toInteger(a.like_count), 0) AS like_count,
            a.channel_title as channel_title,
            a.updated_at as updated_at,
            true AS is_bookmarked_fill
    `;

    const params = {
        userId: data.user_id,
        searchText: data.text || '',
        cids: data.cids || [],
        contentType: data.content_type === 'video' ? 'Video' : 'Article',
    };
    const queryResult = await graphDb.driver.executeQuery(query, params);

    const resources = queryResult.records.map(record => ({
        labels: record.get('labels'),
        id: record.get('id'),
        rid: record.get('rid'),
        title: record.get('title'),
        text: record.get('text'),
        thumbnail: record.get('thumbnail'),
        abstract: record.get('abstract'),
        // post_date: record.get('post_date'),
        // author_image_url: record.get('author_image_url'),
        // author_name: record.get('author_name'),
        keyphrases: record.get('keyphrases'),
        description: record.get('description'),
        description_full: record.get('description_full'),
        publish_time: record.get('publish_time'),
        uri: record.get('uri'),
        duration: record.get('duration'),
        views: record.get('views'),
        similarity_score: record.get('similarity_score'),
        helpful_count: record.get('helpful_count'),
        not_helpful_count: record.get('not_helpful_count'),
        bookmarked_count: record.get('bookmarked_count'),
        like_count: record.get('like_count'),
        channel_title: record.get('channel_title'),
        updated_at: record.get('updated_at'),
        is_bookmarked_fill: record.get('is_bookmarked_fill'),
    }));

    if (resources.length > 0) {
        if (data.content_type === 'video') {
            result.videos = resources;
        } else if (data.content_type === 'article') {
            result.articles = resources;
        } else {
            result.articles = resources.filter(res => res.labels.includes('Article'));
            result.videos = resources.filter(res => res.labels.includes('Video'));
        }
    }

  return result;
}

// recs helper_service db

export async function getConceptsByCids(userId, cids) {
  let concepts = [];
  const query = `
      MATCH (c:Concept)
      WHERE c.cid IN $cids
      RETURN DISTINCT c.name as name, c.cid as cid, c.weight as weight
  `;
  const queryResult = await graphDb.driver.executeQuery(query, { cids });
  concepts = queryResult.records.map(record => ({
      name: record.get('name'),
      cid: record.get('cid'),
      weight: record.get('weight'),
  }));
  const modifiedConcepts = await getConceptsModifiedByUserId(userId);

  // Update weights if modified by the user
  concepts.forEach(concept => {
      const modified = modifiedConcepts.find(c => c.cid === concept.cid);
      if (modified) {
          concept.weight = modified.weight;
      }
  });
  return concepts;
}

export async function getConceptsModifiedByUserId(userId) {
  let result = [];
  const query = `
      MATCH (a:User)-[r:HAS_MODIFIED]->(b:Concept_modified)
      WHERE r.user_id = $userId
      RETURN DISTINCT r.user_id as user_id, b.cid as cid, r.weight as weight
  `;
  const queryResult = await graphDb.driver.executeQuery(query, { userId });
  result = queryResult.records.map(record => ({
      user_id: record.get('user_id'),
      cid: record.get('cid'),
      weight: record.get('weight'),
  }));
  return result;
}

export async function getConceptsModifiedByMid(mid) {
  let result = [];
  // AND c.type = "main_concept" 
  const query = `
      MATCH (c:Concept) 
      WHERE c.mid = $mid AND c.type = 'main_concept'
      RETURN c.cid as cid, c.name AS name, c.weight as weight, 
              c.rank as rank, c.mid as mid
              ORDER BY c.name
  `;
  const queryResult = await graphDb.driver.executeQuery(query, { mid });
  result = queryResult.records.map(record => ({
      cid: record.get('cid'),
      name: record.get('name'),
      weight: record.get('weight'),
      rank: record.get('rank'),
      mid: record.get('mid'),
  }));
  return result;
}

export async function getConceptsModifiedBySlideId(slideId) {
  let result = [];
  const query = `
      MATCH (s:Slide)-[:CONTAINS]->(c:Concept)
      WHERE s.sid = $slideId
      RETURN c.cid as cid, c.name AS name, c.weight as weight, 
              c.rank as rank, c.mid as mid
  `;
  const queryResult = await graphDb.driver.executeQuery(query, { slideId });
  result = queryResult.records.map(record => ({
      cid: record.get('cid'),
      name: record.get('name'),
      weight: record.get('weight'),
      rank: record.get('rank'),
      mid: record.get('mid'),
  }));
  return result;
}

export async function getConceptsModifiedByUserFromSaves(userId) {
  let result = [];
  const query = `
      MATCH (a:User)-[r:HAS_SAVED]->(b:Resource)
            -[r2:BASED_ON]->(c:Concept_modified),
            (d:Concept)
      WHERE r.user_id = $userId AND c.cid = d.cid
      RETURN DISTINCT d.cid as cid, d.name as name
  `;
  const queryResult = await graphDb.driver.executeQuery(query, { userId: userId });
  result = queryResult.records.map(record => ({
      cid: record.get('cid'),
      name: record.get('name'),
  }));
  return result;
}


/*
function recordsToObjects(records) {
    return records.map((record) => {
      const obj = {};
      record.keys.forEach((key, i) => {
        obj[key] = record.get(i);
      });
      return obj;
    });
}

export async function getMainConceptsByMid(mid) {
        Getting main concepts by mid
    console.log("Getting main concepts by mid");
    const result = await graphDb.driver.executeQuery(
        `
            MATCH (c:Concept) 
            WHERE c.mid = $mid AND c.type = "main_concept" 
            RETURN  ID(c) AS id, c.cid AS cid, 
                    c.name AS name, c.type AS type, c.weight AS weight, 
                    c.mid AS mid
            ORDER BY c.name
        `,
        { mid }
    );
    return recordsToObjects(result.records);
}
*/