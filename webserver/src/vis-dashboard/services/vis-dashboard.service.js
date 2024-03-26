import {serializeRecords} from "../utils/SerializeRecords";
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


export async function getPlatforms() {

    const { records, summary, keys } = await graphDb.driver.executeQuery(
        'MATCH (n:platform) RETURN n.name as PlatformName',
        //{ sid: slideId }
    );

    return serializeRecords(records);
}


export async function getCourseCategories() {

    const { records, summary, keys } = await graphDb.driver.executeQuery(
        '  MATCH (n) WHERE (n.course_category) IS NOT NULL \n' +

        '     RETURN DISTINCT "node" as entity, n.course_category AS course_category \n' +
        '     UNION ALL \n' +
        '     MATCH ()-[r]-() WHERE (r.course_category) IS NOT NULL \n' +
        '     RETURN DISTINCT "relationship" AS entity, r.course_category AS course_category',
        //{ sid: slideId }
    );

    return serializeRecords(records);
}

export async function getCoursesByPopularity(platformName) {
    //const platform_name_lower = platformname.toLowerCase().replace("'", "\\'")
    const { records, summary, keys } = await graphDb.driver.executeQuery(
        'MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform) \n' +
        'WHERE toLower(platform.name) CONTAINS $platformName \n' +
        'AND course.number_of_participants IS NOT NULL AND course.number_of_participants =~ \'\\d+\' \n' +
        'MATCH (teacher:teacher)-[:TEACHES]->(course) \n' +
        'RETURN course.course_id AS CourseId, teacher.name AS TeacherName, course.name AS CourseName, course.number_of_participants AS NumberOfParticipants \n' +
        'ORDER BY course.number_of_participants DESC \n' +
        'LIMIT 40',
        { platformName: platformName }
    );
    return serializeRecords(records);
}
export async function getCoursesByRating(pn) {
    //const platform_name_lower = platformname.toLowerCase().replace("'", "\\'")
    const { records, summary, keys } = await graphDb.driver.executeQuery(
        'MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform) \n' +
        'WHERE toLower(platform.name) CONTAINS $pn \n' +
        'AND course.rating IS NOT NULL AND course.rating =~ \'\\\\d+\\\\.\\\\d+\' \n' +
        'MATCH (teacher:teacher)-[:TEACHES]->(course) \n' +
        'RETURN course.course_id AS CourseId, teacher.name AS TeacherName, course.name AS CourseName, course.rating AS Rating \n' +
        'ORDER BY course.rating DESC \n' +
        'LIMIT 70',
        { pn: pn }
    );
    return serializeRecords(records);
}

export async function getCourseById(id){
    const { records, summary, keys } = await graphDb.driver.executeQuery(
        'MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform) \n' +
        'WHERE course.course_id = $id \n' +
        'RETURN course.course_id AS CourseId, ' +
        'course.audience AS Audience, course.course_content AS Content,' +
        ' course.course_category AS Category, course.description AS Description, course.duration AS Duration,' +
        'course.goal AS Goal, course.keywords AS Keywords, course.language AS Language,' +

    ' course.level AS Level, course.link AS Link, course.name AS Name, ' +
    'course.number_of_particpants AS NumberOfParticipants,' +
        'course.price AS Price, course.rating AS Rating, course.prerequisites AS Prerequisites,' +
        'course.recommendations AS Recommendations \n'



        , { id: id }
    );
    return serializeRecords(records)
}
