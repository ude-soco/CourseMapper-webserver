const cron = require("node-cron");
const controller = require("../controller/activity-controller");
const lrs = require("../lrs/lrs");
const BATCH_SIZE = 500;

export const ActivityScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const statements = await controller.getActivities();
      if (statements.length > 0) {
        if (statements.length > BATCH_SIZE) {
          const loops = Math.ceil(statements.length / BATCH_SIZE);

          for (let i = 0; i < loops; i++) {
            const start = i * BATCH_SIZE;
            const end =
              start + BATCH_SIZE <= statements.length
                ? start + BATCH_SIZE
                : statements.length;
            const sentStatementsIds = await lrs.sendStatementsToLrs(
              statements.slice(start, end),
            );
            await controller.updateActivities(sentStatementsIds);
          }
        } else {
          const sentStatementsIds = await lrs.sendStatementsToLrs(statements);
          await controller.updateActivities(sentStatementsIds);
        }
      }
    } catch (err) {
      console.log("Error in running xapi scheduler");
    }
  });
};
