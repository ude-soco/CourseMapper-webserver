import {serializeRecords} from "../utils/SerializeRecords";
import {integer} from "neo4j-driver";

const neo4j = require('neo4j-driver');

const graphDb = {};


export async function connect(url, user, password) {
    try {
        graphDb.driver = neo4j.driver(url, neo4j.auth.basic(user, password), {disableLosslessIntegers: true});
        await graphDb.driver.verifyConnectivity();
        console.log(`Connected to Neo4j`);
    } catch (error) {
        console.error('Failed to connect to Neo4j', error);
    }
}


export async function getPlatforms() {

    const {records, summary, keys} = await graphDb.driver.executeQuery(
        'MATCH (n:platform) RETURN n.name as PlatformName',
        //{ sid: slideId }
    );

    return serializeRecords(records);
}


export async function getCourseCategories() {

    const {records, summary, keys} = await graphDb.driver.executeQuery(
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
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        'MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform) \n' +
        'WHERE toLower(platform.name) CONTAINS $platformName \n' +
        'AND course.number_of_participants IS NOT NULL AND course.number_of_participants =~ \'\\d+\' \n' +
        'MATCH (teacher:teacher)-[:TEACHES]->(course) \n' +
        'RETURN course.course_id AS CourseId, teacher.name AS TeacherName, course.name AS CourseName, course.number_of_participants AS NumberOfParticipants, platform.name as PlatformName, platform.platform_id as PlatformId \n' +
        'ORDER BY course.number_of_participants DESC \n' +
        'LIMIT 40',
        {platformName: platformName}
    );
    return serializeRecords(records);
}

export async function getCoursesByRating(pn) {
    //const platform_name_lower = platformname.toLowerCase().replace("'", "\\'")
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        'MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform) \n' +
        'WHERE toLower(platform.name) CONTAINS $pn \n' +
        'AND course.rating IS NOT NULL AND course.rating =~ \'\\\\d+\\\\.\\\\d+\' \n' +
        'MATCH (teacher:teacher)-[:TEACHES]->(course) \n' +
        'RETURN course.course_id AS CourseId, teacher.name AS TeacherName, course.name AS CourseName, course.rating AS Rating \n' +
        'ORDER BY course.rating DESC \n' +
        'LIMIT 70',
        {pn: pn}
    );
    return serializeRecords(records);
}

export async function getCourseById(id) {
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        'MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform) \n' +
        'WHERE course.course_id = $id \n' +
        'RETURN course.course_id AS CourseId, ' +
        'course.audience AS Audience, course.course_content AS Content,' +
        ' course.course_category AS Category, course.description AS Description, course.duration AS Duration,' +
        'course.goal AS Goal, course.keywords AS Keywords, course.language AS Language,' +

        ' course.level AS Level, course.link AS Link, course.name AS Name, ' +
        'course.number_of_participants AS NumberOfParticipants,' +
        'course.price AS Price, course.rating AS Rating, course.prerequisites AS Prerequisites,' +
        'course.recommendations AS Recommendations, platform.name as PlatformName \n'
        , {id: id}
    );
    return serializeRecords(records)
}

export async function getConceptsByCourseId(courseId) {
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        'MATCH (course:course )-[r:CONTAINS_CONCEPT]->(concept:concept)\n' +
        '     WHERE course.course_id = $courseId          \n' +
        'RETURN concept.name as ConceptName'

        , {courseId: courseId}
    );
    return serializeRecords(records)
}

export async function getCoursesByCourseCategory(courseCategory) {
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        'MATCH (teacher:teacher)-[:TEACHES]->(course:course)-[:AVAILABLE_ON]->(platform:platform) \n' +
        '     WHERE toLower(course.course_category) = toLower($courseCategory)   OR  toLower(course.course_category) CONTAINS toLower($courseCategory)   \n' +
        'RETURN course.course_id AS CourseId, ' +
        'course.audience AS Audience, course.course_content AS Content,' +
        ' course.course_category AS Category, course.description AS Description, course.duration AS Duration,' +
        'course.goal AS Goal, course.keywords AS Keywords, course.language AS Language,' +

        ' course.level AS Level, course.link AS Link, course.name AS Name, ' +
        'course.number_of_participants AS NumberOfParticipants,' +
        'course.price AS Price, course.rating AS Rating, course.prerequisites AS Prerequisites,' +
        'course.recommendations AS Recommendations, platform.name as PlatformName, platform.platform_id as PlatformId, teacher.name As TeacherName \n'

        , {courseCategory: courseCategory}
    );
    return serializeRecords(records)
}

export async function getPopularTeachers(platformName) {
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        'MATCH (platform:platform)<-[:AVAILABLE_ON]-(course:course)<-[:TEACHES]-(teacher:teacher)\n' +
        'WHERE toLower(platform.name) CONTAINS $platformName \n' +
        'AND course.number_of_participants IS NOT NULL AND course.number_of_participants =~ \'\\d+\' \n' +
        'RETURN teacher.name AS TeacherName,teacher.teacher_id AS TeacherId, SUM(toInteger(course.number_of_participants)) AS TotalEnrollment, COUNT(course) as NumOfCourses\n' +
        'ORDER BY TotalEnrollment DESC\n' +
        'LIMIT 50'

        , {platformName: platformName}
    );
    return serializeRecords(records)
}

export async function getTeacherById(teacherId) {
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        'MATCH (platform:platform)<-[:AVAILABLE_ON]-(course:course)<-[:TEACHES]-(teacher:teacher)\n' +
        'WHERE teacher.teacher_id =  $teacherId \n' +
        'RETURN teacher.name AS TeacherName,teacher.teacher_id AS TeacherId, platform.name AS PlatformName, course.course_id AS CourseId, course.name AS CourseName\n' +
        'LIMIT 10'

        , {teacherId: teacherId}
    );
    return serializeRecords(records)

}

export async function getConceptsByPlatform(platform) {
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        'MATCH (platform:platform) <-[:AVAILABLE_ON]- (course:course)-[:CONTAINS_CONCEPT]->(concept:concept)\n' +
        'WHERE toLower(platform.name) = $platform   \n' +
        '\n' +
        'RETURN concept.name as ConceptName LIMIT 200'
        , {platform: platform}
    );
    return serializeRecords(records)

}

export async function getCoursesByConceptAndPlatform(concept, platform) {
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        'MATCH (platform:platform) <-[:AVAILABLE_ON]- (course:course)-[:CONTAINS_CONCEPT]->(concept:concept)\n' +
        'WHERE toLower(platform.name) = $platform AND course.description CONTAINS $concept  \n' +
        'RETURN DISTINCT course.course_id AS CourseId, course.name AS CourseName LIMIT 8'
        , {platform: platform, concept: concept}
    );
    return serializeRecords(records)

}


export async function getCoursesByPopularityForVis(platformName, datapoints) {
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        'MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform) \n' +
        'WHERE toLower(platform.name) CONTAINS $platformName \n' +
        'AND course.number_of_participants IS NOT NULL AND course.number_of_participants =~ \'\\d+\' \n' +
        'MATCH (teacher:teacher)-[:TEACHES]->(course) \n' +
        'RETURN DISTINCT course.name AS CourseName, course.number_of_participants AS NumberOfParticipants \n' +
        'ORDER BY course.number_of_participants DESC \n' +
        `LIMIT ${+datapoints}`,
        {platformName: platformName, datapoints: datapoints}
    );
    return serializeRecords(records);
}

export async function getCategoryByPopularityForVis(platformName, datapoints) {
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        `MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform)
WHERE toLower(course.course_category) IS NOT NULL AND platform.name = $platformName
WITH DISTINCT course.course_category AS course_category
MATCH (m)
WHERE (m.course_category = course_category) AND (m.number_of_participants IS NOT NULL)
WITH course_category, toInteger(replace(m.number_of_participants, ',', '')) AS participants
RETURN course_category AS CourseCategory, 
       SUM(participants) AS TotalParticipants
ORDER BY TotalParticipants DESC 
LIMIT ${+datapoints}`,
        {platformName: platformName, datapoints: datapoints}
    );
    return serializeRecords(records);
}

export async function getActiveTeachersForVis(platformName, datapoints) {
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        `
        MATCH (teacher:teacher)-[:TEACHES]->(course:course)-[:AVAILABLE_ON]->(platform:platform) 
WHERE toLower(platform.name) CONTAINS $platformName RETURN teacher.name AS TeacherName, COUNT(course) AS NumberOfCourses 
ORDER BY NumberOfCourses DESC 
LIMIT ${+datapoints}`,
        {platformName: platformName, datapoints: datapoints}
    );
    return serializeRecords(records);
}

export async function getActiveInstitutionsForVis(platformName, datapoints) {
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        `MATCH (institution:institution)-[:OFFERS]->(course:course)-[:AVAILABLE_ON]->(platform:platform) 
WHERE toLower(platform.name) = 'coursera' RETURN institution.name AS InstitutionName, COUNT(course) AS NumberOfCourses 
ORDER BY NumberOfCourses DESC 
LIMIT ${+datapoints}`,
        {platformName: platformName, datapoints: datapoints}
    );
    return serializeRecords(records);
}

export async function postTest(platforms){
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        `MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform)
WHERE platform.name IN $platforms
RETURN  COUNT(course) AS CourseCount, platform.name As PlatformName LIMIT 20`,
        {platforms: platforms}
    );
    return serializeRecords(records);

}

export async function getNumberOfTeachersForCompare(platforms){
    console.log(platforms)
    const {records, summary, keys} = await graphDb.driver.executeQuery(
        `
        MATCH (teacher:teacher)-[:TEACHES_ON]->(platform:platform)
WHERE platform.name IN $platforms
RETURN COUNT(teacher) AS TeacherCount, platform.name As PlatformName`,
        {platforms: platforms}
    );
    return serializeRecords(records);

}




/*
MATCH (teacher:teacher)-[:TEACHES_ON]->(platform:platform)
WHERE platform.name IN ["udemy","imoox","udacity"]
RETURN COUNT(teacher) AS TeacherCount, platform.name As PlatformName LIMIT 200

MATCH (institution:institution)-[:OFFERS]->(course:course)-[:AVAILABLE_ON]->(platform:platform)
WHERE platform.name = 'coursera' RETURN institution.name AS InstitutionName, COUNT(course) AS NumberOfCourses
ORDER BY NumberOfCourses DESC
LIMIT 10
 */

