const neo4j = require("neo4j-driver");

const graphMoocDb = {};

export async function connect_MOOCentral(url, user, password) {
  try {
    graphMoocDb.driver = neo4j.driver(url, neo4j.auth.basic(user, password), {
      disableLosslessIntegers: true,
    });
    await graphMoocDb.driver.verifyConnectivity();
    console.log(`Connected to Neo4j MOOCentral`);
    const result = await checkplatform();
    console.log("Platform check:", result);
    
  } catch (error) {
    console.error("Failed to connect to Neo4j MOOCentral", error);
  }
}

function recordsToObjects(records) {
  return records.map((record) => {
    const obj = {};
    record.keys.forEach((key, i) => {
      obj[key] = record.get(i);
    });
    return obj;
  });
}


export async function checkplatform() {
  const { records, summary, keys } = await graphMoocDb.driver.executeQuery(
    "MATCH (n:Platform) RETURN n LIMIT 25"
  );
  return recordsToObjects(records);
}