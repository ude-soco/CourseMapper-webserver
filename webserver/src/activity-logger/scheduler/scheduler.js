const cron = require("node-cron");
const SCHEDULE_EXPRESSION = process.env.CRON_SCHEDULE_EVERY_SECOND;
const controller = require("../controller/activity-controller");
const lrs = require("../lrs/lrs");

export const ActivityScheduler = () => {
  console.log("Starting xAPI Activity Scheduler...");
  cron.schedule(SCHEDULE_EXPRESSION, async () => {
    try {
      // 1. Handle course-specific activities
      const syncJobs = await controller.GetActivityByCourseId();
      console.log('xAPI scheduler: fetched', syncJobs.length, 'course(s) with statements to sync');
      
      if (syncJobs.length > 0) {
        // Process each course's statements separately with its own credentials
        for (const job of syncJobs) {
          const { courseId, basicAuth, statements } = job;
          
          if (!statements || statements.length === 0) {
            console.log(`Course ${courseId}: no statements to send`);
            continue;
          }
          
          // Use course-specific basicAuth if available, otherwise use default from env
          const authToUse = basicAuth || process.env.LRS_Authorization;
          const usingDefault = !basicAuth;
          
          console.log(`Course ${courseId}: sending ${statements.length} statement(s) to LRS ${usingDefault ? '(using default auth)' : '(using course auth)'}`);
          
          try {
            const sentStatementsIds = await lrs.sendStatementsToLrs(statements, authToUse);
            
            if (sentStatementsIds && sentStatementsIds.length > 0) {
              console.log(`Course ${courseId}: ${sentStatementsIds.length} statement(s) sent successfully`);
              await controller.updateActivities(sentStatementsIds);
            } else {
              console.log(`Course ${courseId}: no statement IDs returned from LRS`);
            }
          } catch (error) {
            console.error(`Course ${courseId}: error sending statements:`, error.message);
          }
        }
      }
      
      // 2. Handle non-course activities (login, logout, etc.)
      const nonCourseStatements = await controller.getActivitiesWithoutCourseId();
      if (nonCourseStatements.length > 0) {
        console.log(`Global: sending ${nonCourseStatements.length} non-course statement(s) to default LRS`);
        
        try {
          const sentStatementsIds = await lrs.sendStatementsToLrs(nonCourseStatements, null);
          
          if (sentStatementsIds && sentStatementsIds.length > 0) {
            console.log(`Global: ${sentStatementsIds.length} non-course statement(s) sent successfully`);
            await controller.updateActivities(sentStatementsIds);
          } else {
            console.log(`Global: no statement IDs returned from LRS`);
          }
        } catch (error) {
          console.error(`Global: error sending non-course statements:`, error.message);
        }
      }
    } catch (err) {
      console.log("Error in running xAPI scheduler");
    }
  });
};
