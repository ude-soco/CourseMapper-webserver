import { serializeRecords } from "../utils/SerializeRecords";
import { integer } from "neo4j-driver";

const neo4j = require("neo4j-driver");

const graphDb = {};

export async function connect(url, user, password) {
  try {
    graphDb.driver = neo4j.driver(url, neo4j.auth.basic(user, password), {
      disableLosslessIntegers: true,
    });
    await graphDb.driver.verifyConnectivity();
    console.log(`Connected to Neo4j MOOC`);
  } catch (error) {
    console.error("Failed to connect to Neo4j MOOC", error);
  }
}

export async function getPlatforms() {
  // const {records, summary, keys} = await graphDb.driver.executeQuery(
  //     'MATCH (n:platform) RETURN n.name as PlatformName, n.platform_id as PlatformId, n.language as PlatformLanguage',
  //     //{ sid: slideId }
  // );
  const { records } = await graphDb.driver.executeQuery(
    "MATCH (n:Platform) RETURN n.name AS PlatformName, n.platform_id AS PlatformId, n.language AS PlatformLanguage"
  );

  return serializeRecords(records);
}

export async function getCourseCategories() {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    "  MATCH (n) WHERE (n.course_category) IS NOT NULL \n" +
      '     RETURN DISTINCT "node" AS entity, n.course_category AS course_category \n' +
      "     UNION ALL \n" +
      "     MATCH ()-[r]-() WHERE (r.course_category) IS NOT NULL \n" +
      '     RETURN DISTINCT "relationship" AS entity, r.course_category AS course_category'
    //{ sid: slideId }
  );
  return serializeRecords(records);
}

export async function getCoursesByPopularity(platformName) {
    //const platform_name_lower = platformname.toLowerCase().replace("'", "\\'")
    // const {records, summary, keys} = await graphDb.driver.executeQuery(
    //     'MATCH (course:Course)-[:AVAILABLE_ON]->(platform:Platform) \n' +
    //     'WHERE toLower(platform.name) CONTAINS $platformName \n' +
    //     'AND course.number_of_participants IS NOT NULL AND course.number_of_participants =~ \'\\d+\' \n' +
    //     'MATCH (teacher:Teacher)-[:TEACHES]->(course) \n' +
    //     'RETURN course.course_id AS CourseId, teacher.name AS TeacherName, course.name AS CourseName, course.number_of_participants AS NumberOfParticipants, platform.name as PlatformName, platform.platform_id as PlatformId \n' +
    //     'ORDER BY course.number_of_participants DESC \n' +
    //     'LIMIT 40',
    //     {platformName: platformName}
    // );
    // return serializeRecords(records);
      const { records } = await graphDb.driver.executeQuery(
    `
        MATCH (course:Course)-[:AVAILABLE_ON]->(platform:Platform)
        WHERE toLower(platform.name) CONTAINS toLower($platformName)
          AND course.number_of_participants IS NOT NULL
          AND course.number_of_participants =~ '\\d+'
        MATCH (teacher:Teacher)-[:TEACHES]->(course)
        RETURN course.course_id AS CourseId,
               teacher.name AS TeacherName,
               course.name AS CourseName,
               course.number_of_participants AS NumberOfParticipants,
               platform.name AS PlatformName,
               platform.platform_id AS PlatformId
        ORDER BY toInteger(course.number_of_participants) DESC
        LIMIT 40
        `,
    { platformName: platformName }
  );
  if (records.length !== 0) console.log(`Popular courses found`);
  return serializeRecords(records);
}

export async function getCoursesByRating(pn) {
    //const platform_name_lower = platformname.toLowerCase().replace("'", "\\'")
    // const {records, summary, keys} = await graphDb.driver.executeQuery(
    //     'MATCH (course:Course)-[:AVAILABLE_ON]->(platform:Platform) \n' +
    //     'WHERE toLower(platform.name) CONTAINS $pn \n' +
    //     'AND course.rating IS NOT NULL AND course.rating =~ \'\\\\d+\\\\.\\\\d+\' \n' +
    //     'MATCH (teacher:Teacher)-[:TEACHES]->(course) \n' +
    //     'RETURN course.course_id AS CourseId, teacher.name AS TeacherName, course.name AS CourseName, course.rating AS Rating \n' +
    //     'ORDER BY course.rating DESC \n' +
    //     'LIMIT 70',
    //     {pn: pn}
    // );
    // return serializeRecords(records);
      const { records } = await graphDb.driver.executeQuery(
    `
        MATCH (course:Course)-[:AVAILABLE_ON]->(platform:Platform)
        WHERE toLower(platform.name) CONTAINS toLower($pn)
          AND course.rating IS NOT NULL
          AND course.rating =~ '\\d+(\\.\\d+)?'
        MATCH (teacher:Teacher)-[:TEACHES]->(course)
        RETURN course.course_id AS CourseId,
               teacher.name AS TeacherName,
               course.name AS CourseName,
               course.rating AS Rating
        ORDER BY toFloat(course.rating) DESC
        LIMIT 70
        `,
    { pn }
  );
  if (records.length !== 0) console.log(`Highest rated courses found`);
  return serializeRecords(records);
}

// export async function getCourseById(id) {
//     const {records, summary, keys} = await graphDb.driver.executeQuery(
//         'MATCH (course:Course)-[:AVAILABLE_ON]->(platform:Platform) \n' +
//         'WHERE course.course_id = $id \n' +
//         'RETURN course.course_id AS CourseId, ' +
//         'course.audience AS Audience, course.course_content AS Content,' +
//         ' course.course_category AS Category, course.description AS Description, course.duration AS Duration,' +
//         'course.goal AS Goal, course.keywords AS Keywords, course.language AS Language,' +


export async function getCourseById(id) {
  // const {records, summary, keys} = await graphDb.driver.executeQuery(
  //     'MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform) \n' +
  //     'WHERE course.course_id = $id \n' +
  //     'RETURN course.course_id AS CourseId, ' +
  //     'course.audience AS Audience, course.course_content AS Content,' +
  //     ' course.course_category AS Category, course.description AS Description, course.duration AS Duration,' +
  //     'course.goal AS Goal, course.keywords AS Keywords, course.language AS Language,' +
// >>>>>>> dev-moocentral-visualization

  //     ' course.level AS Level, course.link AS Link, course.name AS Name, ' +
  //     'course.number_of_participants AS NumberOfParticipants,' +
  //     'course.price AS Price, course.rating AS Rating, course.prerequisites AS Prerequisites,' +
  //     'course.recommendations AS Recommendations, platform.name AS PlatformName \n'
  //     , {id: id}
  // );
  const { records } = await graphDb.driver.executeQuery(
    `
        MATCH (course:Course)-[:AVAILABLE_ON]->(platform:Platform)
        WHERE course.course_id = $id
        RETURN
            course.course_id AS CourseId,
            course.audience AS Audience,
            course.course_content AS Content,
            course.course_category AS Category,
            course.description AS Description,
            course.duration AS Duration,
            course.goal AS Goal,
            course.keywords AS Keywords,
            course.language AS Language,
            course.level AS Level,
            course.link AS Link,
            course.name AS Name,
            course.number_of_participants AS NumberOfParticipants,
            course.price AS Price,
            course.rating AS Rating,
            course.prerequisites AS Prerequisites,
            course.recommendations AS Recommendations,
            platform.name AS PlatformName
        `,
    { id }
  );
  if (records.length !== 0) console.log(`Course found with id: ${id}`);
  return serializeRecords(records);
}

export async function getConceptsByCourseId(courseId) {
  // const {records, summary, keys} = await graphDb.driver.executeQuery(
  //     'MATCH (course:course )-[r:CONTAINS_CONCEPT]->(concept:concept)\n' +
  //     '     WHERE course.course_id = $courseId          \n' +
  //     'RETURN concept.name AS ConceptName'

  //     , {courseId: courseId}
  // );
  const { records } = await graphDb.driver.executeQuery(
    `
        MATCH (course:Course)-[:CONTAINS_CONCEPT]->(concept:Concept)
        WHERE course.course_id = $courseId
        RETURN concept.name AS ConceptName
        `,
    { courseId }
  );
  if (records.length !== 0)
    console.log(`Concepts found for course with id: ${courseId}`);
  return serializeRecords(records);
}

export async function getCoursesByCourseCategory(courseCategory) {
  // const {records, summary, keys} = await graphDb.driver.executeQuery(
  //     'MATCH (teacher:teacher)-[:TEACHES]->(course:course)-[:AVAILABLE_ON]->(platform:platform) \n' +
  //     '     WHERE toLower(course.course_category) = toLower($courseCategory)   OR  toLower(course.course_category) CONTAINS toLower($courseCategory)   \n' +
  //     'RETURN course.course_id AS CourseId, ' +
  //     'course.audience AS Audience, course.course_content AS Content,' +
  //     ' course.course_category AS Category, course.description AS Description, course.duration AS Duration,' +
  //     'course.goal AS Goal, course.keywords AS Keywords, course.language AS Language,' +

  //     ' course.level AS Level, course.link AS Link, course.name AS Name, ' +
  //     'course.number_of_participants AS NumberOfParticipants,' +
  //     'course.price AS Price, course.rating AS Rating, course.prerequisites AS Prerequisites,' +
  //     'course.recommendations AS Recommendations, platform.name AS PlatformName, platform.platform_id AS PlatformId, teacher.name As TeacherName \n'

  //     , {courseCategory: courseCategory}
  // );
  const { records } = await graphDb.driver.executeQuery(
    `
        MATCH (teacher:Teacher)-[:TEACHES]->(course:Course)-[:AVAILABLE_ON]->(platform:Platform)
        WHERE toLower(course.course_category) = toLower($courseCategory)
           OR toLower(course.course_category) CONTAINS toLower($courseCategory)
        RETURN
            course.course_id AS CourseId,
            course.audience AS Audience,
            course.course_content AS Content,
            course.course_category AS Category,
            course.description AS Description,
            course.duration AS Duration,
            course.goal AS Goal,
            course.keywords AS Keywords,
            course.language AS Language,
            course.level AS Level,
            course.link AS Link,
            course.name AS Name,
            course.number_of_participants AS NumberOfParticipants,
            course.price AS Price,
            course.rating AS Rating,
            course.prerequisites AS Prerequisites,
            course.recommendations AS Recommendations,
            platform.name AS PlatformName,
            platform.platform_id AS PlatformId,
            teacher.name AS TeacherName
        `,
    { courseCategory }
  );
  if (records.length !== 0)
    console.log(`Courses found for course category: ${courseCategory}`);
  return serializeRecords(records);
}

export async function getCoursesByCourseCategorySorted(courseCategory) {
  // const {records, summary, keys} = await graphDb.driver.executeQuery(
  //     'MATCH (teacher:teacher)-[:TEACHES]->(course:course)-[:AVAILABLE_ON]->(platform:platform) \n' +
  //     '     WHERE toLower(course.course_category) = toLower($courseCategory)   OR  toLower(course.course_category) CONTAINS toLower($courseCategory)   \n' +
  //     'AND course.number_of_participants IS NOT NULL AND course.number_of_participants =~ \'\\d+\' \n' +

  //     'RETURN course.course_id AS CourseId, ' +
  //     'course.audience AS Audience, course.course_content AS Content,' +
  //     ' course.course_category AS Category, course.description AS Description, course.duration AS Duration,' +
  //     'course.goal AS Goal, course.keywords AS Keywords, course.language AS Language,' +

  //     ' course.level AS Level, course.link AS Link, course.name AS Name, ' +
  //     'course.number_of_participants AS NumberOfParticipants,' +
  //     'course.price AS Price, course.rating AS Rating, course.prerequisites AS Prerequisites,' +
  //     'course.recommendations AS Recommendations, platform.name AS PlatformName, platform.platform_id AS PlatformId, teacher.name As TeacherName \n' +
  //     'ORDER BY course.number_of_participants DESC \n'

  //     , {courseCategory: courseCategory}
  // );
  const { records } = await graphDb.driver.executeQuery(
    `
        MATCH (teacher:Teacher)-[:TEACHES]->(course:Course)-[:AVAILABLE_ON]->(platform:Platform)
        WHERE (
            toLower(course.course_category) = toLower($courseCategory)
            OR toLower(course.course_category) CONTAINS toLower($courseCategory)
        )
        AND course.number_of_participants IS NOT NULL
        AND course.number_of_participants =~ '\\d+'
        RETURN
            course.course_id AS CourseId,
            course.audience AS Audience,
            course.course_content AS Content,
            course.course_category AS Category,
            course.description AS Description,
            course.duration AS Duration,
            course.goal AS Goal,
            course.keywords AS Keywords,
            course.language AS Language,
            course.level AS Level,
            course.link AS Link,
            course.name AS Name,
            course.number_of_participants AS NumberOfParticipants,
            course.price AS Price,
            course.rating AS Rating,
            course.prerequisites AS Prerequisites,
            course.recommendations AS Recommendations,
            platform.name AS PlatformName,
            platform.platform_id AS PlatformId,
            teacher.name AS TeacherName
        ORDER BY toInteger(course.number_of_participants) DESC
        `,
    { courseCategory }
  );
  if (records.length !== 0)
    console.log(`Sorted courses found for course category: ${courseCategory}`);
  return serializeRecords(records);
}

export async function getPopularTeachers(platformName) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     "MATCH (platform:platform)<-[:AVAILABLE_ON]-(course:course)<-[:TEACHES]-(teacher:teacher)\n" +
  //       "WHERE toLower(platform.name) CONTAINS $platformName \n" +
  //       "AND course.number_of_participants IS NOT NULL AND course.number_of_participants =~ '\\d+' \n" +
  //       "RETURN teacher.name AS TeacherName,teacher.teacher_id AS TeacherId, SUM(toInteger(course.number_of_participants)) AS TotalEnrollment, COUNT(course) AS NumOfCourses\n" +
  //       "ORDER BY TotalEnrollment DESC\n" +
  //       "LIMIT 50",

  //     { platformName: platformName }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
        MATCH (platform:Platform)<-[:AVAILABLE_ON]-(course:Course)<-[:TEACHES]-(teacher:Teacher)
        WHERE toLower(platform.name) CONTAINS toLower($platformName)
          AND course.number_of_participants IS NOT NULL
          AND course.number_of_participants =~ '\\d+'
        RETURN
            teacher.name AS TeacherName,
            teacher.teacher_id AS TeacherId,
            SUM(toInteger(course.number_of_participants)) AS TotalEnrollment,
            COUNT(course) AS NumOfCourses
        ORDER BY TotalEnrollment DESC
        LIMIT 50
        `,
    { platformName }
  );
  if (records.length !== 0)
    console.log(`Popular teachers for platform: ${platformName}`);
  return serializeRecords(records);
}

export async function getTeacherById(teacherId) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     "MATCH (platform:platform)<-[:AVAILABLE_ON]-(course:course)<-[:TEACHES]-(teacher:teacher)\n" +
  //       "WHERE teacher.teacher_id =  $teacherId \n" +
  //       "RETURN teacher.name AS TeacherName,teacher.teacher_id AS TeacherId, platform.name AS PlatformName, course.course_id AS CourseId, course.name AS CourseName\n" +
  //       "LIMIT 10",

  //     { teacherId: teacherId }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (platform:Platform)<-[:AVAILABLE_ON]-(course:Course)<-[:TEACHES]-(teacher:Teacher)
    WHERE teacher.teacher_id = $teacherId
    RETURN 
      teacher.name AS TeacherName,
      teacher.teacher_id AS TeacherId,
      platform.name AS PlatformName,
      course.course_id AS CourseId,
      course.name AS CourseName
    LIMIT 10
    `,
    { teacherId }
  );
  if (records.length !== 0) console.log(`Teacher found with id: ${teacherId}`);
  return serializeRecords(records);
}

/*// Query the database for concepts for a platform: Service
export async function getConceptsByPlatform(platform) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     "MATCH (platform:platform) <-[:AVAILABLE_ON]- (course:course)-[:CONTAINS_CONCEPT]->(concept:concept)\n" +
  //       "WHERE toLower(platform.name) = $platform   \n" +
  //       "\n" +
  //       "RETURN concept.name AS ConceptName LIMIT 200",
  //     { platform: platform }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (platform:Platform)<-[:AVAILABLE_ON]-(course:Course)-[:CONTAINS_CONCEPT]->(concept:Concept)
    WHERE toLower(platform.name) = toLower($platform)
    RETURN concept.name AS ConceptName
    LIMIT 200
    `,
    { platform }
  );
  if (records.length !== 0)
    console.log(`Concepts found for platform: ${platform}`);
  return serializeRecords(records);
}*/
// Query the database for concepts for a platform: Service
export async function getConceptsByPlatform(platform) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     "MATCH (platform:platform) <-[:AVAILABLE_ON]- (course:course)-[:CONTAINS_CONCEPT]->(concept:concept)\n" +
  //       "WHERE toLower(platform.name) = $platform   \n" +
  //       "\n" +
  //       "RETURN concept.name AS ConceptName LIMIT 200",
  //     { platform: platform }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (p:Platform)<-[:AVAILABLE_ON]-(c:Course)-[:CONTAINS_CONCEPT]->(k)
WHERE (k:Concept OR k:concept)
  AND toLower(trim(p.name)) CONTAINS toLower(trim($platform))
RETURN k.name AS ConceptName, count(DISTINCT c) AS Count
ORDER BY Count DESC
LIMIT 200

    `,
    { platform }
  );
  if (records.length !== 0)
    console.log(`Concepts found for platform: ${platform}`);
  return serializeRecords(records);
}

/*/ Query the database for courses on concept selection: service
export async function getCoursesByConceptAndPlatform(concept, platform) {
  // const {records, summary, keys} = await graphDb.driver.executeQuery(
  //     'MATCH (platform:platform) <-[:AVAILABLE_ON]- (course:course)-[:CONTAINS_CONCEPT]->(concept:concept)\n' +
  //     'WHERE toLower(platform.name) = $platform AND course.description CONTAINS $concept  \n' +
  //     'RETURN DISTINCT course.course_id AS CourseId, course.name AS CourseName LIMIT 8'
  //     , {platform: platform, concept: concept}
  // );
  const { records } = await graphDb.driver.executeQuery(
    `
        MATCH (platform:Platform)<-[:AVAILABLE_ON]-(course:Course)-[:CONTAINS_CONCEPT]->(concept:Concept)
        WHERE toLower(platform.name) = toLower($platform)
          AND toLower(course.description) CONTAINS toLower($concept)
        RETURN DISTINCT course.course_id AS CourseId, course.name AS CourseName
        LIMIT 8
        `,
    { platform, concept }
  );
  if (records.length !== 0)
    console.log(`Courses found for concepts and platform`);
  return serializeRecords(records);
}*/
// Query the database for courses on concept selection: service
// Query the database for courses on concept selection: service
export async function getCoursesByConceptAndPlatform(platform, concept) {
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (p:Platform)<-[:AVAILABLE_ON]-(c:Course)-[:CONTAINS_CONCEPT]->(k)
    WHERE (k:Concept OR k:concept)
      AND toLower(trim(p.name)) CONTAINS toLower(trim($platform))
      AND toLower(trim(k.name)) = toLower(trim($concept))

    WITH DISTINCT c,
         toFloat(replace(coalesce(c.rating,''), ',', '.')) AS r

    RETURN
      c.course_id AS CourseId,
      c.name      AS CourseName,
      CASE
        WHEN r IS NULL OR r <= 0 THEN 0.0
        ELSE r
      END AS Rating
    ORDER BY Rating DESC, toLower(CourseName)
    LIMIT 50
    `,
    { platform, concept }
  );

  return serializeRecords(records);
}



// Get courses by popularity :services
export async function getCoursesByPopularityForVis(platformName, datapoints) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     "MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform) \n" +
  //       "WHERE toLower(platform.name) CONTAINS $platformName \n" +
  //       "AND course.number_of_participants IS NOT NULL AND course.number_of_participants =~ '\\d+' \n" +
  //       "MATCH (teacher:teacher)-[:TEACHES]->(course) \n" +
  //       "RETURN DISTINCT course.name AS CourseName, course.number_of_participants AS NumberOfParticipants \n" +
  //       "ORDER BY course.number_of_participants DESC \n" +
  //       `LIMIT ${+datapoints}`,
  //     { platformName: platformName, datapoints: datapoints }
  //   );
  const { records } = await graphDb.driver.executeQuery( //420-421 new
    `
    MATCH (c:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) CONTAINS toLower($platformName)
      AND c.number_of_participants IS NOT NULL

    WITH c,
         toInteger(
           CASE
             WHEN trim(replace(coalesce(c.number_of_participants,''), ',', '')) = '' THEN 0
             ELSE replace(c.number_of_participants, ',', '')
           END
         ) AS participants

    WHERE participants IS NOT NULL

    RETURN
      c.course_id AS CourseId,           
      c.name      AS CourseName,
      participants AS NumberOfParticipants
    ORDER BY NumberOfParticipants DESC
    LIMIT toInteger($datapoints)
    `,
    { platformName, datapoints: Number(datapoints) }
  );
  if (records.length !== 0)
    console.log(
      `Popular courses for visualizations based on platform: '${platformName}' and data points: '${datapoints}'`
    );
  return serializeRecords(records);
}

// Query the database for the most popular categories of courses
export async function getCategoryByPopularityForVis(platformName, datapoints) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     `MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform)
  // WHERE toLower(course.course_category) IS NOT NULL AND platform.name = $platformName
  // WITH DISTINCT course.course_category AS course_category
  // MATCH (m)
  // WHERE (m.course_category = course_category) AND (m.number_of_participants IS NOT NULL)
  // WITH course_category, toInteger(replace(m.number_of_participants, ',', '')) AS participants
  // RETURN course_category AS CourseCategory,
  //        SUM(participants) AS TotalParticipants
  // ORDER BY TotalParticipants DESC
  // LIMIT ${+datapoints}`,
  //     { platformName: platformName, datapoints: datapoints }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (c:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) = toLower($platformName)
      AND c.course_category IS NOT NULL
      AND c.number_of_participants IS NOT NULL

    WITH c.course_category AS CourseCategory,
         // sanitize: remove commas, default empty/invalid to 0
         toInteger(
           CASE
             WHEN trim(replace(coalesce(c.number_of_participants,''), ',', '')) = '' THEN 0
             ELSE replace(c.number_of_participants, ',', '')
           END
         ) AS participants

    WITH CourseCategory, sum(participants) AS total
    RETURN CourseCategory,
           toFloat(total) AS TotalParticipants     // <-- plain JS numbers
    ORDER BY TotalParticipants DESC
    LIMIT toInteger($datapoints)
    `,
    { platformName, datapoints: Number(datapoints) }
  );
  if (records.length !== 0)
    console.log(
      `Popular categories for visualizations based on platform: '${platformName}' and data points: '${datapoints}'`
    );
  return serializeRecords(records);
}

// Query the database for the most active teachers: service
export async function getActiveTeachersForVis(platformName, datapoints) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     `
  //         MATCH (teacher:teacher)-[:TEACHES]->(course:course)-[:AVAILABLE_ON]->(platform:platform)
  // WHERE toLower(platform.name) CONTAINS $platformName RETURN teacher.name AS TeacherName, COUNT(course) AS NumberOfCourses
  // ORDER BY NumberOfCourses DESC
  // LIMIT ${+datapoints}`,
  //     { platformName: platformName, datapoints: datapoints }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (t:Teacher)-[:TEACHES]->(c:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) CONTAINS toLower($platformName)   // keep CONTAINS if you want partial matches
    RETURN t.name AS TeacherName,
           toFloat(count(c)) AS NumberOfCourses             // <-- cast so we get plain numbers
    ORDER BY NumberOfCourses DESC
    LIMIT toInteger($datapoints)                            // <-- ensure integer
    `,
    { platformName, datapoints: Number(datapoints) }
  );
  if (records.length !== 0)
    console.log(
      `Active teachers found for visualizations based on platform: '${platformName}' and data points: '${datapoints}'`
    );
  return serializeRecords(records);
}

// Query the database for the most active institutions: service
export async function getActiveInstitutionsForVis(platformName, datapoints) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     `MATCH (institution:institution)-[:OFFERS]->(course:course)-[:AVAILABLE_ON]->(platform:platform)
  // WHERE toLower(platform.name) = 'coursera' RETURN institution.name AS InstitutionName, COUNT(course) AS NumberOfCourses
  // ORDER BY NumberOfCourses DESC
  // LIMIT ${+datapoints}`,
  //     { platformName: platformName, datapoints: datapoints }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (i:Institution)-[:OFFERS]->(c:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) = toLower($platformName)
    RETURN i.name AS InstitutionName,
           toFloat(count(c)) AS NumberOfCourses
    ORDER BY NumberOfCourses DESC
    LIMIT toInteger($datapoints)

    `,
    { platformName, datapoints: Number(datapoints) }
  );
  if (records.length !== 0)
    console.log(
      `Active institutions found for visualizations based on platform: '${platformName}' and data points: '${datapoints}'`
    );
  return serializeRecords(records);
}

export async function postTest(platforms) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     `MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform)
  // WHERE platform.name IN $platforms
  // RETURN  COUNT(course) AS CourseCount, platform.name As PlatformName LIMIT 20`,
  //     { platforms: platforms }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (course:Course)-[:AVAILABLE_ON]->(platform:Platform)
    WHERE platform.name IN $platforms
    RETURN COUNT(course) AS CourseCount, platform.name AS PlatformName
    LIMIT 20
    `,
    { platforms }
  );
  if (records.length !== 0)
    console.log(`Post test for platform: '${platforms}'`);
  return serializeRecords(records);
}

// query the database for number of teachers in compare: service
export async function getNumberOfTeachersForCompare(platforms) {
  //   console.log(platforms);
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     `
  //         MATCH (teacher:teacher)-[:TEACHES_ON]->(platform:platform)
  // WHERE platform.name IN $platforms
  // RETURN COUNT(teacher) AS TeacherCount, platform.name As PlatformName`,
  //     { platforms: platforms }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (teacher:Teacher)-[:TEACHES_ON]->(platform:Platform)
    WHERE platform.name IN $platforms
    RETURN COUNT(DISTINCT teacher) AS TeacherCount, platform.name AS PlatformName
    `,
    { platforms }
  );
  if (records.length !== 0)
    console.log(
      `Number of teachers found for compare based on platforms: '${platforms}'`
    );
  return serializeRecords(records);
}

// Query the database to retrieve platforms by number of institutions :service
export async function getNumberOfInstitutionsForCompare(platforms) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     `MATCH (institution:institution)<-[:BELONGS_TO]-(teacher:teacher)-[:TEACHES_ON]->(platform:platform)
  //          WHERE platform.name IN $platforms
  //          RETURN COUNT(institution) AS InstitutionCount, platform.name AS PlatformName`,
  //     { platforms: platforms }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (institution:Institution)<-[:BELONGS_TO]-(teacher:Teacher)-[:TEACHES_ON]->(platform:Platform)
    WHERE platform.name IN $platforms
    RETURN COUNT(DISTINCT institution) AS InstitutionCount, platform.name AS PlatformName
    `,
    { platforms }
  );
  if (records.length !== 0)
    console.log(
      `Number of institutions found for compare based on platforms: '${platforms}'`
    );
  return serializeRecords(records);
}

// Query the database to retrieve platforms by number of participants: service
export async function getNumberOfParticipantsForCompare(platforms) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     `MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform)
  // WHERE toLower(course.course_category) IS NOT NULL AND platform.name IN $platforms
  // WITH platform.name AS platform_name,
  //      toInteger(replace(course.number_of_participants, ',', '')) AS participants
  // RETURN platform_name AS PlatformName,
  //        SUM(participants) AS TotalParticipants`,
  //     { platforms: platforms }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (course:Course)-[:AVAILABLE_ON]->(platform:Platform)
    WHERE course.course_category IS NOT NULL AND platform.name IN $platforms
    WITH platform.name AS platform_name,
         toInteger(replace(course.number_of_participants, ',', '')) AS participants
    RETURN platform_name AS PlatformName,
           SUM(participants) AS TotalParticipants
    `,
    { platforms }
  );
  if (records.length !== 0)
    console.log(
      `Number of participants found for compare based on platforms: '${platforms}'`
    );
  return serializeRecords(records);
}

export async function getCoursesByConceptForCompare(concept, platforms) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     "\n" +
  //       "MATCH (platform:platform) <-[:AVAILABLE_ON]- (course:course)-[:CONTAINS_CONCEPT]->(concept:concept)\n" +
  //       "WHERE platform.name IN $platforms AND course.description CONTAINS $concept\n" +
  //       "RETURN DISTINCT course.course_id AS CourseId, course.name AS CourseName, platform.name AS PlatformName LIMIT 9",
  //     { platforms: platforms, concept: concept }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (platform:Platform)<-[:AVAILABLE_ON]-(course:Course)-[:CONTAINS_CONCEPT]->(concept:Concept)
    WHERE platform.name IN $platforms AND course.description CONTAINS $concept
    RETURN DISTINCT course.course_id AS CourseId, course.name AS CourseName, platform.name AS PlatformName
    LIMIT 9
    `,
    { platforms, concept }
  );
  if (records.length !== 0)
    console.log(
      `Courses found for comparison based on concepts and platforms: '${platforms}'`
    );
  return serializeRecords(records);
}

// Query the database for the concepts in compare : service
export async function getConceptsByPlatforms(platforms) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     "MATCH (platform:platform) <-[:AVAILABLE_ON]- (course:course)-[:CONTAINS_CONCEPT]->(concept:concept)\n" +
  //       "WHERE platform.name IN $platforms       \n" +
  //       "RETURN concept.name AS ConceptName LIMIT 200",
  //     { platforms: platforms }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (p:Platform)<-[:AVAILABLE_ON]-(c:Course)-[:CONTAINS_CONCEPT]->(k:Concept)
    WHERE ANY(pl IN $platforms WHERE toLower(trim(p.name)) = toLower(trim(pl)))
    RETURN DISTINCT k.name AS ConceptName, count(DISTINCT c) AS Count
    ORDER BY Count DESC
    LIMIT 200
    `,
    { platforms }
  );
  if (records.length !== 0)
    console.log(`Concepts found for platforms: '${platforms}'`);
  return serializeRecords(records);
}

// retrieve the courses by the query : service
export async function getCoursesByConceptsFind(concept) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     "MATCH (c:concept) WHERE c.name CONTAINS $concept " +
  //       "MATCH (course:course)-[:CONTAINS_CONCEPT]->(concept:concept) " +
  //       "WHERE course.description CONTAINS $concept " +
  //       "MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform) " +
  //       "WHERE course.description CONTAINS $concept" +
  //       " RETURN DISTINCT course.course_id AS CourseId, " +
  //       "course.audience AS Audience, course.course_content AS Content," +
  //       " course.course_category AS Category, course.description AS Description, course.duration AS Duration," +
  //       "course.goal AS Goal, course.keywords AS Keywords, course.language AS Language," +
  //       " course.level AS Level, course.link AS Link, course.name AS Name, " +
  //       "course.number_of_participants AS NumberOfParticipants," +
  //       "course.price AS Price, course.rating AS Rating, course.prerequisites AS Prerequisites," +
  //       "course.recommendations AS Recommendations, platform.name AS PlatformName LIMIT 10",
  //     { concept: concept }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (concept:Concept)
    WHERE toLower(concept.name) CONTAINS toLower($concept)
    MATCH (course:Course)-[:CONTAINS_CONCEPT]->(concept)
    MATCH (course)-[:AVAILABLE_ON]->(platform:Platform)
    RETURN DISTINCT 
      course.course_id AS CourseId,
      course.audience AS Audience,
      course.course_content AS Content,
      course.course_category AS Category,
      course.description AS Description,
      course.duration AS Duration,
      course.goal AS Goal,
      course.keywords AS Keywords,
      course.language AS Language,
      course.level AS Level,
      course.link AS Link,
      course.name AS Name,
      course.number_of_participants AS NumberOfParticipants,
      course.price AS Price,
      course.rating AS Rating,
      course.prerequisites AS Prerequisites,
      course.recommendations AS Recommendations,
      platform.name AS PlatformName
    LIMIT 10
    `,
    { concept }
  );
  if (records.length !== 0)
    console.log(`Courses found by concept: '${concept}'`);
  return serializeRecords(records);
}

export async function addLanguageToPlatform() {
  try {
    const result = await graphDb.driver.executeQuery(
      //   "MATCH (p:platform) WHERE (p.language) IS NULL RETURN p"
      "MATCH (p:platform) WHERE NOT EXISTS(p.language) RETURN p"
    );
    const platformsWithoutLanguage = result.records.map((record) =>
      record.get("p")
    );
    if (platformsWithoutLanguage.length === 0) {
      return;
    }
    for (const platform of platformsWithoutLanguage) {
      const name = platform.properties.name;
      let language = "";
      if (
        (name === "udacity") |
        (name === "edX") |
        (name === "coursera") |
        (name === "Future Learn") |
        (name === "udemy")
      ) {
        language = "English";
      } else {
        language = "German";
      }
      await graphDb.driver.executeQuery(
        "MATCH (p:platform {name: $name}) SET p.language = $language",
        { name, language }
      );
    }
    console.log("Language attribute added to platforms successfully");
  } catch (error) {
    console.error("Error adding language attribute to platforms:", error);
  }
}

export async function getCourseRatingsPricesForVis(platformName, datapoints) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     "MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform) \n" +
  //       "WHERE toLower(platform.name) CONTAINS $platformName \n" +
  //       " AND course.price IS NOT NULL \n" +
  //       "RETURN DISTINCT course.name AS CourseName, course.price AS CoursePrice, course.rating AS CourseRating \n" +
  //       `LIMIT ${+datapoints}`,
  //     { platformName: platformName, datapoints: datapoints }
  //   );
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    `
    MATCH (c:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) CONTAINS toLower($platformName)
      AND c.price  IS NOT NULL
      AND c.rating IS NOT NULL

    WITH c,
         toFloat(
           CASE
             WHEN toLower(c.price) = 'free' THEN 0
             WHEN c.price =~ '^[0-9]+(\\.[0-9]+)?$' THEN c.price
             ELSE replace(replace(replace(replace(c.price,'€',''),'$',''),',','.'),' ','')
           END
         ) AS priceNum,
         toFloat(replace(c.rating, ',', '.')) AS ratingNum

    WHERE priceNum IS NOT NULL AND ratingNum IS NOT NULL

    RETURN c.course_id AS CourseId,
           c.name AS CourseName,
           priceNum AS CoursePrice,
           ratingNum AS CourseRating
    ORDER BY CourseRating DESC
    LIMIT toInteger($datapoints)
    `,
    { platformName: platformName, datapoints: +datapoints }
  );
  if (records.length !== 0)
    console.log(
      `Course ratings and prices found based on platform: ${platformName} and data points: '${datapoints}'`
    );
  return serializeRecords(records);
}

export async function getTopicsByCategory(course_category) {
  //   const { records, summary, keys } = await graphDb.driver.executeQuery(
  //     "MATCH (platform:platform) <-[:AVAILABLE_ON]- (course:course)-[:CONTAINS_CONCEPT]->(concept:concept) \n" +
  //       "WHERE toLower(course.course_category) = $course_category\n" +
  //       "RETURN DISTINCT concept.name AS ConceptName, platform.name AS PlatformName\n" +
  //       "LIMIT 20\n",
  //     { course_category: course_category }
  //   );
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (platform:platform) <-[:AVAILABLE_ON]- (course:course)-[:CONTAINS_CONCEPT]->(concept:concept)
    WHERE toLower(course.course_category) = toLower($course_category)
    RETURN DISTINCT concept.name AS ConceptName, platform.name AS PlatformName
    LIMIT 20
    `,
    { course_category }
  );
  if (records.length !== 0)
    console.log(`Topics found based on category: ${course_category}`);
  return serializeRecords(records);
}

// Get courses by teacher 
export async function getCoursesByTeacherForVis(platformName, { teacherId = null, teacherName = null } = {}) {
  if (!teacherId && !teacherName) {
    throw new Error("getCoursesByTeacherForVis: teacherId or teacherName is required");
  }

  const { records } = await graphDb.driver.executeQuery(
  /*  `
    MATCH (t:Teacher)-[:TEACHES]->(c:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) CONTAINS toLower($platformName)
      AND (
        ($teacherId IS NOT NULL AND id(t) = $teacherId) OR
        ($teacherName IS NOT NULL AND toLower(t.name) = toLower($teacherName))
      )

    // de-dup in case of multiple rels
    WITH DISTINCT c

    RETURN
      id(c)                    AS Id,
      c.course_id              AS CourseId,
      c.name                   AS CourseName,
      coalesce(c.rank, 999999) AS Rank,
      c.language               AS Language,
      c.level                  AS Level,
      c.platform               AS Platform
    ORDER BY Rank, toLower(CourseName)
    `,*/
    `
    MATCH (t:Teacher)-[:TEACHES]->(c:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) CONTAINS toLower($platformName)
      AND (
        ($teacherId IS NOT NULL AND id(t) = $teacherId) OR
        ($teacherName IS NOT NULL AND toLower(t.name) = toLower($teacherName))
      )
    WITH DISTINCT c
    WITH
      c,
      toFloat(
        CASE
          WHEN c.rating IS NULL THEN 0
          WHEN c.rating =~ '^[0-9]+(\\.[0-9]+)?$' THEN c.rating
          ELSE replace(c.rating, ',', '.')
        END
      ) AS ratingNum,
      toInteger(
        CASE
          WHEN c.number_of_participants IS NULL THEN 0
          WHEN trim(replace(c.number_of_participants, ',', '')) = '' THEN 0
          ELSE replace(c.number_of_participants, ',', '')
        END
      ) AS participants
    RETURN
      id(c)           AS Id,
      c.course_id     AS CourseId,
      c.name          AS CourseName,
      ratingNum       AS Rating,
      participants    AS NumberOfParticipants,
      c.language      AS Language,
      c.level         AS Level,
      c.platform      AS Platform
    ORDER BY toLower(CourseName)
    `,
    { platformName, teacherId, teacherName }
  );

  return serializeRecords(records);
}

// Get courses by institution  
export async function getCoursesByInstitutionForVis(
  platformName,
  { institutionId = null, institutionName = null } = {}
) {
  if (!institutionId && !institutionName) {
    throw new Error(
      "getCoursesByInstitutionForVis: institutionId or institutionName is required"
    );
  }

  const { records } = await graphDb.driver.executeQuery(
  /*  `
    MATCH (i:Institution)-[:OFFERS]->(c:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) CONTAINS toLower($platformName)
      AND (
        ($institutionId IS NOT NULL AND id(i) = $institutionId) OR
        ($institutionName IS NOT NULL AND toLower(i.name) = toLower($institutionName))
      )

    // de-dup in case of multiple rels
    WITH DISTINCT c

    RETURN
      id(c)                    AS Id,
      c.course_id              AS CourseId,
      c.name                   AS CourseName,
      coalesce(c.rank, 999999) AS Rank,
      c.language               AS Language,
      c.level                  AS Level,
      c.platform               AS Platform
    ORDER BY Rank, toLower(CourseName)
    `,*/
    `
     MATCH (i:Institution)-[:OFFERS]->(c:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) CONTAINS toLower($platformName)
      AND (
        ($institutionId IS NOT NULL AND id(i) = $institutionId) OR
        ($institutionName IS NOT NULL AND toLower(i.name) = toLower($institutionName))
      )
    WITH DISTINCT c
    WITH
      c,
      toFloat(
        CASE
          WHEN c.rating IS NULL THEN 0
          WHEN c.rating =~ '^[0-9]+(\\.[0-9]+)?$' THEN c.rating
          ELSE replace(c.rating, ',', '.')
        END
      ) AS ratingNum,
      toInteger(
        CASE
          WHEN c.number_of_participants IS NULL THEN 0
          WHEN trim(replace(c.number_of_participants, ',', '')) = '' THEN 0
          ELSE replace(c.number_of_participants, ',', '')
        END
      ) AS participants
    RETURN
      id(c)           AS Id,
      c.course_id     AS CourseId,
      c.name          AS CourseName,
      ratingNum       AS Rating,
      participants    AS NumberOfParticipants,
      c.language      AS Language,
      c.level         AS Level,
      c.platform      AS Platform
    ORDER BY toLower(CourseName)
     `,
    { platformName, institutionId, institutionName }
  );

  return serializeRecords(records);
}

// Teachers list with course counts (paginated)
export async function getTeachersByPlatform(
  platformName,
  { page = 1, pageSize = 10, q = "" } = {}
) {
  const skip = Math.max((Number(page) - 1) * Number(pageSize), 0);
  const limit = Math.max(Number(pageSize), 1);

  // total count
  const { records: totalRecs } = await graphDb.driver.executeQuery(
    `
    MATCH (t:Teacher)-[:TEACHES]->(:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) CONTAINS toLower($platformName)
      AND ($q = '' OR toLower(t.name) CONTAINS toLower($q))
    RETURN count(DISTINCT t) AS total
    `,
    { platformName, q: q.toLowerCase() }
  );

  const total = (totalRecs?.[0]?.get?.("total")) ?? 0;

  // page of items
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (t:Teacher)-[:TEACHES]->(c:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) CONTAINS toLower($platformName)
      AND ($q = '' OR toLower(t.name) CONTAINS toLower($q))
    WITH t, count(c) AS numCourses
    RETURN
      t.name                                        AS TeacherName,
      coalesce(t.teacher_id, id(t))                 AS TeacherId,
      toFloat(numCourses)                           AS NumberOfCourses
    ORDER BY NumberOfCourses DESC, toLower(TeacherName)
    SKIP toInteger($skip)
    LIMIT toInteger($limit)
    `,
    { platformName, q: q.toLowerCase(), skip, limit }
  );

  return {
    total: Number(total) || 0,
    items: serializeRecords(records),
  };
}

// Institutions list with course counts (paginated)
export async function getInstitutionsByPlatform(
  platformName,
  { page = 1, pageSize = 10, q = "" } = {}
) {
  const skip = Math.max((Number(page) - 1) * Number(pageSize), 0);
  const limit = Math.max(Number(pageSize), 1);

  // total count
  const { records: totalRecs } = await graphDb.driver.executeQuery(
    `
    MATCH (i:Institution)-[:OFFERS]->(:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) CONTAINS toLower($platformName)
      AND ($q = '' OR toLower(i.name) CONTAINS toLower($q))
    RETURN count(DISTINCT i) AS total
    `,
    { platformName, q: q.toLowerCase() }
  );

  const total = (totalRecs?.[0]?.get?.("total")) ?? 0;

  // page of items
  const { records } = await graphDb.driver.executeQuery(
    `
    MATCH (i:Institution)-[:OFFERS]->(c:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE toLower(p.name) CONTAINS toLower($platformName)
      AND ($q = '' OR toLower(i.name) CONTAINS toLower($q))
    WITH i, count(c) AS numCourses
    RETURN
      i.name                                        AS InstitutionName,
      coalesce(i.institution_id, id(i))             AS InstitutionId,
      toFloat(numCourses)                           AS NumberOfCourses
    ORDER BY NumberOfCourses DESC, toLower(InstitutionName)
    SKIP toInteger($skip)
    LIMIT toInteger($limit)
    `,
    { platformName, q: q.toLowerCase(), skip, limit }
  );

  return {
    total: Number(total) || 0,
    items: serializeRecords(records),
  };
}

export async function getCoursesLite({ platform = '', platforms = null, limit = 50 } = {}) {
  const whereClause = platform
    ? 'WHERE toLower(p.name) CONTAINS toLower($platform)'
    : (platforms && platforms.length ? 'WHERE toLower(p.name) IN $platformsLower' : '');

  const query = `
    MATCH (c:Course)-[:AVAILABLE_ON]->(p:Platform)
    ${whereClause}
    WITH c, p,  
         toFloat(
           CASE
             WHEN c.rating IS NULL THEN 0
             WHEN c.rating =~ '^[0-9]+(\\.[0-9]+)?$' THEN c.rating
             ELSE replace(c.rating, ',', '.')
           END
         ) AS ratingNum,
         toInteger(
           CASE
             WHEN c.number_of_participants IS NULL THEN 0
             WHEN trim(replace(coalesce(c.number_of_participants,''), ',', '')) = '' THEN 0
             ELSE replace(c.number_of_participants, ',', '')
           END
         ) AS participants
    RETURN
      id(c)           AS id,
      c.course_id     AS courseId,
      c.name          AS title,
      p.name          AS platform,
      ratingNum       AS rating,
      participants    AS enrolled
    ORDER BY enrolled DESC, toLower(title)
    LIMIT toInteger($limit)
  `;

  const params = {
    platform,
    platformsLower: platforms ? platforms.map(s => s.toLowerCase()) : null,
    limit: Number(limit)
  };

  const { records } = await graphDb.driver.executeQuery(query, params);
  return serializeRecords(records); // -> [{id,title,platform,rating,enrolled}]
}

export async function getPlatformCourses({
  platform = '', platforms = null, page = 1, pageSize = 20,
  q = '', sort = 'enrolled', order = 'desc', minRating = 0
} = {}) {
  const skip  = Math.max((Number(page) - 1) * Number(pageSize), 0);
  const limit = Math.max(Number(pageSize), 1);

  const platformClause = platform
    ? 'toLower(p.name) CONTAINS toLower($platform)'
    : (platforms && platforms.length ? 'toLower(p.name) IN $platformsLower' : 'true');

  const baseMatch = `
    MATCH (c:Course)-[:AVAILABLE_ON]->(p:Platform)
    WHERE ${platformClause}
      AND ($q = '' OR toLower(c.name) CONTAINS toLower($q))
  `;

  const calc = `
    WITH c, p,
      toFloat(
        CASE
          WHEN c.rating IS NULL THEN 0
          WHEN c.rating =~ '^[0-9]+(\\.[0-9]+)?$' THEN c.rating
          ELSE replace(c.rating, ',', '.')
        END
      ) AS ratingNum,
      toInteger(
        CASE
          WHEN c.number_of_participants IS NULL THEN 0
          WHEN trim(replace(coalesce(c.number_of_participants,''), ',', '')) = '' THEN 0
          ELSE replace(c.number_of_participants, ',', '')
        END
      ) AS participants
    WHERE ratingNum >= toFloat($minRating)
  `;

  // sanitize sort fields for ORDER BY
  let orderField = 'participants';
  if (sort === 'rating') orderField = 'ratingNum';
  if (sort === 'name')   orderField = 'toLower(c.name)';
  const orderDir = (order === 'asc') ? 'ASC' : 'DESC';

  const totalQuery = `${baseMatch} ${calc} RETURN count(DISTINCT c) AS total`;

  const itemsQuery = `${baseMatch} ${calc}
    RETURN
      id(c)        AS id,
      c.course_id     AS courseId,
      c.name       AS title,
      p.name       AS platform,
      ratingNum    AS rating,
      participants AS enrolled
    ORDER BY ${orderField} ${orderDir}, toLower(title) ASC
    SKIP toInteger($skip)
    LIMIT toInteger($limit)
  `;

  const params = {
    platform,
    platformsLower: platforms ? platforms.map(s => s.toLowerCase()) : null,
    q: (q || '').toLowerCase(),
    minRating: Number(minRating) || 0,
    skip, limit
  };

  const { records: totRecs } = await graphDb.driver.executeQuery(totalQuery, params);
  const total = (totRecs?.[0]?.get?.('total')) ?? 0;

  const { records } = await graphDb.driver.executeQuery(itemsQuery, params);
  return { total: Number(total) || 0, items: serializeRecords(records) };
}



/*

MATCH (platform:platform) <-[:AVAILABLE_ON]- (course:course)-[:CONTAINS_CONCEPT]->(concept:concept)
WHERE platform.name IN $platform
RETURN concept.name AS ConceptName LIMIT 200

MATCH (platform:platform) <-[:AVAILABLE_ON]- (course:course)-[:CONTAINS_CONCEPT]->(concept:concept)
WHERE platform.name IN $platforms AND course.description CONTAINS $concept
RETURN DISTINCT course.course_id AS CourseId, course.name AS CourseName, platform.name AS PlatformName LIMIT 9

MATCH (course:course)-[:AVAILABLE_ON]->(platform:platform)
WHERE toLower(course.course_category) IS NOT NULL AND platform.name IN ["udemy","udacity","imoox","edX","Future Learn","Open vhb"]
WITH platform.name AS platform_name,
     toInteger(replace(course.number_of_participants, ',', '')) AS participants
RETURN platform_name AS PlatformName,
       SUM(participants) AS TotalParticipants







MATCH (teacher:teacher)-[:TEACHES_ON]->(platform:platform)
WHERE platform.name IN ["udemy","imoox","udacity"]
RETURN COUNT(teacher) AS TeacherCount, platform.name As PlatformName LIMIT 200

MATCH (institution:institution)-[:OFFERS]->(course:course)-[:AVAILABLE_ON]->(platform:platform)
WHERE platform.name = 'coursera' RETURN institution.name AS InstitutionName, COUNT(course) AS NumberOfCourses
ORDER BY NumberOfCourses DESC
LIMIT 10
 */
