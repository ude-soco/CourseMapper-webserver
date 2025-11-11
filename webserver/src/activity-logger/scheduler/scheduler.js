const cron = require("node-cron");
const SCHEDULE_EXPRESSION = process.env.CRON_SCHEDULE_EVERY_SECOND;
const controller = require("../controller/activity-controller");
const lrs = require("../lrs/lrs");
const BATCH_SIZE = 500;

export const ActivityScheduler = () => {
  console.log("Starting xAPI Activity Scheduler...");
  cron.schedule(SCHEDULE_EXPRESSION, async () => {
    try {
      const statements = await controller.getActivities();
      console.log('xAPI scheduler: fetched statements count =', statements.length);
      if (statements.length > 0) {
        if (statements.length > BATCH_SIZE) {
          const loops = Math.ceil(statements.length / BATCH_SIZE);

          for (let i = 0; i < loops; i++) {
            const start = i * BATCH_SIZE;
            const end =
              start + BATCH_SIZE <= statements.length
                ? start + BATCH_SIZE
                : statements.length;
            const batch = statements.slice(start, end);
            console.log('xAPI scheduler: sending batch', i + 1, 'of', loops, 'size', batch.length);
            const sentStatementsIds = await lrs.sendStatementsToLrs(batch);
            if (sentStatementsIds && sentStatementsIds.length > 0) {
              await controller.updateActivities(sentStatementsIds);
            } else {
              console.log('No statement IDs returned from LRS for this batch — skipping DB update.');
            }
          }
        } else {
          console.log('xAPI scheduler: sending single batch size', statements.length);
          const sentStatementsIds = await lrs.sendStatementsToLrs(statements);
          
          // DEBUG: Log what we received
          console.log('xAPI scheduler: sentStatementsIds type =', typeof sentStatementsIds);
          console.log('xAPI scheduler: sentStatementsIds is array?', Array.isArray(sentStatementsIds));
          console.log('xAPI scheduler: sentStatementsIds =', sentStatementsIds);
          console.log('xAPI scheduler: sentStatementsIds.length =', sentStatementsIds?.length);
          
          if (sentStatementsIds && sentStatementsIds.length > 0) {
            await controller.updateActivities(sentStatementsIds);
          } else {
            console.log('No statement IDs returned from LRS — skipping DB update.');
          }
        }
      }
    } catch (err) {
      console.log("Error in running xAPI scheduler");
    }
  });
};
